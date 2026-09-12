-- Un nod se formează din mai multe momente, nu dintr-o propoziție.
--
-- Până acum, extracția putea naște un nod dintr-un singur citat: omul spunea
-- o frază, pe hartă apărea o convingere. Prea ușor — o convingere e o regulă
-- care revine, nu o remarcă. De acum, ce iese dintr-o singură mențiune rămâne
-- ipoteză nevăzută (formed_at null): stă în bază, cu citatul ei, intră în
-- indexul extracției ca să poată fi întărită, dar nu apare pe hartă. Apare
-- când a strâns destule mențiuni din momente diferite (vezi
-- FORMATION_THRESHOLD în src/lib/extraction/apply.ts).
--
-- Nodurile existente se consideră formate: harta nimănui nu se golește
-- peste noapte. Cine vrea o hartă strictă o poate reseta din cont.

set local search_path = tipare_mentale;

-- Implicit now(): migrarea poate rula înaintea publicării codului nou, iar
-- nodurile create între timp de codul vechi rămân vizibile. Codul nou scrie
-- explicit null pentru ipoteze, iar null explicit bate implicitul.
alter table nodes add column formed_at timestamptz default now();

update nodes set formed_at = created_at where formed_at is null;

create index nodes_user_formed_idx on nodes (user_id, formed_at)
  where archived_at is null;
