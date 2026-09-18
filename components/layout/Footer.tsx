import Link from "next/link";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/navigation";
import { FadeIn } from "@/components/ui/FadeIn";
import { RevealText } from "@/components/ui/RevealText";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-bone-deep">
      <div className="shell pb-10 pt-20 md:pt-28">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 lg:gap-x-10">
          {FOOTER_COLUMNS.map((column, i) => (
            <FadeIn key={column.title} delay={i * 0.06} y={20}>
              <h3 className="label mb-5 font-sans">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex text-[14px] text-ink-soft transition-colors duration-300 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeIn>
          ))}
        </div>

        {/* Oversized wordmark */}
        <div className="mt-24 border-t border-line pt-10">
          <RevealText
            as="div"
            stagger={0.04}
            className="select-none font-display text-[clamp(3.5rem,23vw,21rem)] font-light leading-[0.85] tracking-[0.02em] text-ink"
          >
            AROMA
          </RevealText>
        </div>

        {/* Fine print */}
        <div className="mt-10 flex flex-col gap-6 border-t border-line pt-8 text-[12px] text-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} Aroma Parfums Inc. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="uppercase tracking-[0.16em] transition-colors duration-300 hover:text-accent"
              >
                {social.label}
              </a>
            ))}
            <Link href="/legal/privacy" className="transition-colors hover:text-accent">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-accent">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
