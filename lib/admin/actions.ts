"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME,
  ADMIN_LOGIN,
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  SESSION_COOKIE,
} from "./config";
import { createSessionToken } from "./session";

export type LoginState = { error?: string; username?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { error: "Incorrect username or password.", username };
  }

  const { token, expiresAt } = await createSessionToken(username);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(expiresAt),
  });

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/admin", maxAge: 0 });
  redirect(ADMIN_LOGIN);
}

/** Only allow returning to admin routes, never an arbitrary URL. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  if (next.startsWith("/admin") && !next.startsWith(ADMIN_LOGIN)) return next;
  return ADMIN_HOME;
}
