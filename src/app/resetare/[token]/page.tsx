import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

/**
 * Pagina din linkul primit pe e-mail. Tokenul nu se verifică aici, la
 * afișare — se verifică o singură dată, când omul trimite parola nouă. Așa
 * un scanner de linkuri din clientul de e-mail nu consumă tokenul.
 */
export default async function ResetareTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
