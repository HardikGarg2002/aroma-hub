-- Per-size pricing.
--
-- `products.price` was a single value while `size_options` was an array, so a
-- product offering 10ml and 100ml charged the same for both. Price (and stock)
-- belong to a specific size, so they move to product_variants; `products`
-- keeps only what is true of the scent itself.
--
-- No separate SKU: `products.product_code` remains the single identifier, and
-- a variant is addressed by (product_code, size).

create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  size           text not null,
  price          numeric(10, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One row per size per product; the pair is how a variant is identified.
  unique (product_id, size)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

drop trigger if exists product_variants_touch_updated_at on public.product_variants;
create trigger product_variants_touch_updated_at before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ backfill
--
-- One variant per entry in the old size_options array, all carrying the old
-- product price. Lossless for the current data, where every product has
-- exactly one size, and the best available guess for any multi-size product:
-- the sizes keep the only price that was ever recorded for them.

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  ) then
    insert into public.product_variants (product_id, size, price, is_active)
    select p.id,
           coalesce(nullif(trim(s.size), ''), '50ml'),
           coalesce(p.price, 0),
           p.is_active
      from public.products p
      -- Products with an empty or null array still get one default variant.
      left join lateral unnest(
        case when coalesce(array_length(p.size_options, 1), 0) > 0
             then p.size_options
             else array['50ml'] end
      ) as s(size) on true
    on conflict (product_id, size) do nothing;

    alter table public.products drop column price;
    alter table public.products drop column size_options;
  end if;
end $$;

-- -------------------------------------------------------- row-level security
--
-- Mirrors the catalogue rule: an active variant of an active product is
-- publicly readable; writes go through the service-role key only.

alter table public.product_variants enable row level security;

drop policy if exists "public reads active variants" on public.product_variants;
create policy "public reads active variants" on public.product_variants
  for select to anon, authenticated using (
    is_active
    and exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );
