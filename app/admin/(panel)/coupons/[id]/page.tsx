import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getCoupon } from "@/lib/admin/coupons";
import { CURRENCIES } from "@/lib/admin/products";
import { formatDateTime } from "@/lib/admin/format";

/** `/admin/coupons/new` is add mode; any other segment is a coupon id to edit. */
const NEW = "new";

export async function generateMetadata({ params }: PageProps<"/admin/coupons/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === NEW) return { title: "Add coupon" };
  const coupon = await getCoupon(id);
  return { title: coupon ? `Edit ${coupon.code}` : "Coupon not found" };
}

export default async function AdminCouponEditorPage({ params }: PageProps<"/admin/coupons/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const coupon = id === NEW ? null : await getCoupon(id);
  if (id !== NEW && !coupon) notFound();

  return (
    <>
      <Link href="/admin/coupons" className="text-sm text-muted hover:text-ink">
        ← Coupons
      </Link>
      <div className="mt-3">
        <AdminPageHeader
          title={coupon ? coupon.code : "Add coupon"}
          description={
            coupon
              ? `Created ${formatDateTime(coupon.created_at)} · Updated ${formatDateTime(coupon.updated_at)}`
              : "Create a flat-amount discount code."
          }
        />
      </div>

      <CouponForm key={coupon?.id ?? NEW} coupon={coupon} currencies={CURRENCIES} />
    </>
  );
}
