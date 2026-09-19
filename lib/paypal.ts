import "server-only";

/**
 * PayPal Orders v2, behind a small gateway interface with two backends:
 *
 * - "sandbox" / "live": the real REST API. Needs PAYPAL_CLIENT_ID and
 *   PAYPAL_CLIENT_SECRET (PAYPAL_ENV picks sandbox or live; default sandbox).
 * - "mock": an in-memory stand-in used when no credentials are set, so the
 *   whole checkout can be exercised locally. Buyer approval is simulated.
 *   Never used in a production build — there, missing keys mean "disabled".
 */

export type PayPalMode = "sandbox" | "live" | "mock" | "disabled";

export function paypalMode(): PayPalMode {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (id && secret) return process.env.PAYPAL_ENV?.trim().toLowerCase() === "live" ? "live" : "sandbox";
  return process.env.NODE_ENV === "production" ? "disabled" : "mock";
}

/** Public client id for the JS SDK (only meaningful for sandbox/live). */
export const paypalClientId = () => process.env.PAYPAL_CLIENT_ID?.trim() ?? "";

export interface Money {
  currency_code: string;
  value: string;
}

export interface PayPalOrderRequest {
  /** Our reference, echoed back by PayPal. */
  reference: string;
  currency: string;
  items: { name: string; sku: string; quantity: number; unit_price: number }[];
  item_total: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  ship_to: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
  };
}

export interface PayPalOrderState {
  id: string;
  /** CREATED, APPROVED, COMPLETED, … */
  status: string;
  amount: Money | null;
}

export interface PayPalCapture {
  /** Status of the order after capture — COMPLETED on success. */
  status: string;
  capture_id: string | null;
  amount: Money | null;
}

/** A PayPal failure; `message` is safe to show the customer. */
export class PayPalError extends Error {}

const money = (value: number, currency: string): Money => ({ currency_code: currency, value: value.toFixed(2) });

/* ------------------------------------------------------------------ REST */

const API_BASE = { sandbox: "https://api-m.sandbox.paypal.com", live: "https://api-m.paypal.com" } as const;

let token: { value: string; expires: number } | undefined;

async function accessToken(base: string) {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const auth = Buffer.from(`${paypalClientId()}:${process.env.PAYPAL_CLIENT_SECRET!.trim()}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("PayPal auth failed", res.status, await res.text());
    throw new PayPalError("Payments are unavailable right now. Please try again shortly.");
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return token.value;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, requestId?: string): Promise<T> {
  const mode = paypalMode();
  if (mode !== "sandbox" && mode !== "live") throw new PayPalError("PayPal isn't configured.");
  const base = API_BASE[mode];
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken(base)}`,
      "Content-Type": "application/json",
      // Makes retries of the same create/capture safe on PayPal's side.
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as T & { name?: string; details?: { issue?: string }[] };
  if (!res.ok) {
    console.error(`PayPal ${method} ${path} failed`, res.status, JSON.stringify(data));
    const issue = data?.details?.[0]?.issue;
    if (issue === "INSTRUMENT_DECLINED") throw new PayPalError("Your payment method was declined. Please try another.");
    if (issue === "ORDER_ALREADY_CAPTURED") throw new PayPalError("This payment was already completed.");
    throw new PayPalError("PayPal couldn't process the payment. Please try again.");
  }
  return data;
}

type RestOrder = {
  id: string;
  status: string;
  purchase_units?: {
    amount?: Money;
    payments?: { captures?: { id: string; status: string; amount: Money }[] };
  }[];
};

const rest = {
  async create(req: PayPalOrderRequest): Promise<{ id: string }> {
    const c = req.currency;
    const order = await call<RestOrder>(
      "POST",
      "/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: req.reference,
            custom_id: req.reference,
            amount: {
              ...money(req.total, c),
              breakdown: {
                item_total: money(req.item_total, c),
                shipping: money(req.shipping, c),
                tax_total: money(req.tax, c),
                discount: money(req.discount, c),
              },
            },
            items: req.items.map((it) => ({
              name: it.name.slice(0, 127),
              sku: it.sku.slice(0, 127),
              quantity: String(it.quantity),
              unit_amount: money(it.unit_price, c),
              category: "PHYSICAL_GOODS",
            })),
            shipping: {
              name: { full_name: req.ship_to.name.slice(0, 300) },
              address: {
                address_line_1: req.ship_to.line1,
                ...(req.ship_to.line2 ? { address_line_2: req.ship_to.line2 } : {}),
                admin_area_2: req.ship_to.city,
                admin_area_1: req.ship_to.province,
                postal_code: req.ship_to.postal_code,
                country_code: req.ship_to.country_code,
              },
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "AROMA",
              // Ship to the address entered on our checkout, not one picked in PayPal.
              shipping_preference: "SET_PROVIDED_ADDRESS",
              user_action: "PAY_NOW",
            },
          },
        },
      },
      req.reference,
    );
    return { id: order.id };
  },

  async get(id: string): Promise<PayPalOrderState> {
    const order = await call<RestOrder>("GET", `/v2/checkout/orders/${encodeURIComponent(id)}`);
    return { id: order.id, status: order.status, amount: order.purchase_units?.[0]?.amount ?? null };
  },

  async capture(id: string): Promise<PayPalCapture> {
    const order = await call<RestOrder>("POST", `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, `capture-${id}`);
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    return { status: order.status, capture_id: capture?.id ?? null, amount: capture?.amount ?? null };
  },
};

/* ------------------------------------------------------------------ mock */

const mockStore = globalThis as typeof globalThis & { __aromaMockPayPal?: Map<string, PayPalOrderState> };
const mockOrders = () => (mockStore.__aromaMockPayPal ??= new Map());

const mock = {
  async create(req: PayPalOrderRequest): Promise<{ id: string }> {
    const id = `MOCK-${crypto.randomUUID().slice(0, 13).toUpperCase()}`;
    // Created already APPROVED: stands in for the buyer approving in PayPal.
    mockOrders().set(id, { id, status: "APPROVED", amount: money(req.total, req.currency) });
    return { id };
  },
  async get(id: string): Promise<PayPalOrderState> {
    const order = mockOrders().get(id);
    if (!order) throw new PayPalError("Payment not found.");
    return { ...order };
  },
  async capture(id: string): Promise<PayPalCapture> {
    const order = mockOrders().get(id);
    if (!order) throw new PayPalError("Payment not found.");
    if (order.status === "COMPLETED") throw new PayPalError("This payment was already completed.");
    order.status = "COMPLETED";
    return { status: "COMPLETED", capture_id: `${id}-CAPTURE`, amount: order.amount };
  },
};

/* ---------------------------------------------------------------- facade */

function gateway() {
  const mode = paypalMode();
  if (mode === "mock") return mock;
  if (mode === "disabled") throw new PayPalError("Online payments aren't set up yet.");
  return rest;
}

export const createPayPalOrder = (req: PayPalOrderRequest) => gateway().create(req);
export const getPayPalOrder = (id: string) => gateway().get(id);
export const capturePayPalOrder = (id: string) => gateway().capture(id);
