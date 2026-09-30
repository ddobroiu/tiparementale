import { appUrl } from "@/lib/billing/stripe";
import { query } from "@/lib/db";
import { sendEmailResult, type EmailContent } from "@/lib/email";

/**
 * Trimiterea cu jurnal: fiecare e-mail din ciclul de viață (bun venit, ziua 1,
 * ziua 3…) se rezervă întâi în `email_log`, apoi pleacă.
 *
 * Rezervarea e un `insert` pe un index unic (adresă, fel) care ignoră doar
 * rândurile eșuate. Dacă înscrierea și cronul încearcă același e-mail în
 * același timp, unul singur primește rândul; celălalt nu trimite nimic. Id-ul
 * rândului — aleator, negăsibil — devine linkul de dezabonare din mesaj.
 */

export type EmailKind =
  | "welcome"
  | "day1"
  | "day3"
  | "day7"
  | "post_purchase"
  | "reengage"
  | "lead_welcome"
  | "lead_followup";

export const EMAIL_KINDS: EmailKind[] = [
  "welcome",
  "day1",
  "day3",
  "day7",
  "post_purchase",
  "reengage",
  "lead_welcome",
  "lead_followup",
];

/** E-mailurile care nu intră în regula „cel mult unul la 48 de ore”. */
export const EXEMPT_FROM_SPACING: EmailKind[] = ["welcome", "lead_welcome"];

export function unsubscribeLinks(logId: string): { pageUrl: string; oneClickUrl: string } {
  const base = appUrl();
  return {
    pageUrl: `${base}/dezabonare?id=${logId}`,
    oneClickUrl: `${base}/api/dezabonare?id=${logId}`,
  };
}

export type LoggedResult = "sent" | "failed" | "duplicate";

interface Target {
  email: string;
  kind: EmailKind;
  userId?: string | null;
  leadId?: string | null;
}

/**
 * Rezervă, trimite, notează rezultatul. `build` primește linkurile de
 * dezabonare ale acestui mesaj. Nu aruncă pentru erorile de trimitere; o
 * eroare de bază de date urcă la apelant.
 */
export async function sendLogged(
  target: Target,
  build: (unsubscribe: { pageUrl: string; oneClickUrl: string }) => Omit<EmailContent, "to" | "unsubscribe">,
): Promise<LoggedResult> {
  const email = target.email.trim().toLowerCase();

  const rows = await query<{ id: string }>(
    `insert into email_log (email, kind, user_id, lead_id)
     values ($1, $2, $3, $4)
     on conflict ((lower(email)), kind) where error is null do nothing
     returning id`,
    [email, target.kind, target.userId ?? null, target.leadId ?? null],
  );
  const logId = rows[0]?.id;
  if (!logId) return "duplicate";

  const unsubscribe = unsubscribeLinks(logId);

  let result;
  try {
    result = await sendEmailResult({ ...build(unsubscribe), to: email, unsubscribe });
  } catch (error) {
    // `build` n-ar trebui să arunce; dacă o face, rândul nu rămâne „trimis”.
    result = { ok: false, id: null, error: error instanceof Error ? error.message : String(error) };
  }

  await query("update email_log set resend_id = $2, error = $3 where id = $1", [
    logId,
    result.id,
    result.ok ? null : (result.error ?? "necunoscut").slice(0, 500),
  ]);

  return result.ok ? "sent" : "failed";
}
