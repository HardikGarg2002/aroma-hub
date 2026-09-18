"use client";

import { m } from "motion/react";
import { cn } from "@/lib/cn";

interface CartButtonProps {
  /** Static for now — wired to real cart state once the API exists. */
  count?: number;
  className?: string;
}

export function CartButton({ count = 0, className }: CartButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={cn(
        "group relative flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em]",
        className,
      )}
    >
      <span className="hidden sm:inline">Cart</span>

      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-current">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path
            d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {count > 0 ? (
          <m.span
            key={count}
            // Scale only — animating opacity would hide the count in the
            // server-rendered HTML, before Motion has hydrated.
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-bone"
          >
            {count}
          </m.span>
        ) : null}
      </span>
    </button>
  );
}
