"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminCollectionInput } from "@/types/admin";
import { requireAdmin } from "./auth";
import {
  createCollection,
  findCollectionConflict,
  getCollection,
  setCollectionActive,
  slugify,
  updateCollection,
} from "./collections";
import { setCollectionMembers } from "./products";

export type CollectionFormValues = Record<keyof AdminCollectionInput, string> & { product_ids: string[] };

export type CollectionFormState =
  | {
      errors: Partial<Record<keyof AdminCollectionInput | "form", string>>;
      /** Echoed back so the form keeps what was typed after a failed save. */
      values: CollectionFormValues;
    }
  | undefined;

export async function saveCollection(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || undefined;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const name = text("name");
  const values: CollectionFormValues = {
    name,
    slug: slugify(text("slug") || name),
    description: text("description"),
    image_url: text("image_url"),
    is_active: formData.get("is_active") === "on" ? "true" : "false",
    product_ids: [...new Set(formData.getAll("product_ids").map(String))],
  };

  const errors: NonNullable<CollectionFormState>["errors"] = {};
  if (!values.name) errors.name = "Name is required.";
  if (!values.slug) errors.slug = "Slug is required.";
  if (values.image_url && !/^https?:\/\//i.test(values.image_url)) errors.image_url = "Must be an http(s) URL.";
  if (!errors.name && !errors.slug) {
    const conflict = await findCollectionConflict(values, id);
    if (conflict) errors[conflict] = `Another collection already uses this ${conflict}.`;
  }
  if (Object.keys(errors).length > 0) return { errors, values };

  const input: AdminCollectionInput = {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    image_url: values.image_url || null,
    is_active: values.is_active === "true",
  };

  // Membership is keyed by id, so a rename no longer has to rewrite members.
  let collectionId = id;
  if (id) {
    const existing = await getCollection(id);
    if (!existing) return { errors: { form: "This collection no longer exists." }, values };
    await updateCollection(id, input);
  } else {
    collectionId = (await createCollection(input)).id;
  }
  await setCollectionMembers(collectionId!, values.product_ids);

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  revalidatePath("/shop");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/admin/products");
  redirect("/admin/collections");
}

/** Quick status switch from the collections table. */
export async function toggleCollectionActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (!(await setCollectionActive(id, isActive))) throw new Error("Collection not found.");
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  revalidatePath("/shop");
  revalidatePath("/products/[id]", "page");
}
