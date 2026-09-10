import type { Metadata } from "next";

/** Pagina de autentificare: are titlu, nu are ce căuta în indexul de căutare. */
export const metadata: Metadata = {
  title: "Intră",
  robots: { index: false, follow: true },
};

export default function IntraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
