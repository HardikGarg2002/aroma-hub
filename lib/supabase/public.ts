import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Publishable-key Supabase client for storefront reads.
 *
 * Safe to use anywhere, including the browser: it is subject to RLS, so it
 * only ever sees rows the "public read" policies expose (active products and
 * collections). Admin writes go through lib/supabase/admin.ts instead.
 */

let client: SupabaseClient<Database> | undefined;

export function supabasePublic(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");

  client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
