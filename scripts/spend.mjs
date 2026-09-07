/**
 * Cât a costat aplicația, defalcat. Ca să nu mai fie nevoie să întrebi pe
 * nimeni unde s-au dus banii.
 *
 *   node --env-file=.env.local scripts/spend.mjs
 *
 * Arată exclusiv consumul aplicației. Orice altceva de pe factura Anthropic —
 * unelte de dezvoltare care folosesc aceeași cheie, de exemplu — nu apare aici
 * și nu are cum să apară: aplicația înregistrează doar apelurile pe care le
 * face ea.
 */
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL,
});
await client.connect();

const usd = (micro) => `${(Number(micro) / 1_000_000).toFixed(4)} $`;

async function show(title, sql, params = []) {
  const { rows } = await client.query(sql, params);
  console.log(`\n### ${title}`);
  if (rows.length === 0) {
    console.log("  (nimic)");
    return rows;
  }
  console.table(rows);
  return rows;
}

await show(
  "Pe tip de apel",
  `select kind as tip, model, count(*)::int as apeluri,
          sum(input_tokens)::int as intrare,
          sum(output_tokens)::int as iesire,
          sum(cache_read_tokens)::int as din_cache,
          round(sum(cost_micro)/1000000.0, 4) as usd
     from tipare_mentale.usage_events
    group by kind, model
    order by 7 desc`,
);

await show(
  "Pe zi",
  `select date_trunc('day', created_at)::date as ziua,
          count(*)::int as apeluri,
          round(sum(cost_micro)/1000000.0, 4) as usd
     from tipare_mentale.usage_events
    group by 1 order by 1 desc limit 30`,
);

await show(
  "Pe utilizator",
  `select u.email, s.plan,
          count(e.id)::int as apeluri,
          round(coalesce(sum(e.cost_micro),0)/1000000.0, 4) as usd,
          s.sessions_used as sedinte, s.transformations_used as transformari
     from tipare_mentale.users u
     left join tipare_mentale.usage_events e on e.user_id = u.id
     left join tipare_mentale.subscriptions s on s.user_id = u.id
    group by u.email, s.plan, s.sessions_used, s.transformations_used
    order by 4 desc`,
);

const perSession = await show(
  "Cost pe ședință încheiată",
  `select c.id, c.turns as replici,
          round(coalesce(sum(e.cost_micro),0)/1000000.0, 4) as usd
     from tipare_mentale.conversations c
     left join tipare_mentale.usage_events e on e.conversation_id = c.id
    group by c.id, c.turns
   having c.turns > 0
    order by 3 desc limit 20`,
);

const { rows: total } = await client.query(
  "select coalesce(sum(cost_micro), 0) as micro, count(*)::int as apeluri from tipare_mentale.usage_events",
);

console.log(`\nTOTAL aplicație: ${usd(total[0].micro)} din ${total[0].apeluri} apeluri`);

if (perSession.length > 0) {
  const avg =
    perSession.reduce((s, r) => s + Number(r.usd), 0) / perSession.length;
  console.log(`Medie pe ședință: ${avg.toFixed(4)} $`);
}

await client.end();
