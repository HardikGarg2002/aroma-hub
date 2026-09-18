"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { m, useSpring } from "motion/react";
import { cn } from "@/lib/cn";
import { useHasFinePointer } from "@/hooks/useMediaQuery";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "solid" | "outline";
  /** Maximum px the button leans toward the cursor. */
  pull?: number;
}

/**
 * A CTA that leans toward the cursor and fills from the bottom on hover.
 * The magnetic pull is disabled on touch devices, where there is no cursor
 * to chase and the transform would just feel like lag.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  variant = "solid",
  pull = 8,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const hasFinePointer = useHasFinePointer();

  const spring = { stiffness: 260, damping: 22, mass: 0.35 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!hasFinePointer || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // -1..1 from the element's centre, scaled to `pull` px.
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 2 * pull);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 2 * pull);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const content = (
    <>
      {/* Fill sweep — sits behind the label, grows from the bottom edge. */}
      <m.span
        aria-hidden
        className={cn(
          "absolute inset-0 origin-bottom",
          variant === "solid" ? "bg-bone" : "bg-ink",
        )}
        initial={false}
        animate={{ scaleY: hovered ? 1 : 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ scaleY: 0 }}
      />
      <span
        className={cn(
          "relative z-10 transition-colors duration-300",
          variant === "solid"
            ? hovered
              ? "text-ink"
              : "text-bone"
            : hovered
              ? "text-bone"
              : "text-ink",
        )}
      >
        {children}
      </span>
    </>
  );

  const classes = cn(
    "relative inline-flex items-center justify-center overflow-hidden",
    "px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em]",
    "rounded-full will-change-transform",
    variant === "solid" ? "bg-ink" : "border border-ink bg-transparent",
    className,
  );

  const motionProps = {
    style: { x, y },
    onMouseMove: handleMove,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: reset,
    onFocus: () => setHovered(true),
    onBlur: reset,
  };

  if (href) {
    return (
      <m.div style={{ x, y }} className="inline-block">
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          onMouseMove={handleMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={reset}
          onFocus={() => setHovered(true)}
          onBlur={reset}
        >
          {content}
        </Link>
      </m.div>
    );
  }

  return (
    <m.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={classes}
      {...motionProps}
    >
      {content}
    </m.button>
  );
}
