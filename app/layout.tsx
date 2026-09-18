import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

import { RevealScript } from "@/components/providers/RevealScript";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AROMA — Extrait de Parfum, made in Canada",
    template: "%s · AROMA",
  },
  description:
    "Extrait-strength fragrances built around single olfactive families. Explore floral, woody, amber and fresh compositions, shipped across Canada.",
  keywords: ["perfume", "fragrance", "extrait de parfum", "eau de parfum", "Canada"],
  openGraph: {
    title: "AROMA — Extrait de Parfum",
    description:
      "Extrait-strength fragrances built around single olfactive families.",
    type: "website",
    locale: "en_CA",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-CA"
      className={`${cormorant.variable} ${inter.variable} antialiased`}
      // RevealScript adds a `js` class here before React hydrates, which
      // React would otherwise report as a server/client attribute mismatch.
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-bone text-ink">
        {/* Must stay the first child of <body>: it runs during parsing, before
            the sections below it paint, and never waits on the JS bundle. */}
        <RevealScript />

        {/* Storefront chrome lives in app/(site)/layout.tsx; the admin panel
            brings its own in app/admin. */}
        {children}
      </body>
    </html>
  );
}
