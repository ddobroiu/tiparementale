import type { Metadata } from "next";

/**
 * Harta e privată. Titlul îi trebuie pentru filă și istoric; indexarea nu — o
 * hartă personală ajunsă în rezultatele căutării ar fi o scurgere de date, iar
 * `robots.txt` singur nu e o garanție dacă pagina e legată de undeva.
 */
export const metadata: Metadata = {
  title: "Harta mea",
  robots: { index: false, follow: false },
};

export default function HartaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
