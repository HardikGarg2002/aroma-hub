import { SITE_IMAGES } from "@/lib/images";
import type { FamilyMeta, OlfactiveFamily } from "@/types/product";

/** The four olfactive families the notes explorer cycles through. */
export const FAMILIES: FamilyMeta[] = [
  {
    id: "floral",
    name: "Floral",
    blurb:
      "Petals at the moment they open. Rose, tuberose and iris — powdery rather than sweet, worn close to the skin.",
    ingredients: ["Damask Rose", "Tuberose", "Orris Butter", "Peony", "Jasmine Sambac", "Violet Leaf"],
    image: SITE_IMAGES.familyFloral,
    tint: "var(--color-floral)",
  },
  {
    id: "woody",
    name: "Woody",
    blurb:
      "Dry bark, cold smoke and resin. Cedar and vetiver give structure; oud and leather give it weight.",
    ingredients: ["Virginia Cedar", "Haitian Vetiver", "Oud", "Sandalwood", "Guaiac Wood", "Birch Tar"],
    image: SITE_IMAGES.familyWoody,
    tint: "var(--color-woody)",
  },
  {
    id: "amber",
    name: "Amber",
    blurb:
      "The warm end of the spectrum. Balsams, tonka and vanilla that hold onto heat and radiate for hours.",
    ingredients: ["Amber Resin", "Tonka Bean", "Benzoin", "Labdanum", "Myrrh", "Vanilla Absolute"],
    image: SITE_IMAGES.familyAmber,
    tint: "var(--color-amber)",
  },
  {
    id: "fresh",
    name: "Fresh",
    blurb:
      "Air, salt and citrus peel. Bright at first spray, then mineral and green as it settles.",
    ingredients: ["Calabrian Bergamot", "Sea Salt", "Neroli", "Wild Mint", "Petitgrain", "Grapefruit"],
    image: SITE_IMAGES.familyFresh,
    tint: "var(--color-fresh)",
  },
];

export const getFamily = (id: OlfactiveFamily): FamilyMeta =>
  FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];

/** Words for the marquee ticker — deliberately longer than the family lists. */
export const MARQUEE_NOTES = [
  "Bergamot",
  "Oud",
  "Tuberose",
  "Vetiver",
  "Amber Resin",
  "Sea Salt",
  "Orris",
  "Birch Tar",
  "Tonka Bean",
  "Neroli",
  "Labdanum",
  "Cashmere Wood",
  "Saffron",
  "Fig Leaf",
  "Incense",
] as const;

/** The three movements of the scroll-scrubbed scent story. */
export const STORY_CHAPTERS = [
  {
    id: "top",
    index: "01",
    label: "Top Notes",
    title: "The first minute",
    body:
      "What you meet on the first spray. Citrus peel, green stems, a flash of pepper — volatile, bright, and gone within fifteen minutes.",
    notes: ["Bergamot", "Green Mandarin", "Pink Pepper"],
    image: SITE_IMAGES.storyTop,
    tint: "var(--color-fresh)",
  },
  {
    id: "heart",
    index: "02",
    label: "Heart Notes",
    title: "The next four hours",
    body:
      "The body of the fragrance. Florals and spices unfold as the top notes burn off, and this is what people actually remember.",
    notes: ["Turkish Rose", "Orris", "Saffron"],
    image: SITE_IMAGES.storyHeart,
    tint: "var(--color-floral)",
  },
  {
    id: "base",
    index: "03",
    label: "Base Notes",
    title: "What stays behind",
    body:
      "Heavy molecules that cling to skin and fabric. Resins, woods and musks — the part still faintly there the following morning.",
    notes: ["Sandalwood", "Amber", "Vetiver"],
    image: SITE_IMAGES.storyBase,
    tint: "var(--color-amber)",
  },
] as const;
