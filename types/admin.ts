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
  /**
   * Collections this product belongs to, via the product_collections join
   * table. A product can be in several at once (e.g. "Amber" and
   * "Holiday Edit"), or none.
   */
  collection_ids: string[];
  /** Names for the ids above, in the same order. Read-only; for display. */
  collection_names: string[];
  image_url: string | null;
  is_active: boolean;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}

/**
 * Fields an admin can edit; id and timestamps are server-managed, and
 * collection_names is derived from collection_ids on read.
 */
export type AdminProductInput = Omit<
  AdminProduct,
  "id" | "created_at" | "updated_at" | "collection_names"
>;

/**
 * Product collection. Membership lives in the product_collections join table,
 * so a product can belong to several collections at once.
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
  /** Coupon redeemed on this order, if any. */
  coupon_code: string | null;
  /** How it was paid, e.g. "paypal"; null for orders not placed via checkout. */
  payment_provider: string | null;
  /** The provider's id for the payment (the PayPal order id). Unique. */
  payment_reference: string | null;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}

/** What checkout hands the order store; ids, number and timestamps are generated. */
export type NewOrder = Omit<AdminOrder, "id" | "order_number" | "created_at" | "updated_at">;

/**
 * Flat-amount discount code. Applies once per order when the cart subtotal
 * (before shipping and tax) is at least `min_cart_value`.
 */
export interface AdminCoupon {
  id: string;
  /** Uppercase, unique; what the customer types. */
  code: string;
  /** Internal note, e.g. which campaign it's for. */
  description: string | null;
  /** Amount taken off the subtotal, in `currency`. */
  discount_amount: number;
  /** Subtotal required before the coupon applies; 0 means no minimum. */
  min_cart_value: number;
  currency: string;
  is_active: boolean;
  /** ISO-8601 */
  created_at: string;
  /** ISO-8601 */
  updated_at: string;
}

export type AdminCouponInput = Omit<AdminCoupon, "id" | "created_at" | "updated_at">;
