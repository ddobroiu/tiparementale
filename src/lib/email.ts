import { Resend } from "resend";

import { SITE } from "@/lib/site";

/**
 * E-mailurile pe care le trimite platforma: bun venit, resetarea parolei,
 * confirmarea unei cumpărări.
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

interface EmailContent {
  to: string;
  subject: string;
  /** Titlul mare din e-mail. */
  heading: string;
  /** Paragrafele, text simplu; se scapă la randare. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Rândul mic de la final, de obicei „dacă n-ai cerut tu asta…”. */
  footnote?: string;
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
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9aa8">${escapeHtml(SITE.name)} · <a href="${SITE.url}" style="color:#9a9aa8">${SITE.domain}</a> · <a href="mailto:${SITE.email}" style="color:#9a9aa8">${SITE.email}</a><br>Nu este terapie. Este un instrument de auto-observație.</p>
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
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return { html, text };
}

/** Trimite și spune dacă a reușit. Nu aruncă niciodată. */
export async function sendEmail(content: EmailContent): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`[email] RESEND_API_KEY lipsește; nu s-a trimis „${content.subject}” către ${content.to}`);
    return false;
  }

  const { html, text } = render(content);

  try {
    const { error } = await resend().emails.send({
      from: FROM,
      to: content.to,
      replyTo: SITE.email,
      subject: content.subject,
      html,
      text,
    });

    if (error) {
      console.error(`[email] ${error.name}: ${error.message} (către ${content.to})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] trimitere eșuată:", error);
    return false;
  }
}

// ---------------------------------------------------------------- mesajele

export function sendWelcomeEmail(to: string, mapUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Harta ta a pornit",
    heading: "Bine ai venit. Harta ta e goală, și asta e bine.",
    paragraphs: [
      "Lecția introductivă e gratuită: zece minute despre un singur lucru pe care îl faci mereu, deși te costă. Răspunde cum îți vine. Din ce spui, prima ta convingere apare pe hartă — cu citatul din care a fost dedusă.",
      "Fiecare punct de pe hartă păstrează citatul exact din care a fost dedus. Poți confirma, respinge sau reformula orice. Nimic nu se hotărăște peste tine.",
      "Ce scrii rămâne al tău: poți exporta sau șterge tot, oricând, din setări.",
    ],
    cta: { label: "Deschide harta", url: mapUrl },
    footnote:
      "Primești acest mesaj pentru că ți-ai creat un cont pe tiparementale.ro. Dacă n-ai fost tu, răspunde la acest e-mail și ștergem contul.",
  });
}

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
      "Factura vine separat, de la Stripe, pe această adresă.",
    ],
    cta: { label: "Deschide harta", url: mapUrl },
    footnote: "Ai o întrebare despre plată sau program? Răspunde la acest e-mail.",
  });
}
