import { cn } from "@/lib/cn";

/**
 * KPI tile: label, value, and change vs the previous period. Up is good for
 * every metric on this dashboard, so direction alone picks the colour — and an
 * arrow + sign carry it too, never colour alone.
 */
export function StatTile({
  label,
  value,
  current,
  previous,
  comparisonLabel = "vs previous period",
  hero = false,
}: {
  label: string;
  value: string;
  current: number;
  /** Same metric for the previous period; omit to hide the delta. */
  previous?: number;
  /** What `previous` covers, e.g. "vs this time yesterday". */
  comparisonLabel?: string;
  /** The one number the dashboard leads with. */
  hero?: boolean;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-line bg-paper p-3 sm:p-5", hero && "col-span-3 lg:col-span-1")}>
      <p className="text-xs text-muted sm:text-sm">{label}</p>
      <p className={cn("mt-2 truncate font-sans font-semibold tracking-tight", hero ? "text-5xl" : "text-lg sm:text-3xl")}>{value}</p>
      {previous !== undefined && <Delta current={current} previous={previous} label={comparisonLabel} />}
    </div>
  );
}

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous === 0) {
    return <p className="mt-2 text-xs text-muted">{current === 0 ? "No change" : `New ${label}`}</p>;
  }
  const pct = ((current - previous) / previous) * 100;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          flat ? "text-muted" : up ? "text-emerald-700" : "text-red-700",
        )}
      >
        <span aria-hidden>{flat ? "→" : up ? "▲" : "▼"}</span>
        {flat ? "0%" : `${up ? "+" : "−"}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`}
      </span>
      <span className="hidden text-muted sm:inline">{label}</span>
    </p>
  );
}
