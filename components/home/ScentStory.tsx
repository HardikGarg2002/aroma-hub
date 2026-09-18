"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BLUR } from "@/lib/images";
import { STORY_CHAPTERS } from "@/lib/notes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The scroll-scrubbed centrepiece: the section pins for ~3 viewport heights
 * while the three note chapters crossfade through each other.
 *
 * All of the pinning lives inside a `gsap.matchMedia()` desktop branch. On
 * tablet/mobile, and for anyone who asks for reduced motion, the same markup
 * renders as three plainly stacked chapters with nothing hidden — which is
 * also what crawlers see.
 */
export function ScentStory() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]");
          const total = chapters.length;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${total * 100}%`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Chapter 1 is already visible; crossfade each subsequent one over it.
          chapters.forEach((chapter, i) => {
            if (i === 0) return;

            tl.to(
              chapters[i - 1],
              { autoAlpha: 0, yPercent: -6, duration: 1, ease: "none" },
              i - 1,
            ).fromTo(
              chapter,
              { autoAlpha: 0, yPercent: 6 },
              { autoAlpha: 1, yPercent: 0, duration: 1, ease: "none" },
              i - 1,
            );
          });

          // Progress rule fills across the whole pinned sequence.
          tl.fromTo(
            "[data-progress]",
            { scaleX: 0 },
            { scaleX: 1, duration: total - 1, ease: "none" },
            0,
          );

          return () => tl.scrollTrigger?.kill();
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className="relative bg-bone-deep">
      <div
        ref={root}
        className="relative motion-safe:lg:h-dvh motion-safe:lg:overflow-hidden"
      >
        {/* Progress rule — only meaningful while pinned */}
        <div className="absolute inset-x-0 top-0 z-30 hidden h-px bg-line motion-safe:lg:block">
          <div
            data-progress
            className="h-full w-full origin-left scale-x-0 bg-accent"
          />
        </div>

        <div className="relative motion-safe:lg:h-full">
          {STORY_CHAPTERS.map((chapter, i) => (
            <article
              key={chapter.id}
              data-chapter
              className={[
                // Stacked flow by default — this is what mobile, tablet and
                // reduced-motion visitors get, with every chapter visible.
                "border-b border-line py-20 last:border-b-0 md:py-24",
                // Layered inside the pin only where the timeline actually runs.
                "motion-safe:lg:absolute motion-safe:lg:inset-0 motion-safe:lg:flex",
                "motion-safe:lg:items-center motion-safe:lg:border-0 motion-safe:lg:py-0",
                // Only chapter one starts visible in the pinned stack.
                i > 0 ? "motion-safe:lg:opacity-0" : "",
              ].join(" ")}
            >
              <div className="shell grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-14">
                {/* Copy */}
                <div className="lg:col-span-5 lg:col-start-1">
                  <div className="flex items-baseline gap-5">
                    <span className="font-display text-[clamp(3rem,7vw,5.5rem)] font-light leading-none text-accent/35">
                      {chapter.index}
                    </span>
                    <span className="label">{chapter.label}</span>
                  </div>

                  <h2 className="mt-6 font-display text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.02]">
                    {chapter.title}
                  </h2>

                  <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted md:text-[16px]">
                    {chapter.body}
                  </p>

                  <ul className="mt-9 flex flex-wrap gap-2.5">
                    {chapter.notes.map((note) => (
                      <li
                        key={note}
                        className="rounded-full border border-line bg-bone px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image */}
                <div className="lg:col-span-6 lg:col-start-7">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] lg:aspect-[5/6]">
                    <Image
                      src={chapter.image}
                      alt={`${chapter.label}: ${chapter.title}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      placeholder="blur"
                      blurDataURL={BLUR}
                      className="object-cover"
                    />
                    {/* Family tint wash over the photograph */}
                    <div
                      aria-hidden
                      className="absolute inset-0 mix-blend-multiply opacity-25"
                      style={{
                        background: `linear-gradient(200deg, transparent 35%, ${chapter.tint} 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
