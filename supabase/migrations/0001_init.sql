-- Tipare Mentale — schema inițială
-- Principiu: nodul nu conține adevărul, observațiile îl conțin.
-- Nodul este agregatul lor; de aici rezultă citatul-sursă și evoluția în timp.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- tipuri

create type node_type as enum (
  'belief',       -- convingere
  'value',        -- valoare
  'emotion',      -- emoție
  'goal',         -- obiectiv
  'pattern',      -- tipar recurent
  'fear',         -- temere
  'relationship'  -- relație
);

create type node_verdict as enum (
  'unconfirmed',  -- ipoteză a modelului, neatinsă de utilizator
  'confirmed',    -- utilizatorul a validat interpretarea
  'rejected',     -- utilizatorul a respins-o; păstrată ca exemplu negativ
  'edited'        -- utilizatorul a reformulat-o (vezi user_label)
);

create type input_mode as enum ('text', 'voice');

create type recommendation_kind as enum ('exercise', 'book', 'film');

create type recommendation_status as enum (
  'suggested', 'in_progress', 'done', 'dismissed', 'inaccurate'
);

-- ---------------------------------------------------------------- profiles

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- sesiuni

-- O sesiune grupează mesajele unei conversații și reține diff-ul produs în hartă:
-- ce s-a schimbat este ecranul cu care se încheie fiecare conversație.
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  summary     text,
  diff        jsonb not null default '{}'::jsonb
);

create index sessions_user_started_idx on sessions (user_id, started_at desc);

-- ---------------------------------------------------------------- mesaje

create table messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid references sessions(id) on delete set null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  input_mode  input_mode not null default 'text',
  created_at  timestamptz not null default now()
);

create index messages_user_created_idx on messages (user_id, created_at desc);
create index messages_session_idx on messages (session_id, created_at);

-- ---------------------------------------------------------------- noduri

create table nodes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         node_type not null,

  -- label: formularea modelului. user_label: formularea utilizatorului, care o
  -- înlocuiește la afișare și în promptul de extracție atunci când există.
  label        text not null,
  user_label   text,
  summary      text,

  confidence   real not null default 0.5 check (confidence >= 0 and confidence <= 1),
  verdict      node_verdict not null default 'unconfirmed',

  -- un nod respins nu se șterge: rămâne ca semnal tăcut și ca exemplu negativ
  archived_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index nodes_user_idx on nodes (user_id, type);
create index nodes_user_verdict_idx on nodes (user_id, verdict);

-- ---------------------------------------------------------------- observații

-- Unitatea atomică de adevăr. Fiecare are citatul din care a fost dedusă, ca
-- nodul să poată răspunde oricând la întrebarea „de unde știi asta despre mine?".
create table observations (
  id                 uuid primary key default gen_random_uuid(),
  node_id            uuid not null references nodes(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  quote              text not null,
  source_message_id  uuid references messages(id) on delete set null,
  sentiment          text,
  valence            real check (valence >= -1 and valence <= 1),
  observed_at        timestamptz not null default now()
);

create index observations_node_idx on observations (node_id, observed_at desc);
create index observations_user_observed_idx on observations (user_id, observed_at desc);

-- ---------------------------------------------------------------- muchii

create table edges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  from_node  uuid not null references nodes(id) on delete cascade,
  to_node    uuid not null references nodes(id) on delete cascade,
  relation   text not null,
  strength   real not null default 0.5 check (strength >= 0 and strength <= 1),
  rationale  text,
  created_at timestamptz not null default now(),

  constraint edges_no_self_loop check (from_node <> to_node),
  constraint edges_unique unique (from_node, to_node, relation)
);

create index edges_user_idx on edges (user_id);
create index edges_from_idx on edges (from_node);
create index edges_to_idx on edges (to_node);

-- ---------------------------------------------------------------- istoric

create table node_history (
  id          uuid primary key default gen_random_uuid(),
  node_id     uuid not null references nodes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  field       text not null,
  old_value   text,
  new_value   text,
  changed_at  timestamptz not null default now()
);

create index node_history_node_idx on node_history (node_id, changed_at desc);

-- ---------------------------------------------------------------- recomandări

-- Fiecare recomandare se leagă de un nod confirmat. Legătura cu harta este
-- singura diferență între acest produs și o aplicație generică de self-help.
create table recommendations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  node_id       uuid not null references nodes(id) on delete cascade,
  kind          recommendation_kind not null,
  title         text not null,
  creator       text,          -- autor sau regizor
  year          int,
  rationale     text not null, -- de ce anume aceasta, pentru convingerea aceasta
  status        recommendation_status not null default 'suggested',
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index recommendations_user_idx on recommendations (user_id, status);
create index recommendations_node_idx on recommendations (node_id);

-- ---------------------------------------------------------------- updated_at

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

create trigger nodes_touch_updated_at
  before update on nodes
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- RLS
-- Datele sunt printre cele mai sensibile pe care le poate produce un om.
-- Izolarea pe utilizator există de la prima migrare, nu adăugată ulterior.

alter table profiles        enable row level security;
alter table sessions        enable row level security;
alter table messages        enable row level security;
alter table nodes           enable row level security;
alter table observations    enable row level security;
alter table edges           enable row level security;
alter table node_history    enable row level security;
alter table recommendations enable row level security;

create policy "profiles_own" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "sessions_own" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_own" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "nodes_own" on nodes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "observations_own" on observations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "edges_own" on edges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "node_history_own" on node_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recommendations_own" on recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- profil la signup

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
