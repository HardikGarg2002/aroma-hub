import Link from "next/link";
import { getFeatured } from "@/lib/products";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * Deliberately asymmetric grid — cards break the baseline at lg so the block
 * reads as an editorial spread rather than a catalogue row.
 */
const OFFSETS = ["lg:mt-0", "lg:mt-20", "lg:mt-6", "lg:mt-28"];
const RATIOS = ["tall", "portrait", "tall", "portrait"] as const;

export function FeaturedCollection() {
  const products = getFeatured(4);

  return (
    <section id="featured" className="shell py-24 md:py-32 lg:py-40">
      <SectionHeading
        label="The Collection"
        title="Four that people come back for"
        intro="Our most-reordered compositions, across all four olfactive families. Every bottle ships with four 2 ml samples so you can keep exploring."
        action={
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em]"
          >
            All twelve
            <span className="block h-px w-8 bg-ink transition-all duration-500 group-hover:w-14 group-hover:bg-accent" />
          </Link>
        }
      />

      <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-x-8">
        {products.map((product, i) => (
          <FadeIn
            key={product.id}
            as="div"
            delay={i * 0.09}
            y={40}
            className={OFFSETS[i % OFFSETS.length]}
          >
            <ProductCard
              product={product}
              ratio={RATIOS[i % RATIOS.length]}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
            />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
