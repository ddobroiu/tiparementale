/**
 * Verificarea lecției introductive, pe serverul de dezvoltare:
 * cont nou fără ședințe → lecția pornește gratuit → replici pe modelul ieftin
 * → se încheie cu o singură actualizare a hărții → a doua pornire e refuzată
 * → o lecție de pe drum cere pachet.
 *
 * Costă câțiva cenți: apelează modelele real.
 *
 *   node --env-file=.env.local scripts/smoke-intro.mjs [http://localhost:3000]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = `intro.${Date.now()}@test.local`;
const PASSWORD = "parola-de-verificare-123";
const GUIDE = "regula-pe-care-o-porti";

// Răspunsurile unui om care spune da când vrea să spună nu — aceeași regulă,
// din trei unghiuri, ca nodul să aibă din ce se forma.
const TURNS = [
  "Spun da când vreau să spun nu",
  "Marți, șeful m-a rugat să rămân peste program pentru un raport care nu era al meu. Aveam bilete la teatru cu soția. Am zis „sigur, nicio problemă” și am anulat.",
  "Aș fi dezamăgit pe cineva",
  "Simt că dacă zic nu, omul rămâne cu o părere proastă despre mine și nu mai contez pentru el. Nu suport să dezamăgesc pe nimeni.",
  "Mama. Ea spunea mereu da la toată lumea — la vecini, la rude — și după se plângea acasă. Eu eram cel care „nu face probleme”, așa mă lăuda.",
  "Am fost și eu la fel cu bunica: spuneam da la orice ca să nu o supăr, chiar când nu voiam.",
  "Seara aia de teatru. Și vreo două weekenduri de anul ăsta, luate de proiectele altora. Soția mi-a zis că nu mai face planuri cu mine.",
  "Cred că vreo 10 zile libere pierdute și o discuție serioasă acasă.",
  "Mulțumesc.",
];

let cookie = "";
async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...options.headers },
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    if (c.startsWith("tm_session=")) cookie = c.split(";")[0];
  }
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
const post = (path, body) => call(path, { method: "POST", body: JSON.stringify(body ?? {}) });

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures += 1;
}

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

try {
  const reg = await post("/api/auth", { action: "register", email: EMAIL, password: PASSWORD });
  check("cont nou", reg.status === 200, String(reg.status));

  const acc0 = await call("/api/account");
  check("contul nou nu are ședințe", acc0.body.sessionsLeft === 0, String(acc0.body.sessionsLeft));

  const road = await post("/api/conversations", { guideId: "casa-in-care-ai-crescut" });
  check("o lecție de pe drum cere pachet", road.status === 402 && road.body.code === "no_sessions", String(road.status));

  const start = await post("/api/conversations", { guideId: GUIDE });
  check("lecția introductivă pornește fără ședință", start.status === 200 && start.body.opener, String(start.status));
  const id = start.body.conversationId;

  let done = false;
  let lastReply = "";
  for (const [i, text] of TURNS.entries()) {
    const t0 = Date.now();
    const r = await post("/api/chat", { message: text, conversationId: id });
    const ms = Date.now() - t0;
    if (r.status !== 200) {
      check(`replica ${i + 1}`, false, `${r.status} ${JSON.stringify(r.body)}`);
      break;
    }
    lastReply = r.body.reply;
    console.log(`  ${i + 1}. (${ms} ms, ${r.body.turnsLeft} rămase, extracție: ${r.body.extractionDue}) ${r.body.reply}`);
    if (r.body.options?.length) console.log(`     variante: ${r.body.options.join(" · ")}`);
    if (r.body.extractionDue && !r.body.guideComplete) {
      check("harta nu se actualizează la mijlocul introducerii", false);
    }
    if (r.body.guideComplete) {
      done = true;
      check("lecția s-a încheiat", true, `după ${i + 1} replici`);
      break;
    }
  }
  check("lecția se încheie înainte de a consuma replicile", done);
  check("încheierea lasă o întrebare deschisă", /\?/.test(lastReply));

  const ext = await post(`/api/conversations/${id}/extract`);
  check("extracția rulează la final", ext.status === 200, JSON.stringify(ext.body.diff));
  const diff = ext.body.diff ?? {};
  console.log(`  noi: ${diff.created?.length ?? 0}, întărite: ${diff.strengthened?.length ?? 0}, în formare: ${diff.forming ?? 0}`);
  if (diff.created?.length) console.log("  " + diff.created.map((n) => n.label).join(" | "));

  const { rows: usage } = await admin.query(
    `select kind, model, count(*)::int as n, sum(cost_micro)::bigint as micro
       from tipare_mentale.usage_events e join tipare_mentale.users u on u.id = e.user_id
      where u.email = $1 group by 1, 2 order by 1`,
    [EMAIL],
  );
  for (const u of usage) console.log(`  ${u.kind} · ${u.model} · ${u.n} apeluri · ${(Number(u.micro) / 10000).toFixed(2)} ¢`);
  check("replicile au mers pe modelul ieftin", usage.every((u) => u.kind !== "reply" || u.model.startsWith("claude-sonnet")));
  const total = usage.reduce((s, u) => s + Number(u.micro), 0);
  check("lecția întreagă costă sub 20 ¢", total < 200000, `${(total / 10000).toFixed(2)} ¢`);

  const { rows: nodes } = await admin.query(
    `select n.label, n.formed_at is not null as formed, (select count(*)::int from tipare_mentale.observations o where o.node_id = n.id) as obs
       from tipare_mentale.nodes n join tipare_mentale.users u on u.id = n.user_id where u.email = $1`,
    [EMAIL],
  );
  for (const n of nodes) console.log(`  ${n.formed ? "●" : "○"} ${n.label} (${n.obs} mențiuni)`);
  check("nodurile formate au cel puțin 3 mențiuni", nodes.every((n) => !n.formed || n.obs >= 3));

  const acc1 = await call("/api/account");
  check("ședințele au rămas 0 după introducere", acc1.body.sessionsLeft === 0, String(acc1.body.sessionsLeft));

  const again = await post("/api/conversations", { guideId: GUIDE });
  check("a doua pornire e refuzată", again.status === 402 && again.body.code === "intro_done", String(again.status));
} finally {
  const { rowCount } = await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
  console.log(`\ncurățenie: ${rowCount} cont șters`);
  await admin.end();
}

console.log(failures === 0 ? "\nTotul în regulă." : `\n${failures} verificări au picat.`);
process.exit(failures === 0 ? 0 : 1);
