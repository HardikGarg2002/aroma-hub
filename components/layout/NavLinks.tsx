"use client";

import Link from "next/link";
import { m } from "motion/react";
import { cn } from "@/lib/cn";
import { NAV_LINKS } from "@/lib/navigation";

/**
 * Desktop nav. Each label carries a rule that draws in from the left on
 * hover/focus — the same accent underline used in the journal cards.
 */
export function NavLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Primary" className={cn("flex items-center gap-8", className)}>
      {NAV_LINKS.map((link) => (
        <m.div
          key={link.href}
          initial="rest"
          whileHover="hover"
          animate="rest"
          className={cn(link.wideOnly && "hidden 2xl:block")}
        >
          <Link
            href={link.href}
            className="group relative block whitespace-nowrap py-1 text-[12px] font-medium uppercase tracking-[0.16em]"
          >
            {link.label}
            <m.span
              aria-hidden
              className="absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent"
              variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </Link>
        </m.div>
      ))}
    </nav>
  );
}
