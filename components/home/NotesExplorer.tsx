"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/cn";
import { BLUR } from "@/lib/images";
import { FAMILIES } from "@/lib/notes";
import { getByFamily } from "@/lib/products";
import { EASE_OUT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * Interactive olfactive-family explorer.
 *
 * Implemented as a real tablist: arrow keys move between families, the
 * selected panel is the only one in the accessibility tree, and the
 * decorative wash/photo swap is driven off the same state.
 */
export function NotesExplorer() {
  const [active, setActive] = useState(0);
  // The first panel is server-rendered, so it must not start hidden.
  // Enter animations only kick in once the visitor has switched family.
  const [interacted, setInteracted] = useState(false);
  const baseId = useId();

  const select = (index: number) => {
    setActive(index);
    setInteracted(true);
  };
  const family = FAMILIES[active];
  const products = getByFamily(family.id).slice(0, 3);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = FAMILIES.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(active === last ? 0 : active + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(active === 0 ? last : active - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(last);
    }
  };

  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
      {/* Family-tinted blob that morphs behind the whole section */}
      <AnimatePresence mode="sync">
        <m.div
          key={family.id}
          aria-hidden
          className="pointer-events-none absolute -right-[20%] top-1/4 -z-10 h-[38rem] w-[38rem] rounded-full blur-[110px]"
          style={{ backgroundColor: family.tint }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.45, scale: 1 }}
          exit={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 1.2, ease: EASE_OUT }}
        />
      </AnimatePresence>

      <div className="shell">
        <SectionHeading
          label="Olfactive Families"
          title="Start from a note, not a name"
          intro="Every AROMA composition sits squarely in one family. Pick the one that sounds like you and work outward from there."
        />

        {/* Family tabs */}
        <div
          role="tablist"
          aria-label="Olfactive families"
          onKeyDown={onKeyDown}
          className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-b border-line pb-1 md:gap-x-14"
        >
          {FAMILIES.map((item, i) => {
            const selected = i === active;
            return (
              <button
                key={item.id}
                id={`${baseId}-tab-${item.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onMouseEnter={() => select(i)}
                className={cn(
                  "relative pb-4 font-display text-[clamp(1.8rem,4.6vw,3.2rem)] font-light leading-none transition-colors duration-500",
                  selected ? "text-ink" : "text-ink/30 hover:text-ink/60",
                )}
              >
                {item.name}
                {selected ? (
                  <m.span
                    layoutId={`${baseId}-family-underline`}
                    className="absolute -bottom-px left-0 h-[2px] w-full bg-accent"
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Active family panel */}
        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <m.div
                key={family.id}
                id={`${baseId}-panel-${family.id}`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${family.id}`}
                tabIndex={0}
                initial={interacted ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
              >
                <p className="max-w-md text-[17px] leading-relaxed text-ink-soft md:text-[19px]">
                  {family.blurb}
                </p>

                <h3 className="label mt-10">Signature ingredients</h3>
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                  {family.ingredients.map((ingredient, i) => (
                    <m.li
                      key={ingredient}
                      className="border-b border-line pb-2.5 text-[14px] text-ink-soft"
                      initial={interacted ? { opacity: 0, x: -10 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: EASE_OUT }}
                    >
                      {ingredient}
                    </m.li>
                  ))}
                </ul>

                <Link
                  href={`/shop/${family.id}`}
                  className="group mt-10 inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em]"
                >
                  Shop {family.name}
                  <span className="block h-px w-8 bg-ink transition-all duration-500 group-hover:w-14 group-hover:bg-accent" />
                </Link>
              </m.div>
            </AnimatePresence>
          </div>

          {/* Family photograph */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] lg:aspect-[16/10]">
              <AnimatePresence mode="sync">
                <m.div
                  key={family.id}
                  className="absolute inset-0"
                  initial={interacted ? { opacity: 0, scale: 1.08 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                >
                  <Image
                    src={family.image}
                    alt={`${family.name} family — signature ingredients`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    placeholder="blur"
                    blurDataURL={BLUR}
                    className="object-cover"
                  />
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Matching products */}
        {products.length ? (
          <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:gap-x-8">
            <AnimatePresence mode="wait">
              <m.div
                key={family.id}
                className="contents"
                initial={interacted ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    ratio="portrait"
                    sizes="(max-width: 768px) 46vw, 30vw"
                  />
                ))}
              </m.div>
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </section>
  );
}
