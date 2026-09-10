/**
 * Zona de administrare, cap-coadă: un cont obișnuit nu intră, un cont din
 * ADMIN_EMAILS intră, vede paginile și adaugă credite, iar ajustarea ajunge
 * în portofel și în registru.
 *
 * Cere ca ADMIN_EMAILS din .env-ul serverului țintă să conțină ADMIN_TEST.
 *
 *   node --env-file=.env.local scripts/smoke-admin.mjs [baseUrl]
 */
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ADMIN_TEST = "admin.test@tiparementale.ro";
const USER = `admin-smoke-${Date.now()}@resend.dev`;
const PASSWORD = "parola-de-proba-12345";

const admin = new pg.Client({ connectionString: process.env.DATABASE_URL_ADMIN });
await admin.connect();

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures += 1;
}

async function api(path, body, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})), cookie: res.headers.get("set-cookie") ?? "" };
}

async function page(path, cookie) {
  const res = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") ?? "", html: res.status === 200 ? await res.text() : "" };
}

try {
  // Contul de test al administratorului se reface la fiecare rulare.
  await admin.query("delete from tipare_mentale.users where email in ($1, $2)", [ADMIN_TEST, USER]);

  const anon = await page("/admin");
  check("neautentificat → redirecționat la /intra", anon.status === 307 && anon.location.includes("/intra"));

  const user = await api("/api/auth", { action: "register", email: USER, password: PASSWORD });
  const userCookie = user.cookie.split(";")[0];
  check("cont obișnuit creat", user.status === 200);

  const forbidden = await page("/admin", userCookie);
  check("cont obișnuit → redirecționat la /harta", forbidden.status === 307 && forbidden.location.includes("/harta"), `${forbidden.status} ${forbidden.location}`);

  const denied = await api("/api/admin/credits", { userId: "x", sessions: 1 }, userCookie);
  check("API credite refuză contul obișnuit → 403", denied.status === 403);

  const adm = await api("/api/auth", { action: "register", email: ADMIN_TEST, password: PASSWORD });
  const adminCookie = adm.cookie.split(";")[0];
  check("cont administrator creat", adm.status === 200);

  const dash = await page("/admin", adminCookie);
  check("tabloul se încarcă", dash.status === 200 && dash.html.includes("Utilizatori"), String(dash.status));

  const list = await page(`/admin/utilizatori?q=${encodeURIComponent(USER.slice(0, 12))}`, adminCookie);
  check("lista găsește contul după e-mail", list.status === 200 && list.html.includes(USER));

  const { rows } = await admin.query("select id from tipare_mentale.users where email = $1", [USER]);
  const userId = rows[0].id;

  const detail = await page(`/admin/utilizatori/${userId}`, adminCookie);
  check("pagina contului se încarcă", detail.status === 200 && detail.html.includes("Adaugă credite"));

  const missing = await page("/admin/utilizatori/00000000-0000-0000-0000-000000000000", adminCookie);
  check("id inexistent → 404", missing.status === 404);

  const nothing = await api("/api/admin/credits", { userId, sessions: 0, transformations: 0 }, adminCookie);
  check("zero credite → 400", nothing.status === 400);

  const add = await api("/api/admin/credits", { userId, sessions: 4, transformations: 2, note: "test" }, adminCookie);
  check("+4 ședințe, +2 transformări → 200", add.status === 200 && add.data.wallet?.sessionsLeft === 5 && add.data.wallet?.transformationsLeft === 2, JSON.stringify(add.data));

  const sub = await api("/api/admin/credits", { userId, sessions: -10, transformations: 0, note: "nu sub zero" }, adminCookie);
  check("scădere sub zero se oprește la zero", sub.status === 200 && sub.data.wallet?.sessionsLeft === 0, JSON.stringify(sub.data));

  const { rows: wallet } = await admin.query(
    "select sessions_balance, transformations_balance, cost_ceiling_micro from tipare_mentale.wallets where user_id = $1",
    [userId],
  );
  check("portofelul în bază: 0 ședințe, 2 transformări", wallet[0].sessions_balance === 0 && wallet[0].transformations_balance === 2);
  check("plafonul: 1,5M inițial + 6M adăugate, neatins de scădere", Number(wallet[0].cost_ceiling_micro) === 7_500_000, wallet[0].cost_ceiling_micro);

  const { rows: log } = await admin.query(
    "select count(*)::int as n, min(admin_email) as who from tipare_mentale.wallet_adjustments where user_id = $1",
    [userId],
  );
  check("două intrări în registru, semnate de administrator", log[0].n === 2 && log[0].who === ADMIN_TEST);

  const again = await page(`/admin/utilizatori/${userId}`, adminCookie);
  check("registrul apare pe pagina contului", again.html.includes("nu sub zero"));
  check("butonul de ștergere apare pe pagina contului", again.html.includes("Șterge acest cont"));

  const del = async (id, cookie) => {
    const res = await fetch(`${BASE}/api/admin/users/${id}`, { method: "DELETE", headers: { cookie } });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  };
  const { rows: me } = await admin.query("select id from tipare_mentale.users where email = $1", [ADMIN_TEST]);
  const selfDel = await del(me[0].id, adminCookie);
  check("administratorul nu se poate șterge pe sine → 400", selfDel.status === 400, selfDel.data.error);
  const userDel = await del(userId, userCookie);
  check("contul obișnuit nu poate șterge → 403", userDel.status === 403);
  const gone = await del(userId, adminCookie);
  check("administratorul șterge contul → 200", gone.status === 200 && gone.data.email === USER, JSON.stringify(gone.data));
  const { rows: left } = await admin.query("select count(*)::int as n from tipare_mentale.users where id = $1", [userId]);
  check("contul nu mai există în bază", left[0].n === 0);
  const twice = await del(userId, adminCookie);
  check("a doua ștergere → 404", twice.status === 404);
} finally {
  await admin.query("delete from tipare_mentale.users where email in ($1, $2)", [ADMIN_TEST, USER]);
  await admin.end();
}

console.log(failures === 0 ? "\nToate verificările au trecut." : `\n${failures} verificări picate.`);
process.exit(failures === 0 ? 0 : 1);
