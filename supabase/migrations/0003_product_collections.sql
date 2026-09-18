-- Many-to-many product <-> collection membership.
--
-- Replaces the free-text `products.collection` column, which allowed only one
-- collection per product and could not be enforced by the database. A product
-- can now sit in both "Amber" and "Holiday Edit" at once.
--
-- Safe to run on the current data: every product has collection = null and
-- the collections table is empty, so there is nothing to migrate. The backfill
-- below is kept anyway so the migration is correct if run against a database
-- where the text column was populated.

create table if not exists public.product_collections (
  product_id    uuid not null references public.products(id)    on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (product_id, collection_id)
);

-- The PK indexes product_id; membership is also queried the other way round
-- ("which products are in this collection?").
create index if not exists product_collections_collection_id_idx
  on public.product_collections (collection_id);

-- Backfill from the old text column, matching on name as the app used to.
-- Products naming a collection that does not exist are dropped rather than
-- silently inventing one -- exactly the orphaning the FK now prevents.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'collection'
  ) then
    insert into public.product_collections (product_id, collection_id)
    select p.id, c.id
      from public.products p
      join public.collections c on lower(c.name) = lower(p.collection)
     where p.collection is not null
    on conflict do nothing;

    alter table public.products drop column collection;
  end if;
end $$;

-- -------------------------------------------------------- row-level security
--
-- Membership rows are not sensitive on their own, but they reveal which
-- products exist. Mirror the catalogue rule: readable when both sides are
-- publicly visible, writable only via the service-role key.

alter table public.product_collections enable row level security;

drop policy if exists "public reads active memberships" on public.product_collections;
create policy "public reads active memberships" on public.product_collections
  for select to anon, authenticated using (
    exists (select 1 from public.products p
             where p.id = product_id and p.is_active)
    and exists (select 1 from public.collections c
                 where c.id = collection_id and c.is_active)
  );
