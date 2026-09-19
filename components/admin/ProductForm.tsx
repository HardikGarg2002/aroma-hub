"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProduct, type ProductFormValues, type VariantFormValues } from "@/lib/admin/product-actions";
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
    currency: p?.currency ?? "CAD",
    variants: p
      ? p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          price: String(v.price),
          stock_quantity: String(v.stock_quantity),
          is_active: v.is_active,
        }))
      : [{ size: "50 ml", price: "", stock_quantity: "0", is_active: true }],
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
  const [variants, setVariants] = useState<VariantFormValues[]>(values.variants);

  const setVariant = (i: number, patch: Partial<VariantFormValues>) =>
    setVariants((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addVariant = () =>
    setVariants((rows) => [...rows, { size: "", price: "", stock_quantity: "0", is_active: true }]);
  const removeVariant = (i: number) => setVariants((rows) => rows.filter((_, j) => j !== i));
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

        <Section title="Sizes & pricing">
          <Field label="Currency" error={errors.currency}>
            <select name="currency" defaultValue={values.currency} className={input(errors.currency)}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Sizes" error={errors.variants} hint="Each size has its own price" as="div">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Stock</th>
                    <th className="pb-2 text-center font-medium">Active</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-2 pr-2">
                        {v.id && <input type="hidden" name="variant_id" value={v.id} />}
                        {!v.id && <input type="hidden" name="variant_id" value="" />}
                        <input
                          name="variant_size"
                          list={`sizes-${i}`}
                          value={v.size}
                          onChange={(e) => setVariant(i, { size: e.target.value })}
                          placeholder="50 ml"
                          className={input()}
                        />
                        <datalist id={`sizes-${i}`}>
                          {sizePresets.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          name="variant_price"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={v.price}
                          onChange={(e) => setVariant(i, { price: e.target.value })}
                          className={cn(input(), "tabular-nums")}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          name="variant_stock"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step="1"
                          value={v.stock_quantity}
                          onChange={(e) => setVariant(i, { stock_quantity: e.target.value })}
                          className={cn(input(), "tabular-nums")}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          name="variant_active"
                          value={String(i)}
                          checked={v.is_active}
                          onChange={(e) => setVariant(i, { is_active: e.target.checked })}
                          className="size-4 accent-ink"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          disabled={variants.length === 1}
                          className="text-xs text-muted hover:text-ink disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="mt-3 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              + Add size
            </button>
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
