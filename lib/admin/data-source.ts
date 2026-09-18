/**
 * Selects where admin data comes from: the in-memory mock stores or Supabase.
 *
 * Set ADMIN_DATA_SOURCE=mock to force the sample data, or =supabase to force
 * the database. Unset, it uses Supabase when a secret key is configured and
 * falls back to the mocks when it isn't — so a fresh clone with no Supabase
 * credentials still runs.
 */

export type DataSource = "mock" | "supabase";

export const DATA_SOURCE: DataSource = (() => {
  const configured = process.env.ADMIN_DATA_SOURCE?.trim().toLowerCase();
  if (configured === "mock" || configured === "supabase") return configured;
  return process.env.SUPABASE_SECRET_KEY ? "supabase" : "mock";
})();

export const usingSupabase = DATA_SOURCE === "supabase";
