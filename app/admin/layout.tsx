import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · AROMA Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-1 flex-col bg-bone font-sans">{children}</div>;
}
