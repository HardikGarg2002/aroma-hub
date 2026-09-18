import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getCollection } from "@/lib/admin/collections";
import { listProducts } from "@/lib/admin/products";
import { formatDateTime } from "@/lib/admin/format";

/** `/admin/collections/new` is add mode; any other segment is a collection id to edit. */
const NEW = "new";

export async function generateMetadata({ params }: PageProps<"/admin/collections/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === NEW) return { title: "Add collection" };
  const collection = await getCollection(id);
  return { title: collection ? `Edit ${collection.name}` : "Collection not found" };
}

export default async function AdminCollectionEditorPage({ params }: PageProps<"/admin/collections/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [collection, products] = await Promise.all([
    id === NEW ? null : getCollection(id),
    listProducts(),
  ]);
  if (id !== NEW && !collection) notFound();

  return (
    <>
      <Link href="/admin/collections" className="text-sm text-muted hover:text-ink">
        ← Collections
      </Link>
      <div className="mt-3">
        <AdminPageHeader
          title={collection ? collection.name : "Add collection"}
          description={
            collection
              ? `Created ${formatDateTime(collection.created_at)} · Updated ${formatDateTime(collection.updated_at)}`
              : "Create a new collection and choose its products."
          }
        />
      </div>

      <CollectionForm key={collection?.id ?? NEW} collection={collection} products={products} />
    </>
  );
}
