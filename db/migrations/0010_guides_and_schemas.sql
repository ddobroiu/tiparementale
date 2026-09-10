-- Ședințe ghidate și clasarea pe scheme.
--
-- 1. Fiecare nod poate purta o schemă (taxonomia lui Young, 18 tipare de bază).
--    Este răspunsul la „ce fel de tipar e acesta?” cu o etichetă pe care un
--    terapeut o recunoaște, nu una inventată. Nulabil: nu tot ce e pe hartă
--    intră într-o schemă, iar o clasare forțată e mai rea decât niciuna.
--
-- 2. Conversațiile pot urma un ghid: o temă (copilăria, tata, mama, banii…) cu
--    un parcurs de pași. Ghidul și pasul curent stau pe conversație, ca modelul
--    să știe unde se află și încotro merge.
--
-- 3. Mesajele asistentului pot veni cu variante de răspuns — pe modelul
--    chestionarului Young — pe care omul le poate atinge în loc să scrie.
--    Se păstrează, ca istoricul să arate ce i s-a propus, nu doar ce a ales.

set local search_path = tipare_mentale;

alter table nodes add column schema_code text;
create index nodes_user_schema_idx on nodes (user_id, schema_code) where schema_code is not null;

alter table conversations add column guide_id text;
alter table conversations add column step_index int not null default 0;

alter table messages add column options jsonb;
