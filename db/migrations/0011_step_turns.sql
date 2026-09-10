-- Câte replici s-au petrecut pe pasul curent al ghidului.
--
-- Lăsat singur, modelul sapă la nesfârșit într-un pas: „sapi înainte să
-- lărgești” e o regulă bună pentru o replică și una proastă pentru o ședință.
-- La verificare a stat patru replici pe primul pas dintr-un ghid de cinci — o
-- ședință întreagă ar fi acoperit două teme. Contorul permite un plafon impus
-- de server, nu lăsat la latitudinea modelului.

set local search_path = tipare_mentale;

alter table conversations add column step_turns int not null default 0;
