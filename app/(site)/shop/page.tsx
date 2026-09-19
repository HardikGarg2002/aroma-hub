import type { Metadata } from "next";
import { getShopProducts } from "@/lib/catalog";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShopProductCard } from "@/components/product/ShopProductCard";

// Admin saves revalidate this page immediately; this also picks up edits
// made directly in the database.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All",
  description: "Every AROMA fragrance in one place.",
};

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <section className="shell pb-24 pt-36 md:pb-32 md:pt-44">
      <SectionHeading
        label="Shop All"
        title="Every fragrance"
        intro={`${products.length} ${products.length === 1 ? "composition" : "compositions"}, each in extrait strength.`}
      />

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted">New fragrances are on their way.</p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {products.map((product, i) => (
            <FadeIn key={product.id} as="li" delay={(i % 4) * 0.07} y={32}>
              <ShopProductCard product={product} />
            </FadeIn>
          ))}
        </ul>
      )}
    </section>
  );
}
