import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderBadges";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrder } from "@/lib/admin/orders";
import { getProduct } from "@/lib/admin/products";
import { formatDateTime, formatMoney } from "@/lib/admin/format";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const order = await getOrder((await params).id);
  return { title: order ? `Order #${order.order_number}` : "Order not found" };
}

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const order = await getOrder((await params).id);
  if (!order) notFound();

  // Line items are snapshots; only link through to products that still exist.
  const existing = new Set(
    (await Promise.all(order.items.map((it) => getProduct(it.product_id)))).flatMap((p) => (p ? [p.id] : [])),
  );
  const money = (n: number) => formatMoney(n, order.currency);
  const a = order.shipping_address;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
        ← Orders
      </Link>
      <div className="mt-3">
        <AdminPageHeader
          title={`Order #${order.order_number}`}
          description={`Placed ${formatDateTime(order.created_at)} · Updated ${formatDateTime(order.updated_at)}`}
          actions={
            <>
              <PaymentStatusBadge status={order.payment_status} />
              <OrderStatusBadge status={order.status} />
            </>
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border border-line bg-paper">
            <h2 className="border-b border-line px-6 py-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Items
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((it) => (
                <li key={`${it.product_id}-${it.size}`} className="flex items-center gap-4 px-6 py-4">
                  <ProductThumb src={it.image_url} alt={it.name} size={52} />
                  <div className="min-w-0 flex-1">
                    {existing.has(it.product_id) ? (
                      <Link href={`/admin/products/${it.product_id}`} className="font-medium hover:text-accent">
                        {it.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{it.name}</p>
                    )}
                    <p className="text-xs text-muted">
                      <span className="font-mono">{it.product_code}</span> · {it.size}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm tabular-nums text-ink-soft">
                    {money(it.unit_price)} × {it.quantity}
                  </p>
                  <p className="w-24 text-right text-sm font-medium tabular-nums">
                    {money(it.unit_price * it.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-6 py-4 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 && <Row label="Discount" value={`−${money(order.discount)}`} />}
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : money(order.shipping)} />
              <Row label="Tax" value={money(order.tax)} />
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.notes && (
            <Section title="Customer note">
              <p className="text-sm text-ink-soft">{order.notes}</p>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Update status">
            <OrderStatusForm
              key={order.updated_at}
              id={order.id}
              status={order.status}
              paymentStatus={order.payment_status}
            />
          </Section>

          <Section title="Customer">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <a href={`mailto:${order.customer_email}`} className="block text-ink-soft hover:text-accent">
                {order.customer_email}
              </a>
              {order.customer_phone && <p className="text-ink-soft">{order.customer_phone}</p>}
            </div>
          </Section>

          <Section title="Shipping address">
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              {order.customer_name}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.province} {a.postal_code}
              <br />
              {a.country}
            </address>
          </Section>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
