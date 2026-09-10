-- Exercițiile devin structură, nu sugestie.
--
-- „Firma nu se repară cu motivație — se reconstruiește cu structură" (Petre
-- Nicolae). La fel și un tipar. Un exercițiu care spune „predă ceva la 90%" e
-- o idee bună fără urmare; unul care spune *când* se declanșează, *ce* faci în
-- sub zece minute, *ce* notezi după și *când* revii e o procedură care se poate
-- executa și verifica.
--
-- Cele patru câmpuri urmează forma experimentului comportamental din terapia
-- cognitivă (Bennett-Levy et al., Oxford Guide to Behavioural Experiments):
-- predicția, testul, observația, concluzia. Notarea nu e un detaliu — fără ea
-- mintea rescrie ce s-a întâmplat ca să se potrivească cu regula veche.

set local search_path = tipare_mentale;

-- Ce anume încearcă exercițiul. Fiecare metodă are altă logică de lucru.
create type exercise_method as enum (
  'behavioural_experiment',  -- testezi predicția convingerii într-o situație reală
  'graded_exposure',         -- pași mici către ceea ce eviți
  'thought_record',          -- prinzi gândul, îl separi de fapt
  'opposite_action',         -- faci deliberat contrariul reflexului
  'boundary_practice',       -- spui nu / ceri, în miză mică
  'self_compassion'          -- vocea critică, numită și înlocuită
);

alter table recommendations add column method exercise_method;
alter table recommendations add column trigger_cue text;   -- „când observi că…"
alter table recommendations add column action text;        -- ce faci, sub 10 minute
alter table recommendations add column record_prompt text; -- ce notezi după
alter table recommendations add column review_after_days int;

-- Urmărirea: fiecare dată când omul face exercițiul și notează ce s-a întâmplat.
-- Aici trăiește progresul măsurat, nu declarat.
create table exercise_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  recommendation_id  uuid not null references recommendations(id) on delete cascade,
  did_it             boolean not null,
  note               text,
  -- Cât de mult s-a confirmat frica, 0–10. Scade în timp dacă exercițiul lucrează.
  fear_confirmed     smallint check (fear_confirmed between 0 and 10),
  logged_at          timestamptz not null default now()
);

create index exercise_logs_rec_idx on exercise_logs (recommendation_id, logged_at desc);
create index exercise_logs_user_idx on exercise_logs (user_id, logged_at desc);

alter table exercise_logs enable row level security;
alter table exercise_logs force row level security;

create policy exercise_logs_own on exercise_logs
  for all
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
