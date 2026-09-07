-- Două schimbări de produs.
--
-- 1. Harta capătă ramuri pe domenii de viață — bani, relații, sănătate — ca
--    discuția să poată fi purtată pe o temă anume, iar convingerile dintr-un
--    domeniu să se vadă împreună.
--
-- 2. Transformarea devine un obiect propriu: convingerea veche primește o
--    convingere nouă care să-i ia locul, cu exerciții și exemple concrete care
--    ajută la schimbare. Până acum aveam doar recomandări răzlețe.

set local search_path = tipare_mentale;

-- ---------------------------------------------------------------- domenii

create type life_domain as enum (
  'money',          -- bani, muncă plătită, siguranță materială
  'relationships',  -- partener, prieteni, apropiere
  'health',         -- corp, somn, energie, obiceiuri
  'work',           -- carieră, vocație, realizare
  'family',         -- familia de origine, copii
  'self',           -- imaginea de sine, valoare personală
  'meaning',        -- sens, direcție, spiritualitate
  'other'
);

alter table nodes add column domain life_domain not null default 'other';
create index nodes_user_domain_idx on nodes (user_id, domain);

-- Conversațiile pot fi purtate pe o temă anume.
alter table conversations add column domain life_domain;

-- ---------------------------------------------------------------- transformare

create type transformation_status as enum (
  'proposed',    -- propusă de model, încă neacceptată
  'practicing',  -- utilizatorul lucrează la ea
  'adopted',     -- a înlocuit convingerea veche
  'dismissed'    -- nu i se potrivește
);

-- Convingerea nouă care ia locul celei vechi. Nu ștergem nodul vechi: harta
-- trebuie să poată arăta de unde a plecat omul, nu doar unde a ajuns.
create table transformations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  node_id      uuid not null references nodes(id) on delete cascade,
  new_label    text not null,  -- convingerea nouă, la persoana întâi
  rationale    text not null,  -- de ce aceasta, pentru convingerea aceasta
  status       transformation_status not null default 'proposed',
  created_at   timestamptz not null default now(),
  adopted_at   timestamptz
);

create index transformations_user_idx on transformations (user_id, status);
create index transformations_node_idx on transformations (node_id);

alter table transformations enable row level security;
alter table transformations force row level security;

create policy transformations_own on transformations
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- recomandări

-- „Exemplu concret" este un tip de sprijin în sine: o situație în care
-- convingerea nouă se aplică, descrisă atât de precis încât să fie de făcut.
alter type recommendation_kind add value 'example';

alter table recommendations
  add column transformation_id uuid references transformations(id) on delete cascade;

create index recommendations_transformation_idx on recommendations (transformation_id);
