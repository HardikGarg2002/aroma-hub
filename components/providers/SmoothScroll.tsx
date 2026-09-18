"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Smooth scrolling, driven by Lenis and slaved to GSAP's ticker so that
 * ScrollTrigger positions stay in sync with the interpolated scroll value.
 *
 * Also owns ScrollTrigger refreshes. ScrollTrigger caches each pin's start/end
 * pixel values, so they must be recalculated whenever the page's layout
 * height genuinely changes above a pin — a web font swapping in, the notes
 * explorer switching family, a hot reload in development.
 *
 * It must NOT refresh when nothing moved. A refresh briefly un-pins and
 * re-pins every pinned section, so refreshing on each lazy image load (the
 * previous approach) fired a dozen times while scrolling through a first
 * visit and made the pinned rail jitter — even though every image sits in an
 * aspect-ratio box and never changes the layout. Watching the document's
 * actual height means a refresh only happens when there is something to fix.
 *
 * Skipped entirely for visitors who ask for reduced motion — they get native
 * scrolling, and every ScrollTrigger timeline elsewhere is gated the same way.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | undefined;
    let raf: ((time: number) => void) | undefined;

    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.1,
        // Slightly eased wheel response — long tail, no overshoot.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const instance = lenis;
      raf = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(raf);
      // GSAP's lag smoothing fights Lenis during heavy frames.
      gsap.ticker.lagSmoothing(0);
    }

    // Keep Lenis's scroll limit in step with the geometry ScrollTrigger just
    // recalculated, otherwise it can clamp against a stale page height.
    const onRefresh = () => lenis?.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);

    let refreshTimer = 0;
    let lastHeight = document.documentElement.scrollHeight;

    const refreshIfLayoutChanged = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        if (height === lastHeight) return;
        lastHeight = height;
        ScrollTrigger.refresh();
        // A refresh re-applies pin spacing, which itself changes the height;
        // record the settled value so that change does not trigger another.
        lastHeight = document.documentElement.scrollHeight;
      }, 150);
    };

    // Fires only when the page's size really changes — not on image loads,
    // which land inside fixed aspect-ratio boxes.
    const observer = new ResizeObserver(refreshIfLayoutChanged);
    observer.observe(document.body);

    // The one layout change that can slip past an unchanged total height is
    // a font swap reflowing headings, so re-measure once fonts are settled.
    document.fonts?.ready
      .then(() => {
        ScrollTrigger.refresh();
        lastHeight = document.documentElement.scrollHeight;
      })
      .catch(() => {});

    return () => {
      window.clearTimeout(refreshTimer);
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      if (raf) {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
      }
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
