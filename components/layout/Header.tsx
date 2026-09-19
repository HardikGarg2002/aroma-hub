"use client";

import Link from "next/link";
import { useState } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/cn";
import { EASE_OUT } from "@/lib/motion";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CartButton } from "@/components/layout/CartButton";
import { CartSheet } from "@/components/cart/CartSheet";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

/**
 * Sticky header that retracts on scroll down and returns on scroll up,
 * gaining a translucent backdrop once away from the top of the page.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { direction, isScrolled, isAtTop } = useScrollDirection(90);

  // Stay put while the mobile menu is open, otherwise it retracts underneath it.
  const hidden = direction === "down" && isScrolled && !menuOpen;

  return (
    <>
      <m.header
        className={cn(
          "fixed inset-x-0 top-0 z-[80] transition-colors duration-500",
          isScrolled && !menuOpen
            ? "border-b border-line/70 bg-bone/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
        initial={false}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <AnnouncementBar />

        <div
          className={cn(
            "shell flex items-center justify-between transition-[height] duration-500",
            isAtTop ? "h-20 md:h-24" : "h-16 md:h-18",
          )}
        >
          {/* Left: mobile menu trigger / desktop nav */}
          <div className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex flex-col gap-[5px] py-2 lg:hidden"
            >
              <span className="block h-px w-6 bg-ink" />
              <span className="block h-px w-4 bg-ink" />
            </button>

            <NavLinks className="hidden lg:flex" />
          </div>

          {/* Centre: wordmark */}
          <Link
            href="/"
            className="shrink-0 px-4 font-display leading-none tracking-[0.22em] transition-all duration-500"
            style={{ fontSize: isAtTop ? "clamp(1.4rem, 3vw, 2rem)" : "1.35rem" }}
          >
            AROMA
          </Link>

          {/* Right: utilities */}
          <div className="flex flex-1 items-center justify-end gap-5 md:gap-7">
            <Link
              href="/search"
              aria-label="Search"
              className="hidden text-[12px] font-medium uppercase tracking-[0.16em] md:block"
            >
              Search
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="hidden text-[12px] font-medium uppercase tracking-[0.16em] md:block"
            >
              Account
            </Link>
            <CartButton />
          </div>
        </div>
      </m.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {/* Outside the header: its transform would otherwise anchor the fixed sheet. */}
      <CartSheet />
    </>
  );
}
