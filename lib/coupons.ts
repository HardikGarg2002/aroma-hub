import type { AdminCoupon } from "@/types/admin";

/** Codes are case-insensitive for customers; stored and compared uppercase. */
export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

export type CouponResult =
  | { ok: true; discount: number }
  | { ok: false; reason: "inactive" | "currency" | "minimum"; shortfall?: number };

/**
 * The single place coupon rules live, so the admin preview and checkout can
 * never disagree. The discount is capped at the subtotal: a coupon never
 * makes an order negative.
 */
export function evaluateCoupon(
  coupon: Pick<AdminCoupon, "discount_amount" | "min_cart_value" | "currency" | "is_active">,
  subtotal: number,
  currency: string,
): CouponResult {
  if (!coupon.is_active) return { ok: false, reason: "inactive" };
  if (coupon.currency !== currency) return { ok: false, reason: "currency" };
  if (subtotal < coupon.min_cart_value) {
    return { ok: false, reason: "minimum", shortfall: Math.round((coupon.min_cart_value - subtotal) * 100) / 100 };
  }
  return { ok: true, discount: Math.min(coupon.discount_amount, subtotal) };
}
