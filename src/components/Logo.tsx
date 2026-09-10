import { BrandMark } from "./BrandMark";

/**
 * Marca produsului în antet și subsol: simbolul — creierul cu dalta — și
 * numele alături. Ecusonul pictat rămâne pentru locurile unde e loc să se
 * vadă (pagina principală, imaginea de partajare); la 40 de pixeli nu arată
 * nimic, de aceea aici e semnul simplu.
 */

interface Props {
  className?: string;
  /** Doar simbolul, fără text. Pentru spații strâmte. */
  markOnly?: boolean;
  /** `lg` pentru subsol și paginile de cont, unde e loc. */
  size?: "sm" | "lg";
}

export function Logo({ className = "", markOnly = false, size = "sm" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size === "lg" ? 48 : 34} />

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
