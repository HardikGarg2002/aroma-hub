import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminProduct, AdminProductInput } from "@/types/admin";
import type { Database } from "@/types/database";

/**
 * Supabase-backed product store. Mirrors the function signatures in
 * products.mock.ts exactly; products.ts picks between them.
 */

const TABLE = "products";

/** Single literal, not a concatenation: the SDK statically parses this string. */
const COLUMNS =
  "id, product_code, name, inspired_by, description, price, currency, size_options, collection, image_url, is_active, created_at, updated_at" as const;

/** postgres `numeric` arrives as a string over PostgREST; AdminProduct wants a number. */
type Row = Database["public"]["Tables"]["products"]["Row"];

function toProduct(row: Row): AdminProduct {
  return { ...row, price: Number(row.price), size_options: row.size_options ?? [] };
}

export async function listProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list products: ${error.message}`);
  return data.map(toProduct);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data ? toProduct(data) : null;
}

export async function isProductCodeTaken(code: string, exceptId?: string) {
  let query = supabaseAdmin()
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .ilike("product_code", code);

  if (exceptId) query = query.neq("id", exceptId);

  const { count, error } = await query;
  if (error) throw new Error(`Failed to check product code: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function createProduct(input: AdminProductInput): Promise<AdminProduct> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .insert(input)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create product: ${error.message}`);
  return toProduct(data);
}

export async function updateProduct(
  id: string,
  input: AdminProductInput,
): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update product: ${error.message}`);
  return data ? toProduct(data) : null;
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update product: ${error.message}`);
  return data ? toProduct(data) : null;
}

/**
 * Make `productIds` exactly the members of a collection: listed products move
 * in from wherever they were, and products left in `previousName`/`name` are
 * cleared. Two statements rather than a row-by-row loop.
 */
export async function setCollectionMembers(
  previousName: string | null,
  name: string,
  productIds: string[],
) {
  const db = supabaseAdmin();
  const names = previousName && previousName !== name ? [previousName, name] : [name];

  // Clear everyone currently in the collection who isn't in the new list.
  let clear = db.from(TABLE).update({ collection: null }).in("collection", names);
  if (productIds.length) clear = clear.not("id", "in", `(${productIds.join(",")})`);

  const { error: clearError } = await clear;
  if (clearError) {
    throw new Error(`Failed to update collection members: ${clearError.message}`);
  }

  if (!productIds.length) return;

  const { error: assignError } = await db
    .from(TABLE)
    .update({ collection: name })
    .in("id", productIds);

  if (assignError) {
    throw new Error(`Failed to update collection members: ${assignError.message}`);
  }
}
