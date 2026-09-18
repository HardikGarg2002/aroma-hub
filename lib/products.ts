import { PRODUCT_IMAGES } from "@/lib/images";
import type { OlfactiveFamily, Product } from "@/types/product";

/**
 * Mock catalogue. Selectors below are the only thing components import, so
 * swapping this module for API/DB calls later is a single-file change.
 */
export const PRODUCTS: Product[] = [
  {
    id: "p-01",
    slug: "velvet-rose",
    name: "Velvet Rose",
    tagline: "Damask Rose · Peony · Musk",
    family: "floral",
    price: 128,
    size: "50 ml",
    image: PRODUCT_IMAGES.velvetRose.src,
    hoverImage: PRODUCT_IMAGES.velvetRose.hover,
    notes: {
      top: ["Damask Rose", "Lychee", "Pink Pepper"],
      heart: ["Peony", "Magnolia", "Violet Leaf"],
      base: ["White Musk", "Cashmere Wood"],
    },
    badge: "bestseller",
    rating: 4.8,
    reviews: 412,
    description: "A rose stripped of sweetness — powdery, cool and quietly persistent.",
  },
  {
    id: "p-02",
    slug: "blush-oud",
    name: "Blush Oud",
    tagline: "Saffron · Rose · Oud",
    family: "woody",
    price: 165,
    compareAt: 190,
    size: "50 ml",
    image: PRODUCT_IMAGES.blushOud.src,
    hoverImage: PRODUCT_IMAGES.blushOud.hover,
    notes: {
      top: ["Saffron", "Raspberry"],
      heart: ["Turkish Rose", "Orris"],
      base: ["Oud", "Patchouli", "Amberwood"],
    },
    badge: "limited",
    rating: 4.9,
    reviews: 288,
    description: "Saffron laid over resinous oud — dense, warm, faintly medicinal.",
  },
  {
    id: "p-03",
    slug: "ambre-lumiere",
    name: "Ambre Lumière",
    tagline: "Amber · Tonka · Vanilla",
    family: "amber",
    price: 142,
    size: "50 ml",
    image: PRODUCT_IMAGES.ambreLumiere.src,
    hoverImage: PRODUCT_IMAGES.ambreLumiere.hover,
    notes: {
      top: ["Bergamot", "Cardamom"],
      heart: ["Amber Resin", "Orange Blossom"],
      base: ["Tonka Bean", "Madagascan Vanilla", "Benzoin"],
    },
    badge: "bestseller",
    rating: 4.9,
    reviews: 631,
    description: "Golden, skin-close amber that keeps radiating hours after it dries.",
  },
  {
    id: "p-04",
    slug: "golden-hour",
    name: "Golden Hour",
    tagline: "Fig · Honey · Sandalwood",
    family: "amber",
    price: 136,
    size: "50 ml",
    image: PRODUCT_IMAGES.goldenHour.src,
    hoverImage: PRODUCT_IMAGES.goldenHour.hover,
    notes: {
      top: ["Fig Leaf", "Mandarin"],
      heart: ["Acacia Honey", "Immortelle"],
      base: ["Sandalwood", "Tolu Balsam"],
    },
    badge: "new",
    rating: 4.7,
    reviews: 154,
    description: "Sun-warmed fig and honey, softened by a long sandalwood fade.",
  },
  {
    id: "p-05",
    slug: "cedar-smoke",
    name: "Cedar Smoke",
    tagline: "Cedar · Vetiver · Birch Tar",
    family: "woody",
    price: 152,
    size: "50 ml",
    image: PRODUCT_IMAGES.cedarSmoke.src,
    hoverImage: PRODUCT_IMAGES.cedarSmoke.hover,
    notes: {
      top: ["Juniper", "Black Pepper"],
      heart: ["Virginia Cedar", "Cypress"],
      base: ["Vetiver", "Birch Tar", "Leather"],
    },
    rating: 4.8,
    reviews: 337,
    description: "Dry cedar over cold smoke — the smell of a fire that has just gone out.",
  },
  {
    id: "p-06",
    slug: "pale-drift",
    name: "Pale Drift",
    tagline: "Sea Salt · Driftwood · Iris",
    family: "fresh",
    price: 118,
    size: "50 ml",
    image: PRODUCT_IMAGES.paleDrift.src,
    hoverImage: PRODUCT_IMAGES.paleDrift.hover,
    notes: {
      top: ["Sea Salt", "Grapefruit"],
      heart: ["Iris", "Seaweed Absolute"],
      base: ["Driftwood", "Ambergris"],
    },
    badge: "new",
    rating: 4.6,
    reviews: 96,
    description: "Mineral, saline and open — air moving over wet stone.",
  },
  {
    id: "p-07",
    slug: "citrus-veil",
    name: "Citrus Veil",
    tagline: "Bergamot · Neroli · Petitgrain",
    family: "fresh",
    price: 112,
    size: "50 ml",
    image: PRODUCT_IMAGES.citrusVeil.src,
    hoverImage: PRODUCT_IMAGES.citrusVeil.hover,
    notes: {
      top: ["Calabrian Bergamot", "Green Mandarin"],
      heart: ["Neroli", "Petitgrain"],
      base: ["White Cedar", "Clean Musk"],
    },
    rating: 4.5,
    reviews: 203,
    description: "Bright citrus held in place by bitter green stems. Effortless.",
  },
  {
    id: "p-08",
    slug: "salt-air",
    name: "Salt Air",
    tagline: "Mint · Fig · Vetiver",
    family: "fresh",
    price: 124,
    size: "50 ml",
    image: PRODUCT_IMAGES.saltAir.src,
    hoverImage: PRODUCT_IMAGES.saltAir.hover,
    notes: {
      top: ["Wild Mint", "Bergamot"],
      heart: ["Fig", "Geranium"],
      base: ["Haitian Vetiver", "Oakmoss"],
    },
    rating: 4.6,
    reviews: 178,
    description: "Cool mint that dries down green and earthy rather than sharp.",
  },
  {
    id: "p-09",
    slug: "nocturne",
    name: "Nocturne",
    tagline: "Incense · Leather · Labdanum",
    family: "woody",
    price: 178,
    size: "50 ml",
    image: PRODUCT_IMAGES.nocturne.src,
    hoverImage: PRODUCT_IMAGES.nocturne.hover,
    notes: {
      top: ["Elemi", "Clary Sage"],
      heart: ["Frankincense", "Suede"],
      base: ["Labdanum", "Guaiac Wood", "Styrax"],
    },
    badge: "limited",
    rating: 4.9,
    reviews: 221,
    description: "Church incense and worn leather. Unapologetically nocturnal.",
  },
  {
    id: "p-10",
    slug: "fleur-blanche",
    name: "Fleur Blanche",
    tagline: "Tuberose · Jasmine · Coconut",
    family: "floral",
    price: 134,
    size: "50 ml",
    image: PRODUCT_IMAGES.fleurBlanche.src,
    hoverImage: PRODUCT_IMAGES.fleurBlanche.hover,
    notes: {
      top: ["Green Mango", "Ylang-Ylang"],
      heart: ["Tuberose", "Jasmine Sambac"],
      base: ["Coconut Husk", "Sandalwood"],
    },
    badge: "bestseller",
    rating: 4.7,
    reviews: 389,
    description: "Heady white florals with a creamy, tropical undertow.",
  },
  {
    id: "p-11",
    slug: "resin-noir",
    name: "Resin Noir",
    tagline: "Myrrh · Black Fig · Opoponax",
    family: "amber",
    price: 158,
    size: "50 ml",
    image: PRODUCT_IMAGES.resinNoir.src,
    hoverImage: PRODUCT_IMAGES.resinNoir.hover,
    notes: {
      top: ["Black Fig", "Pink Pepper"],
      heart: ["Myrrh", "Cistus"],
      base: ["Opoponax", "Vanilla Absolute", "Oakmoss"],
    },
    rating: 4.8,
    reviews: 142,
    description: "Sticky resins and dried fruit — balsamic, dark, almost edible.",
  },
  {
    id: "p-12",
    slug: "lumen-suede",
    name: "Lumen Suede",
    tagline: "Orris · Suede · Tonka",
    family: "floral",
    price: 146,
    size: "50 ml",
    image: PRODUCT_IMAGES.lumenSuede.src,
    hoverImage: PRODUCT_IMAGES.lumenSuede.hover,
    notes: {
      top: ["Orris Butter", "Violet"],
      heart: ["Suede", "Heliotrope"],
      base: ["Tonka Bean", "White Amber"],
    },
    rating: 4.7,
    reviews: 167,
    description: "Powdery iris against soft suede. Quiet, expensive, close to the skin.",
  },
];

/* ----------------------------- selectors ----------------------------- */

export const getAllProducts = (): Product[] => PRODUCTS;

export const getFeatured = (count = 4): Product[] =>
  PRODUCTS.filter((p) => p.badge === "bestseller" || p.badge === "new").slice(0, count);

export const getBestsellers = (): Product[] =>
  [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 8);

export const getByFamily = (family: OlfactiveFamily): Product[] =>
  PRODUCTS.filter((p) => p.family === family);

export const getBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug);

/** Consistent price rendering across cards, carousels and quick views. */
export const formatPrice = (value: number): string =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
  }).format(value);
