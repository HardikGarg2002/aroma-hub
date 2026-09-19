import type {
  AdminAddress,
  AdminCollection,
  AdminOrder,
  AdminOrderItem,
  AdminProduct,
  OrderStatus,
  PaymentStatus,
} from "./admin";

/**
 * Schema types for the Supabase client, matching
 * supabase/migrations/0001_admin_schema.sql.
 *
 * Derived from the Admin* types so the table shapes and the application types
 * can't drift apart. Note `numeric` columns arrive as strings over PostgREST,
 * which is why money fields widen to `number | string` on read.
 *
 * Regenerate from the live database with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

/** Columns the database fills in itself. */
type Generated = "id" | "created_at" | "updated_at";

type NumericRead<T, K extends keyof T> = Omit<T, K> & { [P in K]: number | string };

/** The `collection` text column is gone; membership lives in product_collections. */
type ProductRow = NumericRead<
  Omit<AdminProduct, "collection_ids" | "collection_names">,
  "price"
>;

interface ProductCollectionRow {
  product_id: string;
  collection_id: string;
  created_at: string;
}
type OrderRow = NumericRead<
  Omit<AdminOrder, "items" | "shipping_address" | "status" | "payment_status">,
  "subtotal" | "shipping" | "tax" | "discount" | "total"
> & {
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: AdminAddress;
  items: AdminOrderItem[];
};

interface Table<Row extends Record<string, unknown>, Insert> {
  Row: Row;
  Insert: Insert & Partial<Pick<Row, Extract<Generated, keyof Row>>>;
  Update: Partial<Insert>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      products: Table<
        ProductRow & Record<string, unknown>,
        Omit<AdminProduct, Generated | "collection_ids" | "collection_names">
      >;
      product_collections: Table<
        ProductCollectionRow & Record<string, unknown>,
        Omit<ProductCollectionRow, "created_at">
      >;
      collections: Table<
        AdminCollection & Record<string, unknown>,
        Omit<AdminCollection, Generated>
      >;
      // order_number has a database default (see 0004_checkout.sql).
      orders: Table<
        OrderRow & Record<string, unknown>,
        Omit<AdminOrder, Generated | "order_number"> & { order_number?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
