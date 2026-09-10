-- Resetarea parolei prin e-mail.
--
-- Omul primește un link cu un token; în bază se păstrează doar hash-ul lui,
-- ca la sesiuni: o citire a tabelului nu-i dă nimănui acces. Un token e bun o
-- oră și o singură dată — după folosire se marchează, nu se șterge, ca să se
-- vadă istoricul.
--
-- Tabelul rămâne în afara RLS, la fel ca `auth_sessions`: căutarea se face
-- după token, *înainte* de a ști cine este utilizatorul.

set local search_path = tipare_mentale;

create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index password_resets_user_idx on password_resets (user_id);
