// Fluxul de resetare a parolei, cap-coadă, pe serverul local.
//   node --env-file=.env.local scripts/smoke-reset.mjs [baseUrl]
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
// Adresa de test a Resend: acceptă și „livrează” fără să ajungă la nimeni.
const EMAIL = `delivered+${Date.now()}@resend.dev`;
const OLD = "parola-veche-1234";
const NEW = "parola-noua-56789";

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures += 1;
}

async function auth(body, cookie) {
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, cookie: res.headers.get("set-cookie") ?? "" };
}

try {
  const reg = await auth({ action: "register", email: EMAIL, password: OLD });
  check("înregistrare (trimite și bun venit)", reg.status === 200, JSON.stringify(reg.data));

  const req = await auth({ action: "reset-request", email: EMAIL });
  check("cerere resetare pentru cont existent → 200", req.status === 200, JSON.stringify(req.data));

  const ghost = await auth({ action: "reset-request", email: `nimeni-${Date.now()}@resend.dev` });
  check("cerere resetare pentru adresă fără cont → tot 200", ghost.status === 200);

  const { rows: users } = await admin.query(
    "select id from tipare_mentale.users where email = $1",
    [EMAIL],
  );
  const userId = users[0].id;
  const { rows: resets } = await admin.query(
    "select count(*)::int as n from tipare_mentale.password_resets where user_id = $1 and used_at is null",
    [userId],
  );
  check("un singur token activ în bază", resets[0].n === 1, `găsite: ${resets[0].n}`);

  // Tokenul real a plecat pe e-mail; pentru test plantăm unul cunoscut.
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  await admin.query("delete from tipare_mentale.password_resets where user_id = $1", [userId]);
  await admin.query(
    `insert into tipare_mentale.password_resets (user_id, token_hash, expires_at)
     values ($1, $2, now() + interval '1 hour')`,
    [userId, hash],
  );

  const short = await auth({ action: "reset", token, password: "scurt" });
  check("parolă prea scurtă → 400", short.status === 400);

  const bad = await auth({ action: "reset", token: "token-inventat", password: NEW });
  check("token inventat → 400", bad.status === 400, bad.data.error);

  const ok = await auth({ action: "reset", token, password: NEW });
  check("resetare cu token valid → 200 + cookie de sesiune", ok.status === 200 && ok.cookie.includes("tm_session"));

  const reuse = await auth({ action: "reset", token, password: NEW });
  check("același token a doua oară → 400", reuse.status === 400, reuse.data.error);

  const oldLogin = await auth({ action: "login", email: EMAIL, password: OLD });
  check("parola veche nu mai merge → 401", oldLogin.status === 401);

  const newLogin = await auth({ action: "login", email: EMAIL, password: NEW });
  check("parola nouă merge → 200", newLogin.status === 200);

  const { rows: sessions } = await admin.query(
    "select count(*)::int as n from tipare_mentale.auth_sessions where user_id = $1",
    [userId],
  );
  check("sesiunile vechi închise (rămân doar cele 2 noi)", sessions[0].n === 2, `găsite: ${sessions[0].n}`);

  for (const path of ["/resetare", `/resetare/${token}`]) {
    const res = await fetch(`${BASE}${path}`);
    check(`pagina ${path} → 200`, res.status === 200);
  }
} finally {
  await admin.query("delete from tipare_mentale.users where email = $1", [EMAIL]);
  await admin.end();
}

console.log(failures === 0 ? "\nToate verificările au trecut." : `\n${failures} verificări picate.`);
process.exit(failures === 0 ? 0 : 1);
