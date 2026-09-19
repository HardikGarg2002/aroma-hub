import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProductDetail, getRelatedProducts } from "@/lib/catalog";
import { BLUR, canOptimize } from "@/lib/images";
import { formatMoney } from "@/lib/admin/format";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ShopProductCard } from "@/components/product/ShopProductCard";

// Admin saves revalidate this page immediately; this also picks up edits
// made directly in the database.
export const revalidate = 60;

/** Shared by generateMetadata and the page, so the product is fetched once. */
const loadProduct = cache(getProductDetail);

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const product = await loadProduct((await params).id);
  if (!product) return { title: "Product not found" };

  const description =
    product.description ?? (product.inspired_by ? `Inspired by ${product.inspired_by}.` : undefined);
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const product = await loadProduct((await params).id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const primary = product.collections[0];

  return (
    <>
      <section className="shell pb-20 pt-32 md:pb-28 md:pt-40">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.18em] text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-ink">
                Shop
              </Link>
            </li>
            {primary && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/collections/${primary.slug}`} className="hover:text-ink">
                    {primary.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* Image — pinned while the details scroll on large screens */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-paper">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 52vw"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  unoptimized={!canOptimize(product.image_url)}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-display text-9xl text-ink/10">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="lg:py-6">
            {product.collections.length > 0 && (
              <p className="label text-accent">{product.collections.map((c) => c.name).join(" · ")}</p>
            )}
            <h1 className="mt-4 font-display text-[clamp(2.6rem,5.5vw,4.5rem)] leading-[0.98]">{product.name}</h1>
            {product.inspired_by && (
              <p className="mt-4 text-[15px] text-muted">
                Inspired by <span className="text-ink">{product.inspired_by}</span>
              </p>
            )}
            <p className="mt-6 text-2xl tabular-nums">{formatMoney(product.price, product.currency)}</p>

            <div className="mt-10">
              <ProductPurchase product={product} />
            </div>

            <p className="mt-5 text-[13px] text-muted">
              Complimentary shipping on orders over $95. Taxes calculated at checkout.
            </p>

            {product.description && (
              <div className="mt-12 border-t border-line pt-8">
                <h2 className="label">Description</h2>
                <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-10 border-t border-line pt-8">
              <h2 className="label">Details</h2>
              <dl className="mt-4 divide-y divide-line text-[14px]">
                <Detail label="Concentration" value="Extrait de parfum" />
                <Detail label="Sizes" value={product.size_options.join(", ") || "—"} />
                {product.collections.length > 0 && (
                  <Detail
                    label="Collections"
                    value={product.collections.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ", "}
                        <Link href={`/collections/${c.slug}`} className="underline-offset-4 hover:underline">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  />
                )}
                <Detail label="Reference" value={<span className="font-mono text-[13px]">{product.product_code}</span>} />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="shell border-t border-line pb-24 pt-20 md:pb-32 md:pt-28">
          <SectionHeading
            label={primary ? `More from ${primary.name}` : "Keep exploring"}
            title="You may also like"
          />
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
            {related.map((p, i) => (
              <FadeIn key={p.id} as="li" delay={i * 0.07} y={32}>
                <ShopProductCard product={p} />
              </FadeIn>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
