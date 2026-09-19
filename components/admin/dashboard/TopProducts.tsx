import Link from "next/link";
import type { ProductSales } from "@/lib/admin/analytics";
import { formatMoney } from "@/lib/admin/format";
import { ProductThumb } from "@/components/admin/ProductThumb";

/**
 * Best sellers by units, as a ranked horizontal bar list. One series, one
 * colour; the value sits at the bar's tip and the full breakdown is in each
 * row's hover/focus tooltip, so nothing depends on hovering.
 */
export function TopProducts({ products, currency }: { products: ProductSales[]; currency: string }) {
  const max = Math.max(...products.map((p) => p.units), 1);

  return (
    <ol className="space-y-3">
      {products.map((p, i) => (
        <li key={p.product_id} className="group relative flex items-center gap-3">
          <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
          <ProductThumb src={p.image_url} alt="" size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/admin/products/${p.product_id}`}
                className="truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {p.name}
              </Link>
              <span className="shrink-0 text-xs text-muted tabular-nums">{formatMoney(p.revenue, currency)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1">
                <div
                  className="h-full rounded-r-[4px] bg-chart transition-opacity group-hover:opacity-80"
                  style={{ width: `${(p.units / max) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
                {p.units} {p.units === 1 ? "unit" : "units"}
              </span>
            </div>
          </div>

          <div
            role="tooltip"
            className="pointer-events-none invisible absolute -top-2 right-0 z-10 -translate-y-full rounded-md border border-line bg-paper px-3 py-2 text-xs opacity-0 shadow-card transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <p className="text-base font-semibold">{p.units} units</p>
            <p className="text-muted">
              {formatMoney(p.revenue, currency)} · {p.orders} {p.orders === 1 ? "order" : "orders"} ·{" "}
              <span className="font-mono">{p.product_code}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
