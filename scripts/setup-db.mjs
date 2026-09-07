/**
 * Pregătește baza partajată pentru acest proiect:
 *   1. creează schema `tipare_mentale`
 *   2. creează rolul aplicației, cu parolă generată aici
 *   3. îi taie accesul la `public`, unde stau celelalte proiecte
 *
 * Rulează o singură dată, cu credențialele de administrator:
 *   node --env-file=.env.local scripts/setup-db.mjs
 *
 * Parola generată se scrie direct în .env.local și nu se afișează nicăieri.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const SCHEMA = "tipare_mentale";
const ROLE = "tipare_mentale_app";
const ENV_FILE = ".env.local";

const adminUrl = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
if (!adminUrl) {
  console.error("Lipsește DATABASE_URL_ADMIN (sau DATABASE_URL) în .env.local");
  process.exit(1);
}

/** Scrie o cheie în .env.local fără a atinge restul fișierului. */
function setEnv(key, value) {
  let content = "";
  try {
    content = readFileSync(ENV_FILE, "utf8");
  } catch {
    content = "";
  }

  const line = `${key}=${value}`;
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const index = lines.findIndex((l) => l.startsWith(`${key}=`));

  if (index >= 0) lines[index] = line;
  else lines.push(line);

  writeFileSync(ENV_FILE, `${lines.join("\n")}\n`);
}

const password = randomBytes(24).toString("base64url");
const client = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 15000 });

await client.connect();

const { rows: whoami } = await client.query("select current_user as usr, current_database() as db");
console.log(`Conectat la ${whoami[0].db} ca ${whoami[0].usr}`);

await client.query(`create schema if not exists ${SCHEMA}`);
console.log(`✓ schema ${SCHEMA}`);

const { rows: existing } = await client.query("select 1 from pg_roles where rolname = $1", [ROLE]);

// CREATE/ALTER ROLE nu acceptă parametri legați, deci parola se interpolează
// escapată de driver.
const quoted = client.escapeLiteral(password);

if (existing.length > 0) {
  await client.query(`alter role ${ROLE} with login password ${quoted}`);
  console.log(`✓ rol ${ROLE} (parolă rotită)`);
} else {
  await client.query(`create role ${ROLE} with login password ${quoted}`);
  console.log(`✓ rol ${ROLE} (creat)`);
}

// Rolul aplicației vede exclusiv schema proiectului. `public` rămâne al
// celorlalte proiecte, iar o eroare de cod nu poate ajunge la ele.
await client.query(`revoke all on schema public from ${ROLE}`);
await client.query(`revoke all on all tables in schema public from ${ROLE}`);
await client.query(`grant usage on schema ${SCHEMA} to ${ROLE}`);
await client.query(`alter role ${ROLE} set search_path = ${SCHEMA}`);
console.log(`✓ acces limitat la ${SCHEMA}`);

await client.end();

// Șirul de conexiune al aplicației, construit peste cel de administrare.
const appUrl = new URL(adminUrl);
appUrl.username = ROLE;
appUrl.password = password;

setEnv("DATABASE_URL_ADMIN", adminUrl);
setEnv("DATABASE_URL", appUrl.toString());

console.log(`\n✓ ${ENV_FILE} actualizat: DATABASE_URL folosește acum ${ROLE}`);
console.log("  Următorul pas: node --env-file=.env.local scripts/migrate.mjs");
