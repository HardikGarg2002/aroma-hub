"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SeriesPoint } from "@/lib/admin/analytics";
import { formatMoney } from "@/lib/admin/format";

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 52 };
/** Used until the container is measured (and for the server render). */
const DEFAULT_WIDTH = 720;

/** A "nice" axis maximum and step: 1, 2, 2.5 or 5 × 10^n, about 4 ticks. */
function niceScale(max: number) {
  if (max <= 0) return { top: 100, step: 25 };
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { top: Math.ceil(max / step) * step, step };
}

const compact = (n: number, currency: string) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(n);

/**
 * Single-series column chart of sales per bucket. One colour (the series is
 * named by the card title, so no legend), 4px rounded caps on a shared
 * baseline, recessive hairline grid. Hover or arrow keys show a tooltip.
 */
export function SalesChart({
  series,
  currency,
  granularity,
}: {
  series: SeriesPoint[];
  currency: string;
  granularity: "hour" | "day" | "week";
}) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();

  // Draw at the container's real pixel width, so axis text stays 11px on a
  // phone instead of scaling down with the whole SVG.
  const frameRef = useRef<HTMLDivElement>(null);
  const [WIDTH, setWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { top, step } = useMemo(() => niceScale(Math.max(...series.map((p) => p.sales), 0)), [series]);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / Math.max(series.length, 1);
  const barW = Math.min(24, Math.max(2, band * 0.72));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  // Roughly one x-axis label per 110px, however many columns there are.
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(plotW / 110))));

  const point = active !== null ? series[active] : null;

  return (
    <div>
      <div
        ref={frameRef}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        tabIndex={0}
        role="group"
        aria-label={`Sales per ${granularity}. Use left and right arrow keys to read values.`}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          setActive((i) => Math.min(series.length - 1, Math.max(0, (i ?? (dir > 0 ? -1 : series.length)) + dir)));
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" aria-hidden>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {compact(t, currency)}
              </text>
            </g>
          ))}

          {series.map((p, i) => {
            const x = PAD.left + i * band + (band - barW) / 2;
            const h = Math.max(0, y(0) - y(p.sales));
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={p.key}>
                {h > 0 && (
                  // Rounded data-end, square at the baseline.
                  <path
                    d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`}
                    className={active === null || active === i ? "fill-chart" : "fill-chart/35"}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[11px]">
                    {p.label}
                  </text>
                )}
                {/* Hit target: the whole column band, not just the painted bar. */}
                <rect
                  x={PAD.left + i * band}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                />
              </g>
            );
          })}
        </svg>

        {point && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-md border border-line bg-paper px-3 py-2 text-xs shadow-card"
            style={{ left: `${((PAD.left + active * band + band / 2) / WIDTH) * 100}%` }}
          >
            <p className="text-base font-semibold">{formatMoney(point.sales, currency)}</p>
            <p className="text-muted">
              {point.orders} {point.orders === 1 ? "order" : "orders"} · {point.title}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-ink">View as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-line">
          <table id={tableId} className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-bone text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{granularity === "hour" ? "Hour" : granularity === "week" ? "Week of" : "Date"}</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {series.map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-1.5">{p.title}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(p.sales, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
