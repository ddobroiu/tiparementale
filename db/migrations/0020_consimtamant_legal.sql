-- Dovada consimțământului, cu versiunea textului la care s-a spus „da”.
--
-- purchases: acordul cu termenii și cererea de executare imediată, cu luarea
-- la cunoștință a pierderii dreptului de retragere (OUG 34/2014, art. 16
-- lit. a și m), bifate înainte de plată. Aceleași date pleacă și în
-- metadatele sesiunii Stripe.
--
-- users: acordul cu termenii la crearea contului și consimțământul explicit
-- pentru datele care pot privi sănătatea (art. 9 alin. 2 lit. a GDPR).
-- Coloanele sunt opționale: conturile și plățile vechi rămân cu NULL.

alter table tipare_mentale.purchases add column if not exists consent_at timestamptz;
alter table tipare_mentale.purchases add column if not exists terms_version text;

alter table tipare_mentale.users add column if not exists terms_accepted_at timestamptz;
alter table tipare_mentale.users add column if not exists terms_version text;
alter table tipare_mentale.users add column if not exists sensitive_data_consent_at timestamptz;
