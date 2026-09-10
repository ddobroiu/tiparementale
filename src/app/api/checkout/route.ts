import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getPack } from "@/lib/billing/packs";
import { appUrl, stripe, stripeConfigured } from "@/lib/billing/stripe";
import { withUser } from "@/lib/db";
import { readMetaClient, sendMetaEvent } from "@/lib/meta/capi";

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

  // Ce știm despre vizitator acum se pune în metadatele Stripe: webhook-ul
  // vine de la Stripe, fără cookie-uri, și fără asta n-ar avea ce trimite la
  // Meta când confirmă plata.
  const meta = readMetaClient(request);
  const eventId = typeof body?.eventId === "string" ? body.eventId.slice(0, 64) : "";

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
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
    success_url: `${appUrl()}/harta?plata=reusita`,
    cancel_url: `${appUrl()}/pachete?plata=anulata`,
    metadata: {
      userId: user.id,
      pack: pack.code,
      metaConsent: meta.consent ?? "",
      metaFbp: meta.fbp ?? "",
      metaFbc: meta.fbc ?? "",
      metaIp: meta.ip ?? "",
      metaUa: (meta.userAgent ?? "").slice(0, 500),
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
      `insert into purchases (user_id, pack_code, provider_ref, amount_ron)
       values ($1, $2, $3, $4)`,
      [user.id, pack.code, session.id, pack.priceRon],
    ),
  );

  return NextResponse.json({ url: session.url });
}
