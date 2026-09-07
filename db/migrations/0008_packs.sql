-- Trecere de la abonament la pachete de ședințe.
--
-- Abonamentul avea o problemă de potrivire cu produsul: oamenii nu lucrează la
-- convingerile lor uniform, câte patru ședințe pe lună. Lucrează în valuri —
-- două săptămâni intens, apoi o pauză. Un abonament îi pedepsește pe amândoi:
-- pe cel intens îl oprește la zid, pe cel în pauză îl face să plătească degeaba.
--
-- Pachetele nu expiră. Cumperi, folosești când vrei. Venitul e mai puțin
-- previzibil, dar produsul devine onest.
--
-- Plafonul de cost rămâne, fiindcă rămâne necesar: crește odată cu fiecare
-- pachet cumpărat, deci nu poate depăși niciodată ce a plătit omul.

set local search_path = tipare_mentale;

-- ---------------------------------------------------------------- pachete

create table packs (
  code                text primary key,
  name                text not null,
  price_ron           numeric(8, 2) not null,
  sessions            int not null,
  transformations     int not null,
  -- Cât ridică plafonul de cost al contului. Generos față de costul real
  -- (~0,50 lei pe ședință), ca să nu taie niciodată pe cineva care a plătit.
  cost_ceiling_micro  bigint not null,
  sort_order          int not null default 0,
  active              boolean not null default true
);

insert into packs (code, name, price_ron, sessions, transformations, cost_ceiling_micro, sort_order)
values
  ('start',  'Trei ședințe',       35.00,  3,  3,  3000000, 1),
  ('opt',    'Opt ședințe',        79.00,  8,  8,  8000000, 2),
  ('douaz',  'Douăzeci de ședințe', 169.00, 20, 20, 20000000, 3);

-- ---------------------------------------------------------------- portofel

-- Ce are omul, acum. Nu se resetează, nu expiră.
create table wallets (
  user_id                  uuid primary key references users(id) on delete cascade,
  sessions_balance         int not null default 0,
  transformations_balance  int not null default 0,
  cost_ceiling_micro       bigint not null default 0,
  cost_used_micro          bigint not null default 0,
  created_at               timestamptz not null default now()
);

alter table wallets enable row level security;
alter table wallets force row level security;

create policy wallets_own on wallets
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- cumpărări

create type purchase_status as enum ('pending', 'paid', 'failed', 'refunded');

create table purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  pack_code     text not null references packs(code),
  provider      text not null default 'stripe',
  -- Identificatorul sesiunii de plată. Unic, ca aceeași plată să nu poată
  -- credita portofelul de două ori dacă webhook-ul sosește de mai multe ori.
  provider_ref  text unique,
  amount_ron    numeric(8, 2) not null,
  status        purchase_status not null default 'pending',
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index purchases_user_idx on purchases (user_id, created_at desc);

alter table purchases enable row level security;
alter table purchases force row level security;

create policy purchases_own on purchases
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- ---------------------------------------------------------------- prima ședință

-- Fiecare cont nou primește prima ședință și prima transformare. Este
-- demonstrația, nu un cadou: fără ea nimeni nu are cum să știe ce cumpără.
create or replace function handle_new_wallet()
returns trigger
language plpgsql
security definer set search_path = tipare_mentale
as $fn$
begin
  insert into wallets (user_id, sessions_balance, transformations_balance, cost_ceiling_micro)
  values (new.id, 1, 1, 1500000)
  on conflict do nothing;
  return new;
end;
$fn$;

drop trigger if exists users_get_subscription on users;
drop function if exists handle_new_subscription();

create trigger users_get_wallet
  after insert on users
  for each row execute function handle_new_wallet();

-- Conturile existente primesc portofelul, păstrând ce consumaseră deja.
insert into wallets (user_id, sessions_balance, transformations_balance,
                     cost_ceiling_micro, cost_used_micro)
select u.id,
       greatest(0, 1 - coalesce(s.sessions_used, 0)),
       greatest(0, 1 - coalesce(s.transformations_used, 0)),
       1500000,
       coalesce(s.cost_used_micro, 0)
  from users u
  left join subscriptions s on s.user_id = u.id
on conflict do nothing;

drop table subscriptions;
drop table plans;
