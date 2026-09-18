/** Catalogue product as stored in the admin/DB layer (snake_case mirrors the table). */
export interface AdminProduct {
  id: string;
  product_code: string;
  name: string;
  inspired_by: string | null;
  description: string | null;
  price: number;
  currency: string;
  size_options: string[];
  collection: string | null;
  image_url: string | null;
  is_active: boolean;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}

/** Fields an admin can edit; id and timestamps are server-managed. */
export type AdminProductInput = Omit<AdminProduct, "id" | "created_at" | "updated_at">;

/**
 * Product collection. Membership isn't stored here: a product belongs to the
 * collection whose `name` matches its `collection` field.
 */
export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}

export type AdminCollectionInput = Omit<AdminCollection, "id" | "created_at" | "updated_at">;

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface AdminOrderItem {
  product_id: string;
  /** Snapshotted at checkout, so later product edits don't rewrite history. */
  product_code: string;
  name: string;
  size: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
}

export interface AdminAddress {
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface AdminOrder {
  id: string;
  /** Human-facing reference, e.g. "AR-1042". */
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: AdminAddress;
  items: AdminOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}
