/**
 * Hardcoded admin credentials — temporary until a real user store exists.
 * Override via env (ADMIN_USERNAME / ADMIN_PASSWORD) without touching code.
 */
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "aroma@2026";

/** HMAC key for the session cookie. Set ADMIN_SESSION_SECRET in production. */
export const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "dev-only-aroma-admin-secret-change-me";

export const SESSION_COOKIE = "aroma_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours, in seconds

export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";
