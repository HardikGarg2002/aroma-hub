import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusToggle } from "@/components/admin/StatusToggle";
import { toggleCouponActive } from "@/lib/admin/coupon-actions";
import { requireAdmin } from "@/lib/admin/auth";
import { listCoupons } from "@/lib/admin/coupons";
import { formatDateTime, formatMoney } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await requireAdmin();
  const coupons = await listCoupons();
  const active = coupons.filter((c) => c.is_active).length;

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description={`${coupons.length} coupons · ${active} active`}
        actions={
          <Link
            href="/admin/coupons/new"
            className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90"
          >
            + Add new coupon
          </Link>
        }
      />

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-bone/60 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Min. cart value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {coupons.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-bone/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/coupons/${c.id}`}
                    className="font-mono font-medium underline-offset-4 hover:text-accent hover:underline"
                  >
                    {c.code}
                  </Link>
                  {c.description && <p className="max-w-sm truncate text-xs text-muted">{c.description}</p>}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoney(c.discount_amount, c.currency)} off
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                  {c.min_cart_value > 0 ? formatMoney(c.min_cart_value, c.currency) : <span className="text-muted">No minimum</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusToggle id={c.id} active={c.is_active} label={c.code} action={toggleCouponActive} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(c.updated_at)}</td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
