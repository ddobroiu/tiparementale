/**
 * Datele care descriu site-ul, într-un singur loc.
 *
 * Adresa canonică trebuie să fie absolută și corectă în producție: din ea se
 * construiesc harta site-ului, etichetele de partajare și adresele canonice.
 * O adresă greșită aici nu strică nimic vizibil, dar face ca motoarele de
 * căutare să indexeze pagini care nu există.
 */

export const SITE = {
  name: "Tipare Mentale",
  domain: "tiparementale.ro",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://tiparementale.ro",
  tagline: "O hartă vie a felului în care gândești",
  description:
    "Douăsprezece lecții ghidate sau conversație liberă: convingerile care îți " +
    "conduc reacțiile devin vizibile pe o hartă care crește în timp. Le confirmi, " +
    "apoi lucrezi la ele, cu o convingere nouă și exerciții pe care le bifezi.",
  locale: "ro_RO",
  email: "contact@tiparementale.ro",
} as const;

export const NAV = [
  { href: "/cum-functioneaza", label: "Cum funcționează" },
  { href: "/program", label: "Program" },
  { href: "/articole", label: "Articole" },
  { href: "/pachete", label: "Pachete" },
  { href: "/intrebari", label: "Întrebări" },
] as const;

export const FOOTER_LINKS = [
  {
    title: "Produs",
    links: [
      { href: "/cum-functioneaza", label: "Cum funcționează" },
      { href: "/program", label: "Programul: 12 lecții" },
      { href: "/pachete", label: "Pachete și prețuri" },
      { href: "/intrebari", label: "Întrebări frecvente" },
    ],
  },
  {
    title: "De citit",
    links: [
      { href: "/articole", label: "Toate articolele" },
      { href: "/articole/convingeri-limitative", label: "Convingeri limitative" },
      { href: "/articole/perfectionism", label: "Perfecționismul" },
      { href: "/articole/convingeri-despre-bani", label: "Convingeri despre bani" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/despre", label: "Despre noi" },
      { href: "/confidentialitate", label: "Confidențialitate" },
      { href: "/termeni", label: "Termeni și condiții" },
    ],
  },
] as const;

export function canonical(path: string): string {
  return new URL(path, SITE.url).toString();
}
