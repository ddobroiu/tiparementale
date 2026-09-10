import { UsersTable } from "@/components/admin/UsersTable";
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

  const rows = await withAdmin(async (client) => {
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

  // Formatarea se face aici, pe server: componenta de listă primește text gata
  // de afișat și nu are nevoie de nimic din bibliotecile de server.
  const users = rows.map((u) => ({
    id: u.id,
    email: u.email,
    created: dateShort(u.created_at),
    active: ago(u.last_at),
    sessions: u.sessions,
    transformations: u.transformations,
    nodes: u.nodes,
    conversations: u.conversations,
    paid: Number(u.paid_ron) > 0 ? lei(u.paid_ron) : "—",
    cost: usd(u.cost_used_micro),
  }));

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
        „+ Credite” adaugă direct din listă; e-mailul deschide pagina contului.
      </p>

      <div className="mt-6">
        <UsersTable users={users} needle={needle} />
      </div>
    </>
  );
}
