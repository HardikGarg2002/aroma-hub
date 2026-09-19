"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminProductInput, AdminVariantInput } from "@/types/admin";
import { requireAdmin } from "./auth";
import { createProduct, isProductCodeTaken, setProductActive, updateProduct } from "./products";

/** One size row as typed into the form, before validation. */
export type VariantFormValues = {
  id?: string;
  size: string;
  price: string;
  stock_quantity: string;
  is_active: boolean;
};

export type ProductFormValues = Record<
  Exclude<keyof AdminProductInput, "variants" | "collection_ids">,
  string
> & {
  /** One row per purchasable size, each with its own price. */
  variants: VariantFormValues[];
  /** Several collections per product; the form posts one value per checkbox. */
  collection_ids: string[];
};

export type ProductFormState =
  | {
      errors: Partial<Record<keyof AdminProductInput | "form", string>>;
      /** Echoed back so the form keeps what was typed after a failed save. */
      values: ProductFormValues;
    }
  | undefined;

/** Parse the parallel variant_* field arrays the form posts into rows. */
function readVariants(formData: FormData): VariantFormValues[] {
  const ids = formData.getAll("variant_id").map(String);
  const sizes = formData.getAll("variant_size").map((v) => String(v).trim());
  const prices = formData.getAll("variant_price").map((v) => String(v).trim());
  const stock = formData.getAll("variant_stock").map((v) => String(v).trim());
  // Checkboxes only post when checked, so actives carries the row indices.
  const actives = new Set(formData.getAll("variant_active").map(String));

  return sizes
    .map((size, i) => ({
      id: ids[i] || undefined,
      size,
      price: prices[i] ?? "",
      stock_quantity: stock[i] ?? "0",
      is_active: actives.has(String(i)),
    }))
    .filter((v) => v.size || v.price);
}

/** First problem with the size rows, or undefined when they are all valid. */
function variantsError(variants: VariantFormValues[]): string | undefined {
  if (variants.length === 0) return "Add at least one size.";

  const seen = new Set<string>();
  for (const v of variants) {
    if (!v.size) return "Every size needs a name.";
    const key = v.size.toLowerCase();
    if (seen.has(key)) return `"${v.size}" is listed twice.`;
    seen.add(key);

    const price = Number(v.price);
    if (!v.price) return `Enter a price for ${v.size}.`;
    if (!Number.isFinite(price) || price < 0) return `Enter a valid price for ${v.size}.`;

    const stock = Number(v.stock_quantity);
    if (!Number.isInteger(stock) || stock < 0) return `Enter a whole stock count for ${v.size}.`;
  }

  if (!variants.some((v) => v.is_active)) return "At least one size must be active.";
  return undefined;
}

function toVariant(v: VariantFormValues): AdminVariantInput {
  return {
    id: v.id,
    size: v.size,
    price: Math.round(Number(v.price) * 100) / 100,
    stock_quantity: Number(v.stock_quantity),
    is_active: v.is_active,
  };
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || undefined;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const values: ProductFormValues = {
    product_code: text("product_code"),
    name: text("name"),
    inspired_by: text("inspired_by"),
    description: text("description"),
    currency: text("currency"),
    variants: readVariants(formData),
    collection_ids: [...new Set(formData.getAll("collection_ids").map((s) => String(s).trim()).filter(Boolean))],
    image_url: text("image_url"),
    is_active: formData.get("is_active") === "on" ? "true" : "false",
  };

  const errors: NonNullable<ProductFormState>["errors"] = {};

  if (!values.product_code) errors.product_code = "Product code is required.";
  else if (await isProductCodeTaken(values.product_code, id)) errors.product_code = "This code is already used by another product.";
  if (!values.name) errors.name = "Name is required.";
  if (!/^[A-Z]{3}$/.test(values.currency)) errors.currency = "Choose a currency.";
  errors.variants = variantsError(values.variants);
  if (!errors.variants) delete errors.variants;
  if (values.image_url && !/^https?:\/\//i.test(values.image_url)) errors.image_url = "Must be an http(s) URL.";

  if (Object.keys(errors).length > 0) return { errors, values };

  const input: AdminProductInput = {
    product_code: values.product_code,
    name: values.name,
    inspired_by: values.inspired_by || null,
    description: values.description || null,
    currency: values.currency,
    variants: values.variants.map(toVariant),
    collection_ids: values.collection_ids,
    image_url: values.image_url || null,
    is_active: values.is_active === "true",
  };

  if (id) {
    const updated = await updateProduct(id, input);
    if (!updated) return { errors: { form: "This product no longer exists." }, values };
  } else {
    await createProduct(input);
  }

  revalidatePath("/admin/products");
  revalidatePath("/collections");
  revalidatePath("/shop");
  revalidatePath("/products/[id]", "page");
  redirect("/admin/products");
}

/** Quick status switch from the products table. */
export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (!(await setProductActive(id, isActive))) throw new Error("Product not found.");
  revalidatePath("/admin/products");
  revalidatePath("/collections");
  revalidatePath("/shop");
  revalidatePath("/products/[id]", "page");
}
