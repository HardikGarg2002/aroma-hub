"use server";

import { revalidatePath } from "next/cache";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/types/admin";
import { requireAdmin } from "./auth";
import { updateOrderStatus } from "./orders";

export type OrderStatusState = { ok?: boolean; error?: string } | undefined;

export async function saveOrderStatus(_prev: OrderStatusState, formData: FormData): Promise<OrderStatusState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status")) as OrderStatus;
  const payment_status = String(formData.get("payment_status")) as PaymentStatus;

  if (!ORDER_STATUSES.includes(status) || !PAYMENT_STATUSES.includes(payment_status)) {
    return { error: "Choose a valid status." };
  }
  if (!(await updateOrderStatus(id, { status, payment_status }))) {
    return { error: "This order no longer exists." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}
