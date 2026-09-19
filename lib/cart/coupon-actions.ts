"use server";

import { getCouponByCode } from "@/lib/admin/coupons";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupons";
import { formatMoney } from "@/lib/admin/format";
import type { AdminCoupon } from "@/types/admin";
import type { AppliedCoupon } from "./store";

export type CheckCouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: "empty" | "invalid" | "currency" | "minimum"; error: string };

/**
 * Public (storefront) coupon lookup. Returns only the terms the cart needs to
 * show the discount — never internal fields like the description.
 *
 * `subtotal` comes from the browser, so this only drives the message shown;
 * checkout re-checks the code against the real, server-priced cart.
 */
export async function checkCoupon(rawCode: string, subtotal: number, currency: string): Promise<CheckCouponResult> {
  const code = normalizeCouponCode(String(rawCode ?? "")).slice(0, 32);
  if (!code) return { ok: false, reason: "empty", error: "Enter a coupon code." };

  const coupon = await getCouponByCode(code);
  // Unknown and switched-off codes get the same message, so codes can't be probed.
  if (!coupon?.is_active) return { ok: false, reason: "invalid", error: "This code isn't valid." };

  const result = evaluateCoupon(coupon, Number(subtotal) || 0, String(currency));
  if (!result.ok && result.reason === "currency") {
    return { ok: false, reason: "currency", error: "This code can't be used with the items in your cart." };
  }
  if (!result.ok && result.reason === "minimum") {
    return {
      ok: false,
      reason: "minimum",
      error: `Spend ${formatMoney(result.shortfall ?? 0, coupon.currency)} more to use ${coupon.code}.`,
    };
  }

  return { ok: true, coupon: toApplied(coupon) };
}

/**
 * Current terms for an already-applied code, or null if it no longer exists
 * or has been switched off. Doesn't judge the cart — the sheet does that live.
 */
export async function refreshCoupon(rawCode: string): Promise<AppliedCoupon | null> {
  const coupon = await getCouponByCode(normalizeCouponCode(String(rawCode ?? "")).slice(0, 32));
  return coupon?.is_active ? toApplied(coupon) : null;
}

function toApplied(coupon: AdminCoupon): AppliedCoupon {
  return {
    code: coupon.code,
    discount_amount: coupon.discount_amount,
    min_cart_value: coupon.min_cart_value,
    currency: coupon.currency,
  };
}
