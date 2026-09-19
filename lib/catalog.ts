import "server-only";

import { listCollections } from "@/lib/admin/collections";
import { getProduct, listProducts } from "@/lib/admin/products";
import type { AdminProduct } from "@/types/admin";

/**
 * Storefront reads of the admin-managed catalogue (mock or Supabase, per
 * lib/admin/data-source.ts). Only active collections and products are exposed.
 */

export interface CollectionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Collection image, falling back to its first product's image. */
  image_url: string | null;
  product_count: number;
}

export async function getCollectionSummaries(): Promise<CollectionSummary[]> {
  const [collections, products] = await Promise.all([listCollections(), listProducts()]);
  const live = products.filter((p) => p.is_active);

  return collections
    .filter((c) => c.is_active)
    .map((c) => {
      const members = live.filter((p) => p.collection_ids.includes(c.id));
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image_url: c.image_url ?? members.find((p) => p.image_url)?.image_url ?? null,
        product_count: members.length,
      };
    });
}

export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

/** A purchasable size as the storefront needs it. */
export interface ShopVariant {
  id: string;
  size: string;
  price: number;
  /** Out-of-stock sizes still render, but can't be added to the cart. */
  in_stock: boolean;
}

export interface ShopProduct {
  id: string;
  name: string;
  inspired_by: string | null;
  /** Lowest active price -- an entry point, not what any given size costs. */
  price: number;
  currency: string;
  /** Active sizes, cheapest first. Price comes from the chosen one. */
  variants: ShopVariant[];
  size_options: string[];
  image_url: string | null;
  /** Active collections only. */
  collections: CollectionRef[];
}

export interface ProductDetail extends ShopProduct {
  product_code: string;
  description: string | null;
}

async function activeCollectionMap() {
  const collections = await listCollections();
  return new Map<string, CollectionRef>(
    collections.filter((c) => c.is_active).map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug }]),
  );
}

function toShopProduct(p: AdminProduct, live: Map<string, CollectionRef>): ShopProduct {
  const variants = toShopVariants(p);
  return {
    id: p.id,
    name: p.name,
    inspired_by: p.inspired_by,
    price: variants[0]?.price ?? 0,
    currency: p.currency,
    variants,
    size_options: variants.map((v) => v.size),
    image_url: p.image_url,
    collections: p.collection_ids.flatMap((id) => live.get(id) ?? []),
  };
}

/** Active sizes only, cheapest first -- shoppers can't buy a disabled size. */
export function toShopVariants(p: AdminProduct): ShopVariant[] {
  return p.variants
    .filter((v) => v.is_active)
    .map((v) => ({ id: v.id, size: v.size, price: v.price, in_stock: v.stock_quantity > 0 }))
    .sort((a, b) => a.price - b.price);
}

/** Every active product, newest first. */
export async function getShopProducts(): Promise<ShopProduct[]> {
  const [products, live] = await Promise.all([listProducts(), activeCollectionMap()]);
  return products.filter((p) => p.is_active).map((p) => toShopProduct(p, live));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One active product, or null if it doesn't exist or is switched off. */
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  // The DB id column is a uuid; anything else would be a query error, not a miss.
  if (!UUID.test(id)) return null;

  const [product, live] = await Promise.all([getProduct(id), activeCollectionMap()]);
  if (!product?.is_active) return null;

  return {
    ...toShopProduct(product, live),
    product_code: product.product_code,
    description: product.description,
  };
}

/**
 * Other active products to show under a product: ones sharing a collection
 * first, then the newest, so the row is full even for uncategorised items.
 */
export async function getRelatedProducts(product: ShopProduct, limit = 4): Promise<ShopProduct[]> {
  const others = (await getShopProducts()).filter((p) => p.id !== product.id);
  const ids = new Set(product.collections.map((c) => c.id));
  const shared = others.filter((p) => p.collections.some((c) => ids.has(c.id)));
  const rest = others.filter((p) => !shared.includes(p));
  return [...shared, ...rest].slice(0, limit);
}
