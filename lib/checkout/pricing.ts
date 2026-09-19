/**
 * Shipping and tax rules. Pure and client-safe: the checkout page shows
 * estimates with these, and the server re-applies them when it prices the
 * order, so the two can't disagree.
 */

export const STORE_COUNTRY = { code: "CA", name: "Canada" } as const;

/** Matches the storefront announcement bar. */
export const FREE_SHIPPING_FROM = 95;
export const FLAT_SHIPPING = 12;

/**
 * Combined sales tax per province/territory (GST/HST + PST/QST), applied to
 * the discounted subtotal plus shipping. A simplification — confirm rates and
 * what's taxable with an accountant before going live.
 */
export const PROVINCES = [
  { code: "AB", name: "Alberta", tax: 0.05 },
  { code: "BC", name: "British Columbia", tax: 0.12 },
  { code: "MB", name: "Manitoba", tax: 0.12 },
  { code: "NB", name: "New Brunswick", tax: 0.15 },
  { code: "NL", name: "Newfoundland and Labrador", tax: 0.15 },
  { code: "NS", name: "Nova Scotia", tax: 0.14 },
  { code: "NT", name: "Northwest Territories", tax: 0.05 },
  { code: "NU", name: "Nunavut", tax: 0.05 },
  { code: "ON", name: "Ontario", tax: 0.13 },
  { code: "PE", name: "Prince Edward Island", tax: 0.15 },
  { code: "QC", name: "Quebec", tax: 0.14975 },
  { code: "SK", name: "Saskatchewan", tax: 0.11 },
  { code: "YT", name: "Yukon", tax: 0.05 },
] as const;

export type ProvinceCode = (typeof PROVINCES)[number]["code"];

export const isProvinceCode = (v: string): v is ProvinceCode => PROVINCES.some((p) => p.code === v);

/** Rate for a province; 0 until one is chosen. */
export const taxRate = (province: string) => PROVINCES.find((p) => p.code === province)?.tax ?? 0;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function shippingFor(discountedSubtotal: number) {
  return discountedSubtotal >= FREE_SHIPPING_FROM || discountedSubtotal <= 0 ? 0 : FLAT_SHIPPING;
}
