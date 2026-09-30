import { dateTime } from "@/lib/admin";
import { query, withAdmin } from "@/lib/db";
import { EMAIL_KINDS } from "@/lib/lifecycle/send";

/**
 * E-mailurile după înscriere: câte au plecat din fiecare fel în ultimele 30 de
 * zile, câte au eșuat, câți vizitatori au cerut lecția, câți s-au dezabonat și
 * câți oameni au plătit după ce au primit un e-mail. „După” înseamnă doar
 * ordinea în timp, nu că e-mailul i-a convins — cifra e un reper, nu o
 * atribuire.
 */

const LABELS: Record<string, string> = {
  welcome: "Bun venit",
  day1: "Ziua 1 — fără prima conversație",
  day3: "Ziua 3 — progres",
  day7: "Ziua 7 — pachete (fără plată)",
  post_purchase: "După plată (ziua următoare)",
  reengage: "Revenire după 30 de zile",
  lead_welcome: "Vizitator — lecția pe e-mail",
  lead_followup: "Vizitator — invitație la cont (ziua 3)",
};

interface KindRow extends Record<string, unknown> {
  kind: string;
  sent: number;
  failed: number;
}

interface Totals extends Record<string, unknown> {
  launched_at: string | null;
  leads: number;
  leads_30d: number;
  leads_with_account: number;
  unsubscribes: number;
  unsubscribes_30d: number;
  opted_out_at_signup: number;
  converted_users: number;
  converted_ron: string;
}

export default async function AdminEmailuri() {
  const kinds = await query<KindRow>(`
    select kind,
           (count(*) filter (where error is null))::int as sent,
           (count(*) filter (where error is not null))::int as failed
      from email_log
     where sent_at > now() - interval '30 days'
     group by kind
  `);

  // Plățile au RLS: citirea peste toți utilizatorii cere contextul de admin.
  const [totals] = await withAdmin(async (client) =>
    (
      await client.query<Totals>(`
        with first_email as (
          select user_id, min(sent_at) as at
            from email_log
           where user_id is not null and error is null and kind <> 'post_purchase'
           group by user_id
        ),
        converted as (
          select p.user_id, sum(p.amount_ron) as ron
            from purchases p join first_email f on f.user_id = p.user_id
           where p.status = 'paid' and p.completed_at > f.at
           group by p.user_id
        )
        select
          (select lifecycle_launched_at from email_settings limit 1)::text as launched_at,
          (select count(*) from leads)::int as leads,
          (select count(*) from leads where created_at > now() - interval '30 days')::int as leads_30d,
          (select count(*) from leads l
            where exists (select 1 from users u
                           where lower(u.email) = lower(l.email) and u.created_at > l.created_at))::int
            as leads_with_account,
          (select count(*) from email_unsubscribes)::int as unsubscribes,
          (select count(*) from email_unsubscribes
            where unsubscribed_at > now() - interval '30 days')::int as unsubscribes_30d,
          (select count(*) from users u cross join email_settings s
            where u.created_at >= s.lifecycle_launched_at and u.marketing_opt_out
              and u.marketing_choice_at <= u.created_at + interval '1 minute')::int as opted_out_at_signup,
          (select count(*) from converted)::int as converted_users,
          (select coalesce(sum(ron), 0) from converted)::text as converted_ron
      `)
    ).rows,
  );

  const byKind = new Map(kinds.map((k) => [k.kind, k]));

  const cards = [
    { label: "Vizitatori care au cerut lecția", value: totals.leads, sub: `${totals.leads_30d} în 30 zile · ${totals.leads_with_account} și-au făcut cont după` },
    { label: "Dezabonări", value: totals.unsubscribes, sub: `${totals.unsubscribes_30d} în 30 zile · ${totals.opted_out_at_signup} au refuzat la înscriere` },
    { label: "Au plătit după un e-mail", value: totals.converted_users, sub: `${Number(totals.converted_ron).toLocaleString("ro-RO")} lei · ordine în timp, nu atribuire` },
  ];

  return (
    <>
      <h1 className="font-serif text-3xl">E-mailuri</h1>
      <p className="mt-2 text-sm text-paper-faint">
        Lansare: {dateTime(totals.launched_at)} — doar conturile și vizitatorii de după această dată primesc
        e-mailurile periodice.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-ink-line p-5">
            <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-paper">{c.value}</p>
            <p className="mt-1 text-xs text-paper-faint">{c.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
          Trimise în ultimele 30 de zile, pe feluri
        </h2>
        <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line text-sm">
          {EMAIL_KINDS.map((kind) => {
            const row = byKind.get(kind);
            return (
              <li key={kind} className="flex items-center justify-between gap-3 py-3">
                <span className="text-paper">{LABELS[kind] ?? kind}</span>
                <span className="shrink-0 text-xs text-paper-faint">
                  <span className="text-paper">{row?.sent ?? 0}</span> trimise
                  {row?.failed ? ` · ${row.failed} eșuate` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
