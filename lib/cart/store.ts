"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  /** `${product_id}::${size}` — the same product in two sizes is two lines. */
  key: string;
  product_id: string;
  name: string;
  size: string;
  image_url: string | null;
  /** Snapshot at add time. Checkout must re-price against the database. */
  unit_price: number;
  currency: string;
  quantity: number;
}

export type AddToCartInput = Omit<CartItem, "key" | "quantity">;

/**
 * Terms of an applied coupon, as returned by checkCoupon(). Kept so the
 * discount can update live as the cart changes; checkout must re-validate
 * the code on the server rather than trust these.
 */
export interface AppliedCoupon {
  code: string;
  discount_amount: number;
  min_cart_value: number;
  currency: string;
}

export const MAX_QUANTITY = 10;

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  /** Whether the cart sheet is showing. Not persisted. */
  isOpen: boolean;

  addItem: (item: AddToCartInput, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;

  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;

  open: () => void;
  close: () => void;
}

export const cartKey = (productId: string, size: string) => `${productId}::${size}`;

const clamp = (n: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.floor(n)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      isOpen: false,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = cartKey(item.product_id, item.size);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                // Refresh the snapshot too, in case name/price changed since.
                i.key === key ? { ...i, ...item, quantity: clamp(i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key, quantity: clamp(quantity) }] };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity: clamp(quantity) } : i)),
        })),

      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "aroma-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
      // The server always renders an empty cart; rehydrating after mount (see
      // useCartHydration) keeps the first client render identical to it.
      skipHydration: true,
    },
  ),
);

/* Selectors — derive, don't store, so totals can never drift from items. */
export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
