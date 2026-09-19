"use client";

import { useState } from "react";
import { cartKey, useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/cn";
import { QuantityStepper } from "./QuantityStepper";

/** The fields a product card needs to hand to the cart. */
export interface CartProductInput {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  currency: string;
  size_options: string[];
}

/**
 * "Add to cart", which turns into a quantity stepper once that product/size
 * is in the cart.
 *
 * - `outline`: sits under a card, always visible (shop grid).
 * - `overlay`: an ink bar across the bottom of the card image. It rises on
 *   hover/focus of the enclosing `.group`, and stays up on touch screens and
 *   whenever the item is already in the cart.
 */
export function CartControl({
  product,
  variant = "outline",
  className,
}: {
  product: CartProductInput;
  variant?: "outline" | "overlay";
  className?: string;
}) {
  const [size, setSize] = useState(product.size_options[0] ?? "");
  const key = cartKey(product.id, size);
  const quantity = useCartStore((s) => s.items.find((i) => i.key === key)?.quantity ?? 0);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const open = useCartStore((s) => s.open);

  if (!size) return null; // Nothing purchasable without a size.

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

  const label = product.size_options.length > 1 ? `${product.name} ${size}` : product.name;
  const overlay = variant === "overlay";

  const sizePicker =
    product.size_options.length > 1 ? (
      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        aria-label={`${product.name} size`}
        className={cn(
          "min-w-0 border px-2 text-[12px] tracking-wide",
          overlay ? "border-bone/30 bg-ink text-bone" : "border-line bg-transparent",
        )}
      >
        {product.size_options.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    ) : null;

  return (
    <div
      className={cn(
        "flex items-stretch gap-2",
        overlay && [
          "bg-ink p-2 text-bone transition-transform duration-500 ease-out-expo",
          quantity > 0
            ? "translate-y-0"
            : "translate-y-full group-focus-within:translate-y-0 group-hover:translate-y-0 [@media(hover:none)]:translate-y-0",
        ],
        className,
      )}
    >
      {sizePicker}
      {quantity > 0 ? (
        <QuantityStepper
          quantity={quantity}
          onChange={(next) => setQuantity(key, next)}
          label={label}
          tone={overlay ? "dark" : "light"}
          className="flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={add}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
            overlay ? "hover:bg-bone/10" : "border border-ink hover:bg-ink hover:text-bone",
          )}
        >
          Add to cart
        </button>
      )}
    </div>
  );
}
