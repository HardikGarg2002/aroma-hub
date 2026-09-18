import { cn } from "@/lib/cn";

/** Shared building blocks for admin edit forms. */

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-line bg-paper p-6">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  as: Tag = "label",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Use "div" when the field wraps several controls. */
  as?: "label" | "div";
  children: React.ReactNode;
}) {
  return (
    <Tag className="block">
      <span className="flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </Tag>
  );
}

export function input(error?: string) {
  return cn(
    "block w-full rounded-md border bg-bone/40 px-3 py-2 text-sm outline-none transition-colors focus:border-ink",
    error ? "border-red-400" : "border-line",
  );
}
