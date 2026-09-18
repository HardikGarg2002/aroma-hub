"use client";

import { useEffect, useRef, useState } from "react";
import {
  m,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

interface MarqueeProps {
  children: React.ReactNode;
  /**
   * Drift speed in **pixels per second**. Positive moves right, negative left.
   * Around 40–70 keeps long words comfortably readable.
   */
  speed?: number;
  className?: string;
  /** How many copies of the children to lay down to fill the track. */
  repeat?: number;
  /** Cap on how much scroll velocity can multiply the base speed. */
  maxBoost?: number;
}

/**
 * Infinite horizontal ticker that eases faster — and reverses — with scroll
 * velocity, then settles back to `speed`.
 *
 * Offset is tracked in pixels against the measured width of one copy of the
 * children, and wrapped into that range, so the translate value stays small
 * no matter how long the page is open. Motion pauses entirely for visitors
 * who ask for reduced motion.
 */
export function Marquee({
  children,
  speed = -55,
  className,
  repeat = 4,
  maxBoost = 2.5,
}: MarqueeProps) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [copyWidth, setCopyWidth] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  // Measure one copy so the wrap distance is exact at any font size or zoom.
  useEffect(() => {
    const el = copyRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setCopyWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(
    smoothVelocity,
    [-1500, 0, 1500],
    [-maxBoost, 0, maxBoost],
    { clamp: true },
  );

  const baseDirection = speed < 0 ? -1 : 1;

  const x = useTransform(baseX, (value) =>
    copyWidth > 0 ? `${wrap(-copyWidth, 0, value)}px` : "0px",
  );

  useAnimationFrame((_, delta) => {
    if (prefersReduced || copyWidth === 0) return;

    // delta can spike after a background tab or a long frame; clamp it so the
    // track never jumps a large distance in one step.
    const seconds = Math.min(delta, 50) / 1000;
    const factor = velocityFactor.get();

    // Follow the scroll direction only while the page is actually moving,
    // then settle back to the base drift. A sticky direction left the ticker
    // running backwards after any downward scroll, which reads as broken.
    const direction = Math.abs(factor) < 0.05 ? baseDirection : Math.sign(factor);

    const magnitude = Math.abs(speed) * (1 + Math.abs(factor));
    baseX.set(baseX.get() + direction * magnitude * seconds);
  });

  return (
    <div className={cn("relative flex w-full overflow-hidden", className)}>
      <m.div className="flex flex-nowrap will-change-transform" style={{ x }}>
        {Array.from({ length: repeat }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? copyRef : undefined}
            className="flex shrink-0 flex-nowrap"
            aria-hidden={i > 0}
          >
            {children}
          </div>
        ))}
      </m.div>
    </div>
  );
}

/** Wrap `value` into the [min, max) range, keeping it finite forever. */
function wrap(min: number, max: number, value: number): number {
  const range = max - min;
  return min + ((((value - min) % range) + range) % range);
}
