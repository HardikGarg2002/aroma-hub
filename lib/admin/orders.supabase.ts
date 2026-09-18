import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/admin";
import type { Database } from "@/types/database";

/**
 * Supabase-backed order store. Mirrors orders.mock.ts.
 *
 * `items` and `shipping_address` are jsonb snapshots taken at checkout, so
 * they come back already shaped like AdminOrderItem[] / AdminAddress.
 */

const TABLE = "orders";

/** Single literal, not a concatenation: the SDK statically parses this string. */
const COLUMNS =
  "id, order_number, status, payment_status, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping, tax, discount, total, currency, notes, created_at, updated_at" as const;

/** postgres `numeric` arrives as a string over PostgREST; AdminOrder wants numbers. */
type Row = Database["public"]["Tables"]["orders"]["Row"];

function toOrder(row: Row): AdminOrder {
  return {
    ...row,
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    discount: Number(row.discount),
    total: Number(row.total),
  };
}

export async function listOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list orders: ${error.message}`);
  return data.map(toOrder);
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load order: ${error.message}`);
  return data ? toOrder(data) : null;
}

export async function updateOrderStatus(
  id: string,
  patch: { status: OrderStatus; payment_status: PaymentStatus },
): Promise<AdminOrder | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update order: ${error.message}`);
  return data ? toOrder(data) : null;
}
