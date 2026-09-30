-- E-mailurile de după crearea contului și formularul pentru vizitatori.
--
-- Aditivă: nu schimbă și nu șterge nimic existent.
--
-- users: prenumele merge în coloana existentă `display_name`. Nou e doar
-- alegerea privind e-mailurile cu noutăți și sfaturi (Legea 506/2004, art. 12
-- alin. 2 — servicii proprii similare, cu posibilitatea de a refuza la
-- colectare și în fiecare mesaj): bifa „Nu vreau…” de la înscriere, cu
-- momentul alegerii. Conturile vechi rămân cu `false` și NULL, dar nu primesc
-- nimic: vezi `email_settings`.
--
-- email_settings: momentul lansării. Doar conturile și contactele create după
-- el intră în e-mailurile periodice — cele de dinainte nu au văzut anunțul de
-- la înscriere. Se fixează când rulează migrarea.
--
-- leads: vizitatorii fără cont care au cerut lecția introductivă pe e-mail,
-- cu acordul explicit bifat (art. 6 alin. 1 lit. a GDPR).
--
-- email_log: fiecare e-mail trimis, o dată. Indexul unic parțial împiedică
-- dublurile chiar dacă cronul și înscrierea trimit în același timp; o
-- trimitere eșuată rămâne cu `error` și nu blochează o nouă încercare. Id-ul
-- rândului (aleator, 122 de biți) este și cheia linkului de dezabonare.
--
-- email_unsubscribes: adresele care nu mai primesc nimic din cele de mai sus.
-- Rămân și după ștergerea contului — altfel o adresă dezabonată ar putea
-- reprimi e-mailuri la o nouă înscriere a altcuiva cu ea.
--
-- Tabelele noi nu au RLS, ca `users`: le folosesc înscrierea, dezabonarea și
-- cronul, înainte de a exista un utilizator în context. Drepturile rolului
-- aplicației le dă scripts/migrate.mjs după fiecare migrare.

set local search_path = tipare_mentale;

alter table users add column if not exists marketing_opt_out boolean not null default false;
alter table users add column if not exists marketing_choice_at timestamptz;

create table if not exists email_settings (
  id                     boolean primary key default true check (id),
  lifecycle_launched_at  timestamptz not null default now()
);

insert into email_settings (id) values (true) on conflict do nothing;

create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  name             text,
  source_page      text,
  consent_at       timestamptz not null,
  consent_text     text not null,
  created_at       timestamptz not null default now(),
  unsubscribed_at  timestamptz
);

create unique index if not exists leads_email_idx on leads (lower(email));

create table if not exists email_log (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  user_id    uuid references users(id) on delete cascade,
  lead_id    uuid references leads(id) on delete cascade,
  kind       text not null,
  sent_at    timestamptz not null default now(),
  resend_id  text,
  error      text
);

create unique index if not exists email_log_once_idx
  on email_log (lower(email), kind) where error is null;
create index if not exists email_log_email_sent_idx on email_log (lower(email), sent_at desc);
create index if not exists email_log_kind_sent_idx on email_log (kind, sent_at desc);
create index if not exists email_log_user_idx on email_log (user_id);

create table if not exists email_unsubscribes (
  email            text primary key,
  unsubscribed_at  timestamptz not null default now(),
  email_log_id     uuid
);
