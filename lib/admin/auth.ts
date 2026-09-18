import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_LOGIN, SESSION_COOKIE } from "./config";
import { verifySessionToken } from "./session";

/** Current admin session, or null. Deduped per request. */
export const getAdminSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
});

/**
 * Authoritative check for admin pages and server actions. proxy.ts only does
 * an optimistic redirect; anything that reads or mutates admin data must
 * call this too.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN);
  return session;
}
