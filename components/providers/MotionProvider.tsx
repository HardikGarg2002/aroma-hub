"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/**
 * `reducedMotion="user"` makes every Motion component respect the OS setting
 * automatically. `LazyMotion` with only the DOM feature set keeps the runtime
 * small, provided components animate via `m.*` rather than `motion.*`.
 *
 * Deliberately not `strict`: a stray `motion.*` should silently fall back to
 * the full bundle rather than throw at runtime.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.7, ease: EASE_OUT }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
