import type { AdminOrder, OrderStatus } from "@/types/admin";
import { ORDER_STATUSES } from "@/types/admin";

/**
 * Sales analytics over a list of orders. Pure: pass the orders and "now", get
 * numbers back — so it's the same whether orders come from the mock store or
 * Supabase, and trivially testable.
 */

/** Store timezone; matches formatDateTime so day boundaries agree everywhere. */
const TZ = "America/Toronto";
const DAY = 86_400_000;

export const RANGES = {
  today: { label: "Today", days: 1 },
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
} as const;
export type RangeKey = keyof typeof RANGES;
export const DEFAULT_RANGE: RangeKey = "30d";

export const isRangeKey = (v: unknown): v is RangeKey => typeof v === "string" && v in RANGES;

/**
 * An order counts toward sales unless it was cancelled or refunded. Pending
 * and unpaid orders are included: they're demand, even if not yet collected.
 */
export const countsAsSale = (o: AdminOrder) => o.status !== "cancelled" && o.payment_status !== "refunded";

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
/** "YYYY-MM-DD" in store time. */
export const dayKey = (d: Date | string) => dayFormatter.format(new Date(d));

const clockFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** Minutes since midnight, store time. */
const minuteOfDay = (d: Date | string) => {
  const [h, m] = clockFormatter.format(new Date(d)).split(":").map(Number);
  return h * 60 + m;
};

const shortDay = (key: string, withYear = false) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
/** 0 → "12 a.m.", 15 → "3 p.m." */
const hourLabel = (h: number) =>
  new Date(Date.UTC(2000, 0, 1, h)).toLocaleTimeString("en-CA", { hour: "numeric", timeZone: "UTC" });
const keyToUtc = (key: string) => Date.parse(`${key}T00:00:00Z`);
const utcToKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (key: string, n: number) => utcToKey(keyToUtc(key) + n * DAY);

export interface Kpis {
  sales: number;
  orders: number;
  averageOrderValue: number;
  unitsSold: number;
}

export interface SeriesPoint {
  /** Stable key for the bucket. */
  key: string;
  /** Short axis label, e.g. "Sep 5" or "3 p.m.". */
  label: string;
  /** Full label for the tooltip and table, e.g. "Week of Sep 1, 2026". */
  title: string;
  sales: number;
  orders: number;
}

export interface ProductSales {
  product_id: string;
  name: string;
  product_code: string;
  image_url: string | null;
  units: number;
  revenue: number;
  orders: number;
}

export interface Analytics {
  range: RangeKey;
  /** Inclusive bounds of the period, "YYYY-MM-DD"; null when there's no data. */
  from: string | null;
  to: string;
  currency: string;
  kpis: Kpis;
  /** Same KPIs for the comparison period; null for "all". */
  previous: Kpis | null;
  /** What `previous` covers, for the delta caption. */
  comparisonLabel: string;
  granularity: "hour" | "day" | "week";
  series: SeriesPoint[];
  topProducts: ProductSales[];
  statusCounts: { status: OrderStatus; count: number }[];
  /** All orders in the period, including cancelled/refunded. */
  totalOrdersInPeriod: number;
}

function kpis(orders: AdminOrder[]): Kpis {
  const sales = orders.filter(countsAsSale);
  const total = sales.reduce((sum, o) => sum + o.total, 0);
  return {
    sales: round(total),
    orders: sales.length,
    averageOrderValue: sales.length ? round(total / sales.length) : 0,
    unitsSold: sales.reduce((n, o) => n + o.items.reduce((m, it) => m + it.quantity, 0), 0),
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeAnalytics(allOrders: AdminOrder[], range: RangeKey, now = new Date()): Analytics {
  const to = dayKey(now);
  const days = RANGES[range].days;
  const earliest = allOrders.reduce<string | null>((min, o) => {
    const k = dayKey(o.created_at);
    return !min || k < min ? k : min;
  }, null);
  const from = days ? addDays(to, -(days - 1)) : earliest;

  const inPeriod = (o: AdminOrder, a: string | null, b: string) => {
    const k = dayKey(o.created_at);
    return (!a || k >= a) && k <= b;
  };
  const orders = allOrders.filter((o) => inPeriod(o, from, to));

  let previous: Kpis | null = null;
  let comparisonLabel = "vs previous period";
  if (range === "today") {
    // A day in progress vs a whole day would always look like a drop, so
    // compare with yesterday up to the same time of day.
    const yesterday = addDays(to, -1);
    const cutoff = minuteOfDay(now);
    previous = kpis(allOrders.filter((o) => dayKey(o.created_at) === yesterday && minuteOfDay(o.created_at) <= cutoff));
    comparisonLabel = "vs this time yesterday";
  } else if (days) {
    const prevTo = addDays(to, -days);
    const prevFrom = addDays(prevTo, -(days - 1));
    previous = kpis(allOrders.filter((o) => inPeriod(o, prevFrom, prevTo)));
  }

  // Hourly for a single day; daily columns up to ~90 of them; weekly beyond.
  const spanDays = from ? Math.round((keyToUtc(to) - keyToUtc(from)) / DAY) + 1 : 0;
  const granularity: Analytics["granularity"] = spanDays === 1 ? "hour" : spanDays > 92 ? "week" : "day";
  const series: SeriesPoint[] = [];
  const sales = orders.filter(countsAsSale);

  if (granularity === "hour") {
    // Up to the current hour: future hours would read as zero sales.
    const lastHour = Math.floor(minuteOfDay(now) / 60);
    for (let h = 0; h <= lastHour; h++) {
      series.push({ key: `${to}T${h}`, label: hourLabel(h), title: `${hourLabel(h)}, ${shortDay(to, true)}`, sales: 0, orders: 0 });
    }
    for (const o of sales) {
      const point = series[Math.floor(minuteOfDay(o.created_at) / 60)];
      if (point) {
        point.sales = round(point.sales + o.total);
        point.orders += 1;
      }
    }
  } else if (from) {
    const step = granularity === "week" ? 7 : 1;
    const index = new Map<string, SeriesPoint>();
    for (let start = from; start <= to; start = addDays(start, step)) {
      const end = step === 1 ? start : [addDays(start, step - 1), to].sort()[0];
      const point: SeriesPoint = {
        key: start,
        label: shortDay(start),
        title: step === 1 ? shortDay(start, true) : `Week of ${shortDay(start, true)}`,
        sales: 0,
        orders: 0,
      };
      series.push(point);
      for (let d = start; d <= end; d = addDays(d, 1)) index.set(d, point);
    }
    for (const o of sales) {
      const point = index.get(dayKey(o.created_at));
      if (point) {
        point.sales = round(point.sales + o.total);
        point.orders += 1;
      }
    }
  }

  const byProduct = new Map<string, ProductSales>();
  for (const o of orders.filter(countsAsSale)) {
    for (const it of o.items) {
      const row = byProduct.get(it.product_id) ?? {
        product_id: it.product_id,
        name: it.name,
        product_code: it.product_code,
        image_url: it.image_url,
        units: 0,
        revenue: 0,
        orders: 0,
      };
      row.units += it.quantity;
      row.revenue = round(row.revenue + it.unit_price * it.quantity);
      row.orders += 1;
      byProduct.set(it.product_id, row);
    }
  }
  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    range,
    from,
    to,
    currency: orders[0]?.currency ?? allOrders[0]?.currency ?? "CAD",
    kpis: kpis(orders),
    previous,
    comparisonLabel,
    granularity,
    series,
    topProducts,
    statusCounts: ORDER_STATUSES.map((status) => ({ status, count: orders.filter((o) => o.status === status).length })),
    totalOrdersInPeriod: orders.length,
  };
}
