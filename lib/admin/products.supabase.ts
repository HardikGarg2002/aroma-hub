import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminProduct, AdminProductInput } from "@/types/admin";

/**
 * Supabase-backed product store. Mirrors the function signatures in
 * products.mock.ts exactly; products.ts picks between them.
 */

const TABLE = "products";
const JOIN = "product_collections";

/**
 * Single literal, not a concatenation: the SDK statically parses this string.
 * The trailing embed pulls each product's collections through the join table
 * in the same round trip, so listing products stays one query.
 */
const COLUMNS =
  "id, product_code, name, inspired_by, description, price, currency, size_options, image_url, is_active, created_at, updated_at, product_collections(collections(id, name))" as const;

/** A row as selected by COLUMNS, before the embed is flattened. */
type Row = Omit<AdminProduct, "price" | "collection_ids" | "collection_names"> & {
  price: number | string;
  product_collections: { collections: { id: string; name: string } | null }[] | null;
};

function toProduct(row: Row): AdminProduct {
  const { product_collections, ...rest } = row;
  const collections = (product_collections ?? [])
    .map((m) => m.collections)
    .filter((c): c is { id: string; name: string } => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ...rest,
    price: Number(row.price),
    size_options: row.size_options ?? [],
    collection_ids: collections.map((c) => c.id),
    collection_names: collections.map((c) => c.name),
  };
}

export async function listProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list products: ${error.message}`);
  return (data as unknown as Row[]).map(toProduct);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data ? toProduct(data as unknown as Row) : null;
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

/**
 * Make `ids` exactly the rows matching `keep` in the join table: rows outside
 * the list are deleted, listed ones inserted if missing. Shared by the two
 * directions of membership editing below.
 */
async function syncMemberships(
  keep: { column: "product_id" | "collection_id"; value: string },
  otherColumn: "product_id" | "collection_id",
  ids: string[],
  failure: string,
) {
  const db = supabaseAdmin();

  let remove = db.from(JOIN).delete().eq(keep.column, keep.value);
  if (ids.length) remove = remove.not(otherColumn, "in", `(${ids.join(",")})`);

  const { error: removeError } = await remove;
  if (removeError) throw new Error(`${failure}: ${removeError.message}`);

  if (!ids.length) return;

  const rows = ids.map((id) =>
    keep.column === "product_id"
      ? { product_id: keep.value, collection_id: id }
      : { product_id: id, collection_id: keep.value },
  );

  const { error: addError } = await db
    .from(JOIN)
    .upsert(rows, { onConflict: "product_id,collection_id", ignoreDuplicates: true });

  if (addError) throw new Error(`${failure}: ${addError.message}`);
}

export async function createProduct(input: AdminProductInput): Promise<AdminProduct> {
  const { collection_ids, ...columns } = input;

  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .insert(columns)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create product: ${error.message}`);

  await syncMemberships(
    { column: "product_id", value: data.id },
    "collection_id",
    collection_ids,
    "Failed to set product collections",
  );

  const created = await getProduct(data.id);
  if (!created) throw new Error("Product vanished immediately after creation");
  return created;
}

export async function updateProduct(
  id: string,
  input: AdminProductInput,
): Promise<AdminProduct | null> {
  const { collection_ids, ...columns } = input;

  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(columns)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to update product: ${error.message}`);
  if (!data) return null;

  await syncMemberships(
    { column: "product_id", value: id },
    "collection_id",
    collection_ids,
    "Failed to set product collections",
  );

  return getProduct(id);
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<AdminProduct | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to update product: ${error.message}`);
  return data ? getProduct(id) : null;
}

/**
 * Make `productIds` exactly the members of `collectionId`. Products dropped
 * from the list keep whatever other collections they are in -- membership is
 * many-to-many now, so this only touches rows for this collection.
 */
export async function setCollectionMembers(collectionId: string, productIds: string[]) {
  await syncMemberships(
    { column: "collection_id", value: collectionId },
    "product_id",
    productIds,
    "Failed to update collection members",
  );
}
