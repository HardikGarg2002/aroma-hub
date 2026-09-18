export type AdminNavItem = { label: string; href: string };

/** Sidebar menu. Add a matching folder under app/admin/(panel) per entry. */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Collections", href: "/admin/collections" },
];
