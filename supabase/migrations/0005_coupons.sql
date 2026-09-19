-- Coupons. Column names and types mirror types/admin.ts (AdminCoupon), so
-- rows deserialise straight into it -- same convention as 0001's collections.
--
-- Safe to re-run: every object is created only if missing.

create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,
  description      text,
  discount_amount  numeric(10, 2) not null,
  min_cart_value   numeric(10, 2) not null default 0,
  currency         text not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Codes are stored uppercase (see normalizeCouponCode) and unique.
create unique index if not exists coupons_code_key on public.coupons (code);

-- Every lookup (admin panel and the storefront's checkCoupon/refreshCoupon)
-- goes through the service-role client in lib/admin/coupons.supabase.ts,
-- which bypasses RLS entirely -- same as orders. No anon-key access is
-- needed, so RLS is enabled with no policy: the publishable key sees zero
-- rows and codes can't be enumerated from the browser.
alter table public.coupons enable row level security;
