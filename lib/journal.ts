import { SITE_IMAGES } from "@/lib/images";
import type { JournalEntry } from "@/types/content";

export const JOURNAL: JournalEntry[] = [
  {
    id: "j-1",
    slug: "the-art-of-layering",
    category: "Technique",
    title: "The art of layering two fragrances",
    excerpt:
      "Most layering advice tells you to match families. The more interesting results come from deliberate friction — a salt-air fresh over a dense amber base.",
    readTime: "6 min",
    image: SITE_IMAGES.journalLayering,
  },
  {
    id: "j-2",
    slug: "how-a-scent-is-built",
    category: "Craft",
    title: "How a scent is actually built",
    excerpt:
      "From the first accord on a blotter to the eighteenth revision. A perfumer walks us through eleven months of work on a single base note.",
    readTime: "9 min",
    image: SITE_IMAGES.journalMaking,
  },
  {
    id: "j-3",
    slug: "reading-a-note-pyramid",
    category: "Guide",
    title: "Reading a note pyramid without the marketing",
    excerpt:
      "Top, heart and base are a useful fiction. Here is what those three tiers really tell you about how a fragrance will behave on your skin.",
    readTime: "5 min",
    image: SITE_IMAGES.journalNotes,
  },
];
