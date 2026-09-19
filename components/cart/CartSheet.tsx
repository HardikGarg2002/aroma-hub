"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";
import { EASE_OUT } from "@/lib/motion";
import { BLUR, canOptimize } from "@/lib/images";
import { formatMoney } from "@/lib/admin/format";
import { selectCount, selectSubtotal, useCartStore, type CartItem } from "@/lib/cart/store";
import { useCartHydration } from "@/lib/cart/useCartHydration";
import { refreshCoupon } from "@/lib/cart/coupon-actions";
import { evaluateCoupon } from "@/lib/coupons";
import { CartCoupon } from "./CartCoupon";
import { QuantityStepper } from "./QuantityStepper";

/**
 * Slide-in cart drawer. Mounted once in the header; opened via the cart
 * store so any "add to cart" button can reveal it.
 */
export function CartSheet() {
  useCartHydration();

  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  const coupon = useCartStore((s) => s.coupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Scroll lock, Escape to close, focus in on open and back out on close,
  // and Tab kept inside the panel while it's open.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, close]);

  // Mixed currencies can't be summed meaningfully; show the first one's.
  const currency = items[0]?.currency ?? "CAD";

  // Re-applied live as the cart changes: dropping below the minimum keeps the
  // code but pauses the discount until the cart qualifies again.
  const couponResult = coupon ? evaluateCoupon({ ...coupon, is_active: true }, subtotal, currency) : null;
  const total = subtotal - (couponResult?.ok ? couponResult.discount : 0);

  // The stored terms may be stale (edited or switched off in admin since), so
  // refresh them each time the sheet opens. Only a code that no longer exists
  // or is off gets dropped; a cart below the minimum keeps it.
  useEffect(() => {
    if (!isOpen || !coupon) return;
    let cancelled = false;
    void refreshCoupon(coupon.code).then((fresh) => {
      if (cancelled) return;
      if (fresh) applyCoupon(fresh);
      else removeCoupon();
    });
    return () => {
      cancelled = true;
    };
    // Deliberately only on open: re-checking on every quantity change would
    // hit the server for no new information.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div key="cart-sheet" className="fixed inset-0 z-[95]">
          <m.div
            aria-hidden
            className="absolute inset-0 bg-ink/40"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-sheet-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bone shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 sm:h-20 sm:px-6">
              <h2 id="cart-sheet-title" className="font-display text-xl sm:text-2xl">
                Your cart <span className="text-muted">({count})</span>
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="-mr-2 flex h-10 w-10 items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                <p className="font-display text-3xl">Your cart is empty</p>
                <p className="max-w-xs text-[15px] text-muted">Find a fragrance to start with.</p>
                <Link
                  href="/shop"
                  onClick={close}
                  className="bg-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-bone transition-opacity hover:opacity-90"
                >
                  Shop all
                </Link>
              </div>
            ) : (
              <>
                {/* data-lenis-prevent: let this list scroll natively under Lenis. */}
                <ul data-lenis-prevent className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4 sm:px-6">
                  {items.map((item) => (
                    <CartLine key={item.key} item={item} />
                  ))}
                </ul>

                <div className="shrink-0 space-y-3 border-t border-line px-4 py-4 sm:space-y-4 sm:px-6 sm:py-6">
                  <CartCoupon subtotal={subtotal} currency={currency} />

                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex items-baseline justify-between">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="tabular-nums">{formatMoney(subtotal, currency)}</dd>
                    </div>
                    {coupon && couponResult?.ok && (
                      <div className="flex items-baseline justify-between">
                        <dt className="text-muted">
                          Discount <span className="font-mono text-[12px]">({coupon.code})</span>
                        </dt>
                        <dd className="tabular-nums text-accent">−{formatMoney(couponResult.discount, currency)}</dd>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between border-t border-line pt-2">
                      <dt className="text-[12px] font-medium uppercase tracking-[0.16em]">Total</dt>
                      <dd className="text-lg tabular-nums">{formatMoney(total, currency)}</dd>
                    </div>
                  </dl>
                  {coupon && couponResult && !couponResult.ok && (
                    <p className="text-[12px] text-accent">
                      {couponResult.reason === "minimum"
                        ? `Add ${formatMoney(couponResult.shortfall ?? 0, currency)} more to use ${coupon.code}.`
                        : `${coupon.code} can't be used with the items in your cart.`}
                    </p>
                  )}
                  <p className="text-[12px] text-muted sm:text-[13px]">Shipping and taxes are calculated at checkout.</p>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="block bg-ink py-3.5 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-bone transition-opacity hover:opacity-90 sm:py-4"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </m.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <li className="flex gap-3 py-3 sm:gap-4 sm:py-5">
      <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-paper sm:w-20">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt=""
            fill
            sizes="80px"
            placeholder="blur"
            blurDataURL={BLUR}
            unoptimized={!canOptimize(item.image_url)}
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight sm:text-xl">{item.name}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted sm:mt-1 sm:text-[11px]">{item.size}</p>
          </div>
          <p className="shrink-0 text-[13px] tabular-nums sm:text-[14px]">
            {formatMoney(item.unit_price * item.quantity, item.currency)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 sm:pt-3">
          <QuantityStepper
            quantity={item.quantity}
            onChange={(next) => setQuantity(item.key, next)}
            label={item.name}
            className="h-8"
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
