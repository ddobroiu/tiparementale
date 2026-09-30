import { withUser } from "@/lib/db";
import { loadLessonProgress } from "@/lib/lessons";
import { INTRO_GUIDE, LESSONS, lessonState, nextLesson } from "@/lib/program";

/**
 * Ce a făcut omul până acum, citit din bază, pentru e-mailurile personalizate.
 * Rulează ca utilizatorul (RLS), deci vede exact ce vede el în aplicație.
 * Nimic nu se estimează: dacă un număr e zero, e-mailul spune altceva, nu
 * inventează un progres.
 */
export interface UserSnapshot {
  /** A scris cel puțin o replică: lecția introductivă sau o conversație. */
  acted: boolean;
  introDone: boolean;
  /** Lecții de pe drum terminate (toți pașii). */
  lessonsDone: number;
  next: { number: number; title: string } | null;
  nodes: number;
  confirmed: number;
  unconfirmed: number;
  sessions: number;
  transformations: number;
  /** Numele ultimului pachet plătit, dacă există. */
  lastPack: string | null;
}

export async function loadSnapshot(userId: string): Promise<UserSnapshot> {
  return withUser(userId, async (client) => {
    const progress = await loadLessonProgress(client);
    const byGuide = new Map(progress.map((p) => [p.guideId, p]));

    const [counts] = (
      await client.query<{
        messages: number;
        nodes: number;
        confirmed: number;
        unconfirmed: number;
      }>(
        `select
           (select count(*) from messages where role = 'user')::int as messages,
           count(*)::int as nodes,
           (count(*) filter (where verdict in ('confirmed', 'edited')))::int as confirmed,
           (count(*) filter (where verdict = 'unconfirmed'))::int as unconfirmed
           from nodes
          where archived_at is null and verdict <> 'rejected'`,
      )
    ).rows;

    const [wallet] = (
      await client.query<{ sessions_balance: number; transformations_balance: number }>(
        "select sessions_balance, transformations_balance from wallets where user_id = $1",
        [userId],
      )
    ).rows;

    const [pack] = (
      await client.query<{ name: string }>(
        `select p.name from purchases pu join packs p on p.code = pu.pack_code
          where pu.status = 'paid' order by pu.completed_at desc nulls last limit 1`,
      )
    ).rows;

    const next = nextLesson(progress);

    return {
      acted: (counts?.messages ?? 0) > 0,
      introDone: lessonState(INTRO_GUIDE, byGuide.get(INTRO_GUIDE.id)).kind === "done",
      lessonsDone: LESSONS.filter((l) => lessonState(l.guide, byGuide.get(l.guide.id)).kind === "done")
        .length,
      next: next ? { number: next.number, title: next.guide.title } : null,
      nodes: counts?.nodes ?? 0,
      confirmed: counts?.confirmed ?? 0,
      unconfirmed: counts?.unconfirmed ?? 0,
      sessions: wallet?.sessions_balance ?? 0,
      transformations: wallet?.transformations_balance ?? 0,
      lastPack: pack?.name ?? null,
    };
  });
}
