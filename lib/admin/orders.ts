import type { AdminOrder, AdminOrderItem, OrderStatus, PaymentStatus } from "@/types/admin";
import { listProducts } from "./products";

/**
 * Mock order store — same contract as lib/admin/products.ts: in memory,
 * survives hot reloads, resets on server restart. Replace with DB queries.
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

/** Rough combined sales tax by province, enough for believable mock totals. */
const TAX_RATE: Record<string, number> = { ON: 0.13, QC: 0.14975, BC: 0.12, AB: 0.05, NS: 0.15, MB: 0.12 };

// Status/payment pairs that make sense together, most recent orders first.
const STATES: [OrderStatus, PaymentStatus][] = [
  ["pending", "unpaid"], ["pending", "paid"], ["processing", "paid"], ["processing", "paid"],
  ["shipped", "paid"], ["shipped", "paid"], ["delivered", "paid"], ["delivered", "paid"],
  ["cancelled", "refunded"], ["delivered", "paid"],
];

/** Deterministic PRNG so every server start produces the same sample orders. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

async function seed(): Promise<AdminOrder[]> {
  const catalogue = await listProducts();
  const rand = rng(42);
  const now = Date.parse("2026-09-18T15:00:00Z");
  const orders: AdminOrder[] = [];

  for (let i = 0; i < 24; i++) {
    const [name, city, province, postal, line1] = CUSTOMERS[i % CUSTOMERS.length];
    const [status, payment_status] = STATES[i % STATES.length];

    const items: AdminOrderItem[] = [];
    const lineCount = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < lineCount; j++) {
      const p = catalogue[Math.floor(rand() * catalogue.length)];
      if (items.some((it) => it.product_id === p.id)) continue;
      items.push({
        product_id: p.id,
        product_code: p.product_code,
        name: p.name,
        size: p.size_options[Math.floor(rand() * p.size_options.length)],
        image_url: p.image_url,
        unit_price: p.price,
        quantity: 1 + Math.floor(rand() * 2),
      });
    }

    const subtotal = round(items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0));
    const discount = i % 5 === 3 ? round(subtotal * 0.1) : 0;
    const shipping = subtotal - discount >= 150 ? 0 : 12;
    const tax = round((subtotal - discount + shipping) * (TAX_RATE[province] ?? 0.13));
    const created = now - i * 86_400_000 * 1.6 - Math.floor(rand() * 36e5 * 8);

    orders.push({
      id: `0dde7000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      order_number: `AR-${1060 - i}`,
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
      currency: "CAD",
      notes: i % 6 === 1 ? "Gift wrap, please — it's a birthday present." : null,
      created_at: new Date(created).toISOString(),
      updated_at: new Date(created + 36e5 * (i % 4)).toISOString(),
    });
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
