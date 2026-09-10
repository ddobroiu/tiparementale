/**
 * Programul de lecții, fără apel la model: pornirea unei lecții, citirea
 * conversației pentru reluare, închiderea și starea „făcută” în cont.
 *
 *   node --env-file=.env.local scripts/smoke-lessons.mjs [baseUrl]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = `lessons-${Date.now()}@resend.dev`;
const PASSWORD = "parola-de-proba-12345";

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures += 1;
}

let cookie = "";
async function call(path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

try {
  const reg = await call("/api/auth", "POST", { action: "register", email: EMAIL, password: PASSWORD });
  check("cont creat", reg.status === 200);

  // Contul nou are o ședință; îi dăm încă două ca să testăm două lecții.
  await admin.query(
    "update tipare_mentale.wallets set sessions_balance = 3 where user_id = (select id from tipare_mentale.users where email = $1)",
    [EMAIL],
  );

  const acc0 = await call("/api/account");
  check("contul raportează lecțiile (goale la început)", Array.isArray(acc0.data.lessons) && acc0.data.lessons.length === 0);

  const start = await call("/api/conversations", "POST", { guideId: "relatia-cu-tata" });
  check("lecția 3 pornește direct, fără să fi făcut lecția 1", start.status === 200 && start.data.guideTitle === "Relația cu tata", JSON.stringify(start.data).slice(0, 80));
  const id = start.data.conversationId;

  const conv = await call(`/api/conversations/${id}`);
  check("conversația se poate citi pentru reluare, cu întrebarea de deschidere", conv.status === 200 && conv.data.messages.length === 1 && conv.data.guideId === "relatia-cu-tata" && conv.data.closed === false);

  const acc1 = await call("/api/account");
  const p = acc1.data.lessons.find((l) => l.guideId === "relatia-cu-tata");
  check("lecția apare în cont ca începută, neînchisă", p && p.conversationId === id && p.closedAt === null);

  const close = await call(`/api/conversations/${id}/close`, "POST");
  check("închiderea → 200", close.status === 200);
  const acc2 = await call("/api/account");
  const p2 = acc2.data.lessons.find((l) => l.guideId === "relatia-cu-tata");
  check("lecția apare ca închisă în cont", p2 && p2.closedAt !== null);

  const again = await call(`/api/conversations/${id}/close`, "POST");
  check("a doua închidere e inofensivă", again.status === 200);

  const reopen = await call(`/api/conversations/${id}/reopen`, "POST");
  check("o lecție închisă devreme se redeschide fără ședință nouă", reopen.status === 200);
  const accR = await call("/api/account");
  const pr = accR.data.lessons.find((l) => l.guideId === "relatia-cu-tata");
  check("după redeschidere, în cont nu mai e închisă", pr && pr.closedAt === null);
  await call(`/api/conversations/${id}/close`, "POST");
  await admin.query("update tipare_mentale.conversations set turns = 25 where id = $1", [id]);
  const spent = await call(`/api/conversations/${id}/reopen`, "POST");
  check("o ședință consumată nu se redeschide → 409", spent.status === 409);
  await admin.query("update tipare_mentale.conversations set turns = 0 where id = $1", [id]);

  const redo = await call("/api/conversations", "POST", { guideId: "relatia-cu-tata" });
  check("aceeași lecție se poate reface, cu altă ședință", redo.status === 200 && redo.data.conversationId !== id);
  const acc3 = await call("/api/account");
  const p3 = acc3.data.lessons.find((l) => l.guideId === "relatia-cu-tata");
  check("contul arată ultima ședință pe lecție, cea nouă, deschisă", p3.conversationId === redo.data.conversationId && p3.closedAt === null);
  check("au rămas 1 ședință din 3", acc3.data.sessionsLeft === 1, String(acc3.data.sessionsLeft));

  const other = await call(`/api/conversations/00000000-0000-0000-0000-000000000000`);
  check("conversație inexistentă → 404", other.status === 404);
} finally {
  await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
  await admin.end();
}

console.log(failures === 0 ? "\nToate verificările au trecut." : `\n${failures} verificări picate.`);
process.exit(failures === 0 ? 0 : 1);
