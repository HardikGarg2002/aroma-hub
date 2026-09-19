import type { Metadata } from "next";
import Link from "next/link";
import { MAX_QUERY_LENGTH, searchCatalog } from "@/lib/search";
import { FadeIn } from "@/components/ui/FadeIn";
import { ShopProductCard } from "@/components/product/ShopProductCard";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, MAX_QUERY_LENGTH) : "";
  return {
    title: query ? `Search: ${query}` : "Search",
    // Result pages are endless query permutations; keep them out of the index.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const { query, products, collections } = await searchCatalog(typeof q === "string" ? q : "");

  return (
    <section className="shell pb-24 pt-36 md:pb-32 md:pt-44">
      <span className="label text-muted">Search</span>
      {/* Plain GET form: works without JavaScript, and results are linkable. */}
      <form action="/search" role="search" className="mt-4 flex items-center gap-4 border-b border-ink pb-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Search fragrances…"
          aria-label="Search fragrances"
          className="min-w-0 flex-1 bg-transparent font-display text-[clamp(2rem,5vw,3.6rem)] leading-tight outline-none placeholder:text-muted/60"
        />
        <button type="submit" className="text-[12px] font-medium uppercase tracking-[0.18em]">
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-muted" role="status">
          {products.length} {products.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </p>
      )}

      {collections.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="label mr-1 text-muted">Collections</span>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {products.map((product, i) => (
            <FadeIn key={product.id} as="li" delay={(i % 4) * 0.07} y={32}>
              <ShopProductCard product={product} />
            </FadeIn>
          ))}
        </ul>
      ) : (
        query && (
          <div className="mt-16 text-center">
            <p className="font-display text-3xl">Nothing matched</p>
            <p className="mt-3 text-muted">
              Check the spelling, try fewer words, or{" "}
              <Link href="/shop" className="underline underline-offset-4">
                browse all fragrances
              </Link>
              .
            </p>
          </div>
        )
      )}
    </section>
  );
}
