"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/cn";
import { SITE_IMAGES } from "@/lib/images";
import { EASE_OUT } from "@/lib/motion";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { RevealText } from "@/components/ui/RevealText";
import { FadeIn } from "@/components/ui/FadeIn";

type Status = "idle" | "success";

/**
 * Newsletter capture.
 *
 * Local-only for now: there is no endpoint yet, so submitting validates the
 * address and shows the success state without sending anything. Swap the
 * body of `onSubmit` for the real call once the API lands.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setStatus("success");
  };

  return (
    <section className="relative isolate overflow-hidden py-24 md:py-32 lg:py-40">
      {/* Silk backdrop, washed out so type stays legible */}
      <ParallaxImage
        src={SITE_IMAGES.newsletter}
        alt=""
        className="absolute inset-0 -z-20"
        sizes="100vw"
        strength={0.12}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-bone/82" />

      <div className="shell relative max-w-3xl text-center">
        <FadeIn y={12} duration={0.55}>
          <span className="label block">Correspondence</span>
        </FadeIn>

        <RevealText
          as="h2"
          className="mx-auto mt-5 max-w-2xl text-[clamp(2rem,5.4vw,4rem)] leading-[1.05]"
        >
          One letter a month. New releases, and nothing else.
        </RevealText>

        <FadeIn delay={0.15} y={20}>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-muted">
            Early access to limited batches, plus $15 off your first order over
            $95. Unsubscribe in one click, any time.
          </p>
        </FadeIn>

        <FadeIn delay={0.25} y={24} className="mt-12">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <m.div
                key="success"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
              >
                {/* Checkmark that draws itself */}
                <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
                  <m.circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: EASE_OUT }}
                  />
                  <m.path
                    d="M15 24.5l6.5 6.5L33 19"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: EASE_OUT }}
                  />
                </svg>

                <p className="font-display text-2xl">You are on the list.</p>
                <p className="text-[13px] text-muted">
                  Check {email} for your welcome code.
                </p>
              </m.div>
            ) : (
              <m.form
                key="form"
                onSubmit={onSubmit}
                noValidate
                className="mx-auto max-w-lg"
                // Server-rendered state — must not start hidden.
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>

                  <div className="flex items-end gap-4">
                    <input
                      id="newsletter-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "newsletter-error" : undefined}
                      className="min-w-0 flex-1 bg-transparent pb-3 text-center text-[16px] text-ink placeholder:text-muted/70 focus:outline-none sm:text-left"
                    />

                    <button
                      type="submit"
                      className="shrink-0 pb-3 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 hover:text-accent"
                    >
                      Subscribe
                    </button>
                  </div>

                  {/* Base rule, plus an accent rule that sweeps across on focus */}
                  <div className="h-px w-full bg-line" />
                  <m.div
                    aria-hidden
                    className={cn(
                      "h-[1.5px] w-full origin-left",
                      error ? "bg-red-700" : "bg-accent",
                    )}
                    initial={false}
                    animate={{ scaleX: focused || error ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                    style={{ marginTop: -1 }}
                  />
                </div>

                <AnimatePresence>
                  {error ? (
                    <m.p
                      id="newsletter-error"
                      role="alert"
                      className="mt-3 text-left text-[12px] text-red-700"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </m.p>
                  ) : null}
                </AnimatePresence>
              </m.form>
            )}
          </AnimatePresence>
        </FadeIn>
      </div>
    </section>
  );
}
