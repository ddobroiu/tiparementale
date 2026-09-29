import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getPack } from "@/lib/billing/packs";
import { appUrl, stripe, stripeConfigured } from "@/lib/billing/stripe";
import { withUser } from "@/lib/db";
import { LEGAL_VERSION } from "@/lib/legal";
import { readMetaClient, sendMetaEvent } from "@/lib/meta/capi";
import { CONSENT_COOKIE, parseConsentCookie } from "@/lib/meta/consent";
import { clientIp, tiktokCheckoutMetadata } from "@/lib/tiktok-events";

/** Un cookie din cerere (vizitatorul mydashboard, `_md_vid`), ca plata să fie legată de sursa vizitei. */
function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name && v.length) return decodeURIComponent(v.join("=")).slice(0, 64);
  }
  return null;
}

/**
 * Pornește plata unui pachet.
 *
 * Prețul se ia din baza noastră, nu din ce trimite clientul: altfel oricine ar
 * putea cumpăra douăzeci de ședințe cu un leu, schimbând suma în cerere.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Plățile nu sunt încă active. Revino în curând." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const pack = typeof body?.pack === "string" ? await getPack(body.pack) : null;

  if (!pack) {
    return NextResponse.json({ error: "Pachet inexistent" }, { status: 400 });
  }

  // Acordul cu termenii și cererea de executare imediată (cu pierderea
  // dreptului de retragere, OUG 34/2014 art. 16 lit. a și m) se bifează
  // înainte de plată; fără el nu pornim nicio plată.
  if (body?.consent !== true) {
    return NextResponse.json(
      { error: "Bifează acordul cu Termenii și condițiile ca să continui." },
      { status: 400 },
    );
  }
  const consentAt = new Date();

  // Ce știm despre vizitator acum se pune în metadatele Stripe: webhook-ul
  // vine de la Stripe, fără cookie-uri, și fără asta n-ar avea ce trimite la
  // Meta când confirmă plata.
  const meta = readMetaClient(request);
  const eventId = typeof body?.eventId === "string" ? body.eventId.slice(0, 64) : "";

  // Contul Stripe „Applications” e comun aplicatiilor: eticheta de proiect separa platile in mydashboard.
  // Vizitatorul mydashboard se trimite doar cu acord pentru cookie-uri analitice.
  const consentChoice = parseConsentCookie(readCookie(request, CONSENT_COOKIE));
  const analyticsOk = Boolean(consentChoice?.analytics);
  const mdVid = analyticsOk ? readCookie(request, "_md_vid") : null;
  const tag = {
    project: "tiparementale",
    ...(mdVid && { md_vid: mdVid }),
  };
  // TikTok Events API (lib/tiktok-events.ts): acordul + _ttp/ttclid/IP/UA, doar cu acord de marketing
  const jar = await cookies();
  const tiktok = tiktokCheckoutMetadata({
    marketing: Boolean(consentChoice?.marketing),
    ttp: jar.get("_ttp")?.value,
    ttclid: jar.get("tt_ttclid")?.value,
    ip: clientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    // Numele, adresa si (pentru firme) CUI-ul pentru factura Oblio
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    payment_intent_data: { metadata: { ...tag, userId: user.id, pack: pack.code } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "ron",
          unit_amount: Math.round(pack.priceRon * 100),
          product_data: {
            name: `Tipare Mentale — ${pack.name}`,
            description:
              `${pack.sessions} ședințe și ${pack.transformations} lucrări de ` +
              "transformare. Nu expiră.",
          },
        },
      },
    ],
    success_url: `${appUrl()}/harta?plata=reusita&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/pachete?plata=anulata`,
    metadata: {
      ...tag,
      userId: user.id,
      pack: pack.code,
      termsAccepted: "true",
      withdrawalWaiver: "true",
      termsVersion: LEGAL_VERSION,
      consentAt: consentAt.toISOString(),
      metaConsent: meta.consent ?? "",
      metaFbp: meta.fbp ?? "",
      metaFbc: meta.fbc ?? "",
      metaIp: meta.ip ?? "",
      metaUa: (meta.userAgent ?? "").slice(0, 500),
      ...tiktok,
    },
  });

  if (eventId) {
    // Nu așteptăm răspunsul Meta ca să dăm link-ul de plată.
    void sendMetaEvent({
      name: "InitiateCheckout",
      eventId,
      email: user.email,
      externalId: user.id,
      client: meta,
      customData: {
        content_ids: [pack.code],
        content_type: "product",
        value: pack.priceRon,
        currency: "RON",
      },
    });
  }

  // Cumpărarea se înregistrează ca „pending" acum, ca webhook-ul să aibă ce
  // confirma. Fără rândul acesta, o plată reușită nu ar avea unde să aterizeze.
  await withUser(user.id, (client) =>
    client.query(
      `insert into purchases (user_id, pack_code, provider_ref, amount_ron, consent_at, terms_version)
       values ($1, $2, $3, $4, $5, $6)`,
      [user.id, pack.code, session.id, pack.priceRon, consentAt, LEGAL_VERSION],
    ),
  );

  return NextResponse.json({ url: session.url });
}
