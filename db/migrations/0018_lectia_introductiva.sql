-- Contul nou primește lecția introductivă, nu o ședință.
--
-- Ședința gratuită costa cât o ședință plătită (Opus la replici, până la 25
-- de replici, mai multe extracții) — până la 3,7 lei de cont, fără nicio
-- garanție că omul cumpără. La trafic adus gratuit, costul ăsta nu se
-- susține. Demonstrația devine o lecție anume — scurtă, pe model ieftin, cu
-- o singură actualizare a hărții la final — care nu consumă ședințe și se
-- face o singură dată (vezi guide.free în src/lib/guides.ts). Orice altceva
-- — lecțiile de pe drum, conversația liberă, întrebările scurte — cere un
-- pachet.
--
-- Plafonul de cost al contului nou coboară la 0,5 $: lecția introductivă
-- costă ~0,1 $ la maxim. Pachetele îl ridică pe al lor, ca și până acum.
-- Portofelele existente nu se ating: cine are ședința gratuită o păstrează.

set local search_path = tipare_mentale;

create or replace function handle_new_wallet()
returns trigger
language plpgsql
security definer set search_path = tipare_mentale
as $fn$
begin
  insert into wallets (user_id, sessions_balance, transformations_balance, cost_ceiling_micro)
  values (new.id, 0, 0, 500000)
  on conflict do nothing;
  return new;
end;
$fn$;
