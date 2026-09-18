"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProduct, type ProductFormValues } from "@/lib/admin/product-actions";
import type { AdminProduct } from "@/types/admin";
import { cn } from "@/lib/cn";
import { ProductThumb } from "./ProductThumb";
import { Field, Section, input } from "./form";

type Props = {
  /** null = add mode */
  product: AdminProduct | null;
  currencies: readonly string[];
  collections: readonly { id: string; name: string }[];
  sizePresets: readonly string[];
};

function toValues(p: AdminProduct | null): ProductFormValues {
  return {
    product_code: p?.product_code ?? "",
    name: p?.name ?? "",
    inspired_by: p?.inspired_by ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    currency: p?.currency ?? "CAD",
    size_options: p?.size_options ?? ["50 ml"],
    collection_ids: p?.collection_ids ?? [],
    image_url: p?.image_url ?? "",
    is_active: String(p?.is_active ?? true),
  };
}

export function ProductForm({ product, currencies, collections, sizePresets }: Props) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  // After a failed save React resets the form to its defaults, so the
  // defaults become whatever was submitted.
  const values = state?.values ?? toValues(product);
  const errors = state?.errors ?? {};

  const [imageUrl, setImageUrl] = useState(values.image_url);
  const [sizes, setSizes] = useState<string[]>(values.size_options);
  const [collectionIds, setCollectionIds] = useState<string[]>(values.collection_ids);

  const toggleCollection = (id: string) =>
    setCollectionIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  return (
    <form action={action} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="space-y-6">
        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <input name="name" defaultValue={values.name} className={input(errors.name)} />
            </Field>
            <Field label="Product code" error={errors.product_code}>
              <input
                name="product_code"
                defaultValue={values.product_code}
                placeholder="AR-FL-013"
                className={cn(input(errors.product_code), "font-mono")}
              />
            </Field>
          </div>
          <Field label="Inspired by" hint="Optional">
            <input name="inspired_by" defaultValue={values.inspired_by} className={input()} />
          </Field>
          <Field label="Description" hint="Optional">
            <textarea name="description" rows={5} defaultValue={values.description} className={input()} />
          </Field>
        </Section>

        <Section title="Pricing & sizes">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Price" error={errors.price}>
              <input
                name="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={values.price}
                className={cn(input(errors.price), "tabular-nums")}
              />
            </Field>
            <Field label="Currency" error={errors.currency}>
              <select name="currency" defaultValue={values.currency} className={input(errors.currency)}>
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Size options" error={errors.size_options} as="div">
            <SizeOptions presets={sizePresets} value={sizes} onChange={setSizes} />
            {sizes.map((s) => (
              <input key={s} type="hidden" name="size_options" value={s} />
            ))}
          </Field>
        </Section>
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

        <Section title="Organisation">
          <Field label="Collections" hint="Optional — a product can be in several">
            {collections.length === 0 ? (
              <p className="text-sm text-muted">No collections yet.</p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {collections.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="collection_ids"
                        value={c.id}
                        checked={collectionIds.includes(c.id)}
                        onChange={() => toggleCollection(c.id)}
                        className="size-4 accent-ink"
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Field>
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
        {errors.form && (
          <p role="alert" className="mr-auto text-sm text-red-700">
            {errors.form}
          </p>
        )}
        {Object.keys(errors).length > 0 && !errors.form && (
          <p role="alert" className="mr-auto text-sm text-red-700">
            Please fix the highlighted fields.
          </p>
        )}
        <Link href="/admin/products" className="rounded-md px-4 py-2.5 text-sm text-ink-soft hover:bg-bone-deep">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

function SizeOptions({
  presets,
  value,
  onChange,
}: {
  presets: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const all = [...presets, ...value.filter((v) => !presets.includes(v))];
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((v) => v !== s) : [...value, s]);

  const addCustom = () => {
    const s = custom.trim();
    if (s && !value.includes(s)) onChange([...value, s]);
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {all.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                on ? "border-ink bg-ink text-bone" : "border-line text-ink-soft hover:border-ink",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom size, e.g. 75 ml"
          className={cn(input(), "mt-0 max-w-56")}
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-md border border-line px-3 text-sm hover:border-ink"
        >
          Add
        </button>
      </div>
    </div>
  );
}
