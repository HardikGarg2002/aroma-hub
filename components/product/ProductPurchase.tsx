"use client";

import { useState } from "react";
import { cartKey, useCartStore } from "@/lib/cart/store";
import { formatMoney } from "@/lib/admin/format";
import { cn } from "@/lib/cn";
import type { CartProductInput } from "@/components/cart/CartControl";
import { QuantityStepper } from "@/components/cart/QuantityStepper";

/**
 * Size selection and add-to-cart for the product page. Once the chosen size
 * is in the cart, the button becomes a stepper plus a shortcut to the cart.
 */
export function ProductPurchase({ product }: { product: CartProductInput }) {
  const [size, setSize] = useState(product.size_options[0] ?? "");
  const key = cartKey(product.id, size);
  const quantity = useCartStore((s) => s.items.find((i) => i.key === key)?.quantity ?? 0);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const open = useCartStore((s) => s.open);

  if (!size) {
    return <p className="text-[15px] text-muted">Currently unavailable.</p>;
  }

  const add = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      size,
      image_url: product.image_url,
      unit_price: product.price,
      currency: product.currency,
    });
    open();
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label mb-3 block text-muted">Size</legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {product.size_options.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={s === size}
              onClick={() => setSize(s)}
              className={cn(
                "min-w-20 border px-4 py-2.5 text-[13px] tracking-wide transition-colors",
                s === size ? "border-ink bg-ink text-bone" : "border-line hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {quantity > 0 ? (
        <div className="flex flex-wrap items-stretch gap-3">
          <QuantityStepper
            quantity={quantity}
            onChange={(next) => setQuantity(key, next)}
            label={`${product.name} ${size}`}
            className="h-14 w-40"
          />
          <button
            type="button"
            onClick={open}
            className="flex-1 border border-ink px-6 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-bone"
          >
            View cart
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={add}
          className="flex h-14 w-full items-center justify-center gap-3 bg-ink text-[12px] font-medium uppercase tracking-[0.18em] text-bone transition-opacity hover:opacity-90"
        >
          Add to cart
          <span aria-hidden className="h-px w-6 bg-bone/50" />
          <span className="tabular-nums">{formatMoney(product.price, product.currency)}</span>
        </button>
      )}
    </div>
  );
}
