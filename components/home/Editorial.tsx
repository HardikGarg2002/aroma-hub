import Link from "next/link";
import { JOURNAL } from "@/lib/journal";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ParallaxImage } from "@/components/ui/ParallaxImage";

/** Each entry drifts at a slightly different rate, so the row breathes. */
const STRENGTHS = [0.1, 0.18, 0.13];
const OFFSETS = ["", "md:mt-14", "md:mt-4"];

export function Editorial() {
  return (
    <section className="shell py-24 md:py-32 lg:py-40">
      <SectionHeading
        label="The Journal"
        title="Notes on wearing fragrance well"
        intro="Long-form pieces from our perfumers — technique, craft and the occasional myth taken apart."
        action={
          <Link
            href="/journal"
            className="group inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em]"
          >
            All entries
            <span className="block h-px w-8 bg-ink transition-all duration-500 group-hover:w-14 group-hover:bg-accent" />
          </Link>
        }
      />

      <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-3 lg:mt-20">
        {JOURNAL.map((entry, i) => (
          <FadeIn
            key={entry.id}
            as="article"
            delay={i * 0.1}
            y={36}
            className={OFFSETS[i % OFFSETS.length]}
          >
            <Link href={`/journal/${entry.slug}`} className="group block">
              <ParallaxImage
                src={entry.image}
                alt={entry.title}
                className="aspect-[4/3] w-full rounded-[2px]"
                sizes="(max-width: 768px) 92vw, 31vw"
                strength={STRENGTHS[i % STRENGTHS.length]}
                imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />

              <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
                <span>{entry.category}</span>
                <span aria-hidden className="h-px w-5 bg-line" />
                <span>{entry.readTime} read</span>
              </div>

              <h3 className="mt-4 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] leading-tight">
                <span className="relative inline">
                  {entry.title}
                  {/* Accent rule that draws in under the title on hover */}
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                </span>
              </h3>

              <p className="mt-4 text-[14px] leading-relaxed text-muted">
                {entry.excerpt}
              </p>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
