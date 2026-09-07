import Stripe from "stripe";

/**
 * Clientul Stripe, inițializat leneș: cheia trebuie să existe la rulare, nu la
 * build, iar aplicația trebuie să pornească și fără ea — plățile sunt o parte
 * din produs, nu o condiție ca harta să funcționeze.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Lipsește STRIPE_SECRET_KEY");
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
