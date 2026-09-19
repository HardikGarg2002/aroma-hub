import "server-only";

import { listCollections } from "@/lib/admin/collections";
import { listProducts } from "@/lib/admin/products";
import type { CollectionRef, ShopProduct } from "@/lib/catalog";

/**
 * Storefront search over active products and collections. The catalogue is
 * small, so this scores in memory; swap for a DB full-text query if it grows
 * into the thousands.
 */

export const MAX_QUERY_LENGTH = 100;

/** Lowercase, strip accents, punctuation → spaces: "Ambre Lumière!" → "ambre lumiere". */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export interface SearchResults {
  query: string;
  products: ShopProduct[];
  collections: CollectionRef[];
}

/** Heavier fields rank higher; a product must match every word somewhere. */
const WEIGHTS = { name: 10, inspired_by: 6, collections: 4, code: 4, description: 1 } as const;

export async function searchCatalog(rawQuery: string): Promise<SearchResults> {
  const query = String(rawQuery ?? "").slice(0, MAX_QUERY_LENGTH).trim();
  const q = normalize(query);
  const tokens = [...new Set(q.split(" ").filter(Boolean))].slice(0, 8);
  if (!tokens.length) return { query, products: [], collections: [] };

  const [products, collections] = await Promise.all([listProducts(), listCollections()]);
  const live = new Map<string, CollectionRef>(
    collections.filter((c) => c.is_active).map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug }]),
  );

  const scored: { product: ShopProduct; score: number }[] = [];
  for (const p of products) {
    if (!p.is_active) continue;
    const refs = p.collection_ids.flatMap((id) => live.get(id) ?? []);
    const fields = {
      name: normalize(p.name),
      inspired_by: normalize(p.inspired_by ?? ""),
      collections: normalize(refs.map((c) => c.name).join(" ")),
      code: normalize(p.product_code),
      description: normalize(p.description ?? ""),
    };

    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      let best = 0;
      for (const [field, text] of Object.entries(fields) as [keyof typeof WEIGHTS, string][]) {
        // Words must start with the token ("oud" finds "Oud", not "cloud"), which
        // still lets partial typing match: "imper" finds "Imperial".
        if (!` ${text}`.includes(` ${token}`)) continue;
        best = Math.max(best, WEIGHTS[field]);
      }
      if (!best) {
        matchedAll = false;
        break;
      }
      score += best;
    }
    if (!matchedAll) continue;
    if (fields.name === q) score += 50;
    else if (fields.name.startsWith(q)) score += 20;

    scored.push({
      score,
      product: {
        id: p.id,
        name: p.name,
        inspired_by: p.inspired_by,
        price: p.price,
        currency: p.currency,
        size_options: p.size_options,
        image_url: p.image_url,
        collections: refs,
      },
    });
  }
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  const matchingCollections = [...live.values()].filter((c) => {
    const name = normalize(c.name);
    return tokens.every((t) => ` ${name}`.includes(` ${t}`));
  });

  return { query, products: scored.map((s) => s.product), collections: matchingCollections };
}
