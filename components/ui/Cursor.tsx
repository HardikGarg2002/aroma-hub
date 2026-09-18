"use client";

import { useEffect, useState } from "react";
import { m, useSpring } from "motion/react";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * A small difference-blended dot that trails the cursor and swells over
 * anything interactive. Rendered only for fine pointers, and skipped for
 * reduced-motion visitors since it is purely decorative.
 */
export function Cursor() {
  const hasFinePointer = useHasFinePointer();
  const prefersReduced = usePrefersReducedMotion();
  const enabled = hasFinePointer && !prefersReduced;

  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const spring = { stiffness: 500, damping: 40, mass: 0.28 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      // Swell when the pointer is over anything clickable.
      const target = event.target as HTMLElement | null;
      setActive(Boolean(target?.closest("a, button, [data-cursor-grow]")));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden rounded-full bg-bone mix-blend-difference lg:block"
      style={{ x, y, width: 14, height: 14, translateX: "-50%", translateY: "-50%" }}
      animate={{
        scale: active ? 3.2 : 1,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
