# Tipare Mentale — Specificație

Aplicație web care ajută utilizatorul să-și vadă tiparele de gândire.
Utilizatorul vorbește sau scrie liber; AI-ul extrage convingeri, valori, emoții,
obiective și tipare recurente și le așază într-o hartă mentală vie, care se
actualizează în timp și devine mai precisă pe măsură ce utilizatorul o corectează.

> **Harta este produsul. Conversația este doar metoda.**
> Această propoziție decide fiecare compromis de design din document.

---

## 1. Cele trei etape

### Identificare
Utilizatorul vorbește sau scrie liber. AI-ul extrage tipare, convingeri, valori,
emoții și obiective — fiecare cu citatul-sursă din care a fost dedus.

### Interpretare
Se generează harta mentală interactivă, cu conexiunile dintre elemente.
Utilizatorul **confirmă, ajustează sau respinge** fiecare interpretare.
Aceasta nu este o funcție de interfață — este mecanismul prin care sistemul
devine mai precis. Vezi §4.

### Transformare
Pe baza tiparelor **confirmate**, aplicația propune exerciții, cărți și filme
alese pentru convingerea respectivă, și evidențiază progresul măsurat în timp.
Vezi §6.

---

## 2. Principii de produs

1. **Harta e ecranul principal.** Ruta implicită după autentificare este harta,
   niciodată chatul. Chatul e un panou care se deschide peste hartă și se închide.
2. **Fiecare conversație se termină în hartă.** La închiderea unei sesiuni,
   harta se animă și arată diferența: ce noduri au apărut, ce s-a întărit,
   ce s-a slăbit. Acesta este momentul de plată emoțională al produsului.
3. **Nimic fără sursă.** Orice nod poate răspunde la „de unde știi asta despre
   mine?" cu citatul exact din care a fost dedus. Fără asta, utilizatorul nu are
   încredere în hartă și nu revine.
4. **Observație înainte de intervenție.** Nu recomandăm nimic pe baza unui tipar
   neconfirmat.
5. **Nu e terapie.** Este un instrument de auto-observație. Afirmat explicit la
   onboarding.

---

## 3. Model de date

Nodul nu conține adevărul — **observațiile îl conțin**. Nodul este agregatul lor.
De aici rezultă gratuit: citatul-sursă, evoluția în timp și recalcularea
încrederii când apar date noi.

| Tabel | Câmpuri esențiale |
|---|---|
| `profiles` | `id`, `display_name`, `created_at` |
| `messages` | `id`, `user_id`, `role`, `content`, `input_mode` (text/voce), `created_at` |
| `nodes` | `id`, `user_id`, `type`, `label`, `user_label`, `summary`, `confidence`, `user_verdict`, `status`, `created_at`, `updated_at` |
| `observations` | `id`, `node_id`, `quote`, `source_message_id`, `sentiment`, `valence`, `observed_at` |
| `edges` | `id`, `user_id`, `from_node`, `to_node`, `relation`, `strength`, `rationale` |
| `node_history` | `id`, `node_id`, `field`, `old_value`, `new_value`, `changed_at` |
| `recommendations` | `id`, `user_id`, `node_id`, `kind` (exercise/book/film), `title`, `creator`, `year`, `rationale`, `status`, `created_at`, `completed_at` |
| `sessions` | `id`, `user_id`, `started_at`, `ended_at`, `summary`, `diff` |

**Tipuri de noduri:** `belief` (convingere), `value` (valoare), `emotion` (emoție),
`goal` (obiectiv), `pattern` (tipar recurent), `fear` (temere), `relationship`.

**Verdictele utilizatorului:** `unconfirmed`, `confirmed`, `rejected`, `edited`.

---

## 4. Bucla de precizie

La fiecare extracție, promptul conține indexul grafului existent, împărțit în:

- **noduri confirmate** — adevăr stabilit, cu formularea utilizatorului
  (`user_label`) când există;
- **noduri respinse** — exemple negative: „am interpretat greșit asta, nu repeta";
- **noduri neconfirmate** — ipoteze de lucru.

Modelul primește indexul *înainte* de a extrage, deci face fuziunea nodurilor din
prima, în loc să extragă orb și să curățăm după.

Un nod respins nu se șterge. Rămâne ca semnal tăcut — uneori un tipar e respins
pentru că e adevărat și incomod, iar apoi revine. Nu îl afișăm ca acuzație, dar
nu îl pierdem.

### Deduplicare, în două etape
- **Acum:** modelul primește indexul complet și decide fuziunea. Curat până la
  ~200–300 de noduri.
- **Când se rupe:** pgvector + embeddings pentru pre-filtrarea candidaților.
  Nu construim etapa a doua înainte să avem date reale care arată pragul.

---

## 5. Extracție

- Model: `claude-opus-5`, structured outputs (`output_config.format`).
- Prompt caching: indexul grafului este conținut stabil și intră în cache;
  mesajul volatil vine după breakpoint. Taie ~90% din costul de input.
- Ieșirea conține: observații noi, noduri de creat, noduri de actualizat,
  muchii noi, și un flag de siguranță (§8).
- Cost estimat: 2–4 cenți per replică; transcriere ≈ $0.006/minut.

---

## 6. Transformare — exerciții, cărți, filme

Fiecare recomandare este legată de **un nod confirmat, explicit**:
„Pentru convingerea *X*, pe care ai confirmat-o acum trei săptămâni."
Legătura cu harta este singura diferență între acest produs și o mie de
aplicații de dezvoltare personală.

- **Exerciții** — scurte, concrete, aplicabile în aceeași zi.
- **Cărți** — opere reale, cunoscute, cu motivația legată de convingerea anume.
- **Filme** — la fel; filmul funcționează pentru că arată tiparul în altcineva,
  ceea ce e mai ușor de privit decât în tine.

*Risc asumat:* modelul poate inventa titluri. Restrângem la opere consacrate,
cerem an și autor/regizor pentru verificabilitate, iar utilizatorul poate marca
o recomandare drept greșită.

**Progresul se măsoară din observații, nu din auto-raportare.**
„Tiparul apărea de 4 ori pe săptămână, acum apare o dată" sunt date reale.
„Cum te simți de la 1 la 10" este altă aplicație.

---

## 7. Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase — Postgres, Auth, RLS pe `user_id` de la prima migrare
- `@anthropic-ai/sdk` — extracție și recomandări
- Transcriere vocală pe server (Whisper), audio-ul nu trece prin alt client
- Deploy: Vercel

---

## 8. Siguranță și confidențialitate

- Datele sunt printre cele mai sensibile pe care le poate produce un om.
  Izolare pe utilizator prin RLS din prima migrare, nu adăugată ulterior.
- Export complet și ștergere totală a contului, la cerere.
- **Protocol de criză:** extracția întoarce un flag; interfața afișează discret
  resurse de ajutor, fără a bloca conversația.
- Disclaimer la onboarding: nu este terapie.

---

## 9. Ordinea de construcție

1. Schema + auth + RLS
2. Chat text → extracție structurată → noduri în bază
3. Harta interactivă: vizualizare rețea, click pe nod → citate + evoluție
4. Bucla de confirmare (§4)
5. Input vocal
6. Transformare: exerciții, cărți, filme, progres (§6)
7. Landing page cu cele trei etape, ilustrate cu produsul real — o mini-hartă
   care se construiește sub ochii vizitatorului, nu iconițe

Etapa 2 decide dacă produsul merită construit. O testăm pe conversații reale în
română înainte să investim în interfață.
