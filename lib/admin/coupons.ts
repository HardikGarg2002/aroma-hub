import * as mock from "./coupons.mock";

/**
 * Coupon store. Mock-only for now; when a Supabase table exists, add
 * coupons.supabase.ts with the same exports and pick between them on
 * `usingSupabase`, as products.ts and collections.ts do.
 */

export const listCoupons = mock.listCoupons;
export const getCoupon = mock.getCoupon;
export const getCouponByCode = mock.getCouponByCode;
export const isCouponCodeTaken = mock.isCouponCodeTaken;
export const createCoupon = mock.createCoupon;
export const updateCoupon = mock.updateCoupon;
export const setCouponActive = mock.setCouponActive;
