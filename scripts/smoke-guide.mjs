/**
 * Verificare a ședinței ghidate, pe serverul de dezvoltare:
 * pornire pe ghid → răspuns cu variantă → replici → avansarea pasului →
 * extracție cu clasare pe scheme.
 *
 * Costă câțiva cenți: apelează modelele real.
 *
 *   node --env-file=.env.local scripts/smoke-guide.mjs [http://localhost:3000]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = `ghid.${Date.now()}@test.local`;
const PASSWORD = "parola-de-verificare-123";
const GUIDE = "cand-greseai";

let cookie = "";

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    if (c.startsWith("tm_session=")) cookie = c.split(";")[0];
  }
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

async function stepIndex() {
  const { rows } = await admin.query(
    `select c.step_index from tipare_mentale.conversations c
       join tipare_mentale.users u on u.id = c.user_id
      where u.email = $1 order by c.started_at desc limit 1`,
    [EMAIL],
  );
  return rows[0]?.step_index ?? -1;
}

console.log(`Server: ${BASE}\n`);

console.log("1. Cont");
const reg = await call("/api/auth", {
  method: "POST",
  body: JSON.stringify({ action: "register", email: EMAIL, password: PASSWORD }),
});
if (reg.status !== 200) {
  console.error("  ✗", reg.body);
  process.exit(1);
}
console.log("  ✓\n");

console.log(`2. Pornire ghid „${GUIDE}”`);
const started = await call("/api/conversations", {
  method: "POST",
  body: JSON.stringify({ guideId: GUIDE }),
});
if (started.status !== 200) {
  console.error("  ✗", started.body);
  process.exit(1);
}
const conversationId = started.body.conversationId;
console.log(`  ✓ ${started.body.guideTitle}`);
console.log(`  Deschidere: „${started.body.opener}”`);
console.log(`  Variante: ${(started.body.options ?? []).join(" · ") || "(niciuna)"}`);
console.log(`  pas curent: ${await stepIndex()}\n`);

// Răspunsuri: prima e o variantă atinsă, apoi text liber, ca în viața reală.
const ANSWERS = [
  started.body.options?.[1] ?? "Tăcere grea",
  "Nu se spunea nimic ore intregi. Tata pleca in alta camera si mama se uita la mine ca si cum as fi stricat ceva de nereparat.",
  "Cred ca era despre cine sunt. Nu „ai spart cana”, ci „esti neatent, esti ca tine”.",
  "Nu se repara. Trecea de la sine dupa cateva zile si nu mai vorbea nimeni despre asta.",
  "Imi spun „iar ai facut-o” si simt ca ma strang in mine. Exact ca atunci.",
];

console.log("3. Conversație");
let optionsSeen = 0;
for (const [i, text] of ANSWERS.entries()) {
  const t0 = Date.now();
  const { status, body } = await call("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: text, conversationId }),
  });
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  if (status !== 200) {
    console.error(`  ✗ replica ${i + 1}:`, body);
    process.exit(1);
  }
  const opts = body.options ?? [];
  if (opts.length) optionsSeen += 1;
  console.log(`  ${i + 1}. [${s}s] tu: „${text.slice(0, 60)}${text.length > 60 ? "…" : ""}”`);
  console.log(`     el: „${body.reply}”`);
  if (opts.length) console.log(`     variante: ${opts.join(" · ")}`);
  console.log(`     pas curent: ${await stepIndex()}`);
}
console.log(`\n  Replici cu variante oferite: ${optionsSeen} din ${ANSWERS.length}`);

console.log("\n4. Extracție și clasare pe scheme");
const t0 = Date.now();
const extracted = await call(`/api/conversations/${conversationId}/extract`, { method: "POST" });
console.log(`  [${((Date.now() - t0) / 1000).toFixed(1)}s] ${extracted.status}`);
if (extracted.status !== 200 || extracted.body.failed) {
  console.error("  ✗", extracted.body);
  process.exit(1);
}

const { rows: nodes } = await admin.query(
  `select n.type, n.domain, n.schema_code, n.label, n.confidence
     from tipare_mentale.nodes n join tipare_mentale.users u on u.id = n.user_id
    where u.email = $1 order by n.confidence desc`,
  [EMAIL],
);
console.log(`  ✓ ${nodes.length} noduri`);
for (const n of nodes) {
  console.log(`   [${n.type}/${n.domain}] ${n.schema_code ?? "—"}  „${n.label}” (${n.confidence})`);
}
const classified = nodes.filter((n) => n.schema_code).length;
console.log(`  Clasate pe schemă: ${classified} din ${nodes.length}`);

const { rows: usage } = await admin.query(
  `select round(sum(cost_micro)/1000000.0, 4) as usd from tipare_mentale.usage_events e
     join tipare_mentale.users u on u.id = e.user_id where u.email = $1`,
  [EMAIL],
);
console.log(`\n  Cost: ${usage[0].usd} $`);

await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
await admin.end();
console.log("\n✓ Utilizator de test șters.");
