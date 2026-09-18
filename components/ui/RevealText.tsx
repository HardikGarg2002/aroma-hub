import { cn } from "@/lib/cn";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface RevealTextProps {
  children: string;
  as?: Tag;
  className?: string;
  /** Seconds before the first word starts moving. */
  delay?: number;
  /** Seconds between each word. */
  stagger?: number;
  /** Split on words (default) or on whole lines separated by newlines. */
  split?: "word" | "line";
}

/**
 * Masked reveal for display type: each word sits in an overflow-hidden span
 * and slides up from below the baseline.
 *
 * CSS-driven (`.reveal-word` in globals.css) and triggered by the inline
 * reveal script, so the text is readable before — and without — hydration.
 *
 * The full string is also rendered once, visually hidden, so screen readers
 * and crawlers get one continuous sentence rather than a list of fragments.
 */
export function RevealText({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  stagger = 0.055,
  split = "word",
}: RevealTextProps) {
  const parts =
    split === "line"
      ? children.split("\n")
      : children.split(/(\s+)/).filter((part) => part.trim());

  return (
    <Tag data-reveal className={cn(split === "line" && "flex flex-col", className)}>
      <span className="sr-only">{children.replace(/\n/g, " ")}</span>

      {parts.map((part, i) => (
        <span
          key={`${part}-${i}`}
          aria-hidden
          className={cn(
            "reveal-mask reveal-word",
            split === "line" ? "block" : "inline-block",
          )}
          // Words need a trailing space; lines are their own block.
          style={split === "word" ? { marginRight: "0.26em" } : undefined}
        >
          <span
            className="will-change-transform"
            style={{ "--d": `${delay + i * stagger}s` } as React.CSSProperties}
          >
            {part}
          </span>
        </span>
      ))}
    </Tag>
  );
}
