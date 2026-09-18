"use client";

import { useCallback, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Subscribe to a media query.
 *
 * Uses `useSyncExternalStore` rather than an effect so there is no cascading
 * render on mount and no torn state during concurrent rendering. Returns
 * false on the server, so never use it to gate content that has to exist in
 * the initial HTML — only to enable progressive enhancement.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return emptySubscribe();
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True once we know the visitor has asked for reduced motion. */
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

/** Desktop breakpoint — the point where pinned scroll sequences switch on. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

/** True for real mouse/trackpad pointers, where hover effects make sense. */
export const useHasFinePointer = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");
