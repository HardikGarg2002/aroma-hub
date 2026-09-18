import { cn } from "@/lib/cn";

interface FadeInProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  /** Travel distance in px. Negative values come down instead of up. */
  y?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "article" | "span";
}

/**
 * "Rise into view once" wrapper.
 *
 * CSS-driven (see `.reveal-rise` in globals.css) and triggered by the inline
 * reveal script, so the content is present and visible even if the JS bundle
 * is slow or never arrives. No hooks, so this stays a server component and
 * ships no client JS of its own.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 28,
  duration = 0.7,
  as: Tag = "div",
}: FadeInProps) {
  return (
    <Tag
      data-reveal
      className={cn("reveal-rise", className)}
      style={
        {
          "--reveal-y": `${y}px`,
          "--reveal-delay": `${delay}s`,
          "--reveal-dur": `${duration}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
