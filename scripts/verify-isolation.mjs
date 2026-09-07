/**
 * Verifică, cu rolul aplicației, că izolarea chiar ține:
 *   1. vede tabelele proiectului
 *   2. NU poate citi din `public`, unde stau celelalte proiecte
 *   3. NU poate crea tabele
 *   4. RLS ascunde datele altui utilizator, chiar dacă interogarea o cere
 *
 * node --env-file=.env.local scripts/verify-isolation.mjs
 */
import pg from "pg";

const app = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
await app.connect();

const results = [];
const check = async (label, fn, expect) => {
  try {
    const value = await fn();
    results.push({ verificare: label, rezultat: expect === "ok" ? `✓ ${value}` : `✗ a reușit: ${value}` });
  } catch (error) {
    const message = error.message.split("\n")[0];
    results.push({ verificare: label, rezultat: expect === "fail" ? `✓ blocat` : `✗ ${message}` });
  }
};

const { rows: who } = await app.query("select current_user as u, current_schema() as s");
console.log(`Rol: ${who[0].u}   schema implicită: ${who[0].s}\n`);

await check(
  "vede tabelele proiectului",
  async () => {
    const { rows } = await app.query(
      "select count(*)::int as n from pg_tables where schemaname = 'tipare_mentale'",
    );
    return `${rows[0].n} tabele`;
  },
  "ok",
);

await check(
  'nu poate citi public."User"',
  async () => {
    const { rows } = await app.query('select count(*) from public."User"');
    return rows[0].count;
  },
  "fail",
);

await check(
  "nu poate citi public.edu3d_users",
  async () => {
    const { rows } = await app.query("select count(*) from public.edu3d_users");
    return rows[0].count;
  },
  "fail",
);

await check(
  "nu poate crea tabele",
  async () => {
    await app.query("create table tipare_mentale._probe (id int)");
    return "tabel creat";
  },
  "fail",
);

// ---- RLS: doi utilizatori, fiecare cu nodul lui -------------------------

const admin = new pg.Client({
  connectionString: process.env.DATABASE_URL_ADMIN,
  connectionTimeoutMillis: 15000,
});
await admin.connect();

const { rows: seeded } = await admin.query(`
  with u as (
    insert into tipare_mentale.users (email, password_hash)
    values ('_probe_a@test.local', 'x'), ('_probe_b@test.local', 'x')
    returning id
  ),
  n as (
    insert into tipare_mentale.nodes (user_id, type, label)
    select id, 'belief', 'nod de probă' from u
    returning user_id
  )
  select user_id from n order by user_id
`);

const [userA, userB] = seeded.map((r) => r.user_id);

await check(
  "RLS: vede doar nodurile proprii",
  async () => {
    await app.query("begin");
    await app.query("select set_config('app.user_id', $1, true)", [userA]);
    const { rows } = await app.query("select count(*)::int as n from nodes");
    await app.query("commit");
    return rows[0].n === 1 ? "1 nod (al lui, nu al celuilalt)" : `${rows[0].n} noduri — SCURGERE`;
  },
  "ok",
);

await check(
  "RLS: nu poate cere nodul altuia",
  async () => {
    await app.query("begin");
    await app.query("select set_config('app.user_id', $1, true)", [userA]);
    const { rows } = await app.query("select count(*)::int as n from nodes where user_id = $1", [
      userB,
    ]);
    await app.query("commit");
    return rows[0].n === 0 ? "0 rânduri" : `${rows[0].n} rânduri — SCURGERE`;
  },
  "ok",
);

await check(
  "RLS: fără app.user_id nu vede nimic",
  async () => {
    const { rows } = await app.query("select count(*)::int as n from nodes");
    return rows[0].n === 0 ? "0 rânduri" : `${rows[0].n} rânduri — SCURGERE`;
  },
  "ok",
);

await admin.query("delete from tipare_mentale.users where email like '\\_probe\\_%'");
await admin.end();
await app.end();

console.table(results);
const failed = results.filter((r) => r.rezultat.startsWith("✗"));
if (failed.length > 0) process.exit(1);
console.log("\nIzolare confirmată.");
