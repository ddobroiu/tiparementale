// Facturi Oblio, emise automat dupa o plata (copiat din PostingClips).
// Oblio invoices, issued automatically after a paid order.
// The buyer's name, address and (for companies) tax ID come from the Stripe
// Checkout session, which collects them on the payment page.
// Docs: https://www.oblio.eu/api
import type Stripe from "stripe";
const env = process.env;

const API = "https://www.oblio.eu/api";

export function isOblioConfigured(): boolean {
  return Boolean(env.OBLIO_CIF_FIRMA && env.OBLIO_CLIENT_ID && env.OBLIO_CLIENT_SECRET && env.OBLIO_SERIE_FACTURA);
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value;
  const res = await fetch(`${API}/authorize/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.OBLIO_CLIENT_ID, client_secret: env.OBLIO_CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`Oblio auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in?: number | string };
  token = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 - 60_000 };
  return token.value;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => ({}))) as { status?: number; statusMessage?: string; data?: T };
  if (!res.ok || (body.status && body.status !== 200)) {
    throw new Error(`Oblio ${path}: ${body.statusMessage ?? res.status}`);
  }
  return body.data as T;
}

// The company's own VAT setting in Oblio (e.g. a non-VAT payer has only its
// exempt rate), so invoices follow the company configuration instead of a
// hardcoded rate.
let vatRate: { name: string } | null | undefined;

async function defaultVatRate(): Promise<{ name: string } | null> {
  if (vatRate !== undefined) return vatRate;
  try {
    const rates = await call<{ name: string; percent?: number; default?: boolean }[]>(
      `/nomenclature/vat_rates?cif=${encodeURIComponent(env.OBLIO_CIF_FIRMA!)}`,
    );
    const pick = rates.find((r) => r.default) ?? rates[0];
    vatRate = pick ? { name: pick.name } : null;
  } catch (error: unknown) {
    console.error("[oblio] vat rates:", error);
    vatRate = null;
  }
  return vatRate;
}

export type IssuedInvoice = { series: string; number: string; url: string | null };

export async function issueInvoice(
  session: Stripe.Checkout.Session,
  line: { name: string; amountCents: number; currency: string },
): Promise<IssuedInvoice> {
  const buyer = session.customer_details;
  const address = buyer?.address;
  const country: string = (address?.country ?? "RO").toUpperCase();
  const taxId: string | undefined = buyer?.tax_ids?.[0]?.value ?? undefined;
  const vat = await defaultVatRate();
  // The invoice date is the Romanian calendar day (UTC would give yesterday between 00:00 and 03:00)
  const today: string = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());

  const invoice = await call<{ seriesName: string; number: string; link?: string }>("/docs/invoice", {
    method: "POST",
    body: JSON.stringify({
      cif: env.OBLIO_CIF_FIRMA,
      seriesName: env.OBLIO_SERIE_FACTURA,
      issueDate: today,
      dueDate: today,
      currency: line.currency.toUpperCase(),
      language: country === "RO" ? "RO" : "EN",
      precision: 2,
      useStock: 0,
      client: {
        name: buyer?.business_name || buyer?.name || buyer?.email || "Client",
        cif: taxId ?? "",
        address: [address?.line1, address?.line2].filter(Boolean).join(", "),
        city: address?.city ?? "",
        state: address?.state || address?.city || "",
        country,
        email: buyer?.email ?? undefined,
        save: 1,
      },
      products: [
        {
          name: line.name,
          price: line.amountCents / 100,
          quantity: 1,
          measuringUnit: "buc",
          productType: "Serviciu",
          currency: line.currency.toUpperCase(),
          vatIncluded: 1,
          ...(vat ? { vatName: vat.name } : {}),
        },
      ],
    }),
  });

  return { series: invoice.seriesName, number: invoice.number, url: invoice.link ?? null };
}
