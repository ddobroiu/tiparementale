-- Zona de administrare.
--
-- Administratorul trebuie să vadă peste toți utilizatorii: câți sunt, ce au
-- în portofel, cât a costat fiecare. RLS filtrează după `app.user_id`, deci
-- fără nimic în plus el n-ar vedea nici un rând. Adăugăm o a doua politică,
-- pe fiecare tabel protejat: rândurile se văd și când tranzacția declară
-- `app.admin = 'on'`. Setarea o pune doar codul de administrare, într-o
-- tranzacție, după ce a verificat că omul e pe lista ADMIN_EMAILS — exact
-- cum `withUser` declară `app.user_id`. Nicio altă cale nu o poate porni.
--
-- Creditele adăugate de mână se scriu într-un registru propriu: se vede
-- oricând cine, cui, cât și de ce.

set local search_path = tipare_mentale;

create table wallet_adjustments (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references users(id) on delete cascade,
  admin_email               text not null,
  sessions_delta            int not null default 0,
  transformations_delta     int not null default 0,
  cost_ceiling_delta_micro  bigint not null default 0,
  note                      text,
  created_at                timestamptz not null default now()
);

create index wallet_adjustments_user_idx on wallet_adjustments (user_id, created_at desc);

alter table wallet_adjustments enable row level security;
alter table wallet_adjustments force row level security;

-- Utilizatorul își vede propriile ajustări (în cont, la istoric), ca la orice tabel.
create policy wallet_adjustments_own on wallet_adjustments for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

-- Politica de administrator, pe fiecare tabel cu RLS din schemă.
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables
     where schemaname = 'tipare_mentale' and rowsecurity
  loop
    execute format(
      'create policy %I on tipare_mentale.%I for all
         using (current_setting(''app.admin'', true) = ''on'')
         with check (current_setting(''app.admin'', true) = ''on'')',
      t || '_admin', t
    );
  end loop;
end;
$$;
