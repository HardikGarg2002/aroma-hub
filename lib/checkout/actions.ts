"use server";

import { createOrder, getOrderByPaymentReference } from "@/lib/admin/orders";
import {
  PayPalError,
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalOrder,
  type Money,
} from "@/lib/paypal";
import { STORE_COUNTRY } from "./pricing";
import { CheckoutError, buildQuote, type CheckoutLineInput, type Quote } from "./quote";
import { cleanCustomer, validateCustomer, type CheckoutCustomer, type CustomerErrors } from "./validation";

export interface CheckoutRequest {
  customer: CheckoutCustomer;
  items: CheckoutLineInput[];
  coupon_code: string | null;
}

type Failure = { ok: false; error: string; fieldErrors?: CustomerErrors };

/** Order summary for the checkout page, priced by the server. */
export async function quoteCheckout(
  items: CheckoutLineInput[],
  couponCode: string | null,
  province: string,
): Promise<{ ok: true; quote: Quote } | Failure> {
  try {
    return { ok: true, quote: await buildQuote(items, couponCode, province) };
  } catch (error) {
    return fail(error);
  }
}

/** Step 1 — called when the buyer clicks the PayPal button. */
export async function startPayPalCheckout(req: CheckoutRequest): Promise<{ ok: true; paypal_order_id: string } | Failure> {
  try {
    const fieldErrors = validateCustomer(req.customer);
    if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check your details.", fieldErrors };
    const customer = cleanCustomer(req.customer);

    const quote = await buildQuote(req.items, req.coupon_code, customer.province);
    if (!quote.items.length) return { ok: false, error: "Your cart is empty." };

    const { id } = await createPayPalOrder({
      reference: crypto.randomUUID(),
      currency: quote.currency,
      items: quote.items.map((it) => ({
        name: `${it.name} (${it.size})`,
        sku: it.product_code,
        quantity: it.quantity,
        unit_price: it.unit_price,
      })),
      item_total: quote.subtotal,
      shipping: quote.shipping,
      tax: quote.tax,
      discount: quote.discount,
      total: quote.total,
      ship_to: {
        name: customer.name,
        line1: customer.line1,
        line2: customer.line2,
        city: customer.city,
        province: customer.province,
        postal_code: customer.postal_code,
        country_code: STORE_COUNTRY.code,
      },
    });
    return { ok: true, paypal_order_id: id };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Step 2 — called after the buyer approves in PayPal. Re-prices the cart and
 * only captures if PayPal's approved amount matches exactly, so a tampered or
 * changed cart is never charged. Safe to call again for the same payment.
 */
export async function completePayPalCheckout(
  paypalOrderId: string,
  req: CheckoutRequest,
): Promise<{ ok: true; order_number: string } | Failure> {
  const id = String(paypalOrderId ?? "");
  if (!/^[A-Z0-9-]{5,64}$/i.test(id)) return { ok: false, error: "Invalid payment reference." };

  try {
    // Already recorded (a retry, or a double click): just report it.
    const existing = await getOrderByPaymentReference(id);
    if (existing) return { ok: true, order_number: existing.order_number };

    if (Object.keys(validateCustomer(req.customer)).length) {
      return { ok: false, error: "Please check your details." };
    }
    const customer = cleanCustomer(req.customer);
    const quote = await buildQuote(req.items, req.coupon_code, customer.province);
    if (!quote.items.length) return { ok: false, error: "Your cart is empty." };

    const paypal = await getPayPalOrder(id);
    // COMPLETED here means we captured before but failed to save the order;
    // fall through and save it now rather than charging again.
    if (paypal.status !== "APPROVED" && paypal.status !== "COMPLETED") {
      return { ok: false, error: "The payment wasn't approved in PayPal. You haven't been charged." };
    }
    if (!sameAmount(paypal.amount, quote)) {
      return {
        ok: false,
        error: "Your order total changed while you were paying. You haven't been charged — please review and try again.",
      };
    }

    if (paypal.status === "APPROVED") {
      const capture = await capturePayPalOrder(id);
      if (capture.status !== "COMPLETED" || !sameAmount(capture.amount, quote)) {
        console.error("PayPal capture not completed", id, JSON.stringify(capture));
        return { ok: false, error: "PayPal couldn't complete the payment. You haven't been charged." };
      }
    }

    try {
      const order = await createOrder({
        status: "processing",
        payment_status: "paid",
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        shipping_address: {
          line1: customer.line1,
          line2: customer.line2 || null,
          city: customer.city,
          province: customer.province,
          postal_code: customer.postal_code,
          country: STORE_COUNTRY.name,
        },
        items: quote.items,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        currency: quote.currency,
        notes: null,
        coupon_code: quote.coupon_code,
        payment_provider: "paypal",
        payment_reference: id,
      });
      return { ok: true, order_number: order.order_number };
    } catch (error) {
      // Money taken but no order row: the worst case. Log everything needed
      // to recover it by hand; calling this again will retry the save.
      console.error("ORDER NOT SAVED AFTER PAYMENT", id, JSON.stringify({ customer, quote }), error);
      return {
        ok: false,
        error: `Your payment went through, but we couldn't save your order. Please contact us with payment reference ${id}.`,
      };
    }
  } catch (error) {
    return fail(error);
  }
}

function sameAmount(amount: Money | null, quote: Quote) {
  return !!amount && amount.currency_code === quote.currency && amount.value === quote.total.toFixed(2);
}

function fail(error: unknown): Failure {
  if (error instanceof PayPalError || error instanceof CheckoutError) return { ok: false, error: error.message };
  console.error("Checkout failed", error);
  return { ok: false, error: "Something went wrong. You haven't been charged — please try again." };
}
