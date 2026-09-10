# Bugetul: cât costă o ședință și cât rămâne

Cifrele de mai jos sunt **măsurate** din `usage_events` (tokenii reali
raportați de API, la prețurile din `src/lib/billing/pricing.ts`), nu
estimate. Se recalculează oricând cu:

```bash
node --env-file=.env.local scripts/spend.mjs          # consumul real, pe tipuri și pe zile
node --env-file=.env.local scripts/smoke-lesson-end.mjs   # o lecție întreagă, cu costul ei exact
```

Curs folosit: 1 $ ≈ 4,6 lei.

## Modelele, pe meserii

| Meserie | Model | Gândire | Cost mediu pe apel | De ce |
|---|---|---|---|---|
| Replica din conversație | claude-opus-5 | low | ≈ 1,5 ¢ | Fața produsului. Sonnet vorbea corect, dar formulaic („Deci…” la fiecare replică) și trăgea concluzii mai mari decât spusese omul. |
| Extracția pe hartă | claude-sonnet-5 | medium | ≈ 1,6 ¢ | E ghidată de schemă; diferența de calitate față de Opus nu se vede, prețul se vede (6,6 ¢ pe Opus). |
| Transformarea | claude-opus-5 | high | ≈ 14 ¢ | O dată per convingere; momentul care convinge omul să plătească. |
| Predicții, citirea hărții | claude-sonnet-5 | medium | ≈ 1–3 ¢ | Rare, nelimitate, ieftine. |

Haiku 4.5 a fost încercat la replici: de trei ori mai ieftin, dar strica
româna. Nu se mai ia în calcul.

## O lecție, măsurată

Lecția „Ce se întâmpla când greșeai”, parcursă cap-coadă cu răspunsuri
scurte (7 replici, 3 actualizări de hartă):

| | Apeluri | Cost |
|---|---|---|
| Replici (Opus) | 7 | 10,5 ¢ |
| Extracții (Sonnet) | 3 | 4,9 ¢ |
| **Total** | | **15,4 ¢ ≈ 0,71 lei** |

O lecție cu răspunsuri lungi și 12 replici ajunge la ~25 ¢ ≈ 1,15 lei.

## Cel mai rău caz pe o ședință

O ședință are cel mult 25 de replici. Dacă omul le folosește pe toate, cu
răspunsuri lungi, și harta se actualizează de 8 ori:

| | Apeluri | Cost |
|---|---|---|
| Replici, la maximul măsurat (2,4 ¢) | 25 | 60 ¢ |
| Extracții, la maximul măsurat (2,5 ¢) | 8 | 20 ¢ |
| **Total** | | **80 ¢ ≈ 3,7 lei** |

Nicio ședință nu poate costa mai mult: după 25 de replici se închide.

## Marja pe pachete

| Pachet | Preț | Ședințe | Transformări | Cost tipic | Cost maxim | Marjă tipică |
|---|---|---|---|---|---|---|
| Un tipar | 149 lei | 4 | 2 | 4 × 0,9 + 2 × 0,65 ≈ 4,9 lei | 4 × 3,7 + 2 × 0,9 ≈ 16,6 lei | ≈ 97 % |
| Harta completă | 349 lei | 12 | 6 | ≈ 14,7 lei | ≈ 49,8 lei | ≈ 96 % |
| Însoțire 3 luni | 599 lei | 24 | 12 | ≈ 29,4 lei | ≈ 99,6 lei | ≈ 95 % |

Comisionul Stripe (≈ 1,5 % + 1 leu) e sub 4 lei pe orice pachet și nu
schimbă tabloul.

**Contul gratuit** (o ședință, zero transformări) costă tipic 0,7–1,2 lei
și cel mult 3,7 lei. E costul de a-i arăta omului harta lui înainte să
plătească — cel mai ieftin marketing pe care îl avem.

## Plafonul tehnic

Fiecare pachet aduce un plafon de cost în micro-dolari (`cost_ceiling_micro`),
verificat **înainte** de orice apel la model. Dacă ceva scapă de sub control —
un bug, un abuz — contul se oprește la plafon, nu la factura noastră.

| | Plafon | Cost maxim posibil | Rezervă |
|---|---|---|---|
| Cont gratuit | 1,5 $ | 0,8 $ | ×1,9 |
| Un tipar | 6 $ | 3,5 $ | ×1,7 |
| Harta completă | 18 $ | 10,5 $ | ×1,7 |
| Însoțire 3 luni | 36 $ | 21 $ | ×1,7 |

Creditele adăugate de mână din admin ridică plafonul cu 1 $ per credit.

## Proiecție

La 100 de utilizatori activi pe lună, fiecare cu 4 lecții și o transformare:

| | Pe lună |
|---|---|
| Cost model (tipic) | 100 × (4 × 0,9 + 0,65) ≈ 425 lei |
| Cost model (maxim teoretic) | 100 × (4 × 3,7 + 0,9) ≈ 1.570 lei |
| Încasări, dacă jumătate cumpără „Un tipar” | 50 × 149 = 7.450 lei |

Pragul de siguranță: dacă costul mediu pe lecție măsurat în `scripts/spend.mjs`
trece de 2 lei, ceva s-a schimbat (prețuri, prompt prea lung, extracții prea
dese) și merită uitat înainte de a crește.

## La publicare

Modelul replicii se citește din mediu. Pe server, în `.env`:

```
MODEL_REPLY=claude-opus-5
EFFORT_REPLY=low
```

Fără această linie, codul folosește oricum Opus ca implicit; linia e ca să
fie explicit ce plătim.
