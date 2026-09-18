"use client";

import Image from "next/image";
import { useRef } from "react";
import { m, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/cn";
import { BLUR } from "@/lib/images";

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** How far the image drifts, as a fraction of the container height. */
  strength?: number;
  /** Extra scale headroom so the drift never exposes an edge. */
  scale?: number;
  sizes?: string;
  /** Load eagerly and preload — use for above-the-fold imagery only. */
  eager?: boolean;
  quality?: number;
}

/**
 * An image that drifts against the page as it scrolls through the viewport.
 *
 * The wrapper clips; the inner image is oversized by `scale` and translated,
 * so only transform/opacity animate and nothing reflows. Motion's own
 * reduced-motion handling zeroes the transform for users who ask for it.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  strength = 0.14,
  scale = 1.18,
  sizes = "(max-width: 768px) 100vw, 50vw",
  eager = false,
  quality = 75,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const offset = `${strength * 100}%`;
  const raw = useTransform(scrollYProgress, [0, 1], [`-${offset}`, offset]);
  // A touch of spring keeps the drift from feeling mechanically linear.
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <m.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          placeholder="blur"
          blurDataURL={BLUR}
          loading={eager ? "eager" : "lazy"}
          preload={eager}
          className={cn("object-cover", imageClassName)}
        />
      </m.div>
    </div>
  );
}
