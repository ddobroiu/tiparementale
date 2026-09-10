/**
 * Capturi ale zonei de administrare, pe ecran de calculator. Face un cont de
 * administrator de test (trebuie să fie în ADMIN_EMAILS) și un cont obișnuit
 * cu câteva noduri, fotografiază, apoi șterge ambele conturi.
 *
 *   node --env-file=.env.local scripts/shots-admin.mjs [outDir] [baseUrl]
 */
import { chromium } from "playwright";
import pg from "pg";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = process.argv[2] ?? "shots-admin";
const BASE = process.argv[3] ?? "http://localhost:3000";
const ADMIN_TEST = "admin.test@tiparementale.ro";
const USER = `admin-shots-${Date.now()}@resend.dev`;
const PASSWORD = "parola-de-proba-12345";

mkdirSync(OUT, { recursive: true });

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await db.connect();
await db.query("delete from tipare_mentale.users where email in ($1, $2)", [ADMIN_TEST, USER]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: "ro-RO" });
await page.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal{display:none!important}";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});

async function register(email) {
  await page.goto(`${BASE}/intra`);
  await page.evaluate(
    async ({ email, password }) => {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email, password }),
      });
    },
    { email, password: PASSWORD },
  );
}

async function shot(name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log("  ✓", name);
}

try {
  // Contul obișnuit, cu ceva pe hartă.
  await register(USER);
  for (const s of [
    { label: "Dacă nu iese perfect, mai bine nu o fac deloc", type: "belief", domain: "self", schema_code: "unrelenting_standards" },
    { label: "Banii se pot termina oricând", type: "fear", domain: "money", schema_code: "vulnerability" },
    { label: "Libertatea de a alege", type: "value", domain: "meaning" },
  ]) {
    await page.evaluate(async (body) => {
      await fetch("/api/nodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }, s);
  }
  await page.evaluate(() => fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }));

  // Administratorul.
  await register(ADMIN_TEST);
  await page.goto(`${BASE}/admin`);
  await shot("01-tablou");
  await page.goto(`${BASE}/admin/utilizatori`);
  await shot("02-utilizatori");
  await page.getByRole("button", { name: "+ Credite" }).first().click();
  await shot("02b-utilizatori-credite");

  const { rows } = await db.query("select id from tipare_mentale.users where email = $1", [USER]);
  await page.goto(`${BASE}/admin/utilizatori/${rows[0].id}`);
  await shot("03-cont");

  await page.getByRole("button", { name: "+4 / +2" }).click();
  await page.getByPlaceholder("cadou, plată manuală, compensație…").fill("cadou de lansare");
  await page.getByRole("button", { name: "Aplică" }).click();
  await page.getByText("Acum: 5 ședințe").waitFor({ timeout: 8000 });
  await shot("04-cont-dupa-credite");
} finally {
  await browser.close();
  await db.query("delete from tipare_mentale.users where email in ($1, $2)", [ADMIN_TEST, USER]);
  await db.end();
}
console.log("\n✓ Capturi în", path.resolve(OUT));
