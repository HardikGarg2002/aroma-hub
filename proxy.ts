import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HOME, ADMIN_LOGIN, SESSION_COOKIE } from "@/lib/admin/config";
import { verifySessionToken } from "@/lib/admin/session";

/**
 * Optimistic admin gate: bounce signed-out visitors to the login page (keeping
 * where they were headed) and signed-in admins away from it. The panel layout
 * re-checks the session via requireAdmin().
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const onLogin = pathname === ADMIN_LOGIN;

  if (!session && !onLogin) {
    const url = new URL(ADMIN_LOGIN, req.nextUrl);
    if (pathname !== ADMIN_HOME) url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (session && onLogin) {
    return NextResponse.redirect(new URL(ADMIN_HOME, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
