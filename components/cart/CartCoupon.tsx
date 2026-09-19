"use client";

import { useState, useTransition } from "react";
import { checkCoupon } from "@/lib/cart/coupon-actions";
import { useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/cn";

/** Coupon entry for the cart sheet; shows the applied code once accepted. */
export function CartCoupon({ subtotal, currency }: { subtotal: number; currency: string }) {
  const coupon = useCartStore((s) => s.coupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-line px-3 py-2">
        <p className="min-w-0 truncate text-[12px]">
          <span className="font-mono font-medium tracking-wider">{coupon.code}</span>
          <span className="text-muted"> applied</span>
        </p>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label={`Remove coupon ${coupon.code}`}
          className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await checkCoupon(code, subtotal, currency);
      if (result.ok) {
        applyCoupon(result.coupon);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-stretch gap-2">
        <label htmlFor="cart-coupon" className="sr-only">
          Coupon code
        </label>
        <input
          id="cart-coupon"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Coupon code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "cart-coupon-error" : undefined}
          className={cn(
            "min-w-0 flex-1 border bg-transparent px-3 py-2.5 font-mono text-[13px] uppercase tracking-wider outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-ink",
            error ? "border-red-400" : "border-line",
          )}
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="shrink-0 border border-ink px-5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-bone disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="cart-coupon-error" role="alert" className="mt-1.5 text-[12px] text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
