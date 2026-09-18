import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-4xl tracking-[0.2em]">AROMA</p>
        <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
          Admin
        </p>

        <div className="mt-10 rounded-lg border border-line bg-paper p-8 shadow-card">
          <h1 className="text-lg font-medium">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Enter your admin credentials to continue.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
