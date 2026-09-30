import { Resend } from "resend";

import { alerta } from "@/lib/alerts";
import { SITE } from "@/lib/site";

/**
 * E-mailurile pe care le trimite platforma: resetarea parolei, confirmarea
 * unei cumpărări și, prin src/lib/lifecycle, cele de după înscriere.
 *
 * Niciun flux nu depinde de e-mail ca să reușească: contul se creează și
 * plata se creditează chiar dacă serverul de e-mail e jos. Trimiterea eșuată
 * se scrie în jurnal și atât. Singura excepție e resetarea parolei, unde
 * e-mailul *este* fluxul — acolo apelantul primește `false` și îi spune
 * omului să încerce din nou.
 */

const FROM = process.env.EMAIL_FROM ?? `${SITE.name} <${SITE.email}>`;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let client: Resend | null = null;

/** Clientul se face la prima trimitere, nu la încărcarea modulului: build-ul nu are cheia. */
function resend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface EmailContent {
  to: string;
  subject: string;
  /** Titlul mare din e-mail. */
  heading: string;
  /** Paragrafele, text simplu; se scapă la randare. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Rândul mic de la final, de obicei „dacă n-ai cerut tu asta…”. */
  footnote?: string;
  /**
   * Linkul de dezabonare, pentru e-mailurile care nu sunt strict de serviciu.
   * Apare în subsol și pleacă și în antetele List-Unsubscribe (un click, RFC
   * 8058), ca Gmail și ceilalți să arate butonul lor de dezabonare.
   */
  unsubscribe?: { pageUrl: string; oneClickUrl: string };
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Un singur șablon pentru toate mesajele: fundal deschis (e-mailul se citește
 * în clienți cu setări impredictibile, întunecatul iese prost), un titlu cu
 * serife ca pe site, un buton, un subsol discret. Stiluri inline — clienții
 * de e-mail nu respectă foile de stil.
 */
function render(content: EmailContent): { html: string; text: string } {
  const paragraphs = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2b2b33">${escapeHtml(p)}</p>`,
    )
    .join("");

  const cta = content.cta
    ? `<p style="margin:28px 0"><a href="${escapeHtml(content.cta.url)}" style="display:inline-block;background:#0a0a0f;color:#f4f3f0;text-decoration:none;font-size:15px;font-weight:500;padding:14px 24px;border-radius:12px">${escapeHtml(content.cta.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#7a7a88">Dacă butonul nu merge, deschide adresa: <a href="${escapeHtml(content.cta.url)}" style="color:#5b4fcf;word-break:break-all">${escapeHtml(content.cta.url)}</a></p>`
    : "";

  const footnote = content.footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#7a7a88">${escapeHtml(content.footnote)}</p>`
    : "";

  const unsubscribe = content.unsubscribe
    ? `<br>Nu mai vrei aceste e-mailuri? <a href="${escapeHtml(content.unsubscribe.pageUrl)}" style="color:#9a9aa8">Dezabonează-te</a>.`
    : "";

  const html = `<!doctype html>
<html lang="ro">
<body style="margin:0;padding:0;background:#f4f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e6e4df">
        <tr><td style="padding:32px 32px 8px">
          <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#0a0a0f">Tipare <span style="color:#7a7a88">Mentale</span></p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.25;color:#0a0a0f">${escapeHtml(content.heading)}</h1>
          ${paragraphs}
          ${cta}
          ${footnote}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #e6e4df">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9aa8">${escapeHtml(SITE.name)} · <a href="${SITE.url}" style="color:#9a9aa8">${SITE.domain}</a> · <a href="mailto:${SITE.email}" style="color:#9a9aa8">${SITE.email}</a><br>Nu este terapie. Este un instrument de auto-observație.${unsubscribe}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs,
    content.cta ? `\n${content.cta.label}: ${content.cta.url}` : "",
    content.footnote ? `\n${content.footnote}` : "",
    "",
    `${SITE.name} · ${SITE.url} · ${SITE.email}`,
    "Nu este terapie. Este un instrument de auto-observație.",
    content.unsubscribe ? `Dezabonare: ${content.unsubscribe.pageUrl}` : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return { html, text };
}

export interface SendResult {
  ok: boolean;
  /** Id-ul mesajului la Resend, când a plecat. */
  id: string | null;
  error: string | null;
}

/** Trimite și spune ce s-a întâmplat, cu id-ul de la Resend. Nu aruncă niciodată. */
export async function sendEmailResult(content: EmailContent): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn(`[email] RESEND_API_KEY lipsește; nu s-a trimis „${content.subject}” către ${content.to}`);
    return { ok: false, id: null, error: "RESEND_API_KEY lipsește" };
  }

  const { html, text } = render(content);

  try {
    const { data, error } = await resend().emails.send({
      from: FROM,
      to: content.to,
      replyTo: SITE.email,
      subject: content.subject,
      html,
      text,
      ...(content.unsubscribe && {
        headers: {
          "List-Unsubscribe": `<${content.unsubscribe.oneClickUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });

    if (error) {
      console.error(`[email] ${error.name}: ${error.message} (către ${content.to})`);
      void alerta("error", "resend", `Tipare Mentale: e-mailul „${content.subject}” nu a plecat: ${error.name}: ${error.message}`);
      return { ok: false, id: null, error: `${error.name}: ${error.message}` };
    }
    return { ok: true, id: data?.id ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[email] trimitere eșuată:", error);
    void alerta("error", "resend", `Tipare Mentale: e-mailul „${content.subject}” nu a plecat: ${message}`);
    return { ok: false, id: null, error: message };
  }
}

/** Trimite și spune dacă a reușit. Nu aruncă niciodată. */
export async function sendEmail(content: EmailContent): Promise<boolean> {
  return (await sendEmailResult(content)).ok;
}

// ---------------------------------------------------------------- mesajele

// Bun venit: vezi src/lib/lifecycle/messages.ts (trece prin jurnalul e-mailurilor).

export function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Parolă nouă pentru Tipare Mentale",
    heading: "Îți alegi o parolă nouă.",
    paragraphs: [
      "Ai cerut resetarea parolei. Linkul de mai jos e valabil o oră și merge o singură dată.",
    ],
    cta: { label: "Alege parola nouă", url: resetUrl },
    footnote:
      "Dacă n-ai cerut tu asta, ignoră mesajul: parola ta rămâne neschimbată și nimeni nu poate intra fără acest link.",
  });
}

export function sendPurchaseEmail(
  to: string,
  pack: { name: string; sessions: number; transformations: number } | null,
  mapUrl: string,
  invoiceUrl: string | null = null,
): Promise<boolean> {
  const what = pack
    ? `Programul „${pack.name}” e activ: ${pack.sessions} ședințe ghidate și ${pack.transformations} transformări, adăugate în contul tău.`
    : "Ședințele au fost adăugate în contul tău.";

  return sendEmail({
    to,
    subject: pack ? `Ai activat „${pack.name}”` : "Plata a fost confirmată",
    heading: "Mulțumim. Poți începe acum.",
    paragraphs: [
      what,
      "Nimic nu expiră. Lucrezi când ai spațiu pentru asta — o ședință pe săptămână lasă timp ca exercițiile să se așeze.",
      invoiceUrl
        ? `Factura o găsești aici: ${invoiceUrl}`
        : "Factura îți vine în scurt timp pe această adresă.",
    ],
    cta: { label: "Deschide harta", url: mapUrl },
    footnote: "Ai o întrebare despre plată sau program? Răspunde la acest e-mail.",
  });
}
