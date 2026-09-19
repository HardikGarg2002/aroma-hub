import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/Checkout";
import { paypalClientId, paypalMode } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

// PayPal mode comes from server env at request time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const mode = paypalMode();
  return (
    <section className="shell pb-24 pt-32 md:pb-32 md:pt-40">
      <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none">Checkout</h1>
      <Checkout mode={mode} clientId={mode === "sandbox" || mode === "live" ? paypalClientId() : ""} />
    </section>
  );
}
