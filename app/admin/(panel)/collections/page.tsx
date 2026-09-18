import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { StatusToggle } from "@/components/admin/StatusToggle";
import { toggleCollectionActive } from "@/lib/admin/collection-actions";
import { requireAdmin } from "@/lib/admin/auth";
import { listCollections } from "@/lib/admin/collections";
import { listProducts } from "@/lib/admin/products";
import { formatDateTime } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  await requireAdmin();
  const [collections, products] = await Promise.all([listCollections(), listProducts()]);

  // Products can be in several collections, so one product may count once
  // toward each of them.
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const id of p.collection_ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description={`${collections.length} collections`}
        actions={
          <Link
            href="/admin/collections/new"
            className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90"
          >
            + Add new collection
          </Link>
        }
      />

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-bone/60 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {collections.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-bone/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb src={c.image_url} alt={c.name} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/collections/${c.id}`}
                        className="font-medium underline-offset-4 hover:text-accent hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.description && <p className="max-w-md truncate text-xs text-muted">{c.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{c.slug}</td>
                <td className="px-4 py-3 text-right tabular-nums">{counts.get(c.id) ?? 0}</td>
                <td className="px-4 py-3">
                  <StatusToggle
                    id={c.id}
                    active={c.is_active}
                    label={c.name}
                    action={toggleCollectionActive}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(c.updated_at)}</td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No collections yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
