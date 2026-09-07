-- Plafoanele din 0005 erau puse pe estimări. Acum avem măsurători reale,
-- dintr-o ședință completă cu extracție și transformare:
--
--   o replică (Sonnet, cu cache)   ~0,0033 $
--   o extracție (Opus, 4 replici)  ~0,0575 $
--   o transformare (Opus)          ~0,0713 $
--
-- Prima concluzie surprinzătoare: conversația nu este costul. O extracție
-- costă cât șaptesprezece replici. Pârghia care contează este cât de des
-- rulează extracția, nu ce model poartă discuția.
--
-- A doua: plafonul pentru planul gratuit era prea strâns. O ședință completă
-- plus o transformare se apropia de el, deci omul risca să fie oprit exact în
-- momentul care îl convinge. Un plafon care taie demonstrația nu apără nimic.

set local search_path = tipare_mentale;

update plans set cost_ceiling_micro = 1500000 where code = 'free';
update plans set cost_ceiling_micro = 5000000 where code = 'explorare';

-- Planul mare avea ședințe mai lungi *și* mai multe, ceea ce împingea costul
-- în cazul cel mai rău aproape de venit. Ședințe de aceeași lungime peste tot:
-- se vând mai multe, nu mai lungi.
update plans
   set max_turns_per_session = 25,
       cost_ceiling_micro = 10000000
 where code = 'lucru';
