import { SESSION_MAX_AGE, SESSION_SECRET } from "./config";

/**
 * Stateless admin session: `<username>.<expiresAt>.<hmac>`.
 *
 * Uses Web Crypto only, so the same code runs in proxy.ts and in server
 * components/actions. `crypto.subtle.verify` compares signatures in
 * constant time.
 */

const encoder = new TextEncoder();

let keyPromise: Promise<CryptoKey> | undefined;
function getKey() {
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

function toBase64Url(bytes: ArrayBuffer) {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export type AdminSession = { username: string; expiresAt: number };

export async function createSessionToken(username: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${encodeURIComponent(username)}.${expiresAt}`;
  const sig = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload));
  return { token: `${payload}.${toBase64Url(sig)}`, expiresAt };
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [user, exp, sig] = parts;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(sig),
      encoder.encode(`${user}.${exp}`),
    );
    if (!valid) return null;
  } catch {
    return null; // malformed base64
  }

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return { username: decodeURIComponent(user), expiresAt };
}
