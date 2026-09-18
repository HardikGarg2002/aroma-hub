"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminProductInput } from "@/types/admin";
import { requireAdmin } from "./auth";
import { createProduct, isProductCodeTaken, setProductActive, updateProduct } from "./products";

export type ProductFormValues = Record<
  Exclude<keyof AdminProductInput, "size_options" | "collection_ids">,
  string
> & {
  size_options: string[];
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

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || undefined;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const values: ProductFormValues = {
    product_code: text("product_code"),
    name: text("name"),
    inspired_by: text("inspired_by"),
    description: text("description"),
    price: text("price"),
    currency: text("currency"),
    size_options: [...new Set(formData.getAll("size_options").map((s) => String(s).trim()).filter(Boolean))],
    collection_ids: [...new Set(formData.getAll("collection_ids").map((s) => String(s).trim()).filter(Boolean))],
    image_url: text("image_url"),
    is_active: formData.get("is_active") === "on" ? "true" : "false",
  };

  const errors: NonNullable<ProductFormState>["errors"] = {};
  const price = Number(values.price);

  if (!values.product_code) errors.product_code = "Product code is required.";
  else if (await isProductCodeTaken(values.product_code, id)) errors.product_code = "This code is already used by another product.";
  if (!values.name) errors.name = "Name is required.";
  if (!values.price) errors.price = "Price is required.";
  else if (!Number.isFinite(price) || price < 0) errors.price = "Enter a valid, non-negative price.";
  if (!/^[A-Z]{3}$/.test(values.currency)) errors.currency = "Choose a currency.";
  if (values.size_options.length === 0) errors.size_options = "Add at least one size.";
  if (values.image_url && !/^https?:\/\//i.test(values.image_url)) errors.image_url = "Must be an http(s) URL.";

  if (Object.keys(errors).length > 0) return { errors, values };

  const input: AdminProductInput = {
    product_code: values.product_code,
    name: values.name,
    inspired_by: values.inspired_by || null,
    description: values.description || null,
    price: Math.round(price * 100) / 100,
    currency: values.currency,
    size_options: values.size_options,
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
  redirect("/admin/products");
}

/** Quick status switch from the products table. */
export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (!(await setProductActive(id, isActive))) throw new Error("Product not found.");
  revalidatePath("/admin/products");
}
