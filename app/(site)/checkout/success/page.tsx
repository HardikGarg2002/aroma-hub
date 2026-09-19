import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { order } = await searchParams;
  // Display only — no order details are looked up from this public URL.
  const number = typeof order === "string" && /^[A-Z]{2}-\d{1,10}$/.test(order) ? order : null;

  return (
    <section className="shell flex flex-col items-center pb-32 pt-40 text-center md:pt-48">
      <span className="label text-accent">Thank you</span>
      <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-none">Your order is confirmed</h1>
      {number && (
        <p className="mt-6 text-lg">
          Order <span className="font-mono">#{number}</span>
        </p>
      )}
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
        Your payment was successful. We&apos;re preparing your fragrance and will email you when it ships.
      </p>
      <Link
        href="/shop"
        className="mt-10 bg-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-bone hover:opacity-90"
      >
        Continue shopping
      </Link>
    </section>
  );
}
