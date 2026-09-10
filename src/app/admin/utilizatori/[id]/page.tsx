import Link from "next/link";
import { notFound } from "next/navigation";

import { CreditForm } from "@/components/admin/CreditForm";
import { ago, dateTime, lei, usd } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  created_at: string;
  sessions_balance: number | null;
  transformations_balance: number | null;
  cost_ceiling_micro: string | null;
  cost_used_micro: string | null;
}

interface Count extends Record<string, unknown> {
  key: string;
  n: number;
}

interface UsageRow extends Record<string, unknown> {
  kind: string;
  calls: number;
  cost_micro: string;
}

interface ConversationRow extends Record<string, unknown> {
  id: string;
  started_at: string;
  turns: number;
  guide_id: string | null;
}

interface PurchaseRow extends Record<string, unknown> {
  pack_name: string;
  amount_ron: string;
  status: string;
  created_at: string;
}

interface AdjustmentRow extends Record<string, unknown> {
  admin_email: string;
  sessions_delta: number;
  transformations_delta: number;
  note: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  belief: "convingeri",
  value: "valori",
  emotion: "emoții",
  goal: "obiective",
  fear: "frici",
  pattern: "tipare",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const data = await withAdmin(async (client) => {
    const { rows: users } = await client.query<UserRow>(
      `select u.id, u.email, u.created_at,
              w.sessions_balance, w.transformations_balance, w.cost_ceiling_micro, w.cost_used_micro
         from users u left join wallets w on w.user_id = u.id
        where u.id = $1`,
      [id],
    );
    const user = users[0];
    if (!user) return null;

    const { rows: nodeCounts } = await client.query<Count>(
      `select type::text as key, count(*)::int as n from nodes where user_id = $1 group by 1`,
      [id],
    );
    const { rows: usage } = await client.query<UsageRow>(
      `select kind::text as kind, count(*)::int as calls, sum(cost_micro)::text as cost_micro
         from usage_events where user_id = $1 group by 1 order by 3 desc`,
      [id],
    );
    const { rows: conversations } = await client.query<ConversationRow>(
      `select id, started_at, turns, guide_id from conversations
        where user_id = $1 order by started_at desc limit 8`,
      [id],
    );
    const { rows: purchases } = await client.query<PurchaseRow>(
      `select p.name as pack_name, pu.amount_ron, pu.status, pu.created_at
         from purchases pu join packs p on p.code = pu.pack_code
        where pu.user_id = $1 order by pu.created_at desc`,
      [id],
    );
    const { rows: adjustments } = await client.query<AdjustmentRow>(
      `select admin_email, sessions_delta, transformations_delta, note, created_at
         from wallet_adjustments where user_id = $1 order by created_at desc`,
      [id],
    );
    const { rows: last } = await client.query<{ at: string | null }>(
      `select max(created_at) as at from messages where user_id = $1`,
      [id],
    );

    return { user, nodeCounts, usage, conversations, purchases, adjustments, lastAt: last[0]?.at ?? null };
  });

  if (!data) notFound();
  const { user } = data;
  const totalNodes = data.nodeCounts.reduce((s, c) => s + c.n, 0);
  const totalCost = data.usage.reduce((s, u) => s + Number(u.cost_micro), 0);

  return (
    <>
      <Link href="/admin/utilizatori" className="text-sm text-paper-faint hover:text-paper-dim">
        ← Utilizatori
      </Link>
      <h1 className="mt-2 font-serif text-3xl break-all">{user.email}</h1>
      <p className="mt-1 text-sm text-paper-faint">
        Cont din {dateTime(user.created_at)} · ultima replică: {ago(data.lastAt)}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ["Ședințe", user.sessions_balance ?? 0],
              ["Transformări", user.transformations_balance ?? 0],
              ["Cost folosit", usd(user.cost_used_micro ?? 0)],
              ["Plafon", usd(user.cost_ceiling_micro ?? 0)],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-ink-line p-4">
                <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">{label}</p>
                <p className="mt-1 font-serif text-2xl text-paper">{value}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Harta · {totalNodes} noduri
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {data.nodeCounts.map((c) => (
                <span key={c.key} className="rounded-full border border-ink-line px-3 py-1 text-paper-dim">
                  {c.n} {TYPE_LABELS[c.key] ?? c.key}
                </span>
              ))}
              {totalNodes === 0 && <span className="text-paper-faint">Harta e goală.</span>}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Consum model · {usd(totalCost)}
            </h2>
            <ul className="mt-3 divide-y divide-ink-line border-y border-ink-line text-sm">
              {data.usage.map((u) => (
                <li key={u.kind} className="flex justify-between py-2">
                  <span className="text-paper-dim">{u.kind}</span>
                  <span className="text-paper-faint">{u.calls} apeluri · {usd(u.cost_micro)}</span>
                </li>
              ))}
              {data.usage.length === 0 && <li className="py-2 text-paper-faint">Niciun apel.</li>}
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">Conversații recente</h2>
            <ul className="mt-3 divide-y divide-ink-line border-y border-ink-line text-sm">
              {data.conversations.map((c) => (
                <li key={c.id} className="flex justify-between py-2">
                  <span className="text-paper-dim">{c.guide_id ?? "liberă"}</span>
                  <span className="text-paper-faint">{c.turns} replici · {dateTime(c.started_at)}</span>
                </li>
              ))}
              {data.conversations.length === 0 && (
                <li className="py-2 text-paper-faint">Nicio conversație.</li>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">Plăți</h2>
            <ul className="mt-3 divide-y divide-ink-line border-y border-ink-line text-sm">
              {data.purchases.map((p, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span className="text-paper-dim">{p.pack_name}</span>
                  <span className="text-paper-faint">
                    {lei(p.amount_ron)} · {p.status} · {dateTime(p.created_at)}
                  </span>
                </li>
              ))}
              {data.purchases.length === 0 && <li className="py-2 text-paper-faint">Nicio plată.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <CreditForm userId={user.id} />

          <section>
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Registru credite
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {data.adjustments.map((a, i) => (
                <li key={i} className="rounded-xl border border-ink-line p-3">
                  <p className="text-paper">
                    {a.sessions_delta >= 0 ? "+" : ""}{a.sessions_delta} ședințe ·{" "}
                    {a.transformations_delta >= 0 ? "+" : ""}{a.transformations_delta} transformări
                  </p>
                  <p className="mt-1 text-xs text-paper-faint">
                    {a.note ?? "fără notă"} · {a.admin_email} · {dateTime(a.created_at)}
                  </p>
                </li>
              ))}
              {data.adjustments.length === 0 && (
                <li className="text-paper-faint">Nimic adăugat de mână.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
