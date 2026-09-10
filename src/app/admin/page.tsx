import Link from "next/link";

import { ago, dateShort, lei, usd } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

interface Totals extends Record<string, unknown> {
  users: number;
  users_7d: number;
  active_7d: number;
  nodes: number;
  conversations: number;
  paid_count: number;
  paid_ron: string;
  paid_ron_30d: string;
  cost_micro: string;
  cost_micro_30d: string;
  calls_30d: number;
}

interface RecentUser extends Record<string, unknown> {
  id: string;
  email: string;
  created_at: string;
  sessions: number;
  transformations: number;
  nodes: number;
  last_at: string | null;
}

interface RecentPurchase extends Record<string, unknown> {
  user_id: string;
  email: string;
  pack_name: string;
  amount_ron: string;
  status: string;
  created_at: string;
}

interface RecentAdjustment extends Record<string, unknown> {
  user_id: string;
  email: string;
  admin_email: string;
  sessions_delta: number;
  transformations_delta: number;
  note: string | null;
  created_at: string;
}

interface DailyCost extends Record<string, unknown> {
  day: string;
  cost_micro: string;
  calls: number;
}

export default async function AdminDashboard() {
  const data = await withAdmin(async (client) => {
    const [totals] = (
      await client.query<Totals>(`
        select
          (select count(*) from users)::int as users,
          (select count(*) from users where created_at > now() - interval '7 days')::int as users_7d,
          (select count(distinct user_id) from messages where created_at > now() - interval '7 days')::int as active_7d,
          (select count(*) from nodes)::int as nodes,
          (select count(*) from conversations)::int as conversations,
          (select count(*) from purchases where status = 'paid')::int as paid_count,
          (select coalesce(sum(amount_ron), 0) from purchases where status = 'paid')::text as paid_ron,
          (select coalesce(sum(amount_ron), 0) from purchases
            where status = 'paid' and completed_at > now() - interval '30 days')::text as paid_ron_30d,
          (select coalesce(sum(cost_micro), 0) from usage_events)::text as cost_micro,
          (select coalesce(sum(cost_micro), 0) from usage_events
            where created_at > now() - interval '30 days')::text as cost_micro_30d,
          (select count(*) from usage_events where created_at > now() - interval '30 days')::int as calls_30d
      `)
    ).rows;

    const { rows: recentUsers } = await client.query<RecentUser>(`
      select u.id, u.email, u.created_at,
             coalesce(w.sessions_balance, 0) as sessions,
             coalesce(w.transformations_balance, 0) as transformations,
             (select count(*) from nodes n where n.user_id = u.id)::int as nodes,
             (select max(m.created_at) from messages m where m.user_id = u.id) as last_at
        from users u left join wallets w on w.user_id = u.id
       order by u.created_at desc
       limit 10
    `);

    const { rows: recentPurchases } = await client.query<RecentPurchase>(`
      select pu.user_id, u.email, p.name as pack_name, pu.amount_ron, pu.status, pu.created_at
        from purchases pu
        join users u on u.id = pu.user_id
        join packs p on p.code = pu.pack_code
       order by pu.created_at desc
       limit 10
    `);

    const { rows: adjustments } = await client.query<RecentAdjustment>(`
      select a.user_id, u.email, a.admin_email, a.sessions_delta, a.transformations_delta,
             a.note, a.created_at
        from wallet_adjustments a join users u on u.id = a.user_id
       order by a.created_at desc
       limit 10
    `);

    const { rows: daily } = await client.query<DailyCost>(`
      select date_trunc('day', created_at)::date::text as day,
             sum(cost_micro)::text as cost_micro, count(*)::int as calls
        from usage_events
       where created_at > now() - interval '14 days'
       group by 1 order by 1
    `);

    return { totals, recentUsers, recentPurchases, adjustments, daily };
  });

  const { totals } = data;
  const maxDaily = Math.max(1, ...data.daily.map((d) => Number(d.cost_micro)));

  const cards = [
    { label: "Utilizatori", value: totals.users, sub: `${totals.users_7d} noi în 7 zile` },
    { label: "Activi în 7 zile", value: totals.active_7d, sub: "au scris cel puțin o replică" },
    { label: "Încasări", value: lei(totals.paid_ron), sub: `${lei(totals.paid_ron_30d)} în 30 zile · ${totals.paid_count} plăți` },
    { label: "Cost model, 30 zile", value: usd(totals.cost_micro_30d), sub: `${totals.calls_30d} apeluri · ${usd(totals.cost_micro)} total` },
    { label: "Noduri pe hărți", value: totals.nodes, sub: `${totals.conversations} conversații` },
  ];

  return (
    <>
      <h1 className="font-serif text-3xl">Tablou</h1>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-ink-line p-5">
            <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-paper">{c.value}</p>
            <p className="mt-1 text-xs text-paper-faint">{c.sub}</p>
          </div>
        ))}
      </section>

      {data.daily.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Cost model pe zile, ultimele 14
          </h2>
          <div className="mt-4 flex h-28 items-end gap-1.5 rounded-2xl border border-ink-line p-4">
            {data.daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${usd(d.cost_micro)}, ${d.calls} apeluri`}
                className="flex w-full max-w-12 flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-t bg-paper-dim/70"
                  style={{ height: `${Math.max(3, (Number(d.cost_micro) / maxDaily) * 72)}px` }}
                />
                <span className="text-[10px] text-paper-faint">{dateShort(d.day)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Conturi noi
            </h2>
            <Link href="/admin/utilizatori" className="text-xs text-paper-dim underline underline-offset-4">
              toți utilizatorii
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line text-sm">
            {data.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/utilizatori/${u.id}`} className="min-w-0 truncate text-paper hover:underline">
                  {u.email}
                </Link>
                <span className="shrink-0 text-xs text-paper-faint">
                  {u.sessions} șed · {u.transformations} tr · {u.nodes} noduri · {ago(u.last_at)}
                </span>
              </li>
            ))}
            {data.recentUsers.length === 0 && (
              <li className="py-3 text-paper-faint">Niciun cont încă.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">Plăți</h2>
          <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line text-sm">
            {data.recentPurchases.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/utilizatori/${p.user_id}`} className="block truncate text-paper hover:underline">
                    {p.email}
                  </Link>
                  <span className="text-xs text-paper-faint">{p.pack_name}</span>
                </div>
                <span className="shrink-0 text-right text-xs text-paper-faint">
                  <span className={p.status === "paid" ? "text-paper" : ""}>{lei(p.amount_ron)}</span>
                  <br />
                  {p.status} · {dateShort(p.created_at)}
                </span>
              </li>
            ))}
            {data.recentPurchases.length === 0 && (
              <li className="py-3 text-paper-faint">Nicio plată încă.</li>
            )}
          </ul>
        </section>
      </div>

      {data.adjustments.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Credite adăugate de mână
          </h2>
          <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line text-sm">
            {data.adjustments.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/utilizatori/${a.user_id}`} className="block truncate text-paper hover:underline">
                    {a.email}
                  </Link>
                  <span className="text-xs text-paper-faint">
                    {a.note ?? "fără notă"} · de {a.admin_email}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-paper-faint">
                  {a.sessions_delta >= 0 ? "+" : ""}{a.sessions_delta} șed ·{" "}
                  {a.transformations_delta >= 0 ? "+" : ""}{a.transformations_delta} tr ·{" "}
                  {dateShort(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
