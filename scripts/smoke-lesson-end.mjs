/**
 * O lecție întreagă, cu modelul real: replici scurte până la capăt. Verifică
 * că nicio replică nu vine goală, că lecția se încheie explicit
 * (`guideComplete`), că încheierea nu pune altă întrebare și că harta s-a
 * actualizat pe parcurs, nu doar la final.
 *
 * Costă ~10–15 cenți.
 *
 *   node --env-file=.env.local scripts/smoke-lesson-end.mjs [baseUrl]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = `lesson-end-${Date.now()}@resend.dev`;
const PASSWORD = "parola-de-verificare-123";
const GUIDE = "cand-greseai";

const ANSWERS = [
  "Se făcea liniște și mă simțeam vinovat",
  "Odată am spart o cană și tata nu mi-a vorbit toată seara",
  "Tăcerea lui, mai mult decât cearta",
  "Că nu sunt bun de nimic, cam așa",
  "Îmi cer scuze de multe ori și după",
  "La muncă, când greșesc ceva, o iau razna toată ziua",
  "Aș vrea să pot lăsa greșeala în urmă",
  "Îmi spun că oricine ar fi greșit, dar nu mă cred",
  "Că mă critic mai tare decât ar face-o oricine",
  "Nu știu, poate să nu mă mai pedepsesc singur",
  "Da, cred că asta e",
  "Mulțumesc",
];

let cookie = "";
async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    if (c.startsWith("tm_session=")) cookie = c.split(";")[0];
  }
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures += 1;
}

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

try {
  await call("/api/auth", { action: "register", email: EMAIL, password: PASSWORD });
  const start = await call("/api/conversations", { guideId: GUIDE });
  check("lecția pornește", start.status === 200 && start.body.opener, String(start.status));
  const id = start.body.conversationId;

  let complete = false;
  let extractions = 0;
  let lastReply = "";
  let turns = 0;
  for (const text of ANSWERS) {
    const res = await call("/api/chat", { message: text, conversationId: id });
    turns += 1;
    if (res.status !== 200) {
      check(`replica ${turns} → 200`, false, JSON.stringify(res.body).slice(0, 120));
      break;
    }
    const reply = String(res.body.reply ?? "").trim();
    check(`replica ${turns} nu e goală`, reply.length > 0, `„${reply.slice(0, 70)}…”`);
    if (res.body.extractionDue) {
      extractions += 1;
      await call(`/api/conversations/${id}/extract`, {});
    }
    lastReply = reply;
    if (res.body.guideComplete) {
      complete = true;
      break;
    }
  }

  check("lecția s-a încheiat explicit (guideComplete)", complete, `după ${turns} replici`);
  check("încheierea nu pune altă întrebare", complete && !lastReply.includes("?"), `„${lastReply.slice(0, 120)}”`);
  check("harta s-a actualizat pe parcurs, nu doar la final", extractions >= 2, `${extractions} extracții`);

  const { rows: conv } = await admin.query(
    "select step_index, turns from tipare_mentale.conversations where id = $1",
    [id],
  );
  check("toți pașii lecției sunt parcurși în bază", conv[0].step_index >= 5, `step_index=${conv[0].step_index}`);

  const { rows: nodes } = await admin.query(
    "select count(*)::int as n from tipare_mentale.nodes where user_id = (select id from tipare_mentale.users where email = $1)",
    [EMAIL],
  );
  check("au apărut elemente pe hartă", nodes[0].n > 0, `${nodes[0].n} noduri`);
} finally {
  await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
  await admin.end();
}

console.log(failures === 0 ? "\nToate verificările au trecut." : `\n${failures} verificări picate.`);
process.exit(failures === 0 ? 0 : 1);
