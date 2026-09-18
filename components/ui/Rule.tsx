import { cn } from "@/lib/cn";

/**
 * A hairline divider that draws itself in from one edge when scrolled to.
 * CSS-driven via `.reveal-rule`; see FadeIn for why this is not a Motion
 * component.
 */
export function Rule({
  className,
  delay = 0,
  origin = "left",
}: {
  className?: string;
  delay?: number;
  origin?: "left" | "center";
}) {
  return (
    <div
      aria-hidden
      data-reveal
      className={cn(
        "reveal-rule h-px w-full bg-line",
        origin === "left" ? "origin-left" : "origin-center",
        className,
      )}
      style={{ "--reveal-delay": `${delay}s` } as React.CSSProperties}
    />
  );
}
