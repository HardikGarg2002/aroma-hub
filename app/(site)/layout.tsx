import { MotionProvider } from "@/components/providers/MotionProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Cursor } from "@/components/ui/Cursor";
import { LoaderCurtain } from "@/components/ui/LoaderCurtain";

/** Public storefront shell: smooth scroll, custom cursor, header and footer. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      <SmoothScroll>
        <LoaderCurtain />
        <Cursor />

        <Header />

        <main className="flex-1">{children}</main>

        <Footer />
      </SmoothScroll>
    </MotionProvider>
  );
}
