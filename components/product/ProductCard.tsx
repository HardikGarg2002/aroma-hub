"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/cn";
import { BLUR } from "@/lib/images";
import { formatPrice } from "@/lib/products";
import { EASE_OUT } from "@/lib/motion";
import type { Product } from "@/types/product";
import { CartControl } from "@/components/cart/CartControl";

const BADGE_COPY: Record<NonNullable<Product["badge"]>, string> = {
  new: "New",
  bestseller: "Bestseller",
  limited: "Limited",
};

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Aspect ratio of the image well. */
  ratio?: "portrait" | "tall" | "square";
  sizes?: string;
  /** Oversized index numeral shown beside the card (bestsellers rail). */
  index?: number;
}

/**
 * The single product tile used by every grid and carousel on the site.
 *
 * Hover swaps to a second angle, lifts a family-tinted wash behind the
 * bottle, and raises an add-to-cart bar (a quantity stepper once the item is
 * in the cart). Everything is also driven by focus-within, so keyboard users
 * get the same reveal.
 *
 * The image and the meta are separate links so the cart bar, which is a
 * button, never ends up nested inside an <a>.
 */
export function ProductCard({
  product,
  className,
  ratio = "portrait",
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw",
  index,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  // The hover image is only mounted after the first hover/focus, which halves
  // the images a cold page load has to fetch and decode.
  const [hoverLoaded, setHoverLoaded] = useState(false);

  const engage = () => {
    setHovered(true);
    setHoverLoaded(true);
  };

  const href = `/products/${product.slug}`;

  const ratioClass = {
    portrait: "aspect-[4/5]",
    tall: "aspect-[3/4.4]",
    square: "aspect-square",
  }[ratio];

  return (
    <m.article
      className={cn("group relative", className)}
      onHoverStart={engage}
      onHoverEnd={() => setHovered(false)}
      onFocus={engage}
      onBlur={(event) => {
        // Moving focus between the card's own links/buttons isn't leaving it.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(false);
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[2px] bg-paper",
          ratioClass,
        )}
      >
        {/* Duplicate of the name link below, so kept out of tab order and the a11y tree. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 block focus-visible:outline-none"
        >
          {/* Family-tinted wash that bleeds in behind the bottle */}
          <m.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 90% at 50% 105%, var(--color-${product.family}) 0%, transparent 62%)`,
            }}
            initial={false}
            animate={{ opacity: hovered ? 0.5 : 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />

          {/* Primary shot */}
          <m.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.75, ease: EASE_OUT }}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={sizes}
              placeholder="blur"
              blurDataURL={BLUR}
              className="object-cover"
            />
          </m.div>

          {/* Second angle, mounted on first hover and revealed on hover */}
          {hoverLoaded ? (
            <m.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 1.05 }}
              transition={{ duration: 0.75, ease: EASE_OUT }}
            >
              <Image
                src={product.hoverImage}
                alt=""
                aria-hidden
                fill
                sizes={sizes}
                placeholder="blur"
                blurDataURL={BLUR}
                className="object-cover"
              />
            </m.div>
          ) : null}
        </Link>

        {product.badge ? (
          <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-bone/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink backdrop-blur-sm">
            {BADGE_COPY[product.badge]}
          </span>
        ) : null}

        {index !== undefined ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-3 z-10 font-display text-5xl font-light leading-none text-ink/25"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}

        <CartControl
          variant="overlay"
          className="absolute inset-x-0 bottom-0 z-10"
          product={{
            id: product.id,
            name: product.name,
            image_url: product.image,
            price: product.price,
            currency: "CAD",
            size_options: [product.size],
          }}
        />
      </div>

      <Link href={href} className="block focus-visible:outline-none">
        {/* Meta */}
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[22px] leading-tight">
              {product.name}
            </h3>
            <p className="mt-1.5 truncate text-[12px] tracking-wide text-muted">
              {product.tagline}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[14px] tabular-nums">{formatPrice(product.price)}</p>
            {product.compareAt ? (
              <p className="text-[12px] text-muted line-through tabular-nums">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
              {product.size}
            </p>
          </div>
        </div>
      </Link>
    </m.article>
  );
}
