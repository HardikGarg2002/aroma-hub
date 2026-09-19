"use client";

import { cn } from "@/lib/cn";
import { MAX_QUANTITY } from "@/lib/cart/store";

/** − qty + control. Decrementing from 1 is the caller's "remove". */
export function QuantityStepper({
  quantity,
  onChange,
  label,
  tone = "light",
  className,
}: {
  quantity: number;
  onChange: (next: number) => void;
  /** Item name, for the button labels. */
  label: string;
  /** "dark" for use on an ink background. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const button = cn(
    "flex h-full min-h-8 w-9 items-center justify-center text-lg leading-none transition-colors disabled:opacity-30",
    tone === "dark" ? "hover:bg-bone/15" : "hover:bg-bone-deep",
  );

  return (
    <div
      className={cn(
        "flex items-stretch border",
        tone === "dark" ? "border-bone/30" : "border-line",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={quantity === 1 ? `Remove ${label}` : `Decrease ${label} quantity`}
        className={button}
      >
        −
      </button>
      <span aria-live="polite" className="flex min-w-8 flex-1 items-center justify-center text-[13px] tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Increase ${label} quantity`}
        className={button}
      >
        +
      </button>
    </div>
  );
}
