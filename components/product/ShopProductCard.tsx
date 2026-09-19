import Image from "next/image";
import Link from "next/link";
import type { ShopProduct } from "@/lib/catalog";
import { BLUR, canOptimize } from "@/lib/images";
import { formatMoney } from "@/lib/admin/format";
import { CartControl } from "@/components/cart/CartControl";

/**
 * Product tile for catalogue (admin/DB-backed) products. CSS-only hover, so
 * it stays a server component — only the add-to-cart control is client code.
 */
export function ShopProductCard({
  product,
  sizes = "(max-width: 1024px) 46vw, 23vw",
}: {
  product: ShopProduct;
  sizes?: string;
}) {
  const { id, name, inspired_by, price, currency, size_options, image_url, collections } = product;

  return (
    <article className="group">
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-paper">
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              sizes={sizes}
              placeholder="blur"
              blurDataURL={BLUR}
              unoptimized={!canOptimize(image_url)}
              className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-display text-6xl text-ink/10">
              {name.charAt(0)}
            </div>
          )}

          {collections[0] && (
            <span className="absolute left-3 top-3 rounded-full bg-bone/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink backdrop-blur-sm">
              {collections[0].name}
            </span>
          )}

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-ink py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-bone transition-transform duration-500 ease-out-expo group-hover:translate-y-0 group-focus-visible:translate-y-0"
          >
            View
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[20px] leading-tight md:text-[22px]">{name}</h3>
            {inspired_by && (
              <p className="mt-1 truncate text-[12px] tracking-wide text-muted">Inspired by {inspired_by}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[14px] tabular-nums">{formatMoney(price, currency)}</p>
            {size_options.length > 0 && (
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                {size_options.length === 1 ? size_options[0] : `${size_options.length} sizes`}
              </p>
            )}
          </div>
        </div>
      </Link>
      <CartControl product={product} className="mt-4" />
    </article>
  );
}
