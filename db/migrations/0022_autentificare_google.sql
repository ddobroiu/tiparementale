-- „Continuă cu Google”: conturile create prin Google nu au parolă.
--
-- Aditivă: nu șterge nimic și nu schimbă rândurile existente.
--
-- users.password_hash devine opțional: un cont creat cu Google are NULL până
-- când omul își pune o parolă din „Ai uitat parola?”. Autentificarea cu parolă
-- tratează NULL ca parolă greșită.
--
-- users.google_sub: identificatorul stabil al contului Google (`sub`), pus la
-- prima intrare cu Google. Contul se leagă după e-mail (fără diferență de
-- majuscule), deci cine avea deja cont cu parolă intră în același cont.
-- Indexul unic parțial împiedică două conturi legate de același cont Google.

set local search_path = tipare_mentale;

alter table users alter column password_hash drop not null;
alter table users add column if not exists google_sub text;

create unique index if not exists users_google_sub_key on users (google_sub) where google_sub is not null;
