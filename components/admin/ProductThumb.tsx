import Image from "next/image";

/** Square product thumbnail with an empty-state tile when there's no image. */
export function ProductThumb({ src, alt, size = 44 }: { src: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-md border border-dashed border-line text-[10px] text-muted"
      >
        No img
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      // Admins can paste any URL, which next/image's host allowlist would reject.
      unoptimized
      className="shrink-0 rounded-md border border-line object-cover"
      style={{ width: size, height: size }}
    />
  );
}
