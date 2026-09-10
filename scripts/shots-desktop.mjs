/**
 * Capturi ale hărții pe ecran de calculator: panoul cu cele trei etape, un nod
 * deschis, stările de lucru pe hartă. Contul de probă se șterge la final.
 *
 *   node --env-file=.env.local scripts/shots-desktop.mjs [outDir] [baseUrl]
 */
import { chromium } from "playwright";
import pg from "pg";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = process.argv[2] ?? "shots-desktop";
const BASE = process.argv[3] ?? "http://localhost:3000";
const EMAIL = `desktop-${Date.now()}@resend.dev`;
const PASSWORD = "parola-de-proba-12345";

mkdirSync(OUT, { recursive: true });

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await db.connect();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 820 }, locale: "ro-RO" });
await page.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal{display:none!important}";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});

async function shot(name, wait = 700) {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("  ✓", name);
}

try {
  await page.goto(`${BASE}/intra`);
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
  await shot("01-harta-goala");

  const seeds = [
    { label: "Dacă nu iese perfect, mai bine nu o fac deloc", type: "belief", domain: "self", schema_code: "unrelenting_standards" },
    { label: "Dacă cer ajutor, înseamnă că nu mă descurc", type: "belief", domain: "work", schema_code: "dependence" },
    { label: "Banii se pot termina oricând, orice aș face", type: "fear", domain: "money", schema_code: "vulnerability" },
    { label: "Mă retrag când simt că vine respingerea", type: "pattern", domain: "relationships", schema_code: "abandonment" },
    { label: "Vreau să lucrez fără vinovăție", type: "goal", domain: "work" },
    { label: "Libertatea de a alege", type: "value", domain: "meaning" },
    { label: "Copiii mei trebuie să reușească unde eu n-am reușit", type: "belief", domain: "children", schema_code: "unrelenting_standards" },
  ];
  const ids = [];
  for (const s of seeds) {
    const id = await page.evaluate(async (body) => {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return data.node.id;
    }, s);
    ids.push(id);
  }

  // Unul neconfirmat, unul în lucru, unul rezolvat — ca stările să se vadă.
  const { rows: user } = await db.query("select id from tipare_mentale.users where email = $1", [EMAIL]);
  const userId = user[0].id;
  await db.query("update tipare_mentale.nodes set verdict = 'unconfirmed' where id = $1", [ids[6]]);
  await db.query(
    `insert into tipare_mentale.transformations (user_id, node_id, new_label, rationale, status)
     values ($1, $2, 'Pot cere ajutor și rămân competent: așa lucrează oamenii buni.', 'Cererea de ajutor e o abilitate, nu o lipsă.', 'practicing'),
            ($1, $3, 'Am bani cât să respir; restul îl construiesc, pas cu pas.', 'Frica de lipsă nu e același lucru cu lipsa.', 'adopted')`,
    [userId, ids[1], ids[2]],
  );

  await page.goto(`${BASE}/harta`);
  await shot("02-identificare", 1200);

  await page.getByRole("button", { name: /Interpretare/ }).first().click();
  await shot("03-interpretare");

  await page.getByRole("button", { name: /Transformare/ }).first().click();
  await shot("04-transformare");

  // Nodul în lucru, deschis din listă.
  await page.getByRole("button", { name: /Dacă cer ajutor/ }).first().click();
  await page.getByText("De unde vine").waitFor({ timeout: 8000 }).catch(() => {});
  await shot("05-nod-in-lucru");

  // Nodul neconfirmat, deschis de pe hartă (prin lista de confirmat).
  await page.getByRole("button", { name: "Închide" }).first().click();
  await page.getByRole("button", { name: /Interpretare/ }).first().click();
  await page.getByRole("button", { name: /Copiii mei/ }).first().click();
  await page.getByText("Te regăsești în asta?").waitFor({ timeout: 8000 }).catch(() => {});
  await shot("06-nod-neconfirmat");
} finally {
  await browser.close();
  await db.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
  await db.end();
}
console.log("\n✓ Capturi în", path.resolve(OUT));
