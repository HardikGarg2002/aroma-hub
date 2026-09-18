import { cn } from "@/lib/cn";
import { FadeIn } from "@/components/ui/FadeIn";
import { RevealText } from "@/components/ui/RevealText";
import { Rule } from "@/components/ui/Rule";

interface SectionHeadingProps {
  label: string;
  title: string;
  /** Optional supporting sentence shown beside or under the title. */
  intro?: string;
  className?: string;
  align?: "left" | "center";
  as?: "h2" | "h3";
  /** Trailing slot, e.g. a "view all" link on the right. */
  action?: React.ReactNode;
}

/** Eyebrow + display heading + hairline rule. Used by every section. */
export function SectionHeading({
  label,
  title,
  intro,
  className,
  align = "left",
  as = "h2",
  action,
}: SectionHeadingProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
          align === "center" && "md:flex-col md:items-center md:text-center",
        )}
      >
        <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
          <FadeIn y={12} duration={0.55}>
            <span className="label block">{label}</span>
          </FadeIn>

          <RevealText
            as={as}
            className="mt-4 text-[clamp(2.1rem,5.2vw,4.1rem)] leading-[1.02]"
          >
            {title}
          </RevealText>
        </div>

        {intro ? (
          <FadeIn
            y={16}
            delay={0.12}
            className={cn(
              "max-w-sm text-[15px] leading-relaxed text-muted",
              align === "center" && "mx-auto",
            )}
          >
            <p>{intro}</p>
          </FadeIn>
        ) : null}

        {action ? <FadeIn y={16} delay={0.18}>{action}</FadeIn> : null}
      </div>

      <Rule className="mt-10" delay={0.2} />
    </div>
  );
}
