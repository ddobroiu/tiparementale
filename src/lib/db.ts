import { Pool, type PoolClient } from "pg";

/**
 * Accesul la baza de date, care este partajată cu alte proiecte.
 *
 * Conexiunea folosește rolul `tipare_mentale_app`, care vede exclusiv schema
 * proiectului și nu are drept de DDL. Peste asta, fiecare cerere rulează într-o
 * tranzacție care declară cine este utilizatorul, iar politicile RLS filtrează
 * rândurile. Izolarea între utilizatori este astfel o garanție a bazei de date:
 * un `where user_id = ...` uitat în cod nu scurge nimic.
 */

declare global {
  var __tmPool: Pool | undefined;
}

function pool(): Pool {
  // În dezvoltare, modulele se reîncarcă la fiecare salvare; fără cache am
  // deschide un pool nou de fiecare dată.
  globalThis.__tmPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return globalThis.__tmPool;
}

/**
 * Rulează interogări în numele unui utilizator, într-o tranzacție.
 * `app.user_id` este local tranzacției, deci nu se scurge către următoarea
 * cerere care primește aceeași conexiune din pool.
 */
export async function withUser<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rulează interogări peste toți utilizatorii, pentru zona de administrare.
 * Politicile `*_admin` lasă rândurile să se vadă când tranzacția declară
 * `app.admin = 'on'`. Apelantul e răspunzător să fi verificat deja că omul
 * e administrator (`getAdminUser` / `requireAdmin`); aici nu se mai verifică
 * nimic, la fel cum `withUser` nu verifică cine i-a dat id-ul.
 */
export async function withAdmin<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.admin', 'on', true)");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Pentru autentificare, care trebuie să caute după email sau după token
 * *înainte* de a ști cine este utilizatorul. Tabelele `users` și
 * `auth_sessions` sunt singurele fără RLS, tocmai din acest motiv.
 */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { rows } = await pool().query(text, params);
  return rows as T[];
}
