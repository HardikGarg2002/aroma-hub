import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import { CURRENCIES, SIZE_PRESETS, getProduct } from "@/lib/admin/products";
import { listCollections } from "@/lib/admin/collections";
import { formatDateTime } from "@/lib/admin/format";

/** `/admin/products/new` is add mode; any other segment is a product id to edit. */
const NEW = "new";

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === NEW) return { title: "Add product" };
  const product = await getProduct(id);
  return { title: product ? `Edit ${product.name}` : "Product not found" };
}

export default async function AdminProductEditorPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [product, collections] = await Promise.all([
    id === NEW ? null : getProduct(id),
    listCollections(),
  ]);
  if (id !== NEW && !product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
        ← Products
      </Link>
      <div className="mt-3">
        <AdminPageHeader
          title={product ? product.name : "Add product"}
          description={
            product
              ? `Created ${formatDateTime(product.created_at)} · Updated ${formatDateTime(product.updated_at)}`
              : "Create a new product in the catalogue."
          }
        />
      </div>

      <ProductForm
        // Remount when switching between products so form state never leaks.
        key={product?.id ?? NEW}
        product={product}
        currencies={CURRENCIES}
        collections={collections.map((c) => c.name)}
        sizePresets={SIZE_PRESETS}
      />
    </>
  );
}
