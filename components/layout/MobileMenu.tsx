"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/navigation";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen nav overlay for small screens. Locks body scroll while open and
 * closes on Escape; links stagger in behind the panel wipe.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          key="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[90] flex flex-col bg-bone lg:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.65, ease: EASE_IN_OUT }}
        >
          <div className="shell flex h-20 shrink-0 items-center justify-between">
            <span className="font-display text-2xl tracking-[0.18em]">AROMA</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <m.nav
            aria-label="Primary"
            className="shell flex flex-1 flex-col justify-center gap-1"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
          >
            {NAV_LINKS.map((link) => (
              <span key={link.href} className="reveal-mask block">
                <m.span
                  className="block"
                  variants={{
                    hidden: { y: "105%" },
                    visible: { y: "0%", transition: { duration: 0.8, ease: EASE_OUT } },
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block font-display text-[clamp(2.4rem,11vw,4rem)] leading-[1.15]"
                  >
                    {link.label}
                  </Link>
                </m.span>
              </span>
            ))}
          </m.nav>

          <m.div
            className="shell flex shrink-0 items-center gap-6 border-t border-line py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
              >
                {social.label}
              </a>
            ))}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
