import { withAdmin } from "./db";

/**
 * Cifrele aplicației pentru mydashboard.ro (contractul comun din
 * mydashboard.ro/README.md: { project, generatedAt, kpi[], recent[] }).
 * Zilele sunt cele din România. Plățile și mesajele au RLS, deci totul se
 * citește în contextul de administrare.
 */

const PERIODS: Record<string, string> = {
  today: "date_trunc('day', now() at time zone 'Europe/Bucharest') at time zone 'Europe/Bucharest'",
  d7: "now() - interval '7 days'",
  d30: "now() - interval '30 days'",
  total: "'1970-01-01'::timestamptz",
};

interface KpiRow extends Record<string, unknown> {
  period: string;
  users: number;
  leads: number;
  emails: number;
  unsubscribes: number;
  converted: number;
  payers: number;
  orders: number;
  revenue: string;
  active: number;
}

interface RecentRow extends Record<string, unknown> {
  at: string;
  kind: "signup" | "lead" | "purchase";
  email: string;
  label: string | null;
  amount: string | null;
  status: string | null;
}

/** „a***@gmail.com”: destul ca să recunoști un cont, fără adresa întreagă. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

export async function statsMydashboard() {
  const { kpi, recent } = await withAdmin(async (client) => {
    const parts = Object.entries(PERIODS).map(
      ([key, since]) => `
        select '${key}' as period,
          (select count(*) from users where created_at >= ${since})::int as users,
          (select count(*) from leads where created_at >= ${since})::int as leads,
          (select count(*) from email_log where error is null and sent_at >= ${since})::int as emails,
          (select count(*) from email_unsubscribes where unsubscribed_at >= ${since})::int as unsubscribes,
          (select count(distinct p.user_id) from purchases p
             join (select user_id, min(sent_at) as at from email_log
                    where user_id is not null and error is null and kind <> 'post_purchase'
                    group by user_id) f on f.user_id = p.user_id
            where p.status = 'paid' and p.completed_at > f.at and p.completed_at >= ${since})::int as converted,
          (select count(distinct user_id) from purchases where status = 'paid' and completed_at >= ${since})::int as payers,
          (select count(*) from purchases where status = 'paid' and completed_at >= ${since})::int as orders,
          (select coalesce(sum(amount_ron), 0) from purchases where status = 'paid' and completed_at >= ${since})::text as revenue,
          (select count(distinct user_id) from messages where role = 'user' and created_at >= ${since})::int as active`,
    );
    const { rows } = await client.query<KpiRow>(parts.join(" union all "));

    const { rows: recent } = await client.query<RecentRow>(`
      (select created_at as at, 'signup' as kind, email, null as label, null as amount, null as status
         from users order by created_at desc limit 15)
      union all
      (select created_at, 'lead', email, source_page, null, null
         from leads order by created_at desc limit 15)
      union all
      (select coalesce(pu.completed_at, pu.created_at), 'purchase', u.email, pk.name, pu.amount_ron::text, pu.status::text
         from purchases pu join users u on u.id = pu.user_id join packs pk on pk.code = pu.pack_code
        order by coalesce(pu.completed_at, pu.created_at) desc limit 20)
      order by at desc
      limit 50
    `);

    return { kpi: Object.fromEntries(rows.map((r) => [r.period, r])), recent };
  });

  const row = (key: keyof KpiRow, label: string, unit: "count" | "money" | "percent", hint?: string) => ({
    key,
    label,
    unit,
    ...(hint && { hint }),
    today: Number(kpi.today[key]),
    d7: Number(kpi.d7[key]),
    d30: Number(kpi.d30[key]),
    total: Number(kpi.total[key]),
  });

  return {
    project: "tiparementale",
    generatedAt: new Date().toISOString(),
    currency: "RON",
    kpi: [
      row("users", "Conturi noi", "count"),
      row("leads", "Vizitatori care au cerut lecția", "count", "formularul de pe site, cu acord"),
      row("emails", "E-mailuri trimise", "count", "bun venit, ziua 1/3/7, după plată, revenire, vizitatori"),
      row("unsubscribes", "Dezabonări", "count"),
      row("converted", "Au plătit după un e-mail", "count", "plată după primul e-mail primit; ordine în timp, nu atribuire"),
      row("payers", "Clienți plătitori", "count"),
      row("orders", "Pachete vândute", "count", "plăți confirmate"),
      row("revenue", "Încasat în aplicație", "money", "aceleași plăți vin și din Stripe (project=tiparementale)"),
      row("active", "Oameni care au scris", "count", "cel puțin o replică în perioadă"),
    ],
    recent: recent.map((r) => ({
      at: new Date(r.at).toISOString(),
      title:
        r.kind === "signup"
          ? `Cont nou: ${maskEmail(r.email)}`
          : r.kind === "lead"
            ? `Lecție cerută: ${maskEmail(r.email)}`
            : `${r.label ?? "Pachet"}: ${maskEmail(r.email)}`,
      detail: r.kind === "lead" ? (r.label ? `de pe ${r.label}` : null) : null,
      amount: r.amount === null ? null : Number(r.amount),
      ...(r.kind === "purchase" && r.status ? { status: r.status } : {}),
    })),
  };
}
