import type { AdminCoupon, AdminCouponInput } from "@/types/admin";

/**
 * Mock coupon store — same contract as the other *.mock.ts stores: in
 * memory, survives hot reloads, resets on server restart.
 */

type Seed = [code: string, off: number, min: number, description: string, active?: boolean];

const SEEDS: Seed[] = [
  ["WELCOME10", 10, 50, "New customer welcome offer"],
  ["AROMA20", 20, 120, "Newsletter subscribers"],
  ["SAVE35", 35, 200, "Higher-basket incentive"],
  ["FREEGIFT15", 15, 0, "Apology / customer service goodwill — no minimum"],
  ["HOLIDAY25", 25, 150, "Holiday campaign — not yet live", false],
  ["SUMMER30", 30, 180, "Summer 2026 campaign — ended", false],
];

function seed(): AdminCoupon[] {
  const base = Date.parse("2026-04-01T10:00:00Z");
  const day = 86_400_000;
  return SEEDS.map(([code, off, min, description, active = true], i) => ({
    id: `c0a90000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    code,
    description,
    discount_amount: off,
    min_cart_value: min,
    currency: "CAD",
    is_active: active,
    created_at: new Date(base + i * day * 9).toISOString(),
    updated_at: new Date(base + i * day * 11).toISOString(),
  }));
}

const store = globalThis as typeof globalThis & { __aromaAdminCoupons?: AdminCoupon[] };
const coupons = () => (store.__aromaAdminCoupons ??= seed());

export async function listCoupons(): Promise<AdminCoupon[]> {
  // Newest first by creation, so rows don't jump around when toggled or edited.
  return [...coupons()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getCoupon(id: string): Promise<AdminCoupon | null> {
  return coupons().find((c) => c.id === id) ?? null;
}

export async function getCouponByCode(code: string): Promise<AdminCoupon | null> {
  return coupons().find((c) => c.code === code) ?? null;
}

export async function isCouponCodeTaken(code: string, exceptId?: string) {
  return coupons().some((c) => c.code === code && c.id !== exceptId);
}

export async function createCoupon(input: AdminCouponInput): Promise<AdminCoupon> {
  const now = new Date().toISOString();
  const coupon: AdminCoupon = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
  coupons().push(coupon);
  return coupon;
}

export async function updateCoupon(id: string, input: AdminCouponInput): Promise<AdminCoupon | null> {
  const list = coupons();
  const i = list.findIndex((c) => c.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...input, updated_at: new Date().toISOString() };
  return list[i];
}

export async function setCouponActive(id: string, isActive: boolean): Promise<AdminCoupon | null> {
  const coupon = coupons().find((c) => c.id === id);
  if (!coupon) return null;
  Object.assign(coupon, { is_active: isActive, updated_at: new Date().toISOString() });
  return coupon;
}
