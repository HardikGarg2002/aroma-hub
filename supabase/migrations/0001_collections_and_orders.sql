-- Collections and orders only. `products` already exists and is not touched.
--
-- Safe to re-run: every object is created only if missing.
-- Column names and types mirror types/admin.ts, so rows deserialise straight
-- into AdminCollection / AdminOrder.

-- ---------------------------------------------------------------- collections

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  description text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Case-insensitive: findCollectionConflict() treats "Floral" and "floral" as
-- the same name, so the database must agree.
create unique index if not exists collections_name_key on public.collections (lower(name));
create unique index if not exists collections_slug_key on public.collections (slug);

-- -------------------------------------------------------------------- orders

do $$ begin
  create type public.order_status as enum
    ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null,
  status           public.order_status not null default 'pending',
  payment_status   public.payment_status not null default 'unpaid',
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text,
  -- Snapshots, not references: line items and the address are frozen at
  -- checkout so later product or customer edits never rewrite order history.
  -- `items` holds AdminOrderItem[].
  shipping_address jsonb not null,
  items            jsonb not null default '[]',
  subtotal         numeric(10, 2) not null default 0,
  shipping         numeric(10, 2) not null default 0,
  tax              numeric(10, 2) not null default 0,
  discount         numeric(10, 2) not null default 0,
  total            numeric(10, 2) not null default 0,
  currency         text not null default 'CAD',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists orders_order_number_key on public.orders (order_number);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- ------------------------------------------------------- updated_at triggers

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists collections_touch_updated_at on public.collections;
create trigger collections_touch_updated_at before update on public.collections
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------- row-level security
--
-- The admin panel uses the service-role key, which bypasses RLS and is gated
-- by requireAdmin() in the application. The storefront's publishable key gets
-- read access to active collections only, and no access to orders at all.

alter table public.collections enable row level security;
alter table public.orders      enable row level security;

drop policy if exists "public reads active collections" on public.collections;
create policy "public reads active collections" on public.collections
  for select to anon, authenticated using (is_active);

-- Deliberately no policy on public.orders: customer names, emails, phone
-- numbers and addresses are readable only via the service-role key.
