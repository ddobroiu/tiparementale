/**
 * Inspectează baza de date partajată, ca să știm pe ce calcăm înainte de a
 * crea ceva. Rulează cu:
 *   node --env-file=.env.local scripts/inspect-db.mjs
 */
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});

await client.connect();

async function show(label, sql) {
  const { rows } = await client.query(sql);
  console.log(`\n### ${label}`);
  console.table(rows);
}

await show("Context", "select current_database() as db, current_user as usr");

await show(
  "Scheme existente",
  `select n.nspname as schema,
          (select count(*) from pg_class c
            where c.relnamespace = n.oid and c.relkind = 'r') as tabele
     from pg_namespace n
    where n.nspname not like 'pg\\_%'
      and n.nspname <> 'information_schema'
    order by 1`,
);

await show(
  "Tabele în public",
  `select tablename from pg_tables where schemaname = 'public' order by 1 limit 60`,
);

await show(
  "Roluri care se pot autentifica",
  `select rolname, rolsuper from pg_roles
    where rolcanlogin and rolname not like 'pg\\_%' order by 1`,
);

await show("Extensii", "select extname from pg_extension order by 1");

await client.end();
