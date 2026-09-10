import type { Metadata } from "next";

/** Resetarea parolei: pagini personale, fără loc în indexul de căutare. */
export const metadata: Metadata = {
  title: "Resetare parolă",
  robots: { index: false, follow: false },
};

export default function ResetareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
