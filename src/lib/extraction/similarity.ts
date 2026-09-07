import type { PoolClient } from "pg";

import { displayLabel, type MindNode } from "@/lib/types";

/**
 * Găsirea convingerilor care spun același lucru cu alte cuvinte.
 *
 * Fuziunea de la extracție prinde majoritatea cazurilor, fiindcă modelul
 * primește indexul hărții înainte să scrie. Nu prinde însă formulările foarte
 * diferite, apărute la săptămâni distanță — „nu am voie să greșesc” și „dacă
 * nu iese impecabil, nu merită” pot ajunge noduri separate.
 *
 * Ce scapă e prins aici și devine o *întrebare pusă omului*, nu o decizie
 * luată în locul lui: două convingeri care par identice unui algoritm pot fi
 * distincte pentru cel care le trăiește, iar unirea lor greșită ar șterge o
 * distincție reală.
 */

/** Cuvinte prea frecvente ca să spună ceva despre asemănare. */
const STOPWORDS = new Set([
  "si", "sa", "se", "de", "la", "cu", "in", "pe", "un", "o", "ca", "ce", "nu",
  "ma", "mi", "el", "ea", "eu", "am", "are", "sunt", "este", "fie", "fi", "as",
  "sau", "din", "prea", "mai", "tot", "cand", "daca", "dar", "pentru", "care",
  "trebuie", "vreau", "pot", "face", "fac", "lui", "meu", "mea", "al", "a",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

/** Cât se suprapun două formulări, ca raport între comun și total. */
export function similarity(a: string, b: string): number {
  const first = tokens(a);
  const second = tokens(b);
  if (first.size === 0 || second.size === 0) return 0;

  let shared = 0;
  for (const word of first) if (second.has(word)) shared += 1;

  return shared / (first.size + second.size - shared);
}

/**
 * Pragul de la care merită întrebat. Sub el sunt prea multe coincidențe de
 * vocabular; peste el, aproape sigur modelul ar fi trebuit să le unească.
 */
const THRESHOLD = 0.42;

/**
 * Caută perechi asemănătoare și le înregistrează ca întrebări deschise.
 *
 * Perechile deja judecate — unite sau declarate distincte — nu se repropun:
 * a întreba a doua oară același lucru face produsul să pară că nu ascultă.
 */
export async function recordSimilarities(
  client: PoolClient,
  userId: string,
  candidates: MindNode[],
  existing: MindNode[],
): Promise<number> {
  const pairs: Array<{ a: string; b: string; score: number }> = [];

  for (const candidate of candidates) {
    for (const other of existing) {
      if (other.id === candidate.id) continue;
      if (other.type !== candidate.type) continue;
      if (other.verdict === "rejected") continue;

      const score = similarity(displayLabel(candidate), displayLabel(other));
      if (score < THRESHOLD) continue;

      // Ordinea fixă face perechea unică indiferent din ce parte am ajuns la ea.
      const [a, b] =
        candidate.id < other.id ? [candidate.id, other.id] : [other.id, candidate.id];
      pairs.push({ a, b, score });
    }
  }

  if (pairs.length === 0) return 0;

  let recorded = 0;

  for (const pair of pairs) {
    const { rowCount } = await client.query(
      `insert into node_similarities (user_id, node_a, node_b, score)
       values ($1, $2, $3, $4)
       on conflict (node_a, node_b) do nothing`,
      [userId, pair.a, pair.b, Math.min(1, pair.score)],
    );
    if (rowCount) recorded += 1;
  }

  return recorded;
}
