import { usingSupabase } from "./data-source";
import * as mock from "./coupons.mock";
import * as db from "./coupons.supabase";

/**
 * Coupon store. Delegates to Supabase or to the in-memory sample data
 * depending on ADMIN_DATA_SOURCE -- see lib/admin/data-source.ts.
 */

const impl = usingSupabase ? db : mock;

export const listCoupons = impl.listCoupons;
export const getCoupon = impl.getCoupon;
export const getCouponByCode = impl.getCouponByCode;
export const isCouponCodeTaken = impl.isCouponCodeTaken;
export const createCoupon = impl.createCoupon;
export const updateCoupon = impl.updateCoupon;
export const setCouponActive = impl.setCouponActive;
