-- Însoțirea nu mai dublează ședințele, ci transformările.
--
-- Drumul are douăsprezece lecții, care se deschid una din alta. „Însoțire
-- 3 luni” avea 24 de ședințe — drumul de două ori, ceva ce nimeni nu-și
-- propune când cumpără. Ce deosebește un om care vrea însoțire nu e că vrea
-- să repete lecțiile, e că vrea să lucreze pe fiecare tipar care iese, nu
-- doar pe jumătate din ele. Deci: drumul o dată, o transformare pentru
-- fiecare lecție. Prețul rămâne.
--
-- Plafonul de cost urmează regula de 1 $ per credit: 12 + 12 = 24 $. Costul
-- maxim posibil e ~12 $, rezerva ×2. Portofelele deja creditate nu se ating —
-- cine a cumpărat 24 de ședințe le are.

set local search_path = tipare_mentale;

update packs
   set sessions = 12,
       transformations = 12,
       cost_ceiling_micro = 24000000
 where code = 'insotire-3-luni';
