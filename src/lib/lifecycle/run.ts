import { listPacks } from "@/lib/billing/packs";
import { withAdmin } from "@/lib/db";

import {
  day1Message,
  day3Message,
  day7Message,
  leadFollowupMessage,
  leadWelcomeMessage,
  postPurchaseMessage,
  reengageMessage,
  welcomeMessage,
} from "./messages";
import { EXEMPT_FROM_SPACING, sendLogged, type EmailKind } from "./send";
import { loadSnapshot } from "./snapshot";

/**
 * Cronul e-mailurilor: cine ce primește acum.
 *
 * Reguli, toate verificate aici, la fiecare rulare:
 *   - doar conturile și contactele create după lansare (`email_settings`);
 *   - niciodată cui a bifat „Nu vreau…”, s-a dezabonat sau e pe lista de
 *     dezabonări;
 *   - fiecare fel de e-mail o singură dată pe adresă (`email_log`);
 *   - cel mult un e-mail la 48 de ore pe adresă, în afară de bun venit;
 *   - fiecare fel are o fereastră: dacă cronul a stat oprit o săptămână, nu
 *     pleacă „ziua 1” cuiva care e de 10 zile în cont.
 */

const DAY = 24 * 60 * 60 * 1000;
const SPACING_MS = 48 * 60 * 60 * 1000;
const PAUSE_MS = 600;
/** După atâtea eșecuri ale aceluiași e-mail, nu se mai încearcă. */
const MAX_FAILURES = 3;

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  display_name: string | null;
  created_at: Date;
  acted: boolean;
  last_message_at: Date | null;
  last_paid_at: Date | null;
  sent: string[];
  failed: string[];
  last_spaced_at: Date | null;
}

interface LeadRow extends Record<string, unknown> {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  has_account: boolean;
  sent: string[];
  failed: string[];
  last_spaced_at: Date | null;
}

interface Job {
  kind: EmailKind;
  email: string;
  userId?: string;
  leadId?: string;
  name: string | null;
}

function pickUserKind(u: UserRow, now: number): EmailKind | null {
  const sent = new Set(u.sent);
  const age = now - new Date(u.created_at).getTime();
  const tooMany = (k: EmailKind) => u.failed.filter((f) => f === k).length >= MAX_FAILURES;
  const can = (k: EmailKind) => !sent.has(k) && !tooMany(k);

  if (can("welcome") && age < 2 * DAY) return "welcome";

  const spaced = u.last_spaced_at && now - new Date(u.last_spaced_at).getTime() < SPACING_MS;
  if (spaced) return null;

  const paidAt = u.last_paid_at ? new Date(u.last_paid_at).getTime() : null;
  if (paidAt && now - paidAt >= DAY && now - paidAt < 10 * DAY && can("post_purchase")) {
    return "post_purchase";
  }
  if (!u.acted && age >= DAY && age < 3 * DAY && can("day1")) return "day1";
  if (age >= 3 * DAY && age < 7 * DAY && can("day3")) return "day3";
  if (!paidAt && age >= 7 * DAY && age < 14 * DAY && can("day7")) return "day7";

  const lastActivity = Math.max(
    new Date(u.created_at).getTime(),
    u.last_message_at ? new Date(u.last_message_at).getTime() : 0,
    paidAt ?? 0,
  );
  if (now - lastActivity >= 30 * DAY && can("reengage")) return "reengage";

  return null;
}

function pickLeadKind(l: LeadRow, now: number): EmailKind | null {
  if (l.has_account) return null;
  const sent = new Set(l.sent);
  const age = now - new Date(l.created_at).getTime();
  const tooMany = (k: EmailKind) => l.failed.filter((f) => f === k).length >= MAX_FAILURES;
  const can = (k: EmailKind) => !sent.has(k) && !tooMany(k);

  if (can("lead_welcome") && age < 2 * DAY) return "lead_welcome";

  const spaced = l.last_spaced_at && now - new Date(l.last_spaced_at).getTime() < SPACING_MS;
  if (spaced) return null;

  if (age >= 3 * DAY && age < 14 * DAY && can("lead_followup")) return "lead_followup";
  return null;
}

const EXEMPT_KINDS_SQL = `(${EXEMPT_FROM_SPACING.map((k) => `'${k}'`).join(", ")})`;

async function collectJobs(): Promise<Job[]> {
  // Peste toți utilizatorii: mesajele și plățile au RLS, deci doar cu
  // `app.admin`. Tranzacția e scurtă — trimiterea se face în afara ei.
  const { users, leads } = await withAdmin(async (client) => {
    const { rows: users } = await client.query<UserRow>(`
      select u.id, u.email, u.display_name, u.created_at,
             exists (select 1 from messages m where m.user_id = u.id and m.role = 'user') as acted,
             (select max(m.created_at) from messages m where m.user_id = u.id) as last_message_at,
             (select max(p.completed_at) from purchases p
               where p.user_id = u.id and p.status = 'paid') as last_paid_at,
             array(select l.kind from email_log l
                    where lower(l.email) = lower(u.email) and l.error is null) as sent,
             array(select l.kind from email_log l
                    where lower(l.email) = lower(u.email) and l.error is not null) as failed,
             (select max(l.sent_at) from email_log l
               where lower(l.email) = lower(u.email) and l.error is null
                 and l.kind not in ${EXEMPT_KINDS_SQL}) as last_spaced_at
        from users u
        cross join email_settings s
       where u.created_at >= s.lifecycle_launched_at
         and not u.marketing_opt_out
         and not exists (select 1 from email_unsubscribes x where x.email = lower(u.email))
       order by u.created_at
    `);

    const { rows: leads } = await client.query<LeadRow>(`
      select l.id, l.email, l.name, l.created_at,
             exists (select 1 from users u where lower(u.email) = lower(l.email)) as has_account,
             array(select g.kind from email_log g
                    where lower(g.email) = lower(l.email) and g.error is null) as sent,
             array(select g.kind from email_log g
                    where lower(g.email) = lower(l.email) and g.error is not null) as failed,
             (select max(g.sent_at) from email_log g
               where lower(g.email) = lower(l.email) and g.error is null
                 and g.kind not in ${EXEMPT_KINDS_SQL}) as last_spaced_at
        from leads l
        cross join email_settings s
       where l.created_at >= s.lifecycle_launched_at
         and l.unsubscribed_at is null
         and not exists (select 1 from email_unsubscribes x where x.email = lower(l.email))
       order by l.created_at
    `);

    return { users, leads };
  });

  const now = Date.now();
  const jobs: Job[] = [];
  const seen = new Set<string>();

  for (const u of users) {
    const kind = pickUserKind(u, now);
    const email = u.email.toLowerCase();
    if (kind && !seen.has(email)) {
      seen.add(email);
      jobs.push({ kind, email, userId: u.id, name: u.display_name });
    }
  }
  for (const l of leads) {
    const kind = pickLeadKind(l, now);
    const email = l.email.toLowerCase();
    if (kind && !seen.has(email)) {
      seen.add(email);
      jobs.push({ kind, email, leadId: l.id, name: l.name });
    }
  }

  // Bun venit întâi: e cel așteptat „acum”.
  const order: EmailKind[] = [
    "welcome",
    "lead_welcome",
    "post_purchase",
    "day1",
    "day3",
    "day7",
    "lead_followup",
    "reengage",
  ];
  return jobs.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

export interface RunReport {
  dry: boolean;
  due: Partial<Record<EmailKind, number>>;
  sent: Partial<Record<EmailKind, number>>;
  failed: Partial<Record<EmailKind, number>>;
  skipped: number;
  remaining: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runLifecycle({ dry, limit }: { dry: boolean; limit: number }): Promise<RunReport> {
  const jobs = await collectJobs();
  const report: RunReport = { dry, due: {}, sent: {}, failed: {}, skipped: 0, remaining: 0 };

  for (const job of jobs) report.due[job.kind] = (report.due[job.kind] ?? 0) + 1;
  if (dry) {
    report.remaining = jobs.length;
    return report;
  }

  const batch = jobs.slice(0, limit);
  report.remaining = jobs.length - batch.length;

  // Pachetele se citesc o dată pe rulare, doar dacă e nevoie de ele.
  const packs = batch.some((j) => j.kind === "day7") ? await listPacks() : [];

  for (const [index, job] of batch.entries()) {
    if (index > 0) await sleep(PAUSE_MS);

    let result;
    try {
      const snapshot =
        job.userId && ["day3", "post_purchase", "reengage"].includes(job.kind)
          ? await loadSnapshot(job.userId)
          : null;

      result = await sendLogged(
        { email: job.email, kind: job.kind, userId: job.userId, leadId: job.leadId },
        () => {
          switch (job.kind) {
            case "welcome":
              return welcomeMessage(job.name);
            case "day1":
              return day1Message(job.name);
            case "day3":
              return day3Message(job.name, snapshot!);
            case "day7":
              return day7Message(job.name, packs);
            case "post_purchase":
              return postPurchaseMessage(job.name, snapshot!);
            case "reengage":
              return reengageMessage(job.name, snapshot!);
            case "lead_welcome":
              return leadWelcomeMessage(job.name);
            case "lead_followup":
              return leadFollowupMessage(job.name);
          }
        },
      );
    } catch (error) {
      console.error(`[lifecycle] ${job.kind} către ${job.email}:`, error);
      result = "failed" as const;
    }

    if (result === "sent") report.sent[job.kind] = (report.sent[job.kind] ?? 0) + 1;
    else if (result === "failed") report.failed[job.kind] = (report.failed[job.kind] ?? 0) + 1;
    else report.skipped += 1;
  }

  return report;
}

/** Folosit la înscriere: bun venit imediat, jurnalizat, fără să aștepte cronul. */
export async function sendWelcomeNow(user: { id: string; email: string; name: string | null }) {
  return sendLogged({ email: user.email, kind: "welcome", userId: user.id }, () =>
    welcomeMessage(user.name),
  );
}

/** Folosit la formularul pentru vizitatori: lecția promisă, imediat. */
export async function sendLeadWelcomeNow(lead: { id: string; email: string; name: string | null }) {
  return sendLogged({ email: lead.email, kind: "lead_welcome", leadId: lead.id }, () =>
    leadWelcomeMessage(lead.name),
  );
}
