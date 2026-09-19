"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { SITE_IMAGES } from "@/lib/images";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useSearchUi } from "@/lib/ui/search-store";

const HEADLINE = ["Notes of", "the", "unfamiliar"];

/**
 * The entrance animation here is CSS (`rise` / `mask-up` / `wipe-up` in
 * globals.css), not Motion.
 *
 * Motion renders its `initial` prop into the server HTML, which would leave
 * the hero at opacity 0 until the JS bundle downloads and hydrates — an empty
 * first screen on a cold cache. CSS animations ship with the stylesheet and
 * run on first paint, so the hero is never dependent on hydration.
 *
 * Motion is still used for the scroll-linked parallax and fade, which are
 * genuine progressive enhancement: their resting state is fully visible.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const openSearch = useSearchUi((s) => s.openSearch);

  // Lift and fade the copy as the next section arrives underneath it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-32 lg:pb-28 lg:pt-36"
    >
      {/* Hairline grid, drawn behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="shell h-full">
          <div className="grid h-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="rise h-full border-l border-line/60 last:border-r"
                style={{ "--d": `${0.3 + i * 0.07}s` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="shell relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Copy column — CSS handles the entrance, Motion the scroll fade */}
          <m.div className="lg:col-span-6" style={{ y: copyY, opacity: copyOpacity }}>
            <span
              className="label rise block"
              style={{ "--d": "0.15s" } as React.CSSProperties}
            >
              Extrait de Parfum · 30% concentration
            </span>

            <h1 className="mt-7 font-display text-[clamp(3rem,10vw,7.5rem)] font-light leading-[0.92] tracking-[-0.03em]">
              {HEADLINE.map((line, i) => (
                <span key={line} className="reveal-mask block">
                  <span
                    className="mask-up"
                    style={{ "--d": `${0.25 + i * 0.11}s` } as React.CSSProperties}
                  >
                    {/* The last word carries the accent */}
                    <span
                      className={
                        i === HEADLINE.length - 1 ? "italic text-accent" : undefined
                      }
                    >
                      {line}
                    </span>
                  </span>
                </span>
              ))}
            </h1>

            <p
              className="rise mt-8 max-w-md text-[15px] leading-relaxed text-muted md:text-[16px]"
              style={{ "--d": "0.62s" } as React.CSSProperties}
            >
              Twelve compositions, each built around a single olfactive family.
              Extrait strength, poured in small batches in Montréal, and priced
              without the boutique markup.
            </p>

            <div
              className="rise mt-10 flex flex-wrap items-center gap-4"
              style={{ "--d": "0.74s" } as React.CSSProperties}
            >
              <MagneticButton href="/shop">Explore the collection</MagneticButton>
              <MagneticButton onClick={openSearch} variant="outline">
                Find your scent
              </MagneticButton>
            </div>
          </m.div>

          {/* Image column */}
          <div className="relative lg:col-span-6">
            <div className="wipe-up" style={{ "--d": "0.35s" } as React.CSSProperties}>
              <ParallaxImage
                src={SITE_IMAGES.heroPrimary}
                alt="A glass extrait de parfum bottle resting on folded cream silk"
                className="aspect-[4/5] w-full rounded-[2px] sm:aspect-[3/4] lg:aspect-[4/5]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                strength={0.1}
                eager
                quality={90}
              />
            </div>

            {/* Inset detail, overlapping the primary from the lower left */}
            <div
              className="wipe-up absolute -bottom-10 -left-4 hidden w-[36%] md:block lg:-left-16"
              style={{ "--d": "0.8s" } as React.CSSProperties}
            >
              <ParallaxImage
                src={SITE_IMAGES.heroDetail}
                alt="Close detail of folded beige silk"
                className="aspect-square w-full rounded-[2px] shadow-lift"
                sizes="25vw"
                strength={0.22}
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator.

            The Motion scroll-fade and the CSS entrance both want `opacity`,
            and a CSS animation with `both` fill would win permanently — so
            they live on separate elements. */}
        <m.div className="mt-24 lg:mt-16" style={{ opacity: copyOpacity }}>
          <div
            className="rise flex items-center gap-4"
            style={{ "--d": "0.95s" } as React.CSSProperties}
          >
            <span className="label">Scroll</span>
            <div className="relative h-px w-24 overflow-hidden bg-line">
              <m.span
                className="absolute inset-y-0 left-0 w-8 bg-ink"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
