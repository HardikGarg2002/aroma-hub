"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { searchSuggestions } from "@/lib/search-actions";
import { formatMoney } from "@/lib/admin/format";
import { BLUR, canOptimize } from "@/lib/images";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Suggestions = Awaited<ReturnType<typeof searchSuggestions>>;

/**
 * Full-width search panel under the header. Suggestions update as you type;
 * arrow keys move through them, Enter opens the highlighted one or the full
 * results page.
 */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open ? <Panel onClose={onClose} /> : null}</AnimatePresence>;
}

function Panel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  // Focus, scroll lock, Escape; restore focus to the trigger on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  // Debounced lookup; a newer query cancels an older one's result.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const next = await searchSuggestions(q);
      if (cancelled) return;
      setResults(next);
      setActive(-1);
      setLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const q = query.trim();
  const shown = q ? results : null;
  const products = shown?.products ?? [];
  const hrefs = products.map((p) => `/products/${p.id}`);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!hrefs.length) return;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      // -1 is the input itself; wrap past either end back to it.
      setActive((i) => {
        const next = i + dir;
        if (next >= hrefs.length) return -1;
        if (next < -1) return hrefs.length - 1;
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && hrefs[active]) go(hrefs[active]);
      else if (q) go(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[95]">
      <m.div
        aria-hidden
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="absolute inset-x-0 top-0 max-h-dvh overflow-hidden bg-bone shadow-lift"
        initial={{ y: "-100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <div className="shell pb-8 pt-6 md:pt-10">
          <div className="flex items-center gap-4 border-b border-ink pb-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search fragrances, notes, inspirations…"
              maxLength={100}
              role="combobox"
              aria-expanded={products.length > 0}
              aria-controls={listId}
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              className="min-w-0 flex-1 bg-transparent font-display text-[clamp(1.6rem,4vw,2.6rem)] leading-tight outline-none placeholder:text-muted/60 [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="flex h-10 w-10 shrink-0 items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            data-lenis-prevent
            className={cn("max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain transition-opacity", loading && "opacity-60")}
          >
            {!q && <p className="py-6 text-sm text-muted">Try a fragrance name, a note, or a scent it&apos;s inspired by.</p>}

            {shown && shown.collections.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-5">
                <span className="label mr-1 text-muted">Collections</span>
                {shown.collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.slug}`}
                    onClick={onClose}
                    className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {shown && (
              <ul id={listId} role="listbox" aria-label="Products" className="grid gap-x-8 pt-4 sm:grid-cols-2">
                {products.map((p, i) => (
                  <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={hrefs[i]}
                      onClick={onClose}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex items-center gap-4 border-b border-line py-3 transition-colors",
                        i === active && "bg-bone-deep",
                      )}
                    >
                      <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden bg-paper">
                        {p.image_url && (
                          <Image
                            src={p.image_url}
                            alt=""
                            fill
                            sizes="48px"
                            placeholder="blur"
                            blurDataURL={BLUR}
                            unoptimized={!canOptimize(p.image_url)}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-xl leading-tight">{p.name}</p>
                        {p.inspired_by && <p className="truncate text-[12px] text-muted">Inspired by {p.inspired_by}</p>}
                      </div>
                      <span className="shrink-0 text-sm tabular-nums">{formatMoney(p.price, p.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {shown && shown.total === 0 && shown.collections.length === 0 && (
              <p className="py-6 text-sm text-muted">
                No results for &ldquo;{q}&rdquo;. Try a different word, or{" "}
                <Link href="/shop" onClick={onClose} className="underline underline-offset-4">
                  browse everything
                </Link>
                .
              </p>
            )}

            {shown && shown.total > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em]"
              >
                See all {shown.total} {shown.total === 1 ? "result" : "results"}
                <span className="block h-px w-8 bg-ink" />
              </Link>
            )}
          </div>
        </div>
      </m.div>
    </div>
  );
}
