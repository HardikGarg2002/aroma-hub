import { isProvinceCode } from "./pricing";

/** Contact and shipping details collected at checkout. */
export interface CheckoutCustomer {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
}

export const EMPTY_CUSTOMER: CheckoutCustomer = {
  email: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postal_code: "",
};

export type CustomerErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Canadian postal code; letters D, F, I, O, Q, U are never used.
const POSTAL = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]) ?(\d[ABCEGHJ-NPRSTV-Z]\d)$/i;

/** "k1a0b1" → "K1A 0B1"; unchanged if it isn't a valid code. */
export function normalizePostalCode(value: string) {
  const m = value.trim().match(POSTAL);
  return m ? `${m[1]} ${m[2]}`.toUpperCase() : value.trim();
}

/** Trim everything and tidy the postal code. */
export function cleanCustomer(c: CheckoutCustomer): CheckoutCustomer {
  const t = (v: unknown) => String(v ?? "").trim().slice(0, 200);
  return {
    email: t(c.email).toLowerCase(),
    name: t(c.name),
    phone: t(c.phone),
    line1: t(c.line1),
    line2: t(c.line2),
    city: t(c.city),
    province: t(c.province).toUpperCase(),
    postal_code: normalizePostalCode(t(c.postal_code)),
  };
}

/** Same rules in the browser (instant feedback) and on the server (the real check). */
export function validateCustomer(raw: CheckoutCustomer): CustomerErrors {
  const c = cleanCustomer(raw);
  const errors: CustomerErrors = {};
  if (!EMAIL.test(c.email)) errors.email = "Enter a valid email address.";
  if (c.name.length < 2) errors.name = "Enter your full name.";
  if (c.phone && !/^[+\d\s().-]{7,20}$/.test(c.phone)) errors.phone = "Enter a valid phone number.";
  if (!c.line1) errors.line1 = "Enter your street address.";
  if (!c.city) errors.city = "Enter your city.";
  if (!isProvinceCode(c.province)) errors.province = "Choose a province or territory.";
  if (!POSTAL.test(c.postal_code)) errors.postal_code = "Enter a valid postal code, e.g. K1A 0B1.";
  return errors;
}
