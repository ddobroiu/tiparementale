/**
 * Verificare cap-coadă a căii de AI, pe serverul de dezvoltare:
 * conversație → extracție → hartă → confirmare → transformare.
 *
 * Costă câțiva cenți de fiecare dată, fiindcă apelează modelele real.
 *
 *   node --env-file=.env.local scripts/smoke-test.mjs [http://localhost:3000]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = `smoke.${Date.now()}@test.local`;
const PASSWORD = "parola-de-verificare-123";

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

  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    if (c.startsWith("tm_session=")) cookie = c.split(";")[0];
  }

  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const timed = async (label, fn) => {
  const started = Date.now();
  const result = await fn();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`  ${label} — ${seconds}s`);
  return result;
};

// Replici realiste, în română, care ar trebui să producă tipare clare.
const TURNS = [
  "In ultima vreme ma simt epuizat. Lucrez pana noaptea tarziu si tot am impresia ca nu e destul.",
  "Cred ca de cand eram mic. Tata spunea mereu ca daca nu iese perfect, mai bine nu o faci deloc.",
  "Nu cer ajutor aproape niciodata. Mi se pare ca daca cer, inseamna ca nu ma descurc.",
  "Si cu banii e la fel. Am ceva pus deoparte dar tot ma tem ca se termina oricand si nu ma pot relaxa.",
];

console.log(`Server: ${BASE}\n`);

// ---------------------------------------------------------------- cont

console.log("1. Cont nou");
const registered = await call("/api/auth", {
  method: "POST",
  body: JSON.stringify({ action: "register", email: EMAIL, password: PASSWORD }),
});
if (registered.status !== 200) {
  console.error("  ✗ înregistrare eșuată:", registered.body);
  process.exit(1);
}
console.log("  ✓ autentificat\n");

// ---------------------------------------------------------------- conversație

console.log("2. Conversație");
let conversationId = null;
let extractionDue = false;

for (const [i, text] of TURNS.entries()) {
  const { status, body } = await timed(`replica ${i + 1}`, () =>
    call("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: text, conversationId }),
    }),
  );

  if (status !== 200) {
    console.error("  ✗ eroare:", body);
    process.exit(1);
  }

  conversationId = body.conversationId;
  extractionDue = body.extractionDue;
  console.log(`    „${body.reply}"`);
}

console.log(`\n  extracția e datorată: ${extractionDue}\n`);

// ---------------------------------------------------------------- extracție

console.log("3. Extracție");
const extracted = await timed("rulare", () =>
  call(`/api/conversations/${conversationId}/extract`, { method: "POST" }),
);

if (extracted.status !== 200) {
  console.error("  ✗ eroare:", extracted.body);
  process.exit(1);
}
if (extracted.body.failed) {
  console.error("  ✗ extracția a eșuat, nimic marcat ca prelucrat");
  process.exit(1);
}

const diff = extracted.body.diff;
console.log(`  ✓ ${diff.created.length} noduri noi, ${diff.connected.length} conexiuni\n`);

// ---------------------------------------------------------------- harta

console.log("4. Harta");
const graph = await call("/api/graph");
const nodes = graph.body.nodes ?? [];

if (nodes.length === 0) {
  console.error("  ✗ harta a rămas goală — extracția nu a produs nimic");
  process.exit(1);
}

for (const node of nodes) {
  console.log(`  [${node.domain}/${node.type}] ${node.label} (${node.confidence})`);
}
console.log(`  ${graph.body.edges.length} conexiuni\n`);

// ---------------------------------------------------------------- transformare

const belief = nodes.find((n) => n.type === "belief") ?? nodes[0];
console.log(`5. Confirmare: „${belief.label}"`);
await call(`/api/nodes/${belief.id}`, {
  method: "PATCH",
  body: JSON.stringify({ verdict: "confirmed" }),
});
console.log("  ✓ confirmat\n");

console.log("6. Transformare");
const transformed = await timed("generare", () =>
  call(`/api/nodes/${belief.id}/transform`, { method: "POST" }),
);

if (transformed.status !== 200) {
  console.error("  ✗ eroare:", transformed.body);
  process.exit(1);
}

console.log(`\n  Convingerea nouă: „${transformed.body.transformation.new_label}"`);
console.log(`  De ce s-a instalat cea veche: ${transformed.body.whyOldPersists}\n`);

const detail = await call(`/api/nodes/${belief.id}`);
for (const rec of detail.body.recommendations ?? []) {
  const who = rec.creator ? `, ${rec.creator}` : "";
  const year = rec.year ? ` (${rec.year})` : "";
  console.log(`  [${rec.kind}] ${rec.title}${who}${year}`);
  console.log(`      ${rec.rationale}`);
}

const observations = detail.body.observations ?? [];
console.log(`\n  Citate-sursă păstrate: ${observations.length}`);
for (const obs of observations) console.log(`    „${obs.quote}"`);

// ---------------------------------------------------------------- predicții

console.log("\n7. Predicții");

// Predicțiile au nevoie de cel puțin două elemente confirmate.
const second = nodes.find((n) => n.id !== belief.id);
if (second) {
  await call(`/api/nodes/${second.id}`, {
    method: "PATCH",
    body: JSON.stringify({ verdict: "confirmed" }),
  });
}

const predicted = await timed("generare", () =>
  call("/api/predictions", { method: "POST" }),
);

if (predicted.status !== 200) {
  console.error("  ✗ eroare:", predicted.body);
  process.exit(1);
}

const predictions = predicted.body.predictions ?? [];
console.log(`  ✓ ${predictions.length} predicții`);
for (const p of predictions) {
  console.log(`    „${p.situation}”`);
  console.log(`     → ${p.behaviour}`);
}

if (predictions.length > 0) {
  const answered = await call(`/api/predictions/${predictions[0].id}`, {
    method: "PATCH",
    body: JSON.stringify({ answer: "confirmed" }),
  });
  console.log(
    `  ✓ răspuns înregistrat, încredere acum ${answered.body.confidence?.toFixed?.(2)}`,
  );
}

// ---------------------------------------------------------------- citirea hărții

console.log("\n8. Citirea hărții");
const read = await timed("generare", () => call("/api/reading", { method: "POST" }));

if (read.status === 400) {
  console.log(`  · sărită: ${read.body.error}`);
} else if (read.status !== 200) {
  console.error("  ✗ eroare:", read.body);
  process.exit(1);
} else {
  console.log(`\n  ${read.body.reading.summary}\n`);
  for (const theme of read.body.reading.themes?.themes ?? []) {
    console.log(`  · ${theme.title}: ${theme.explanation}`);
  }
  if (read.body.reading.themes?.tension) {
    console.log(`\n  Contradicția: ${read.body.reading.themes.tension}`);
  }
}

// ---------------------------------------------------------------- cost real

const account = await call("/api/account");
console.log(
  `\n9. Portofel: ${account.body.sessionsLeft} ședințe și ` +
    `${account.body.transformationsLeft} transformări rămase`,
);

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

const { rows: usage } = await admin.query(
  `select e.kind, e.model, count(*)::int as apeluri,
          sum(e.input_tokens)::int as intrare,
          sum(e.output_tokens)::int as iesire,
          sum(e.cache_read_tokens)::int as din_cache,
          sum(e.cost_micro)::bigint as cost_micro
     from tipare_mentale.usage_events e
     join tipare_mentale.users u on u.id = e.user_id
    where u.email = $1
    group by e.kind, e.model
    order by 1`,
  [EMAIL],
);

console.log("\n8. Consum măsurat");
console.table(usage);

const total = usage.reduce((sum, r) => sum + Number(r.cost_micro), 0);
console.log(`  Total: ${(total / 1_000_000).toFixed(4)} $ pentru ${TURNS.length} replici,`);
console.log(`  o extracție și o transformare.`);

// ---------------------------------------------------------------- curățenie

const { rowCount } = await admin.query("delete from tipare_mentale.users where email = $1", [
  EMAIL,
]);
await admin.end();

console.log(`\n✓ Verificare completă. Utilizator de test șters: ${rowCount}`);
