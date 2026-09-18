import type { OrderStatus, PaymentStatus } from "@/types/admin";
import { cn } from "@/lib/cn";

const ORDER_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber/40 text-ink",
  processing: "bg-woody/40 text-ink",
  shipped: "bg-fresh/60 text-ink",
  delivered: "bg-ink text-bone",
  cancelled: "bg-bone-deep text-muted line-through",
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  unpaid: "border-amber text-ink",
  paid: "border-line text-ink-soft",
  refunded: "border-floral text-muted",
};

const pill = "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn(pill, ORDER_TONE[status])}>{status}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn(pill, "border", PAYMENT_TONE[status])}>{status}</span>;
}
