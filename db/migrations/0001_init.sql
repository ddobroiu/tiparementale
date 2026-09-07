-- Tipare Mentale — schema inițială
--
-- Baza de date este partajată cu alte proiecte, toate înghesuite în `public`.
-- Acest proiect trăiește într-o schemă proprie: zero coliziuni de nume, iar
-- rolul aplicației nu are drept de acces în afara ei.
--
-- Principiu de modelare: nodul nu conține adevărul, observațiile îl conțin.
-- Nodul este agregatul lor; de aici rezultă citatul-sursă și evoluția în timp.

create schema if not exists tipare_mentale;
set local search_path = tipare_mentale;

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

-- ---------------------------------------------------------------- utilizatori

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  password_hash  text not null,
  display_name   text,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index users_email_idx on users (lower(email));

-- Sesiunile de autentificare. Se păstrează doar hash-ul token-ului: o citire a
-- tabelului nu permite nimănui să se dea drept utilizator.
create table auth_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index auth_sessions_user_idx on auth_sessions (user_id);
create index auth_sessions_expiry_idx on auth_sessions (expires_at);

-- ---------------------------------------------------------------- conversații

-- Grupează mesajele unei conversații și reține diferența produsă în hartă:
-- „ce s-a schimbat” este ecranul cu care se încheie fiecare conversație.
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  summary     text,
  diff        jsonb not null default '{}'::jsonb
);

create index conversations_user_started_idx on conversations (user_id, started_at desc);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  conversation_id  uuid references conversations(id) on delete set null,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  input_mode       input_mode not null default 'text',
  created_at       timestamptz not null default now()
);

create index messages_user_created_idx on messages (user_id, created_at desc);
create index messages_conversation_idx on messages (conversation_id, created_at);

-- ---------------------------------------------------------------- noduri

create table nodes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  type         node_type not null,

  -- label: formularea modelului. user_label: formularea utilizatorului, care o
  -- înlocuiește la afișare și în promptul de extracție atunci când există.
  label        text not null,
  user_label   text,
  summary      text,

  confidence   real not null default 0.5 check (confidence >= 0 and confidence <= 1),
  verdict      node_verdict not null default 'unconfirmed',

  -- un nod respins nu se șterge: iese din hartă, rămâne ca exemplu negativ
  archived_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index nodes_user_idx on nodes (user_id, type);
create index nodes_user_verdict_idx on nodes (user_id, verdict);

-- Unitatea atomică de adevăr. Fiecare are citatul din care a fost dedusă, ca
-- nodul să poată răspunde oricând la întrebarea „de unde știi asta despre mine?".
create table observations (
  id                 uuid primary key default gen_random_uuid(),
  node_id            uuid not null references nodes(id) on delete cascade,
  user_id            uuid not null references users(id) on delete cascade,
  quote              text not null,
  source_message_id  uuid references messages(id) on delete set null,
  sentiment          text,
  valence            real check (valence >= -1 and valence <= 1),
  observed_at        timestamptz not null default now()
);

create index observations_node_idx on observations (node_id, observed_at desc);
create index observations_user_observed_idx on observations (user_id, observed_at desc);

create table edges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
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

create table node_history (
  id          uuid primary key default gen_random_uuid(),
  node_id     uuid not null references nodes(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  field       text not null,
  old_value   text,
  new_value   text,
  changed_at  timestamptz not null default now()
);

create index node_history_node_idx on node_history (node_id, changed_at desc);

-- Fiecare recomandare se leagă de un nod confirmat. Legătura cu harta este
-- singura diferență între acest produs și o aplicație generică de self-help.
create table recommendations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
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

create function touch_updated_at()
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
--
-- Datele sunt printre cele mai sensibile pe care le poate produce un om.
-- Fiecare cerere rulează într-o tranzacție care setează `app.user_id`, iar
-- politicile de mai jos fac izolarea între utilizatori o garanție a bazei de
-- date, nu o promisiune a codului: un `where user_id = ...` uitat nu scurge
-- nimic.
--
-- `users` și `auth_sessions` rămân în afara RLS — autentificarea trebuie să
-- caute după email și după token *înainte* de a ști cine este utilizatorul.

do $$
declare
  t text;
begin
  foreach t in array array[
    'conversations', 'messages', 'nodes', 'observations',
    'edges', 'node_history', 'recommendations'
  ]
  loop
    execute format('alter table tipare_mentale.%I enable row level security', t);
    execute format('alter table tipare_mentale.%I force row level security', t);
    execute format(
      'create policy %I on tipare_mentale.%I for all
         using (user_id = current_setting(''app.user_id'', true)::uuid)
         with check (user_id = current_setting(''app.user_id'', true)::uuid)',
      t || '_own', t
    );
  end loop;
end;
$$;
