"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminCouponInput } from "@/types/admin";
import { normalizeCouponCode } from "@/lib/coupons";
import { requireAdmin } from "./auth";
import { createCoupon, isCouponCodeTaken, setCouponActive, updateCoupon } from "./coupons";
import { CURRENCIES } from "./products";

export type CouponFormValues = Record<keyof AdminCouponInput, string>;

export type CouponFormState =
  | {
      errors: Partial<Record<keyof AdminCouponInput | "form", string>>;
      /** Echoed back so the form keeps what was typed after a failed save. */
      values: CouponFormValues;
    }
  | undefined;

const CODE = /^[A-Z0-9_-]{3,24}$/;

export async function saveCoupon(_prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || undefined;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const values: CouponFormValues = {
    code: normalizeCouponCode(text("code")),
    description: text("description"),
    discount_amount: text("discount_amount"),
    min_cart_value: text("min_cart_value") || "0",
    currency: text("currency"),
    is_active: formData.get("is_active") === "on" ? "true" : "false",
  };

  const errors: NonNullable<CouponFormState>["errors"] = {};
  const discount = Number(values.discount_amount);
  const minimum = Number(values.min_cart_value);

  if (!values.code) errors.code = "Code is required.";
  else if (!CODE.test(values.code)) errors.code = "3–24 characters: letters, numbers, - or _.";
  else if (await isCouponCodeTaken(values.code, id)) errors.code = "Another coupon already uses this code.";

  if (!values.discount_amount) errors.discount_amount = "Discount is required.";
  else if (!Number.isFinite(discount) || discount <= 0) errors.discount_amount = "Enter an amount greater than 0.";

  if (!Number.isFinite(minimum) || minimum < 0) errors.min_cart_value = "Enter 0 or more.";
  else if (!errors.discount_amount && minimum > 0 && discount >= minimum) {
    errors.min_cart_value = "Must be more than the discount, or 0 for no minimum.";
  }

  if (!(CURRENCIES as readonly string[]).includes(values.currency)) errors.currency = "Choose a currency.";

  if (Object.keys(errors).length > 0) return { errors, values };

  const input: AdminCouponInput = {
    code: values.code,
    description: values.description || null,
    discount_amount: Math.round(discount * 100) / 100,
    min_cart_value: Math.round(minimum * 100) / 100,
    currency: values.currency,
    is_active: values.is_active === "true",
  };

  if (id) {
    if (!(await updateCoupon(id, input))) return { errors: { form: "This coupon no longer exists." }, values };
  } else {
    await createCoupon(input);
  }

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

/** Quick status switch from the coupons table. */
export async function toggleCouponActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (!(await setCouponActive(id, isActive))) throw new Error("Coupon not found.");
  revalidatePath("/admin/coupons");
}
