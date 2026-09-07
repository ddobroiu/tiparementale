-- Conversația și extracția erau făcute de același apel, la fiecare replică:
-- fiecare „mhm, și ce s-a întâmplat apoi?" plătea indexul complet al hărții și
-- o rundă de raționament greu. Nu se susține economic.
--
-- De acum sunt două meserii separate. Replica se dă imediat, cu un model mai
-- ieftin. Extracția rulează pe mai multe mesaje odată, cu modelul bun, la
-- fiecare câteva replici și la închiderea conversației.
--
-- `extracted_at` ține minte ce a fost deja prelucrat, ca nimic să nu fie
-- extras de două ori și nimic să nu se piardă.

set local search_path = tipare_mentale;

alter table messages add column extracted_at timestamptz;

-- Mesajele neprelucrate ale unei conversații: interogarea din calea fierbinte.
create index messages_pending_extraction_idx
  on messages (conversation_id, created_at)
  where extracted_at is null and role = 'user';
