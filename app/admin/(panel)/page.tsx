import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderBadges";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { StatTile } from "@/components/admin/dashboard/StatTile";
import { TopProducts } from "@/components/admin/dashboard/TopProducts";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/admin/orders";
import {
  DEFAULT_RANGE,
  RANGES,
  computeAnalytics,
  dayKey,
  isRangeKey,
  type RangeKey,
} from "@/lib/admin/analytics";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Dashboard" };

const shortDate = (key: string) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { range: raw } = await searchParams;
  const range: RangeKey = isRangeKey(raw) ? raw : DEFAULT_RANGE;

  const orders = await listOrders();
  const a = computeAnalytics(orders, range);
  const money = (n: number) => formatMoney(n, a.currency);
  const prev = a.previous ?? undefined;

  const recent = orders
    .filter((o) => !a.from || dayKey(o.created_at) >= a.from)
    .slice(0, 6);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={!a.from ? "No orders yet" : a.from === a.to ? shortDate(a.to) : `${shortDate(a.from)} – ${shortDate(a.to)}`}
      />

      {/* One filter row, above everything it scopes. */}
      <nav aria-label="Date range" className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={key === DEFAULT_RANGE ? "/admin" : `/admin?range=${key}`}
            aria-current={key === range ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              key === range ? "border-ink bg-ink text-bone" : "border-line text-ink-soft hover:border-ink",
            )}
          >
            {RANGES[key].label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile hero label="Total sales" value={money(a.kpis.sales)} current={a.kpis.sales} previous={prev?.sales}
          comparisonLabel={a.comparisonLabel} />
        <StatTile label="Orders" value={a.kpis.orders.toLocaleString("en-CA")} current={a.kpis.orders} previous={prev?.orders}
          comparisonLabel={a.comparisonLabel} />
        <StatTile
          label="Average order value"
          value={money(a.kpis.averageOrderValue)}
          current={a.kpis.averageOrderValue}
          previous={prev?.averageOrderValue}
          comparisonLabel={a.comparisonLabel}
        />
        <StatTile
          label="Units sold"
          value={a.kpis.unitsSold.toLocaleString("en-CA")}
          current={a.kpis.unitsSold}
          previous={prev?.unitsSold}
          comparisonLabel={a.comparisonLabel}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Sales are order totals including shipping and tax, excluding cancelled and refunded orders.
      </p>

      {a.totalOrdersInPeriod === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="font-display text-2xl">No orders in this period</p>
          <p className="mt-2 text-sm text-muted">
            {orders.length === 0
              ? "Charts and best sellers will appear here once customers start placing orders."
              : "Try a longer date range."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card title={`Sales per ${a.granularity}`} className="lg:col-span-2">
              <SalesChart series={a.series} currency={a.currency} granularity={a.granularity} />
            </Card>

            <Card title="Orders by status">
              <ul className="divide-y divide-line">
                {a.statusCounts.map(({ status, count }) => (
                  <li key={status} className="flex items-center justify-between py-2.5">
                    <Link href={`/admin/orders?status=${status}`} className="hover:opacity-80">
                      <OrderStatusBadge status={status} />
                    </Link>
                    <span className="text-sm tabular-nums">
                      {count}
                      <span className="ml-2 inline-block w-10 text-right text-xs text-muted">
                        {Math.round((count / a.totalOrdersInPeriod) * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Best sellers" subtitle="By units sold">
              {a.topProducts.length > 0 ? (
                <TopProducts products={a.topProducts} currency={a.currency} />
              ) : (
                <p className="py-6 text-center text-sm text-muted">No completed sales in this period.</p>
              )}
            </Card>

            <Card
              title="Recent orders"
              action={
                <Link href="/admin/orders" className="text-xs text-muted hover:text-ink">
                  View all →
                </Link>
              }
            >
              <ul className="divide-y divide-line">
                {recent.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-medium hover:text-accent">
                        #{o.order_number}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {o.customer_name} · {formatDateTime(o.created_at)}
                      </p>
                    </div>
                    <PaymentStatusBadge status={o.payment_status} />
                    <span className="w-20 text-right text-sm font-medium tabular-nums">{money(o.total)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function Card({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-line bg-paper p-5", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-sm font-medium tracking-normal">
          {title}
          {subtitle && <span className="ml-2 font-normal text-muted">{subtitle}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
