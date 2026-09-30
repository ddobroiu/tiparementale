import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Logo } from "@/components/Logo";
import { googleConfigured } from "@/lib/google";

import { AuthForm } from "./AuthForm";

export default async function IntraPage() {
  // „Continuă cu Google” apare doar cu cheile puse; se citesc la cerere, nu la build.
  await connection();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <Suspense fallback={null}>
          <AuthForm googleEnabled={googleConfigured()} />
        </Suspense>
      </div>
    </main>
  );
}
