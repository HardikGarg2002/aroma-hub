export type AdminNavItem = {
  label: string;
  href: string;
  /** Only active on this exact path, not its children (for the /admin root). */
  exact?: boolean;
};

/** Sidebar menu. Add a matching folder under app/admin/(panel) per entry. */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", exact: true },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Coupons", href: "/admin/coupons" },
];
