import { BRAND_GOLD, BRAND_GOLD_LIGHT, BRAND_MARK } from "@/lib/brand-mark";

/** Simbolul mărcii — creierul auriu — ca SVG inline, la orice mărime. */
export function BrandMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {BRAND_MARK.map((p, i) => {
        const color = p.tone === "light" ? BRAND_GOLD_LIGHT : BRAND_GOLD;
        return p.kind === "fill" ? (
          <path key={i} d={p.d} fill={color} />
        ) : (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={color}
            strokeWidth={p.width}
            strokeOpacity={p.opacity ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
