"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getBestsellers } from "@/lib/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Horizontal rail of bestsellers.
 *
 * On desktop the section pins and the track translates on X as you scroll —
 * the classic horizontal-scroll sequence. Below `lg`, and under reduced
 * motion, the exact same track becomes a native scroll-snap carousel, so it
 * stays fully usable with no JS driving it.
 */
export function Bestsellers() {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const products = getBestsellers();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = track.current;
          const frame = viewport.current;
          if (!el || !frame) return;

          // The track is `w-max`, so it has no internal scroll of its own —
          // measure it against the viewport it slides inside instead.
          const distance = () => Math.max(0, el.scrollWidth - frame.clientWidth);
          if (distance() <= 0) return;

          const tween = gsap.to(el, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
            gsap.set(el, { x: 0 });
          };
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className="bg-bone py-24 md:py-32 lg:py-0">
      <div
        ref={root}
        className="motion-safe:lg:flex motion-safe:lg:h-dvh motion-safe:lg:flex-col motion-safe:lg:justify-center motion-safe:lg:overflow-hidden"
      >
        <div className="shell">
          <SectionHeading
            label="Bestsellers"
            title="What is actually selling"
            intro="Ranked by verified reviews, refreshed weekly. Nothing here is paid placement."
            action={
              <Link
                href="/shop?sort=popular"
                className="group inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em]"
              >
                Full ranking
                <span className="block h-px w-8 bg-ink transition-all duration-500 group-hover:w-14 group-hover:bg-accent" />
              </Link>
            }
          />
        </div>

        {/* Rail — GSAP-driven on desktop, snap-scroll everywhere else */}
        <div
          ref={viewport}
          className="mt-12 overflow-x-auto pl-5 md:pl-10 xl:pl-16 motion-safe:lg:mt-16 motion-safe:lg:overflow-visible hide-scrollbar"
        >
          <div
            ref={track}
            className="flex w-max snap-x snap-mandatory gap-6 pr-5 md:gap-8 md:pr-10 xl:pr-16 motion-safe:lg:snap-none"
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className="w-[72vw] shrink-0 snap-start sm:w-[45vw] lg:w-[26vw] xl:w-[22vw]"
              >
                <ProductCard
                  product={product}
                  index={i}
                  ratio="portrait"
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 45vw, 24vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hint, only relevant for the native-scroll fallback */}
        <p className="shell mt-8 text-[11px] uppercase tracking-[0.18em] text-muted motion-safe:lg:hidden">
          Swipe to browse
        </p>
      </div>
    </section>
  );
}
