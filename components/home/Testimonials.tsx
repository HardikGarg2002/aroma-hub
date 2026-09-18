"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/cn";
import { TESTIMONIALS } from "@/lib/testimonials";
import { PRODUCTS } from "@/lib/products";
import { EASE_OUT } from "@/lib/motion";

const INTERVAL = 6500;

/** Total verified reviews across the catalogue, rounded down to the hundred. */
const REVIEW_COUNT =
  Math.floor(PRODUCTS.reduce((sum, p) => sum + p.reviews, 0) / 100) * 100;

/**
 * Auto-advancing pull-quote. Pauses on hover and on keyboard focus, and can
 * be driven manually — the timer restarts after any manual move so a quote
 * never flips away the instant you land on it.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // The first quote is server-rendered, so it must not start hidden; only
  // the quotes that follow animate in.
  const [started, setStarted] = useState(false);
  const timer = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setStarted(true);
    setIndex((next + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timer.current = window.setTimeout(() => {
      setStarted(true);
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, INTERVAL);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, paused]);

  const current = TESTIMONIALS[index];

  return (
    <section
      className="border-y border-line bg-bone-deep/50 py-24 md:py-32 lg:py-40"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="shell">
        <span className="label mx-auto block text-center">
          {REVIEW_COUNT.toLocaleString("en-CA")}+ verified reviews
        </span>

        {/* Reserve height so swapping quotes does not jolt the page */}
        <div className="relative mt-10 flex min-h-[19rem] items-center justify-center md:min-h-[17rem]">
          <AnimatePresence mode="wait">
            <m.blockquote
              key={current.id}
              className="mx-auto max-w-4xl text-center"
              initial={started ? { opacity: 0, y: 24 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            >
              <p className="font-display text-[clamp(1.6rem,4.4vw,3.2rem)] font-light leading-[1.18]">
                <span aria-hidden className="text-accent/50">“</span>
                {current.quote}
                <span aria-hidden className="text-accent/50">”</span>
              </p>

              <footer className="mt-9">
                <cite className="block text-[13px] font-medium not-italic uppercase tracking-[0.16em]">
                  {current.author}
                </cite>
                <span className="mt-2 block text-[12px] text-muted">
                  {current.context}
                </span>
              </footer>
            </m.blockquote>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous review"
            className="text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
          >
            Prev
          </button>

          <div className="flex items-center gap-2.5">
            {TESTIMONIALS.map((testimonial, i) => (
              <button
                key={testimonial.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show review ${i + 1} of ${TESTIMONIALS.length}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "w-8 bg-accent" : "w-1.5 bg-ink/25 hover:bg-ink/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next review"
            className="text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
