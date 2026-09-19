import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCollectionSummaries, type CollectionSummary } from "@/lib/catalog";
import { BLUR, canOptimize } from "@/lib/images";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Admin saves revalidate this page immediately; this also picks up edits
// made directly in the database.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse every AROMA collection — from floral and woody to amber and fresh.",
};

export default async function CollectionsPage() {
  const collections = await getCollectionSummaries();

  return (
    <section className="shell pb-24 pt-36 md:pb-32 md:pt-44">
      <SectionHeading
        as="h2"
        label="Collections"
        title="Find your family"
        intro="Every fragrance belongs to one collection. Start with the mood you're after and explore from there."
      />

      {collections.length === 0 ? (
        <p className="mt-16 text-center text-muted">New collections are on their way.</p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
          {collections.map((collection, i) => (
            <FadeIn key={collection.id} as="li" delay={(i % 4) * 0.07} y={40}>
              <CollectionCard collection={collection} index={i} />
            </FadeIn>
          ))}
        </ul>
      )}
    </section>
  );
}

function CollectionCard({ collection, index }: { collection: CollectionSummary; index: number }) {
  const { name, slug, description, image_url, product_count } = collection;

  return (
    <Link href={`/collections/${slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-bone-deep">
        {image_url ? (
          <Image
            src={image_url}
            alt=""
            fill
            sizes="(max-width: 768px) 46vw, (max-width: 1024px) 31vw, 23vw"
            placeholder="blur"
            blurDataURL={BLUR}
            unoptimized={!canOptimize(image_url)}
            className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display text-6xl text-ink/10">
            {name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/0 to-ink/0" />

        <span className="absolute left-4 top-4 font-display text-base text-paper/90">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 text-paper">
          <h2 className="font-display text-[clamp(1.35rem,2.2vw,1.9rem)] leading-none">{name}</h2>
          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] text-paper/85">
            {product_count} {product_count === 1 ? "fragrance" : "fragrances"}
          </span>
        </div>
      </div>

      {description && <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-muted">{description}</p>}
      <span className="mt-2 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em]">
        Explore
        <span className="block h-px w-8 bg-ink transition-all duration-500 group-hover:w-14 group-hover:bg-accent" />
      </span>
    </Link>
  );
}
