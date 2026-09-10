import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/Logo";
import { SettingsActions } from "@/components/SettingsActions";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contul meu",
  robots: { index: false, follow: false },
};

interface PurchaseRow extends Record<string, unknown> {
  pack_name: string;
  amount_ron: string;
  status: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "în așteptare",
  paid: "plătit",
  failed: "eșuat",
  refunded: "rambursat",
};

/**
 * Contul: ce ai, ce ai cumpărat, și cele trei lucruri pe care trebuie să le
 * poți face singur — să iei tot ce e al tău, să pleci, să ștergi tot.
 */
export default async function SetariPage() {
  const user = await getSessionUser();
  if (!user) redirect("/intra?redirect=/setari");

  const data = await withUser(user.id, async (client) => {
    const wallet = await getWallet(client, user.id);
    const { rows: purchases } = await client.query<PurchaseRow>(
      `select p.name as pack_name, pu.amount_ron, pu.status, pu.created_at
         from purchases pu join packs p on p.code = pu.pack_code
        order by pu.created_at desc`,
    );
    return { wallet, purchases };
  });

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/harta">
          <Logo />
        </Link>
        <Link
          href="/harta"
          className="rounded-full border border-ink-line px-4 py-1.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
        >
          ← Harta mea
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="font-serif text-3xl sm:text-4xl">Contul meu</h1>
        <p className="mt-2 text-sm text-paper-faint">{user.email}</p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink-line p-6">
            <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Ședințe rămase
            </p>
            <p className="mt-2 font-serif text-4xl">{data.wallet.sessionsLeft}</p>
          </div>
          <div className="rounded-2xl border border-ink-line p-6">
            <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Transformări rămase
            </p>
            <p className="mt-2 font-serif text-4xl">{data.wallet.transformationsLeft}</p>
          </div>
        </section>

        <Link
          href="/pachete"
          className="mt-4 inline-block text-sm text-paper-dim underline underline-offset-4 hover:text-paper"
        >
          Vezi programele
        </Link>

        {data.purchases.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Cumpărări
            </h2>
            <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line">
              {data.purchases.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-paper">{p.pack_name}</span>
                  <span className="text-paper-faint">
                    {formatDate(p.created_at)} · {Number(p.amount_ron).toFixed(0)} lei ·{" "}
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12">
          <SettingsActions email={user.email} />
        </div>
      </div>
    </main>
  );
}
