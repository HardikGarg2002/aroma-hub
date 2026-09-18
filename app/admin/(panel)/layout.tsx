import { requireAdmin } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/** Everything under /admin except /admin/login: auth-gated, with the sidebar. */
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      <AdminSidebar username={session.username} />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
