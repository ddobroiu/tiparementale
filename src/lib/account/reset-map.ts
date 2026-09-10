import type { PoolClient } from "pg";

/**
 * Golește harta unui utilizator și o lasă ca la crearea contului.
 *
 * Pleacă tot ce s-a construit din conversații: nodurile (cu citatele,
 * legăturile, istoricul, transformările, exercițiile și asemănările lor,
 * prin cascadă), conversațiile (cu mesajele), predicțiile și citirile
 * hărții. Rămân contul, portofelul, plățile și jurnalul de consum: omul a
 * plătit pentru ședințe, nu pentru o hartă anume.
 *
 * Rulează în tranzacția apelantului — `withUser` pentru om, `withAdmin`
 * pentru administrator — deci politicile RLS decid ce rânduri se văd.
 */
export async function resetMap(
  client: PoolClient,
  userId: string,
): Promise<{ nodes: number; conversations: number }> {
  const nodes = await client.query("delete from nodes where user_id = $1", [userId]);
  const conversations = await client.query("delete from conversations where user_id = $1", [
    userId,
  ]);
  await client.query("delete from predictions where user_id = $1", [userId]);
  await client.query("delete from map_readings where user_id = $1", [userId]);

  return { nodes: nodes.rowCount ?? 0, conversations: conversations.rowCount ?? 0 };
}

/** Cuvântul pe care omul îl scrie ca să confirme: scurt, dar nu din reflex. */
export const RESET_WORD = "resetez";
