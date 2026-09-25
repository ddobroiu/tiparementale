import { NextResponse } from "next/server";

import { creditPurchase } from "@/lib/billing/packs";
import { appUrl, stripe, stripeConfigured } from "@/lib/billing/stripe";
import { query, withUser } from "@/lib/db";
import { sendPurchaseEmail } from "@/lib/email";
import { isOblioConfigured, issueInvoice } from "@/lib/billing/oblio";
import { sendMetaEvent } from "@/lib/meta/capi";
import { parseConsent } from "@/lib/meta/consent";
import { alerta } from "@/lib/alerts";

/**
 * Confirmarea plății, venită de la Stripe.
 *
 * Nu ne bazăm pe întoarcerea utilizatorului în `success_url`: acolo poate să
 * nu ajungă niciodată — închide fereastra, pică netul — iar plata ar rămâne
 * neonorată. Webhook-ul este singurul loc unde se creditează portofelul.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Plățile nu sunt configurate" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Semnătură lipsă" }, { status: 400 });
  }

  // Corpul brut, nu cel parsat: semnătura se verifică pe octeții exacți.
  const payload = await request.text();

  let event;
  try {
    event = stripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    // O semnătură invalidă înseamnă că cererea nu vine de la Stripe.
    return NextResponse.json({ error: "Semnătură invalidă" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const userId = session.metadata?.userId;

  if (!userId) {
    return NextResponse.json({ received: true });
  }
  // contul Stripe e comun aplicatiilor: evenimentele altor proiecte nu sunt ale noastre
  if (session.metadata?.project && session.metadata.project !== "tiparementale") {
    return NextResponse.json({ received: true });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  let result;
  try {
    result = await withUser(userId, (client) => creditPurchase(client, session.id));
  } catch (error: unknown) {
    // Aceeasi cale 500 ca inainte (Stripe reincearca), dar proprietarul afla.
    const message = error instanceof Error ? error.message : String(error);
    void alerta("error", "stripe-webhook", `Tipare Mentale: plata ${session.id} nu a putut fi procesata: ${message}`);
    throw error;
  }

  // Confirmarea pe e-mail pleacă o singură dată, la prima creditare. Dacă nu
  // ajunge, portofelul e oricum creditat: e-mailul e informare, nu dovadă.
  if (result.credited) {
    const [user] = await query<{ email: string }>("select email from users where id = $1", [
      userId,
    ]);
    const packCode = session.metadata?.pack;
    const [pack] = packCode
      ? await query<{ name: string; sessions: number; transformations: number }>(
          "select name, sessions, transformations from packs where code = $1",
          [packCode],
        )
      : [];
    // Factura Oblio pe datele cerute de Stripe la plata; nu blocheaza niciodata creditarea
    let invoiceUrl: string | null = null;
    if (isOblioConfigured()) {
      try {
        const inv = await issueInvoice(session, {
          name: `Tipare Mentale - ${pack?.name ?? "pachet"}`,
          amountCents: session.amount_total ?? 0,
          currency: session.currency ?? "ron",
        });
        invoiceUrl = inv.url;
        await withUser(userId, (client) =>
          client.query(
            `update purchases set invoice_series = $2, invoice_number = $3, invoice_url = $4, invoice_error = null where provider_ref = $1`,
            [session.id, inv.series, inv.number, inv.url],
          ),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[oblio] factura:", session.id, message);
        void alerta("error", "oblio", `Tipare Mentale: factura Oblio nu s-a emis pentru plata ${session.id}: ${message}`);
        await withUser(userId, (client) =>
          client.query(`update purchases set invoice_error = $2 where provider_ref = $1`, [session.id, message.slice(0, 500)]),
        ).catch(() => {});
      }
    }
    if (user) await sendPurchaseEmail(user.email, pack ?? null, `${appUrl()}/harta`, invoiceUrl);

    // Cumpărarea se raportează la Meta doar de aici și doar o dată (la prima
    // creditare), cu ID-ul sesiunii Stripe ca `event_id`. Consimțământul și
    // cookie-urile Meta au fost salvate la pornirea plății.
    const m = session.metadata ?? {};
    void sendMetaEvent({
      name: "Purchase",
      eventId: session.id,
      email: user?.email ?? session.customer_email,
      externalId: userId,
      client: {
        consent: parseConsent(m.metaConsent),
        fbp: m.metaFbp || null,
        fbc: m.metaFbc || null,
        ip: m.metaIp || null,
        userAgent: m.metaUa || null,
        sourceUrl: `${appUrl()}/pachete`,
      },
      customData: {
        content_ids: packCode ? [packCode] : undefined,
        content_type: "product",
        value: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "ron").toUpperCase(),
      },
    });
  }

  // `credited: false` înseamnă că plata fusese deja onorată. Stripe retrimite
  // același eveniment prin proiectare, deci este starea normală, nu o eroare.
  return NextResponse.json({ received: true, credited: result.credited });
}
