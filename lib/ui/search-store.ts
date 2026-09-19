"use client";

import { create } from "zustand";

/**
 * Whether the header search panel is open. Shared so anything on the page —
 * the header button, ⌘K, the hero's "Find your scent" — can open it.
 */
interface SearchUiState {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useSearchUi = create<SearchUiState>()((set) => ({
  open: false,
  openSearch: () => set({ open: true }),
  closeSearch: () => set({ open: false }),
}));
