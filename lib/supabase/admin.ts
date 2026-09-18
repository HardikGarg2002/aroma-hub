import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role Supabase client for the admin panel.
 *
 * This key bypasses RLS entirely, so it must never reach the browser — the
 * "server-only" import above turns any client-component import into a build
 * error. Authorisation is still enforced by requireAdmin() in lib/admin/auth.ts;
 * this client assumes the caller has already passed that gate.
 */

let client: SupabaseClient<Database> | undefined;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to .env.local, or set " +
        "ADMIN_DATA_SOURCE=mock to run against the sample data instead.",
    );
  }

  client = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
