import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens. Kept in one place so every section eases identically —
 * these mirror --ease-out-expo / --ease-in-out-expo in globals.css.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.83, 0, 0.17, 1] as const;

export const DURATION = {
  fast: 0.35,
  base: 0.7,
  slow: 1.1,
  reveal: 1.25,
} as const;

export const transition = {
  base: { duration: DURATION.base, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_OUT },
  fast: { duration: DURATION.fast, ease: EASE_OUT },
} satisfies Record<string, Transition>;

/** Standard "rise into place" entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: transition.base },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.slow },
};

/** Vertical mask reveal for a single line/word of display type. */
export const maskUp: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: DURATION.reveal, ease: EASE_OUT },
  },
};

/** Parent that walks its children in sequence. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Shared viewport config so sections all trigger at the same threshold. */
export const inView = { once: true, amount: 0.25 } as const;
export const inViewEarly = { once: true, amount: 0.1 } as const;
