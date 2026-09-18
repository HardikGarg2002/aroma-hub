/** Primary navigation. These routes are built out in later passes. */
export const NAV_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Floral", href: "/shop/floral" },
  { label: "Woody", href: "/shop/woody" },
  { label: "Amber", href: "/shop/amber" },
  { label: "Fresh", href: "/shop/fresh" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Fragrances", href: "/shop" },
      { label: "Discovery Set", href: "/shop/discovery-set" },
      { label: "New Arrivals", href: "/shop?sort=new" },
      { label: "Bestsellers", href: "/shop?sort=popular" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Olfactive Families", href: "/families" },
      { label: "The Journal", href: "/journal" },
      { label: "Find Your Scent", href: "/quiz" },
      { label: "Our Perfumers", href: "/about#perfumers" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping & Returns", href: "/help/shipping" },
      { label: "Track an Order", href: "/help/track" },
      { label: "Contact Us", href: "/help/contact" },
      { label: "FAQ", href: "/help/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About AROMA", href: "/about" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Stockists", href: "/stockists" },
      { label: "Careers", href: "/careers" },
    ],
  },
] as const;

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
] as const;

export const ANNOUNCEMENTS = [
  "Complimentary shipping on orders over $95",
  "Four 2 ml samples free with every order",
  "New — Golden Hour, now in 50 ml",
] as const;
