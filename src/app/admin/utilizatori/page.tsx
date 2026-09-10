import Link from "next/link";

import { ago, dateShort, lei, usd } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  created_at: string;
  sessions: number;
  transformations: number;
  cost_used_micro: string;
  nodes: number;
  conversations: number;
  last_at: string | null;
  paid_ron: string;
}

const LIMIT = 200;

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const needle = q.trim();

  const users = await withAdmin(async (client) => {
    const { rows } = await client.query<UserRow>(
      `select u.id, u.email, u.created_at,
              coalesce(w.sessions_balance, 0) as sessions,
              coalesce(w.transformations_balance, 0) as transformations,
              coalesce(w.cost_used_micro, 0)::text as cost_used_micro,
              (select count(*) from nodes n where n.user_id = u.id)::int as nodes,
              (select count(*) from conversations c where c.user_id = u.id)::int as conversations,
              (select max(m.created_at) from messages m where m.user_id = u.id) as last_at,
              (select coalesce(sum(amount_ron), 0) from purchases p
                where p.user_id = u.id and p.status = 'paid')::text as paid_ron
         from users u left join wallets w on w.user_id = u.id
        where $1 = '' or u.email ilike '%' || $1 || '%'
        order by u.created_at desc
        limit ${LIMIT}`,
      [needle],
    );
    return rows;
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl">Utilizatori</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={needle}
            placeholder="Caută după e-mail…"
            className="w-64 rounded-xl border border-ink-line bg-ink-soft px-4 py-2 text-sm text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
          />
          <button className="rounded-xl border border-ink-line px-4 py-2 text-sm text-paper-dim hover:border-paper-faint hover:text-paper">
            Caută
          </button>
        </form>
      </div>

      <p className="mt-2 text-xs text-paper-faint">
        {users.length === LIMIT ? `Primii ${LIMIT}. ` : `${users.length} conturi. `}
        Apasă pe un e-mail pentru detalii și credite.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-[11px] tracking-[0.12em] text-paper-faint uppercase">
            <tr className="border-b border-ink-line">
              <th className="px-4 py-3 font-normal">E-mail</th>
              <th className="px-4 py-3 font-normal">Creat</th>
              <th className="px-4 py-3 font-normal">Activ</th>
              <th className="px-4 py-3 text-right font-normal">Șed.</th>
              <th className="px-4 py-3 text-right font-normal">Transf.</th>
              <th className="px-4 py-3 text-right font-normal">Noduri</th>
              <th className="px-4 py-3 text-right font-normal">Conv.</th>
              <th className="px-4 py-3 text-right font-normal">Plătit</th>
              <th className="px-4 py-3 text-right font-normal">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-ink-soft/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/utilizatori/${u.id}`} className="text-paper hover:underline">
                    {u.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-paper-faint">{dateShort(u.created_at)}</td>
                <td className="px-4 py-3 text-paper-faint">{ago(u.last_at)}</td>
                <td className="px-4 py-3 text-right">{u.sessions}</td>
                <td className="px-4 py-3 text-right">{u.transformations}</td>
                <td className="px-4 py-3 text-right text-paper-dim">{u.nodes}</td>
                <td className="px-4 py-3 text-right text-paper-dim">{u.conversations}</td>
                <td className="px-4 py-3 text-right text-paper-dim">
                  {Number(u.paid_ron) > 0 ? lei(u.paid_ron) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-paper-faint">{usd(u.cost_used_micro)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-paper-faint">
                  Nimic pentru „{needle}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
