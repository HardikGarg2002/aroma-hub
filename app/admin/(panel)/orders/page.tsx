import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderBadges";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { ORDER_STATUSES, type OrderStatus } from "@/types/admin";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === raw) as OrderStatus | undefined;

  const all = await listOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, all.filter((o) => o.status === s).length]));

  const tabs = [
    { label: "All", href: "/admin/orders", active: !status, count: all.length },
    ...ORDER_STATUSES.map((s) => ({
      label: s,
      href: `/admin/orders?status=${s}`,
      active: status === s,
      count: counts[s],
    })),
  ];

  return (
    <>
      <AdminPageHeader title="Orders" description={`${all.length} orders`} />

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
              t.active ? "border-ink bg-ink text-bone" : "border-line text-ink-soft hover:border-ink",
            )}
          >
            {t.label} <span className="ml-1 tabular-nums opacity-60">{t.count}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-bone/60 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-bone/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono font-medium underline-offset-4 hover:text-accent hover:underline"
                  >
                    #{o.order_number}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(o.created_at)}</td>
                <td className="px-4 py-3">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted">{o.customer_email}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                  {o.items.reduce((n, it) => n + it.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(o.total, o.currency)}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={o.payment_status} />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No {status ?? ""} orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
