-- Politicile din 0001 compară direct `current_setting('app.user_id', true)::uuid`.
-- Când variabila nu este setată — sau a fost resetată la finalul unei tranzacții,
-- caz în care rămâne șirul gol — conversia la uuid aruncă o eroare, în loc să
-- refuze curat accesul.
--
-- `nullif(..., '')` transformă lipsa în NULL: comparația devine falsă, iar
-- interogarea întoarce zero rânduri. Tot închis, dar fără excepție.

set local search_path = tipare_mentale;

do $$
declare
  t text;
begin
  foreach t in array array[
    'conversations', 'messages', 'nodes', 'observations',
    'edges', 'node_history', 'recommendations'
  ]
  loop
    execute format('drop policy if exists %I on tipare_mentale.%I', t || '_own', t);
    execute format(
      'create policy %I on tipare_mentale.%I for all
         using (user_id = nullif(current_setting(''app.user_id'', true), '''')::uuid)
         with check (user_id = nullif(current_setting(''app.user_id'', true), '''')::uuid)',
      t || '_own', t
    );
  end loop;
end;
$$;
