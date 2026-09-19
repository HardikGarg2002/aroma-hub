"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  completePayPalCheckout,
  quoteCheckout,
  startPayPalCheckout,
  type CheckoutRequest,
} from "@/lib/checkout/actions";
import type { Quote } from "@/lib/checkout/quote";
import { FREE_SHIPPING_FROM, PROVINCES, STORE_COUNTRY } from "@/lib/checkout/pricing";
import {
  EMPTY_CUSTOMER,
  validateCustomer,
  type CheckoutCustomer,
  type CustomerErrors,
} from "@/lib/checkout/validation";
import { useCartStore } from "@/lib/cart/store";
import { useCartHydrated } from "@/lib/cart/useCartHydration";
import { BLUR, canOptimize } from "@/lib/images";
import { formatMoney } from "@/lib/admin/format";
import type { PayPalMode } from "@/lib/paypal";
import { cn } from "@/lib/cn";
import { PayPalButtons } from "./PayPalButtons";

/** Field order, for focusing the first problem. */
const FIELDS: (keyof CheckoutCustomer)[] = ["email", "phone", "name", "line1", "line2", "city", "province", "postal_code"];

export function Checkout({ mode, clientId }: { mode: PayPalMode; clientId: string }) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clearCart = useCartStore((s) => s.clear);

  const [customer, setCustomer] = useState<CheckoutCustomer>(EMPTY_CUSTOMER);
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutCustomer, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<CustomerErrors>({});

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const lines = useMemo(
    () => items.map((i) => ({ product_id: i.product_id, size: i.size, quantity: i.quantity })),
    [items],
  );
  const couponCode = coupon?.code ?? null;

  // Server-priced summary; re-fetched when the cart, coupon or province changes.
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoting(true);
      const result = await quoteCheckout(lines, couponCode, customer.province);
      if (cancelled) return;
      setQuoting(false);
      if (result.ok) {
        setQuote(result.quote);
        setQuoteError(null);
      } else {
        setQuoteError(result.error);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hydrated, lines, couponCode, customer.province]);

  const clientErrors = validateCustomer(customer);
  const errorFor = (field: keyof CheckoutCustomer) =>
    serverErrors[field] ?? (submitted || touched[field] ? clientErrors[field] : undefined);

  const update = (field: keyof CheckoutCustomer, value: string) => {
    setCustomer((c) => ({ ...c, [field]: value }));
    setServerErrors((e) => ({ ...e, [field]: undefined }));
    setPayError(null);
  };

  const request = (): CheckoutRequest => ({ customer, items: lines, coupon_code: couponCode });

  const focusFirstError = (errors: CustomerErrors) => {
    const first = FIELDS.find((f) => errors[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const validate = () => {
    setSubmitted(true);
    setPayError(null);
    if (Object.keys(clientErrors).length) {
      focusFirstError(clientErrors);
      return false;
    }
    if (!quote || quoteError) {
      setPayError(quoteError ?? "Still calculating your total — try again in a moment.");
      return false;
    }
    return true;
  };

  const createOrder = async () => {
    setPaying(true);
    const result = await startPayPalCheckout(request());
    if (result.ok) return result.paypal_order_id;
    setPaying(false);
    setPayError(result.error);
    if (result.fieldErrors) {
      setServerErrors(result.fieldErrors);
      focusFirstError(result.fieldErrors);
    }
    return null;
  };

  const onApprove = async (paypalOrderId: string) => {
    setPaying(true);
    const result = await completePayPalCheckout(paypalOrderId, request());
    if (result.ok) {
      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(result.order_number)}`);
      return;
    }
    setPaying(false);
    setPayError(result.error);
  };

  const payWithTestGateway = async () => {
    if (!validate()) return;
    const id = await createOrder();
    if (id) await onApprove(id);
  };

  if (!hydrated) {
    return <div className="mt-12 h-96 animate-pulse rounded-[2px] bg-bone-deep" aria-label="Loading your cart" />;
  }

  if (items.length === 0 && !paying) {
    return (
      <div className="mt-16 flex flex-col items-center gap-6 text-center">
        <p className="font-display text-4xl">Your cart is empty</p>
        <p className="text-muted">Add a fragrance to check out.</p>
        <Link
          href="/shop"
          className="bg-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-bone hover:opacity-90"
        >
          Shop all
        </Link>
      </div>
    );
  }

  const currency = quote?.currency ?? items[0]?.currency ?? "CAD";
  const money = (n: number) => formatMoney(n, currency);

  return (
    <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
      <form ref={formRef} noValidate onSubmit={(e) => e.preventDefault()} className="space-y-10">
        <Fieldset legend="Contact">
          <Field label="Email" error={errorFor("email")}>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={customer.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={inputClass(errorFor("email"))}
            />
          </Field>
          <Field label="Phone" hint="Optional, for delivery updates" error={errorFor("phone")}>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={customer.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              className={inputClass(errorFor("phone"))}
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Shipping address">
          <Field label="Full name" error={errorFor("name")}>
            <input
              name="name"
              autoComplete="name"
              value={customer.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={inputClass(errorFor("name"))}
            />
          </Field>
          <Field label="Address" error={errorFor("line1")}>
            <input
              name="line1"
              autoComplete="address-line1"
              value={customer.line1}
              onChange={(e) => update("line1", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, line1: true }))}
              className={inputClass(errorFor("line1"))}
            />
          </Field>
          <Field label="Apartment, suite, etc." hint="Optional">
            <input
              name="line2"
              autoComplete="address-line2"
              value={customer.line2}
              onChange={(e) => update("line2", e.target.value)}
              className={inputClass()}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" error={errorFor("city")}>
              <input
                name="city"
                autoComplete="address-level2"
                value={customer.city}
                onChange={(e) => update("city", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                className={inputClass(errorFor("city"))}
              />
            </Field>
            <Field label="Province / territory" error={errorFor("province")}>
              <select
                name="province"
                autoComplete="address-level1"
                value={customer.province}
                onChange={(e) => {
                  update("province", e.target.value);
                  setTouched((t) => ({ ...t, province: true }));
                }}
                className={inputClass(errorFor("province"))}
              >
                <option value="">Select…</option>
                {PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Postal code" error={errorFor("postal_code")}>
              <input
                name="postal_code"
                autoComplete="postal-code"
                value={customer.postal_code}
                onChange={(e) => update("postal_code", e.target.value.toUpperCase())}
                onBlur={() => setTouched((t) => ({ ...t, postal_code: true }))}
                placeholder="K1A 0B1"
                className={cn(inputClass(errorFor("postal_code")), "uppercase")}
              />
            </Field>
            <Field label="Country">
              <input value={STORE_COUNTRY.name} readOnly aria-readonly className={cn(inputClass(), "text-muted")} />
            </Field>
          </div>
        </Fieldset>

        <Fieldset legend="Payment">
          {payError && (
            <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {payError}
            </p>
          )}

          {mode === "mock" && (
            <div className="space-y-3">
              <p className="border border-dashed border-amber bg-amber/10 px-4 py-3 text-[13px] text-ink-soft">
                <strong className="font-medium text-ink">Test mode:</strong> PayPal keys aren&apos;t set, so payment
                is simulated — no money moves. Add <code className="font-mono text-[12px]">PAYPAL_CLIENT_ID</code> and{" "}
                <code className="font-mono text-[12px]">PAYPAL_CLIENT_SECRET</code> to use real PayPal.
              </p>
              <button
                type="button"
                onClick={payWithTestGateway}
                disabled={paying || quoting}
                className="flex h-12 w-full items-center justify-center bg-ink text-[12px] font-medium uppercase tracking-[0.18em] text-bone transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {paying ? "Processing…" : `Pay ${quote ? money(quote.total) : ""} with PayPal (test)`}
              </button>
            </div>
          )}

          {(mode === "sandbox" || mode === "live") && (
            <>
              {mode === "sandbox" && (
                <p className="text-[12px] text-muted">PayPal sandbox — use a sandbox buyer account; no real money moves.</p>
              )}
              <PayPalButtons
                clientId={clientId}
                currency={currency}
                disabled={paying || quoting || !quote}
                handlers={{
                  validate,
                  createOrder,
                  onApprove,
                  onCancel: () => {
                    setPaying(false);
                    setPayError("Payment cancelled. You haven't been charged.");
                  },
                  onError: (message) => {
                    setPaying(false);
                    setPayError(message);
                  },
                }}
              />
              {paying && <p className="text-sm text-muted">Confirming your payment…</p>}
            </>
          )}

          {mode === "disabled" && (
            <p className="text-sm text-muted">Online payment isn&apos;t available right now. Please try again later.</p>
          )}
        </Fieldset>
      </form>

      {/* Summary first on phones, so the total is seen before paying. */}
      <aside className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-paper p-6">
          <h2 className="font-display text-2xl">Order summary</h2>

          <ul className={cn("mt-5 divide-y divide-line transition-opacity", quoting && "opacity-60")}>
            {(quote?.items ?? []).map((it) => (
              <li key={`${it.product_id}-${it.size}`} className="flex gap-4 py-4">
                <div className="relative w-14 shrink-0">
                  <div className="relative aspect-[4/5] overflow-hidden bg-bone">
                    {it.image_url && (
                      <Image
                        src={it.image_url}
                        alt=""
                        fill
                        sizes="56px"
                        placeholder="blur"
                        blurDataURL={BLUR}
                        unoptimized={!canOptimize(it.image_url)}
                        className="object-cover"
                      />
                    )}
                  </div>
                  {/* Outside the clipped image box so it can overhang the corner. */}
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-bone">
                    {it.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight">{it.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted">{it.size}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{money(it.unit_price * it.quantity)}</p>
              </li>
            ))}
            {!quote && !quoteError && <li className="h-20 animate-pulse bg-bone" />}
          </ul>

          {quote && (
            <dl className={cn("mt-2 space-y-2 border-t border-line pt-4 text-sm transition-opacity", quoting && "opacity-60")}>
              <Row label="Subtotal" value={money(quote.subtotal)} />
              {quote.coupon_code && (
                <Row
                  label={
                    <>
                      Discount <span className="font-mono text-[12px]">({quote.coupon_code})</span>
                    </>
                  }
                  value={<span className="text-accent">−{money(quote.discount)}</span>}
                />
              )}
              <Row
                label="Shipping"
                value={quote.shipping === 0 ? "Free" : money(quote.shipping)}
                hint={quote.shipping > 0 ? `Free over ${money(FREE_SHIPPING_FROM)}` : undefined}
              />
              <Row label="Tax" value={customer.province ? money(quote.tax) : <span className="text-muted">Select province</span>} />
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="text-[12px] font-medium uppercase tracking-[0.16em]">Total</dt>
                <dd className="text-2xl tabular-nums">
                  <span className="mr-1.5 text-xs text-muted">{quote.currency}</span>
                  {money(quote.total)}
                </dd>
              </div>
            </dl>
          )}

          {(quote?.notices.length || quoteError) && (
            <ul className="mt-4 space-y-1 text-[13px] text-accent" role="status">
              {quoteError && <li>{quoteError}</li>}
              {quote?.notices.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 font-display text-2xl">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[12px] font-medium uppercase tracking-[0.14em]">
        {label}
        {hint && <span className="text-[11px] font-normal normal-case tracking-normal text-muted">{hint}</span>}
      </span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1.5 block text-[12px] text-red-700">{error}</span>}
    </label>
  );
}

function Row({ label, value, hint }: { label: React.ReactNode; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">
        {label}
        {hint && <span className="block text-[11px]">{hint}</span>}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function inputClass(error?: string) {
  return cn(
    "block w-full border bg-paper px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink",
    error ? "border-red-400" : "border-line",
  );
}
