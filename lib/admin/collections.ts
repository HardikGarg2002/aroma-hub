import { PRODUCT_IMAGES } from "@/lib/images";
import type { AdminCollection, AdminCollectionInput } from "@/types/admin";

/**
 * Mock collection store — same contract as lib/admin/products.ts: in memory,
 * survives hot reloads, resets on server restart. Replace with DB queries.
 */

type Seed = [name: string, description: string, image: string, active?: boolean];

const SEEDS: Seed[] = [
  ["Floral", "Rose, peony and white flowers — soft to opulent.", PRODUCT_IMAGES.velvetRose.src],
  ["Woody", "Cedar, oud and smoke for warmth and depth.", PRODUCT_IMAGES.cedarSmoke.src],
  ["Amber", "Resins, vanilla and tonka — rich and enveloping.", PRODUCT_IMAGES.ambreLumiere.src],
  ["Fresh", "Citrus, sea salt and green notes.", PRODUCT_IMAGES.citrusVeil.src],
  ["Signature", "The house's defining compositions.", PRODUCT_IMAGES.nocturne.src],
  ["Holiday Edit", "Seasonal gift selection.", PRODUCT_IMAGES.goldenHour.src, false],
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function seed(): AdminCollection[] {
  const base = Date.parse("2026-05-20T10:00:00Z");
  const day = 86_400_000;
  return SEEDS.map(([name, description, image, active = true], i) => ({
    id: `c011ec70-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    name,
    slug: slugify(name),
    description,
    image_url: image,
    is_active: active,
    created_at: new Date(base + i * day).toISOString(),
    updated_at: new Date(base + i * day * 2).toISOString(),
  }));
}

const store = globalThis as typeof globalThis & { __aromaAdminCollections?: AdminCollection[] };
const collections = () => (store.__aromaAdminCollections ??= seed());

export async function listCollections(): Promise<AdminCollection[]> {
  return [...collections()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCollection(id: string): Promise<AdminCollection | null> {
  return collections().find((c) => c.id === id) ?? null;
}

/** Returns which unique field clashes with another collection, if any. */
export async function findCollectionConflict(input: Pick<AdminCollection, "name" | "slug">, exceptId?: string) {
  const others = collections().filter((c) => c.id !== exceptId);
  if (others.some((c) => c.name.toLowerCase() === input.name.toLowerCase())) return "name" as const;
  if (others.some((c) => c.slug === input.slug)) return "slug" as const;
  return null;
}

export async function createCollection(input: AdminCollectionInput): Promise<AdminCollection> {
  const now = new Date().toISOString();
  const collection: AdminCollection = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
  collections().push(collection);
  return collection;
}

export async function updateCollection(id: string, input: AdminCollectionInput): Promise<AdminCollection | null> {
  const list = collections();
  const i = list.findIndex((c) => c.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...input, updated_at: new Date().toISOString() };
  return list[i];
}

export async function setCollectionActive(id: string, isActive: boolean): Promise<AdminCollection | null> {
  const collection = collections().find((c) => c.id === id);
  if (!collection) return null;
  Object.assign(collection, { is_active: isActive, updated_at: new Date().toISOString() });
  return collection;
}
