-- Monetizare pe ședințe, cu tokenii ca plasă de siguranță.
--
-- Unitatea vândută este ședința, fiindcă se potrivește cu produsul și
-- plafonează costul din construcție. Dar ședința singură nu garantează nimic
-- dacă o conversație poate crește oricât, așa că:
--
--   1. fiecare conversație are un număr maxim de replici;
--   2. fiecare apel la model își înregistrează tokenii reali și costul;
--   3. fiecare cont are un plafon de cost pe perioadă, verificat înainte de
--      apel, nu după.
--
-- Al treilea strat este cel care face imposibil să ieșim pe minus, indiferent
-- cât de mult vorbește cineva.

set local search_path = tipare_mentale;

-- ---------------------------------------------------------------- planuri

create type plan_code as enum ('free', 'explorare', 'lucru');

-- Ce include fiecare plan. Tabel, nu constante în cod: prețurile și limitele
-- se schimbă mai des decât aplicația.
create table plans (
  code                     plan_code primary key,
  name                     text not null,
  price_eur                numeric(6, 2) not null,
  sessions_included        int not null,
  transformations_included int not null,
  max_turns_per_session    int not null,
  -- Plafonul de cost pe perioadă, în micro-dolari. Ultima linie de apărare.
  cost_ceiling_micro       bigint not null
);

insert into plans (code, name, price_eur, sessions_included, transformations_included,
                   max_turns_per_session, cost_ceiling_micro)
values
  ('free',      'Prima ședință',  0.00,  1,  1, 25,   800000),
  ('explorare', 'Explorare',      9.99,  4,  4, 25,  4000000),
  ('lucru',     'Lucru',         19.99, 12, 12, 30, 12000000);

-- ---------------------------------------------------------------- abonament

create table subscriptions (
  user_id                 uuid primary key references users(id) on delete cascade,
  plan                    plan_code not null default 'free' references plans(code),
  period_start            timestamptz not null default now(),
  period_end              timestamptz not null default now() + interval '30 days',
  sessions_used           int not null default 0,
  transformations_used    int not null default 0,
  -- Costul real consumat în perioada curentă, însumat din usage_events.
  cost_used_micro         bigint not null default 0,
  created_at              timestamptz not null default now()
);

alter table subscriptions enable row level security;
alter table subscriptions force row level security;

create policy subscriptions_own on subscriptions
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- Fiecare utilizator nou primește prima ședință gratuită.
create or replace function handle_new_subscription()
returns trigger
language plpgsql
security definer set search_path = tipare_mentale
as $fn$
begin
  insert into subscriptions (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$fn$;

create trigger users_get_subscription
  after insert on users
  for each row execute function handle_new_subscription();

insert into subscriptions (user_id)
  select id from users on conflict do nothing;

-- ---------------------------------------------------------------- consum

create type usage_kind as enum ('reply', 'extraction', 'transformation');

-- Tokenii reali, din răspunsurile API. Marja se măsoară, nu se estimează.
create table usage_events (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  conversation_id       uuid references conversations(id) on delete set null,
  kind                  usage_kind not null,
  model                 text not null,
  input_tokens          int not null default 0,
  output_tokens         int not null default 0,
  cache_read_tokens     int not null default 0,
  cache_write_tokens    int not null default 0,
  cost_micro            bigint not null default 0,
  created_at            timestamptz not null default now()
);

create index usage_events_user_created_idx on usage_events (user_id, created_at desc);
create index usage_events_conversation_idx on usage_events (conversation_id);

alter table usage_events enable row level security;
alter table usage_events force row level security;

create policy usage_events_own on usage_events
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- ședințe

-- Conversația devine ședință: are un număr de replici și un sfârșit.
alter table conversations add column turns int not null default 0;
alter table conversations add column closed_at timestamptz;

-- Cât s-a schimbat o convingere de când a fost observată prima dată. Se
-- calculează din istoric, dar vârful de încredere trebuie ținut minte: fără el
-- nu se poate spune „era la 80%, acum e la 45%".
alter table nodes add column peak_confidence real;

update nodes set peak_confidence = confidence where peak_confidence is null;

-- Vârful se ridică singur, niciodată nu coboară.
create or replace function track_peak_confidence()
returns trigger
language plpgsql
as $fn$
begin
  new.peak_confidence = greatest(coalesce(old.peak_confidence, 0), new.confidence);
  return new;
end;
$fn$;

create trigger nodes_track_peak
  before update on nodes
  for each row execute function track_peak_confidence();
