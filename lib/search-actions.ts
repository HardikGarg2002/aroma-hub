"use server";

import { searchCatalog } from "./search";

/** Live suggestions for the header search: a few top results and the total. */
export async function searchSuggestions(query: string) {
  const { products, collections } = await searchCatalog(query);
  return {
    products: products.slice(0, 6),
    collections: collections.slice(0, 3),
    total: products.length,
  };
}
