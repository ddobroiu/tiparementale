/**
 * Capturi de ecran la dimensiune de telefon, ca să vedem ce vede omul, nu ce
 * credem că vede. Creează un cont de probă, pune câteva noduri pe hartă,
 * fotografiază fiecare stare importantă și șterge contul la final.
 *
 *   node --env-file=.env.local scripts/shots-mobile.mjs [outDir] [baseUrl]
 */
import { chromium, devices } from "playwright";
import pg from "pg";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = process.argv[2] ?? "shots";
const BASE = process.argv[3] ?? "http://localhost:3000";
const EMAIL = `mobil.${Date.now()}@test.local`;
const PASSWORD = "parola-de-proba-123";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 14"], locale: "ro-RO" });
const page = await context.newPage();

// Ecusonul de dezvoltare al Next stă în colțul de jos și interceptează atingerile
// exact peste bara noastră. În producție nu există; aici îl ascundem.
await context.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal{display:none!important}";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});

async function shot(name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 600);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.full ?? false });
  console.log("  ✓", name);
}

console.log("Pagini publice");
await page.goto(`${BASE}/`);
await shot("01-acasa", { full: true });
await page.goto(`${BASE}/pachete`);
await shot("02-pachete", { full: true });
await page.goto(`${BASE}/articole/convingeri-limitative`);
await shot("03-articol");
await page.goto(`${BASE}/intra`);
await shot("04-intra");

console.log("Cont și hartă");
await page.evaluate(
  async ({ email, password }) => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email, password }),
    });
  },
  { email: EMAIL, password: PASSWORD },
);

await page.goto(`${BASE}/harta`);
await shot("05-harta-goala");

// Câteva noduri, ca harta să aibă ce arăta.
const seeds = [
  { label: "Dacă nu iese perfect, mai bine nu o fac deloc", type: "belief", domain: "self", schema_code: "unrelenting_standards" },
  { label: "Dacă cer ajutor, înseamnă că nu mă descurc", type: "belief", domain: "work", schema_code: "dependence" },
  { label: "Banii se pot termina oricând", type: "fear", domain: "money", schema_code: "vulnerability" },
  { label: "Mă retrag când simt că vine respingerea", type: "pattern", domain: "relationships", schema_code: "abandonment" },
  { label: "Vreau să lucrez fără vinovăție", type: "goal", domain: "work" },
  { label: "Libertatea de a alege", type: "value", domain: "meaning" },
];
for (const s of seeds) {
  await page.evaluate(async (body) => {
    await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, s);
}

await page.goto(`${BASE}/harta`);
await shot("06-harta-cu-noduri", { wait: 1200 });

// Pe telefon, selectorul e o foaie care se ridică din bara de jos.
await page.getByRole("button", { name: "Începe o ședință" }).click();
await page.waitForTimeout(500);
await shot("06b-foaie-teme");
// Selectorul există de două ori în DOM (varianta de ecran mare e doar ascunsă):
// atingem-o pe cea vizibilă.
const visible = (text) => page.getByText(text).filter({ visible: true }).first();
await visible("De unde vin tiparele mele").click();
await shot("07-teme");

// Chat deschis, pe o temă (consumă ședința gratuită; contul se șterge oricum).
await visible("Casa în care ai crescut").click();
await page.waitForTimeout(1500);
await shot("08-chat-deschis");

// Închide chatul, deschide un nod.
await page.getByText("Închide").first().click();
await page.waitForTimeout(800);
await page.locator("svg g.cursor-pointer").first().click();
// Panoul aduce nodul, citatele și exercițiile din API: lăsăm timp să sosească.
await page.getByText("Din ce am dedus").waitFor({ timeout: 8000 }).catch(() => {});
await shot("09-nod-deschis", { wait: 400 });

await page.goto(`${BASE}/setari`);
await shot("10-setari", { full: true });

await browser.close();

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();
await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
await admin.end();
console.log("\n✓ Capturi în", path.resolve(OUT), "— cont de probă șters.");
