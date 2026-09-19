import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminCoupon, AdminCouponInput } from "@/types/admin";
import type { Database } from "@/types/database";

/**
 * Supabase-backed coupon store. Mirrors coupons.mock.ts; the picker in
 * coupons.ts chooses between them.
 */

const TABLE = "coupons";
const COLUMNS =
  "id, code, description, discount_amount, min_cart_value, currency, is_active, created_at, updated_at" as const;

/** postgres `numeric` arrives as a string over PostgREST; AdminCoupon wants numbers. */
type Row = Database["public"]["Tables"]["coupons"]["Row"];

function toCoupon(row: Row): AdminCoupon {
  return {
    ...row,
    discount_amount: Number(row.discount_amount),
    min_cart_value: Number(row.min_cart_value),
  };
}

export async function listCoupons(): Promise<AdminCoupon[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list coupons: ${error.message}`);
  return data.map(toCoupon);
}

export async function getCoupon(id: string): Promise<AdminCoupon | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load coupon: ${error.message}`);
  return data ? toCoupon(data) : null;
}

export async function getCouponByCode(code: string): Promise<AdminCoupon | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("code", code)
    .maybeSingle();

  if (error) throw new Error(`Failed to load coupon: ${error.message}`);
  return data ? toCoupon(data) : null;
}

export async function isCouponCodeTaken(code: string, exceptId?: string): Promise<boolean> {
  let q = supabaseAdmin().from(TABLE).select("id", { count: "exact", head: true }).eq("code", code);
  if (exceptId) q = q.neq("id", exceptId);

  const { count, error } = await q;
  if (error) throw new Error(`Failed to check coupon: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function createCoupon(input: AdminCouponInput): Promise<AdminCoupon> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .insert(input)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create coupon: ${error.message}`);
  return toCoupon(data);
}

export async function updateCoupon(id: string, input: AdminCouponInput): Promise<AdminCoupon | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update coupon: ${error.message}`);
  return data ? toCoupon(data) : null;
}

export async function setCouponActive(id: string, isActive: boolean): Promise<AdminCoupon | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update coupon: ${error.message}`);
  return data ? toCoupon(data) : null;
}
