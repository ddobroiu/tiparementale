-- Prețuri de program, nu de minute.
--
-- La 8–12 lei pe ședință, pachetele vechi vindeau timp de conversație. Ce
-- vinde produsul acum e altceva: ghiduri din terapia schemelor, clasare,
-- predicții, transformare cu exerciții urmărite, citirea hărții. Asta se
-- prețuiește ca un program pe o convingere — ~35 lei pe ședință, de șase ori
-- sub o ședință de psihoterapie și clar peste o aplicație de self-help.
--
-- Costul real măsurat: ~0,90 lei o ședință, ~0,45 lei o transformare. Marja
-- rămâne 96–97% la toate treptele; plafonul de cost crește proporțional.
--
-- Gratuit: o ședință și predicțiile („te regăsești?”, ~10 bani). Transformarea
-- rămâne motivul de a plăti — e lucrul cel mai valoros și cel mai scump.

set local search_path = tipare_mentale;

-- Pachetele vechi nu se șterg: cumpărările existente le referențiază. Doar ies
-- din vânzare.
update packs set active = false where code in ('start', 'opt', 'douaz');

insert into packs (code, name, price_ron, sessions, transformations, cost_ceiling_micro, sort_order)
values
  ('un-tipar',       'Un tipar',          149.00,  4,  2,  6000000, 1),
  ('harta-completa', 'Harta completă',    349.00, 12,  6, 18000000, 2),
  ('insotire-3-luni','Însoțire 3 luni',   599.00, 24, 12, 36000000, 3);

-- Contul nou: o ședință, zero transformări.
create or replace function handle_new_wallet()
returns trigger
language plpgsql
security definer set search_path = tipare_mentale
as $fn$
begin
  insert into wallets (user_id, sessions_balance, transformations_balance, cost_ceiling_micro)
  values (new.id, 1, 0, 1500000)
  on conflict do nothing;
  return new;
end;
$fn$;
