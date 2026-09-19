import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { StatusToggle } from "@/components/admin/StatusToggle";
import { toggleProductActive } from "@/lib/admin/product-actions";
import { requireAdmin } from "@/lib/admin/auth";
import { listProducts } from "@/lib/admin/products";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { fromPrice } from "@/types/admin";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await listProducts();

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${products.length} products`}
        actions={
          <Link
            href="/admin/products/new"
            className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90"
          >
            + Add new product
          </Link>
        }
      />

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-bone/60 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Sizes</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-bone/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb src={p.image_url} alt={p.name} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium underline-offset-4 hover:text-accent hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.inspired_by && (
                        <p className="truncate text-xs text-muted">Inspired by {p.inspired_by}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{p.product_code}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {p.collection_names.length ? p.collection_names.join(", ") : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {p.variants.map((v) => v.size).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {(() => {
                    const from = fromPrice(p);
                    if (from === null) return "—";
                    // Several sizes means several prices; show the entry point.
                    const prefix = p.variants.filter((v) => v.is_active).length > 1 ? "from " : "";
                    return `${prefix}${formatMoney(from, p.currency)}`;
                  })()}
                </td>
                <td className="px-4 py-3">
                  <StatusToggle
                    id={p.id}
                    active={p.is_active}
                    label={p.name}
                    action={toggleProductActive}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(p.updated_at)}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
