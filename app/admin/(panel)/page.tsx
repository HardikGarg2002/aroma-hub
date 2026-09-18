import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_NAV } from "@/lib/admin/navigation";

export default function AdminHomePage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" description="Manage the AROMA store." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-line bg-paper p-6 transition-shadow hover:shadow-card"
          >
            <p className="text-lg font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-muted">Manage {item.label.toLowerCase()} →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
