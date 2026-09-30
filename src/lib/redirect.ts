/**
 * Ținta de după autentificare vine din adresă, deci din mâna oricui. Acceptăm
 * doar o cale din acest site: „/ceva”, niciodată „//alt-site” sau o adresă
 * completă. Altfel formularul de intrare ar deveni o trambulină spre afară.
 * Fără importuri de server — fișierul ajunge și în browser.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/harta"): string {
  if (!value || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
