-- Trei lucruri noi, care se sprijină pe aceleași convingeri confirmate.
--
-- 1. Predicții de comportament. Din convingerile confirmate se derivă situații
--    concrete în care omul probabil reacționează într-un anume fel. El spune
--    dacă se regăsește sau nu. Este momentul în care produsul dovedește că a
--    înțeles ceva, și în același timp cea mai bună sursă de calibrare: un „nu”
--    este o informație mai valoroasă decât zece extracții.
--
-- 2. Perechi de convingeri asemănătoare. Fuziunea automată la extracție prinde
--    majoritatea cazurilor, dar nu pe cele formulate foarte diferit. Ce scapă
--    ajunge aici, ca întrebare pusă omului, nu ca decizie luată în locul lui.
--
-- 3. Citirea hărții. O interpretare de ansamblu, păstrată cu data ei, ca să se
--    poată compara cu cea de peste două luni.

set local search_path = tipare_mentale;

-- ---------------------------------------------------------------- predicții

create type prediction_status as enum ('pending', 'confirmed', 'rejected');

create table predictions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  -- Nodul din care a fost derivată. Se șterge odată cu el: o predicție fără
  -- convingerea care a produs-o nu mai poate fi explicată.
  node_id      uuid not null references nodes(id) on delete cascade,
  situation    text not null,  -- „Când cineva îți oferă ajutor la ceva…”
  behaviour    text not null,  -- „…probabil spui «mă descurc» înainte să te gândești.”
  rationale    text not null,  -- din ce convingere decurge
  status       prediction_status not null default 'pending',
  created_at   timestamptz not null default now(),
  answered_at  timestamptz
);

create index predictions_user_status_idx on predictions (user_id, status, created_at desc);
create index predictions_node_idx on predictions (node_id);

alter table predictions enable row level security;
alter table predictions force row level security;

create policy predictions_own on predictions
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- asemănări

create type similarity_status as enum ('pending', 'same', 'different');

create table node_similarities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  node_a      uuid not null references nodes(id) on delete cascade,
  node_b      uuid not null references nodes(id) on delete cascade,
  score       real not null check (score >= 0 and score <= 1),
  status      similarity_status not null default 'pending',
  created_at  timestamptz not null default now(),

  constraint similarity_distinct check (node_a <> node_b),
  -- Perechea se păstrează într-o singură ordine, ca aceeași asemănare să nu
  -- fie propusă de două ori, o dată în fiecare sens.
  constraint similarity_ordered check (node_a < node_b),
  constraint similarity_unique unique (node_a, node_b)
);

create index node_similarities_user_idx on node_similarities (user_id, status);

alter table node_similarities enable row level security;
alter table node_similarities force row level security;

create policy node_similarities_own on node_similarities
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- citirea hărții

create table map_readings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  summary      text not null,
  themes       jsonb not null default '[]'::jsonb,
  node_count   int not null default 0,
  created_at   timestamptz not null default now()
);

create index map_readings_user_idx on map_readings (user_id, created_at desc);

alter table map_readings enable row level security;
alter table map_readings force row level security;

create policy map_readings_own on map_readings
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
