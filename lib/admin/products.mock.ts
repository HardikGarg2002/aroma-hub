import { PRODUCT_IMAGES } from "@/lib/images";
import { COLLECTION_SEED_NAMES, collectionSeedId, peekCollections } from "./collections.mock";
import type { AdminProduct, AdminProductInput } from "@/types/admin";

/**
 * Mock product store. Pages and actions only use the functions below, so
 * swapping this module for DB queries later is a single-file change.
 *
 * Data lives in memory on the server: edits show up across pages but reset
 * whenever the server restarts. Pinned to globalThis so dev hot reloads
 * don't wipe it.
 */

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "INR"] as const;
export const SIZE_PRESETS = ["10 ml", "30 ml", "50 ml", "100 ml"] as const;

type Seed = [code: string, name: string, inspiredBy: string | null, collection: string, price: number, image: string, active?: boolean];

const SEEDS: Seed[] = [
  ["AR-FL-001", "Velvet Rose", "Portrait of a Lady", "Floral", 128, PRODUCT_IMAGES.velvetRose.src],
  ["AR-WD-002", "Blush Oud", "Oud Satin Mood", "Woody", 165, PRODUCT_IMAGES.blushOud.src],
  ["AR-AM-003", "Ambre Lumière", "Ambre Nuit", "Amber", 142, PRODUCT_IMAGES.ambreLumiere.src],
  ["AR-AM-004", "Golden Hour", "Baccarat Rouge 540", "Amber", 155, PRODUCT_IMAGES.goldenHour.src],
  ["AR-WD-005", "Cedar Smoke", "Tam Dao", "Woody", 138, PRODUCT_IMAGES.cedarSmoke.src],
  ["AR-FR-006", "Pale Drift", null, "Fresh", 118, PRODUCT_IMAGES.paleDrift.src],
  ["AR-FR-007", "Citrus Veil", "Neroli Portofino", "Fresh", 112, PRODUCT_IMAGES.citrusVeil.src],
  ["AR-FR-008", "Salt Air", "Wood Sage & Sea Salt", "Fresh", 110, PRODUCT_IMAGES.saltAir.src, false],
  ["AR-SG-009", "Nocturne", "Black Opium", "Signature", 150, PRODUCT_IMAGES.nocturne.src],
  ["AR-FL-010", "Fleur Blanche", "Gypsy Water", "Floral", 132, PRODUCT_IMAGES.fleurBlanche.src],
  ["AR-WD-011", "Resin Noir", null, "Woody", 170, PRODUCT_IMAGES.resinNoir.src, false],
  ["AR-SG-012", "Lumen Suede", "Tuscan Leather", "Signature", 148, PRODUCT_IMAGES.lumenSuede.src],
];

function seed(): AdminProduct[] {
  const base = Date.parse("2026-06-01T10:00:00Z");
  const day = 86_400_000;
  return SEEDS.map(([code, name, inspiredBy, collection, price, image, active = true], i) => {
    // Seed products start in the one collection named above; the id has to
    // match the collection store's deterministic seed ids.
    const ids = COLLECTION_SEED_NAMES.includes(collection) ? [collectionSeedId(collection)] : [];
    return {
    id: `8f3c1a2e-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    product_code: code,
    name,
    inspired_by: inspiredBy,
    description: `${name} — an extrait de parfum from the ${collection} collection.`,
    price,
    currency: "CAD",
    size_options: i % 3 === 0 ? ["10 ml", "50 ml", "100 ml"] : ["30 ml", "50 ml"],
    collection_ids: ids,
    collection_names: ids.length ? [collection] : [],
    image_url: image,
    is_active: active,
    created_at: new Date(base + i * day).toISOString(),
    updated_at: new Date(base + i * day * 3).toISOString(),
    };
  });
}

const store = globalThis as typeof globalThis & { __aromaAdminProducts?: AdminProduct[] };
const products = () => (store.__aromaAdminProducts ??= seed());

export async function listProducts(): Promise<AdminProduct[]> {
  // Newest first by creation, so rows don't jump around when toggled or edited.
  return [...products()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  return products().find((p) => p.id === id) ?? null;
}

export async function isProductCodeTaken(code: string, exceptId?: string) {
  const needle = code.toLowerCase();
  return products().some((p) => p.product_code.toLowerCase() === needle && p.id !== exceptId);
}

export async function createProduct(input: AdminProductInput): Promise<AdminProduct> {
  const now = new Date().toISOString();
  const product: AdminProduct = {
    ...input,
    collection_names: namesFor(input.collection_ids),
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  products().push(product);
  return product;
}

export async function updateProduct(id: string, input: AdminProductInput): Promise<AdminProduct | null> {
  const list = products();
  const i = list.findIndex((p) => p.id === id);
  if (i === -1) return null;
  list[i] = {
    ...list[i],
    ...input,
    collection_names: namesFor(input.collection_ids),
    updated_at: new Date().toISOString(),
  };
  return list[i];
}

export async function setProductActive(id: string, isActive: boolean): Promise<AdminProduct | null> {
  const product = products().find((p) => p.id === id);
  if (!product) return null;
  Object.assign(product, { is_active: isActive, updated_at: new Date().toISOString() });
  return product;
}

/** Resolve collection ids to names for display, dropping any that vanished. */
function namesFor(ids: string[]): string[] {
  const byId = new Map(peekCollections().map((c) => [c.id, c.name]));
  return ids.map((id) => byId.get(id)).filter((n): n is string => n !== undefined);
}

/**
 * Make `productIds` exactly the members of `collectionId`. Products dropped
 * from the list keep their other collections -- membership is many-to-many.
 */
export async function setCollectionMembers(collectionId: string, productIds: string[]) {
  const wanted = new Set(productIds);
  const now = new Date().toISOString();

  for (const p of products()) {
    const has = p.collection_ids.includes(collectionId);
    if (wanted.has(p.id) === has) continue;

    const ids = wanted.has(p.id)
      ? [...p.collection_ids, collectionId]
      : p.collection_ids.filter((id) => id !== collectionId);

    Object.assign(p, { collection_ids: ids, collection_names: namesFor(ids), updated_at: now });
  }
}
