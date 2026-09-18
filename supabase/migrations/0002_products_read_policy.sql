-- Let the storefront read the catalogue.
--
-- `products` has RLS enabled but no policy, so the publishable key sees zero
-- rows even though the table is populated. Admin reads are unaffected either
-- way because the service-role key bypasses RLS entirely.
--
-- Mirrors the collections policy in 0001: active rows are public, inactive
-- ones stay admin-only. No insert/update/delete policy, so anonymous writes
-- remain blocked.

alter table public.products enable row level security;

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated using (is_active);
