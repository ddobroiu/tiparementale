-- Factura Oblio a fiecarei plati (emisa automat din webhook-ul Stripe; eroarea ramane pentru reluare)
alter table tipare_mentale.purchases add column if not exists invoice_series text;
alter table tipare_mentale.purchases add column if not exists invoice_number text;
alter table tipare_mentale.purchases add column if not exists invoice_url text;
alter table tipare_mentale.purchases add column if not exists invoice_error text;
