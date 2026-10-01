/**
 * Textele de acord, într-un singur loc: formularul le afișează, serverul le
 * păstrează lângă momentul bifei, ca dovadă a ce anume s-a acceptat.
 * Fără importuri de server — fișierul ajunge și în browser.
 */

export const LEAD_CONSENT_TEXT =
  "Vreau să primesc lecția introductivă pe e-mail și, după câteva zile, un singur mesaj despre cum îmi fac un cont gratuit. Mă pot dezabona oricând, din orice e-mail.";

/**
 * Anunțul de la „Cont nou” (Legea 506/2004, art. 12 alin. 2): fără bifă de
 * refuz. Orice cont nou — cu parolă sau prin Google — se înregistrează cu
 * marketing permis (`marketing_opt_out = false`, `marketing_choice_at = now()`);
 * refuzul se face din linkul de dezabonare din fiecare e-mail.
 */
export const SIGNUP_MARKETING_NOTICE =
  "Îți putem trimite ocazional sfaturi și noutăți; te poți dezabona din orice e-mail.";
