"use client";

import { useEffect, useRef } from "react";

const SEEN_KEY = "aroma:intro-seen";
/** Hard ceiling on the hold, in case `animationend` never arrives. */
const SAFETY_MS = 2500;

/**
 * A bone curtain over the first paint that lifts to reveal the page.
 *
 * Plays once per tab (sessionStorage) and never for reduced-motion visitors.
 *
 * Driven through the DOM and CSS keyframes rather than React state: the
 * curtain is `display: none` by default, so it is absent from the server HTML,
 * and flipping `data-play` is a write to an external system rather than a
 * render-triggering state update.
 *
 * While the curtain is up it also sets `data-intro="playing"` on <html>, which
 * pauses the hero's CSS entrance animations (see globals.css) so they are not
 * wasted underneath it. The default with no JS is that nothing is paused and
 * the hero animates immediately, and a safety timer clears the flag even if
 * the animation never reports finishing.
 */
export function LoaderCurtain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private mode or blocked storage — treat the intro as unseen.
    }

    if (prefersReduced || seen) return;

    const root = document.documentElement;
    el.dataset.play = "true";
    root.dataset.intro = "playing";

    let safety = 0;

    const finish = () => {
      window.clearTimeout(safety);
      el.dataset.play = "done";
      delete root.dataset.intro;
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* non-fatal */
      }
    };

    const onEnd = (event: AnimationEvent) => {
      // The wordmark animates too; only the curtain's own end counts.
      if (event.target !== el) return;
      finish();
    };

    el.addEventListener("animationend", onEnd);
    safety = window.setTimeout(finish, SAFETY_MS);

    return () => {
      el.removeEventListener("animationend", onEnd);
      window.clearTimeout(safety);
      delete root.dataset.intro;
    };
  }, []);

  return (
    <div ref={ref} aria-hidden data-play="false" className="aroma-curtain">
      <span className="aroma-curtain-mark font-display text-[clamp(2.5rem,9vw,7rem)] font-light tracking-[0.2em] text-ink">
        AROMA
      </span>
    </div>
  );
}
