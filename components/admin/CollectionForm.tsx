"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveCollection, type CollectionFormValues } from "@/lib/admin/collection-actions";
import { fromPrice, type AdminCollection, type AdminProduct } from "@/types/admin";
import { formatMoney } from "@/lib/admin/format";
import { cn } from "@/lib/cn";
import { ProductThumb } from "./ProductThumb";
import { Field, Section, input } from "./form";

type Props = {
  /** null = add mode */
  collection: AdminCollection | null;
  /** Whole catalogue, to pick members from. */
  products: AdminProduct[];
};

// Mirrors slugify() in lib/admin/collections.ts; the server re-slugifies on save.
const slugify = (v: string) =>
  v.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function toValues(c: AdminCollection | null, products: AdminProduct[]): CollectionFormValues {
  return {
    name: c?.name ?? "",
    slug: c?.slug ?? "",
    description: c?.description ?? "",
    image_url: c?.image_url ?? "",
    is_active: String(c?.is_active ?? true),
    product_ids: c ? products.filter((p) => p.collection_ids.includes(c.id)).map((p) => p.id) : [],
  };
}

export function CollectionForm({ collection, products }: Props) {
  const [state, action, pending] = useActionState(saveCollection, undefined);
  // After a failed save React resets the form to its defaults, so the
  // defaults become whatever was submitted.
  const values = state?.values ?? toValues(collection, products);
  const errors = state?.errors ?? {};

  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  // Slug follows the name until the admin edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(collection));
  const [imageUrl, setImageUrl] = useState(values.image_url);
  const [memberIds, setMemberIds] = useState<string[]>(values.product_ids);

  return (
    <form action={action} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      {collection && <input type="hidden" name="id" value={collection.id} />}
      {memberIds.map((id) => (
        <input key={id} type="hidden" name="product_ids" value={id} />
      ))}

      <div className="min-w-0 space-y-6">
        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <input
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className={input(errors.name)}
              />
            </Field>
            <Field label="Slug" error={errors.slug}>
              <input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug(slugify(slug))}
                className={cn(input(errors.slug), "font-mono")}
              />
            </Field>
          </div>
          <Field label="Description" hint="Optional">
            <textarea name="description" rows={3} defaultValue={values.description} className={input()} />
          </Field>
        </Section>

        <ProductMembers
          products={products}
          memberIds={memberIds}
          onChange={setMemberIds}
          collectionName={collection?.name ?? null}
        />
      </div>

      <div className="space-y-6">
        <Section title="Status">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Active</span>
              <span className="block text-xs text-muted">Visible in the storefront</span>
            </span>
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={values.is_active === "true"}
              className="size-4 accent-ink"
            />
          </label>
        </Section>

        <Section title="Image">
          <ProductThumb src={/^https?:\/\//i.test(imageUrl) ? imageUrl : null} alt="Preview" size={120} />
          <Field label="Image URL" hint="Optional" error={errors.image_url}>
            <input
              name="image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={input(errors.image_url)}
            />
          </Field>
        </Section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6 lg:col-span-2">
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="mr-auto text-sm text-red-700">
            {errors.form ?? "Please fix the highlighted fields."}
          </p>
        )}
        <Link href="/admin/collections" className="rounded-md px-4 py-2.5 text-sm text-ink-soft hover:bg-bone-deep">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : collection ? "Save changes" : "Create collection"}
        </button>
      </div>
    </form>
  );
}

function ProductMembers({
  products,
  memberIds,
  onChange,
  collectionName,
}: {
  products: AdminProduct[];
  memberIds: string[];
  onChange: (ids: string[]) => void;
  collectionName: string | null;
}) {
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  const memberSet = useMemo(() => new Set(memberIds), [memberIds]);
  const members = products.filter((p) => memberSet.has(p.id));

  const q = query.trim().toLowerCase();
  const candidates = products.filter(
    (p) =>
      !memberSet.has(p.id) &&
      (!q || p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)),
  );

  const remove = (id: string) => onChange(memberIds.filter((m) => m !== id));
  const add = (id: string) => onChange([...memberIds, id]);

  return (
    <section className="rounded-lg border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Products <span className="ml-1 text-ink">{members.length}</span>
        </h2>
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          aria-expanded={picking}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-ink"
        >
          {picking ? "Done" : "+ Add products"}
        </button>
      </div>

      {picking && (
        <div className="border-b border-line bg-bone/40 px-6 py-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Search by name or code"
            className={input()}
          />
          <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-md border border-line bg-paper">
            {candidates.map((p) => {
              const elsewhere = p.collection_names.filter((n) => n !== collectionName);
              return (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <ProductThumb src={p.image_url} alt={p.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      <span className="font-mono">{p.product_code}</span>
                      {elsewhere.length > 0 && <> · Also in {elsewhere.join(", ")}</>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => add(p.id)}
                    className="rounded-md bg-ink px-3 py-1 text-xs font-medium text-bone hover:opacity-90"
                  >
                    Add
                  </button>
                </li>
              );
            })}
            {candidates.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">No matching products.</li>
            )}
          </ul>
        </div>
      )}

      <ul className="divide-y divide-line">
        {members.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-6 py-3">
            <ProductThumb src={p.image_url} alt={p.name} size={40} />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/products/${p.id}`} className="truncate text-sm font-medium hover:text-accent">
                {p.name}
              </Link>
              <p className="truncate text-xs text-muted">
                <span className="font-mono">{p.product_code}</span> · {(() => { const f = fromPrice(p); return f === null ? "—" : formatMoney(f, p.currency); })()}
                {!p.is_active && " · Inactive"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="rounded-md px-3 py-1 text-xs text-ink-soft hover:bg-bone-deep hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
        {members.length === 0 && (
          <li className="px-6 py-10 text-center text-sm text-muted">
            No products in this collection yet.
          </li>
        )}
      </ul>
    </section>
  );
}
