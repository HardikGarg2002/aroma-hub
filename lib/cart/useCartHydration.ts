"use client";

import { useEffect } from "react";
import { useCartStore } from "./store";

/**
 * Loads the persisted cart after mount, and keeps it in sync when another tab
 * changes it. Call once, from a component that is always mounted.
 */
export function useCartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === useCartStore.persist.getOptions().name) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}
