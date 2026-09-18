"use client";

import { useEffect, useState } from "react";

export type ScrollDirection = "up" | "down";

interface ScrollState {
  direction: ScrollDirection;
  /** True once scrolled past `offset` — used to give the header a backdrop. */
  isScrolled: boolean;
  /** True while still within `offset` of the very top of the page. */
  isAtTop: boolean;
}

/**
 * Tracks scroll direction with a small threshold so the header does not
 * flicker on sub-pixel or rubber-band movement.
 */
export function useScrollDirection(offset = 80, threshold = 8): ScrollState {
  const [state, setState] = useState<ScrollState>({
    direction: "up",
    isScrolled: false,
    isAtTop: true,
  });

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;

      setState((prev) => {
        const direction =
          Math.abs(delta) < threshold ? prev.direction : delta > 0 ? "down" : "up";
        const next: ScrollState = {
          direction,
          isScrolled: y > offset,
          isAtTop: y <= offset,
        };
        // Skip the state write when nothing meaningful changed.
        return next.direction === prev.direction &&
          next.isScrolled === prev.isScrolled &&
          next.isAtTop === prev.isAtTop
          ? prev
          : next;
      });

      if (Math.abs(delta) >= threshold) lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [offset, threshold]);

  return state;
}
