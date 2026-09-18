"use client";

import { useActionState } from "react";
import { saveOrderStatus } from "@/lib/admin/order-actions";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/types/admin";
import { Field, input } from "./form";

export function OrderStatusForm({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const [state, action, pending] = useActionState(saveOrderStatus, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Order status">
        <select name="status" defaultValue={status} className={`${input()} capitalize`}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Payment status">
        <select name="payment_status" defaultValue={paymentStatus} className={`${input()} capitalize`}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update order"}
      </button>
    </form>
  );
}
