/**
 * Aplică migrările din db/migrations, în ordine, o singură dată fiecare.
 * Rulează cu credențialele de administrator (rolul aplicației nu are DDL):
 *   node --env-file=.env.local scripts/migrate.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const SCHEMA = "tipare_mentale";
const ROLE = "tipare_mentale_app";
const DIR = "db/migrations";

const adminUrl = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
if (!adminUrl) {
  console.error("Lipsește DATABASE_URL_ADMIN în .env.local. Rulează întâi scripts/setup-db.mjs");
  process.exit(1);
}

const client = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 15000 });
await client.connect();

await client.query(`create schema if not exists ${SCHEMA}`);
await client.query(
  `create table if not exists ${SCHEMA}.schema_migrations (
     name text primary key,
     applied_at timestamptz not null default now()
   )`,
);

const { rows: done } = await client.query(`select name from ${SCHEMA}.schema_migrations`);
const applied = new Set(done.map((r) => r.name));

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;

for (const file of files) {
  if (applied.has(file)) {
    console.log(`· ${file} (deja aplicată)`);
    continue;
  }

  const sql = readFileSync(path.join(DIR, file), "utf8");

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(`insert into ${SCHEMA}.schema_migrations (name) values ($1)`, [file]);
    await client.query("commit");
    console.log(`✓ ${file}`);
    count += 1;
  } catch (error) {
    await client.query("rollback");
    console.error(`✗ ${file}\n  ${error.message}`);
    await client.end();
    process.exit(1);
  }
}

// Drepturile rolului aplicației se reîmprospătează după fiecare migrare, ca un
// tabel nou să nu rămână invizibil. Fără DDL: aplicația citește și scrie, atât.
await client.query(`grant usage on schema ${SCHEMA} to ${ROLE}`);
await client.query(
  `grant select, insert, update, delete on all tables in schema ${SCHEMA} to ${ROLE}`,
);
await client.query(`grant usage, select on all sequences in schema ${SCHEMA} to ${ROLE}`);
await client.query(
  `revoke insert, update, delete on ${SCHEMA}.schema_migrations from ${ROLE}`,
);

console.log(
  count === 0 ? "\nNimic de aplicat. Drepturi reîmprospătate." : `\n${count} migrare/migrări aplicate.`,
);

await client.end();
