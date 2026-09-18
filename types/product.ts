export type OlfactiveFamily = "floral" | "woody" | "amber" | "fresh";

export type ProductBadge = "new" | "bestseller" | "limited";

export interface NotePyramid {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Three-note summary shown under the name, e.g. "Bergamot · Cedar · Vanilla" */
  tagline: string;
  family: OlfactiveFamily;
  /** Whole currency units (CAD). Format with formatPrice(). */
  price: number;
  compareAt?: number;
  size: string;
  image: string;
  hoverImage: string;
  notes: NotePyramid;
  badge?: ProductBadge;
  rating: number;
  reviews: number;
  /** One line of copy for the product card / quick view. */
  description: string;
}

export interface FamilyMeta {
  id: OlfactiveFamily;
  name: string;
  /** Short sensory description used by the notes explorer. */
  blurb: string;
  ingredients: string[];
  image: string;
  /** CSS colour token for the family wash. */
  tint: string;
}
