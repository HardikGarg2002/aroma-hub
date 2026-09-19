import type { AdminOrder, AdminOrderItem, NewOrder, OrderStatus, PaymentStatus } from "@/types/admin";
// The products facade, not products.mock: with ADMIN_ORDERS_SOURCE=mock and
// products on Supabase, sample orders are made of the real catalogue.
import { listProducts } from "./products";
import { shippingFor, taxRate } from "@/lib/checkout/pricing";

/**
 * Mock order store — same contract as lib/admin/products.ts: in memory,
 * survives hot reloads, resets on server restart. Replace with DB queries.
 *
 * Seeded once, from whatever products exist at that moment; restart the
 * server to regenerate after big catalogue changes.
 */

const CUSTOMERS = [
  ["Olivia Tremblay", "Montréal", "QC", "H2X 1Y4", "4521 Rue Saint-Denis"],
  ["Liam Nguyen", "Toronto", "ON", "M5V 2T6", "88 Blue Jays Way"],
  ["Emma Singh", "Vancouver", "BC", "V6B 1A1", "1025 Granville St"],
  ["Noah Martin", "Calgary", "AB", "T2P 1J9", "300 5 Ave SW"],
  ["Ava Roy", "Ottawa", "ON", "K1P 5G8", "150 Elgin St"],
  ["Lucas Chen", "Halifax", "NS", "B3J 1S9", "1800 Argyle St"],
  ["Sophia Gagnon", "Québec", "QC", "G1R 4P5", "22 Rue du Petit-Champlain"],
  ["Ethan Wilson", "Winnipeg", "MB", "R3C 0V8", "201 Portage Ave"],
  ["Mia Patel", "Edmonton", "AB", "T5J 0N3", "10180 101 St NW"],
  ["Benjamin Côté", "Victoria", "BC", "V8W 1N4", "812 Wharf St"],
] as const;


/** Deterministic PRNG so every server start produces the same sample orders. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
const DAY = 86_400_000;
const ORDER_COUNT = 60;


/** Flat coupons from coupons.mock.ts, best first, so mock discounts look real. */
const COUPON_CODES: Record<number, string> = { 35: "SAVE35", 20: "AROMA20", 10: "WELCOME10" };
const COUPONS: [minimum: number, off: number][] = [
  [200, 35],
  [120, 20],
  [50, 10],
];

/** Newest orders are still in flight; older ones have been delivered. */
function stateFor(i: number): [OrderStatus, PaymentStatus] {
  if (i > 0 && i % 11 === 0) return ["cancelled", "refunded"];
  if (i === 0) return ["pending", "unpaid"];
  if (i < 3) return ["pending", "paid"];
  if (i < 7) return ["processing", "paid"];
  if (i < 14) return ["shipped", "paid"];
  return ["delivered", "paid"];
}

async function seed(): Promise<AdminOrder[]> {
  // Active, purchasable products only, in a stable order so the same
  // products come out as best sellers on every start.
  const catalogue = (await listProducts())
    .filter((p) => p.is_active)
    .sort((a, b) => a.product_code.localeCompare(b.product_code));
  if (catalogue.length === 0) return [];

  const rand = rng(42);
  // A skewed pick (rand²) so a handful of products clearly lead.
  const pickProduct = () => catalogue[Math.floor(rand() ** 2 * catalogue.length)];

  // Dated relative to now, so every dashboard range has data whenever the
  // server starts. Gaps widen further back: busier recently, like a growing store.
  const now = Date.now();
  let created = now - 3 * 36e5;
  const orders: AdminOrder[] = [];

  for (let i = 0; i < ORDER_COUNT; i++) {
    const [name, city, province, postal, line1] = CUSTOMERS[i % CUSTOMERS.length];
    const [status, payment_status] = stateFor(i);

    const items: AdminOrderItem[] = [];
    const lineCount = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < lineCount; j++) {
      const p = pickProduct();
      if (items.some((it) => it.product_id === p.id)) continue;
      items.push({
        product_id: p.id,
        product_code: p.product_code,
        name: p.name,
        size: p.size_options[Math.floor(rand() * p.size_options.length)] ?? "50ml",
        image_url: p.image_url,
        unit_price: p.price,
        quantity: rand() < 0.75 ? 1 : 2,
      });
    }

    const subtotal = round(items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0));
    // About one order in three used the best coupon it qualified for.
    const discount = rand() < 0.33 ? (COUPONS.find(([min]) => subtotal >= min)?.[1] ?? 0) : 0;
    // Same rules as real checkout (lib/checkout/pricing.ts).
    const shipping = shippingFor(subtotal - discount);
    const tax = round((subtotal - discount + shipping) * taxRate(province));

    orders.push({
      id: `0dde7000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      order_number: `AR-${1000 + ORDER_COUNT - i}`,
      status,
      payment_status,
      customer_name: name,
      customer_email: `${name.split(" ")[0].toLowerCase()}.${i + 1}@example.com`,
      customer_phone: i % 3 === 0 ? null : `+1 555 01${String(i).padStart(2, "0")}`,
      shipping_address: { line1, line2: i % 4 === 0 ? `Apt ${100 + i}` : null, city, province, postal_code: postal, country: "Canada" },
      items,
      subtotal,
      shipping,
      tax,
      discount,
      total: round(subtotal - discount + shipping + tax),
      currency: catalogue.find((p) => p.id === items[0].product_id)?.currency ?? "CAD",
      notes: i % 7 === 1 ? "Gift wrap, please — it's a birthday present." : null,
      coupon_code: discount ? (COUPON_CODES[discount] ?? null) : null,
      payment_provider: payment_status === "unpaid" ? null : "paypal",
      payment_reference: null,
      created_at: new Date(created).toISOString(),
      updated_at: new Date(Math.min(now, created + 36e5 * (1 + (i % 5)))).toISOString(),
    });

    // Next (older) order: 0.3–1.5 days back near today, up to ~3 days back later.
    created -= DAY * (0.3 + rand() * (1.2 + i / 30));
  }
  return orders;
}

const store = globalThis as typeof globalThis & { __aromaAdminOrders?: Promise<AdminOrder[]> };
const orders = () => (store.__aromaAdminOrders ??= seed());

export async function listOrders(): Promise<AdminOrder[]> {
  return [...(await orders())].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  return (await orders()).find((o) => o.id === id) ?? null;
}

export async function updateOrderStatus(
  id: string,
  patch: { status: OrderStatus; payment_status: PaymentStatus },
): Promise<AdminOrder | null> {
  const order = (await orders()).find((o) => o.id === id);
  if (!order) return null;
  Object.assign(order, patch, { updated_at: new Date().toISOString() });
  return order;
}

export async function createOrder(input: NewOrder): Promise<AdminOrder> {
  const list = await orders();
  const highest = list.reduce((n, o) => Math.max(n, Number(o.order_number.replace(/\D/g, "")) || 0), 1000);
  const now = new Date().toISOString();
  const order: AdminOrder = {
    ...input,
    id: crypto.randomUUID(),
    order_number: `AR-${highest + 1}`,
    created_at: now,
    updated_at: now,
  };
  list.push(order);
  return order;
}

export async function getOrderByPaymentReference(reference: string): Promise<AdminOrder | null> {
  return (await orders()).find((o) => o.payment_reference === reference) ?? null;
}
