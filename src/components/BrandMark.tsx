import { BRAND_GOLD, BRAND_MARK } from "@/lib/brand-mark";

/** Simbolul mărcii — creierul cu dalta — ca SVG inline, la orice mărime. */
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
        const color = p.tone === "gold" ? BRAND_GOLD : "#f4f3f0";
        return p.kind === "fill" ? (
          <path
            key={i}
            d={p.d}
            fill={color}
            stroke={color}
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
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
