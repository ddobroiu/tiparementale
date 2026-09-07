import { NextResponse } from "next/server";

import { creditPurchase } from "@/lib/billing/packs";
import { stripe, stripeConfigured } from "@/lib/billing/stripe";
import { withUser } from "@/lib/db";

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

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const result = await withUser(userId, (client) => creditPurchase(client, session.id));

  // `credited: false` înseamnă că plata fusese deja onorată. Stripe retrimite
  // același eveniment prin proiectare, deci este starea normală, nu o eroare.
  return NextResponse.json({ received: true, credited: result.credited });
}
