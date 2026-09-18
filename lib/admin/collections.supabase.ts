import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminCollection, AdminCollectionInput } from "@/types/admin";

/**
 * Supabase-backed collection store. Mirrors collections.mock.ts; the picker in
 * collections.ts chooses between them.
 */

const TABLE = "collections";
const COLUMNS =
  "id, name, slug, description, image_url, is_active, created_at, updated_at" as const;

export async function listCollections(): Promise<AdminCollection[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to list collections: ${error.message}`);
  return data;
}

export async function getCollection(id: string): Promise<AdminCollection | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load collection: ${error.message}`);
  return data ?? null;
}

/** Returns which unique field clashes with another collection, if any. */
export async function findCollectionConflict(
  input: Pick<AdminCollection, "name" | "slug">,
  exceptId?: string,
) {
  const db = supabaseAdmin();

  const byName = async () => {
    let q = db.from(TABLE).select("id", { count: "exact", head: true }).ilike("name", input.name);
    if (exceptId) q = q.neq("id", exceptId);
    return q;
  };

  const bySlug = async () => {
    let q = db.from(TABLE).select("id", { count: "exact", head: true }).eq("slug", input.slug);
    if (exceptId) q = q.neq("id", exceptId);
    return q;
  };

  const [nameHit, slugHit] = await Promise.all([byName(), bySlug()]);

  if (nameHit.error) throw new Error(`Failed to check collection: ${nameHit.error.message}`);
  if (slugHit.error) throw new Error(`Failed to check collection: ${slugHit.error.message}`);

  if ((nameHit.count ?? 0) > 0) return "name" as const;
  if ((slugHit.count ?? 0) > 0) return "slug" as const;
  return null;
}

export async function createCollection(
  input: AdminCollectionInput,
): Promise<AdminCollection> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .insert(input)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create collection: ${error.message}`);
  return data;
}

export async function updateCollection(
  id: string,
  input: AdminCollectionInput,
): Promise<AdminCollection | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update collection: ${error.message}`);
  return data ?? null;
}

export async function setCollectionActive(
  id: string,
  isActive: boolean,
): Promise<AdminCollection | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update collection: ${error.message}`);
  return data ?? null;
}
