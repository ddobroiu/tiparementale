# Tipare Mentale — Specificație

Aplicație web care ajută utilizatorul să-și vadă tiparele de gândire.
El poartă o conversație liberă; interlocutorul din aplicație pune întrebări,
urmează firul și extrage convingerile care îi conduc reacțiile. Din ele se
construiește o hartă mentală vie, pe ramuri de viață, care crește în timp și
devine mai precisă pe măsură ce omul o corectează. Pentru convingerile
confirmate, aplicația lucrează cu el la schimbarea lor.

> **Harta este produsul. Conversația este metoda.**
> Această propoziție decide fiecare compromis de design din document.

---

## 1. Cele trei etape

### Identificare
O conversație adevărată, nu un chestionar. Interlocutorul pune **o singură
întrebare pe replică**, sapă în răspuns înainte să lărgească, cere exemple
concrete. Din ce spune omul extrage convingeri, valori, emoții, obiective,
temeri, tipare și relații — fiecare cu citatul-sursă.

### Interpretare
Harta se construiește pe **ramuri**: fiecare domeniu de viață își are zona lui.
Elementele se leagă între ele și arată ce alimentează ce. Utilizatorul
**confirmă, reformulează sau respinge** fiecare interpretare. Aceasta nu este o
funcție de interfață — este mecanismul prin care sistemul devine precis. Vezi §4.

### Transformare
Pentru convingerile **confirmate**, aplicația propune o **convingere nouă** care
să le ia locul, împreună cu exerciții mici, exemple concrete, o carte și un film
alese pentru convingerea aceea. Vezi §6.

---

## 2. Principii de produs

1. **Harta e ecranul principal.** Ruta implicită după autentificare este harta,
   niciodată chatul. Chatul e un panou care se deschide peste ea și se închide.
2. **Fiecare conversație se termină în hartă.** La închidere, harta se animă și
   arată diferența: ce a apărut, ce s-a întărit, ce s-a slăbit. Acesta este
   momentul de plată emoțională al produsului.
3. **Conversația nu recită harta.** Interlocutorul nu enumeră ce a extras și nu
   spune „am adăugat o convingere". Harta se vede singură; povestită, devine de
   prisos.
4. **Nimic fără sursă.** Orice nod răspunde la „de unde știi asta despre mine?"
   cu citatul exact.
5. **Observație înainte de intervenție.** Nu se recomandă nimic pe baza unui
   tipar neconfirmat.
6. **Nu e terapie.** Este un instrument de auto-observație. Afirmat la onboarding.

---

## 3. Date

Nodul nu conține adevărul — **observațiile îl conțin**. Nodul este agregatul lor.
De aici rezultă gratuit citatul-sursă, evoluția în timp și recalcularea
încrederii când apar date noi.

| Tabel | Rol |
|---|---|
| `users`, `auth_sessions` | cont și sesiune; singurele fără RLS (vezi §8) |
| `conversations`, `messages` | firul discuției, cu domeniul în care s-a purtat |
| `nodes` | elementele hărții: tip, **domeniu**, formularea modelului, formularea utilizatorului, încredere, verdict |
| `observations` | citatul-sursă, mesajul din care provine, sentiment, valență |
| `edges` | legăturile, cu relația și motivul lor |
| `node_history` | ce s-a schimbat și când |
| `transformations` | convingerea nouă propusă pentru un nod confirmat |
| `recommendations` | exercițiu / exemplu / carte / film, legate de o transformare |

**Tipuri de noduri:** convingere, valoare, emoție, obiectiv, tipar, temere, relație.
**Domenii:** bani, relații, sănătate, muncă, familie, sine, sens.
**Verdicte:** neconfirmat, confirmat, respins, editat.

---

## 4. Bucla de precizie

La fiecare extracție, promptul conține indexul hărții împărțit pe verdicte:

- **confirmate** — adevăr stabilit, cu formularea utilizatorului (`user_label`);
- **respinse** — exemple negative: „am interpretat greșit, nu repeta";
- **neconfirmate** — ipoteze de lucru.

Modelul primește indexul *înainte* de a extrage, deci face fuziunea nodurilor din
prima, în loc să extragem orb și să curățăm după.

Promptul include și **acoperirea domeniilor** — câte elemente are fiecare ramură
și care sunt neatinse — ca discuția să se poată muta natural într-o zonă
neexplorată, printr-o întrebare, nu printr-un anunț.

Un nod respins nu se șterge. Iese din hartă și rămâne ca semnal tăcut: uneori un
tipar e respins pentru că e adevărat și incomod, iar apoi revine.

### Deduplicare, în două etape
- **Acum:** modelul primește indexul complet și decide fuziunea. Curat până la
  ~200–300 de noduri.
- **Când se rupe:** pgvector + embeddings pentru pre-filtrare. Nu construim
  etapa a doua înainte să avem date care arată pragul.

---

## 5. Model și cost

- `claude-opus-5`, ieșire structurată (`output_config.format`).
- Instrucțiunile de sistem sunt un bloc de cache; indexul volatil stă după
  breakpoint. Taie ~90% din costul de input.
- Cost estimat: 2–4 cenți per replică.

---

## 6. Transformare

Fiecare transformare pleacă de la **un nod confirmat**. Legătura cu harta este
singura diferență între acest produs și o aplicație generică de dezvoltare
personală.

- **Convingerea nouă nu este opusul celei vechi.** „Nu trebuie să fiu perfect"
  este o negație, iar nimeni nu trăiește după o negație. Se caută varianta pe
  care omul ar putea-o crede de mâine.
- **Se spune de ce s-a instalat cea veche și ce a protejat.** Convingerile
  restrictive au fost soluții bune cândva. Fără asta, omul se apără.
- **Exercițiile sunt mici și de făcut în aceeași zi.**
- **Exemplele sunt situații, nu principii** — descrise atât de precis încât să
  fie de recunoscut când apar.
- **Cartea și filmul sunt opere reale**, cu autor/regizor și an, iar motivația se
  leagă de convingerea anume.

*Risc asumat:* modelul poate inventa titluri. Cerem an și autor pentru
verificabilitate, iar utilizatorul poate marca o recomandare drept greșită.

**Progresul se măsoară din observații, nu din auto-raportare.**

---

## 7. Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4
- Postgres — **bază partajată cu alte proiecte** (vezi §8)
- `pg` pentru acces, migrări proprii în `db/migrations`
- `@anthropic-ai/sdk`
- Autentificare proprie: email + parolă (scrypt), sesiuni în bază

---

## 8. Izolare, siguranță, confidențialitate

Baza de date este comună mai multor proiecte, toate în `public`. Acest proiect
trăiește într-o **schemă proprie**, `tipare_mentale`, iar aplicația se conectează
cu rolul `tipare_mentale_app`, care:

- vede exclusiv schema proiectului — `public` îi este revocat;
- nu are drept de DDL;
- este supus politicilor RLS (nu este proprietarul tabelelor).

Peste asta, fiecare cerere rulează într-o tranzacție care setează `app.user_id`,
iar politicile RLS filtrează pe utilizator. Izolarea între utilizatori este o
garanție a bazei de date, nu o promisiune a codului: un `where user_id = ...`
uitat nu scurge nimic. Când variabila lipsește, politicile întorc zero rânduri.

`users` și `auth_sessions` sunt singurele tabele fără RLS — autentificarea
trebuie să caute după email și după token *înainte* de a ști cine este
utilizatorul.

Verificarea acestor garanții rulează cu `scripts/verify-isolation.mjs`.

Restul:
- export complet și ștergere totală a contului, la cerere;
- **protocol de criză:** extracția întoarce un flag; interfața afișează discret
  resurse de ajutor, fără a bloca conversația;
- disclaimer la onboarding: nu este terapie.

---

## 9. Stadiu

Construit: izolarea bazei, autentificarea, conversația cu extracție structurată,
harta pe ramuri cu citate și evoluție, bucla de confirmare, transformarea cu
convingere nouă și recomandări, prima pagină.

Rămâne: input vocal, măsurarea progresului în timp, export și ștergere cont.
