import Image from "next/image";

/**
 * Marca produsului: ecusonul rotund — sculptorul care își cioplește propria
 * minte — cu numele alături. Ecusonul singur, la 36 de pixeli, nu-și mai
 * poate arăta textul, așa că numele stă lângă el, cu serife, ca pe site.
 */

interface Props {
  className?: string;
  /** Doar ecusonul, fără text. Pentru spații strâmte. */
  markOnly?: boolean;
  /** `lg` pentru subsol și paginile de cont, unde e loc. */
  size?: "sm" | "lg";
}

export function Logo({ className = "", markOnly = false, size = "sm" }: Props) {
  const px = size === "lg" ? 56 : 40;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo-192.png"
        alt=""
        width={px}
        height={px}
        priority={size === "sm"}
        className="shrink-0 rounded-full"
        style={{ width: px, height: px }}
      />

      {!markOnly && (
        <span
          className={`font-serif leading-none tracking-tight whitespace-nowrap ${
            size === "lg" ? "text-2xl" : "text-lg"
          }`}
        >
          Tipare<span className="text-paper-dim"> Mentale</span>
        </span>
      )}
    </span>
  );
}
