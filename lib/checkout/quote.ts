import "server-only";

import { getProductDetail } from "@/lib/catalog";
import { getCouponByCode } from "@/lib/admin/coupons";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupons";
import { formatMoney } from "@/lib/admin/format";
import type { AdminOrderItem } from "@/types/admin";
import { round2, shippingFor, taxRate } from "./pricing";

/** A problem the customer can see and fix; its message is safe to show. */
export class CheckoutError extends Error {}

/** What the browser sends: just ids, sizes and quantities — never prices. */
export interface CheckoutLineInput {
  product_id: string;
  size: string;
  quantity: number;
}

export interface Quote {
  items: AdminOrderItem[];
  subtotal: number;
  /** Coupon actually applied (null if none or it doesn't qualify). */
  coupon_code: string | null;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  /** Things the customer should know: removed items, a coupon that no longer applies… */
  notices: string[];
}

const MAX_LINES = 50;
const MAX_QUANTITY = 10;

/**
 * Prices a cart from the database: current prices, active products only,
 * valid sizes, and the coupon re-checked. This — not anything the browser
 * sent — is what PayPal is asked to charge and what the order records.
 */
export async function buildQuote(
  lines: CheckoutLineInput[],
  couponCode: string | null,
  province: string,
): Promise<Quote> {
  const notices: string[] = [];
  const items: AdminOrderItem[] = [];
  const currencies = new Set<string>();

  for (const line of (Array.isArray(lines) ? lines : []).slice(0, MAX_LINES)) {
    const quantity = Math.floor(Number(line?.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) continue;

    const product = await getProductDetail(String(line.product_id));
    if (!product) {
      notices.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    // Price comes from the chosen size's variant, never the product's "from"
    // price -- otherwise a 100 ml would be charged at the 10 ml price.
    const variant = product.variants.find((v) => v.size === String(line.size));
    if (!variant) {
      notices.push(`${product.name} is no longer available in ${line.size}.`);
      continue;
    }
    if (!variant.in_stock) {
      notices.push(`${product.name} in ${variant.size} is out of stock.`);
      continue;
    }

    currencies.add(product.currency);
    const existing = items.find((it) => it.product_id === product.id && it.size === line.size);
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
      continue;
    }
    items.push({
      product_id: product.id,
      variant_id: variant.id,
      product_code: product.product_code,
      name: product.name,
      size: variant.size,
      image_url: product.image_url,
      unit_price: variant.price,
      quantity: Math.min(MAX_QUANTITY, quantity),
    });
  }

  // One order, one currency: PayPal charges a single currency per order.
  if (currencies.size > 1) throw new CheckoutError("Your cart mixes currencies, which can't be paid in one order.");
  const currency = [...currencies][0] ?? "CAD";

  const subtotal = round2(items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0));

  let coupon_code: string | null = null;
  let discount = 0;
  if (couponCode) {
    const code = normalizeCouponCode(couponCode);
    const coupon = await getCouponByCode(code);
    const result = coupon ? evaluateCoupon(coupon, subtotal, currency) : null;
    if (result?.ok) {
      coupon_code = coupon!.code;
      discount = round2(result.discount);
    } else if (result && result.reason === "minimum") {
      notices.push(`${code} needs a subtotal of ${formatMoney(coupon!.min_cart_value, currency)} and wasn't applied.`);
    } else {
      notices.push(`${code} isn't valid and wasn't applied.`);
    }
  }

  const discounted = round2(subtotal - discount);
  const shipping = items.length ? shippingFor(discounted) : 0;
  const tax = round2((discounted + shipping) * taxRate(province));

  return {
    items,
    subtotal,
    coupon_code,
    discount,
    shipping,
    tax,
    total: round2(discounted + shipping + tax),
    currency,
    notices,
  };
}
