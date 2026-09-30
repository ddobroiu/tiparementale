import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Dezabonare",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pagina din linkul „Dezabonează-te” din e-mailuri. Nu dezabonează la simpla
 * deschidere (scanerele de linkuri deschid tot): cere un click pe buton, care
 * trimite un formular obișnuit, fără JavaScript, la /api/dezabonare.
 */
export default async function DezabonarePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const id = typeof params.id === "string" && UUID.test(params.id) ? params.id : null;
  const done = params.gata === "1";
  const failed = params.eroare === "1";

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">
          {done ? (
            <>
              <h1 className="font-serif text-3xl">Gata, te-ai dezabonat.</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Nu mai primești e-mailuri cu noutăți și sfaturi. Dacă ai cont, el rămâne
                neatins; vei primi doar mesajele strict necesare, precum resetarea parolei
                sau confirmarea unei plăți.
              </p>
            </>
          ) : failed || !id ? (
            <>
              <h1 className="font-serif text-3xl">Linkul nu mai merge.</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Folosește linkul de dezabonare dintr-un e-mail primit de la noi, sau scrie-ne
                la{" "}
                <a href="mailto:contact@tiparementale.ro" className="text-paper underline underline-offset-4">
                  contact@tiparementale.ro
                </a>{" "}
                și te scoatem noi din listă.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl">Te dezabonezi?</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Nu vei mai primi e-mailuri cu noutăți și sfaturi de la Tipare Mentale. Contul
                tău, dacă ai unul, rămâne neatins.
              </p>
              <form method="post" action="/api/dezabonare" className="mt-8">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="from" value="page" />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
                >
                  Da, dezabonează-mă
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-paper-faint">
                <Link href="/" className="underline underline-offset-4 hover:text-paper-dim">
                  M-am răzgândit
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
