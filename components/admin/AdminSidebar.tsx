"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ADMIN_NAV } from "@/lib/admin/navigation";
import { logout } from "@/lib/admin/actions";

export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="border-b border-line bg-paper md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-5 py-4 md:py-6">
        <Link href="/admin" className="font-display text-2xl tracking-[0.2em]">
          AROMA
          <span className="ml-2 align-middle font-sans text-[10px] font-medium tracking-[0.2em] text-muted">
            ADMIN
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id="admin-nav"
        className={cn("flex-1 flex-col px-3 pb-4 md:flex", open ? "flex" : "hidden")}
      >
        <nav aria-label="Admin" className="flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-ink text-bone" : "text-ink-soft hover:bg-bone-deep",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-line pt-4 md:mt-auto">
          <p className="px-3 text-xs text-muted">
            Signed in as <span className="font-medium text-ink">{username}</span>
          </p>
          <form action={logout} className="mt-2">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-bone-deep"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
