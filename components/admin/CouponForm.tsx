"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCoupon, type CouponFormValues } from "@/lib/admin/coupon-actions";
import { evaluateCoupon } from "@/lib/coupons";
import { formatMoney } from "@/lib/admin/format";
import type { AdminCoupon } from "@/types/admin";
import { cn } from "@/lib/cn";
import { Field, Section, input } from "./form";

type Props = {
  /** null = add mode */
  coupon: AdminCoupon | null;
  currencies: readonly string[];
};

function toValues(c: AdminCoupon | null): CouponFormValues {
  return {
    code: c?.code ?? "",
    description: c?.description ?? "",
    discount_amount: c ? String(c.discount_amount) : "",
    min_cart_value: c ? String(c.min_cart_value) : "0",
    currency: c?.currency ?? "CAD",
    is_active: String(c?.is_active ?? true),
  };
}

export function CouponForm({ coupon, currencies }: Props) {
  const [state, action, pending] = useActionState(saveCoupon, undefined);
  // After a failed save React resets the form to its defaults, so the
  // defaults become whatever was submitted.
  const values = state?.values ?? toValues(coupon);
  const errors = state?.errors ?? {};

  // Controlled so the summary and tester below stay live.
  const [code, setCode] = useState(values.code);
  const [discount, setDiscount] = useState(values.discount_amount);
  const [minimum, setMinimum] = useState(values.min_cart_value);
  const [currency, setCurrency] = useState(values.currency);

  const off = Number(discount);
  const min = Number(minimum) || 0;
  const valid = Number.isFinite(off) && off > 0;
  const money = (n: number) => formatMoney(n, currency);

  return (
    <form action={action} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}

      <div className="min-w-0 space-y-6">
        <Section title="Coupon">
          <Field label="Code" error={errors.code}>
            <input
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="WELCOME10"
              autoComplete="off"
              spellCheck={false}
              className={cn(input(errors.code), "font-mono uppercase")}
            />
          </Field>
          <Field label="Description" hint="Optional, internal only">
            <input
              name="description"
              defaultValue={values.description}
              placeholder="e.g. Newsletter welcome offer"
              className={input()}
            />
          </Field>
        </Section>

        <Section title="Discount">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
            <Field label="Amount off" error={errors.discount_amount}>
              <input
                name="discount_amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="10"
                className={cn(input(errors.discount_amount), "tabular-nums")}
              />
            </Field>
            <Field label="Minimum cart value" hint="0 = none" error={errors.min_cart_value}>
              <input
                name="min_cart_value"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
                className={cn(input(errors.min_cart_value), "tabular-nums")}
              />
            </Field>
            <Field label="Currency" error={errors.currency}>
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={input(errors.currency)}
              >
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="rounded-md bg-bone/60 px-4 py-3 text-sm text-ink-soft">
            {valid ? (
              <>
                <span className="font-mono font-medium text-ink">{code || "This code"}</span> takes{" "}
                <strong className="font-medium text-ink">{money(off)}</strong> off the cart subtotal
                {min > 0 ? (
                  <>
                    {" "}when it is <strong className="font-medium text-ink">{money(min)}</strong> or more.
                  </>
                ) : (
                  ", with no minimum."
                )}
              </>
            ) : (
              "Enter an amount to see how this coupon applies."
            )}
          </p>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Status">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Active</span>
              <span className="block text-xs text-muted">Customers can redeem it</span>
            </span>
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={values.is_active === "true"}
              className="size-4 accent-ink"
            />
          </label>
        </Section>

        {valid && <CouponTester discount={off} minimum={min} currency={currency} />}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6 lg:col-span-2">
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="mr-auto text-sm text-red-700">
            {errors.form ?? "Please fix the highlighted fields."}
          </p>
        )}
        <Link href="/admin/coupons" className="rounded-md px-4 py-2.5 text-sm text-ink-soft hover:bg-bone-deep">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : coupon ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}

/** Try the coupon against a cart subtotal, using the same rule as checkout. */
function CouponTester({ discount, minimum, currency }: { discount: number; minimum: number; currency: string }) {
  const [subtotal, setSubtotal] = useState("");
  const amount = Number(subtotal);
  const money = (n: number) => formatMoney(n, currency);

  const result =
    subtotal && Number.isFinite(amount) && amount >= 0
      ? evaluateCoupon({ discount_amount: discount, min_cart_value: minimum, currency, is_active: true }, amount, currency)
      : null;

  return (
    <Section title="Test a cart">
      <Field label="Cart subtotal">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={subtotal}
          onChange={(e) => setSubtotal(e.target.value)}
          // Not part of the coupon: keep it out of the submitted form.
          form="__none"
          placeholder={String(Math.max(minimum, discount * 3))}
          className={cn(input(), "tabular-nums")}
        />
      </Field>
      {result && (
        <p className={cn("text-sm", result.ok ? "text-ink" : "text-muted")}>
          {result.ok ? (
            <>
              Applies: −{money(result.discount)} → customer pays{" "}
              <strong className="font-medium">{money(amount - result.discount)}</strong> before shipping and tax.
            </>
          ) : (
            <>Doesn&apos;t apply — add {money(result.shortfall ?? 0)} more to reach {money(minimum)}.</>
          )}
        </p>
      )}
    </Section>
  );
}
