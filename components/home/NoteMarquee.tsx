import { MARQUEE_NOTES } from "@/lib/notes";
import { Marquee } from "@/components/ui/Marquee";

/**
 * Full-bleed ticker of raw ingredient names. Purely atmospheric — the whole
 * strip is hidden from assistive tech since the same notes appear, in context,
 * in the notes explorer below.
 */
export function NoteMarquee() {
  return (
    <section
      aria-hidden
      className="select-none border-y border-line bg-bone-deep/60 py-6 md:py-9"
    >
      <Marquee speed={-75} repeat={4}>
        {MARQUEE_NOTES.map((note) => (
          <span
            key={note}
            className="flex shrink-0 items-center whitespace-nowrap font-display text-[clamp(1.75rem,4.2vw,3.4rem)] font-light leading-none tracking-[-0.01em]"
          >
            {note}
            <span className="mx-6 text-accent/60 md:mx-10">·</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
