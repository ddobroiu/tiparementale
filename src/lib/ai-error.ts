import Anthropic from "@anthropic-ai/sdk";

import { alerta, faraCredite } from "@/lib/alerts";

/**
 * Traducerea unei erori de la model în ceva folositor, în două direcții.
 *
 * Către om: o propoziție care spune ce s-a întâmplat și ce poate face. Până
 * acum, o eroare de API prăbușea ruta, clientul primea un corp gol și pe ecran
 * apărea „Ceva n-a mers” — adevărat, dar inutil pentru toată lumea.
 *
 * Către noi: mesajul complet în jurnalul serverului. Fără el, un `400 Invalid
 * request data` rămâne un mister, iar diagnosticarea înseamnă ghicit.
 */

export interface AiFailure {
  /** Ce vede omul. */
  message: string;
  /** Codul HTTP potrivit. */
  status: number;
  /** Dacă are rost să încerce din nou imediat. */
  retryable: boolean;
}

export function describeAiError(error: unknown, context: string): AiFailure {
  // Jurnalul primește întotdeauna tot, indiferent ce arătăm în interfață.
  console.error(`[ai:${context}]`, error);

  // Credite terminate la Anthropic: anuntam proprietarul (mydashboard limiteaza la o data pe ora).
  if (faraCredite(error)) {
    const short = error instanceof Error ? error.message : String(error);
    void alerta(
      "credits",
      "anthropic",
      `Tipare Mentale: Anthropic a refuzat cererea - credite terminate. Generarea nu merge pana nu reincarci contul: ${short.slice(0, 300)}`,
    );
  }

  if (error instanceof Anthropic.APIError) {
    if (error.status === 429) {
      return {
        message: "Prea multe cereri deodată. Încearcă din nou peste câteva secunde.",
        status: 429,
        retryable: true,
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        message: "Serviciul nu este configurat corect. Am fost anunțați.",
        status: 503,
        retryable: false,
      };
    }

    if (error.status && error.status >= 500) {
      return {
        message: "Serviciul de limbaj are o problemă momentan. Încearcă din nou.",
        status: 503,
        retryable: true,
      };
    }

    // 400: aproape întotdeauna un defect al nostru, nu al omului.
    return {
      message: "Nu am putut prelucra cererea. Am înregistrat problema.",
      status: 502,
      retryable: false,
    };
  }

  if (error instanceof Anthropic.APIConnectionError) {
    return {
      message: "Nu am putut ajunge la serviciul de limbaj. Încearcă din nou.",
      status: 503,
      retryable: true,
    };
  }

  return {
    message: "Ceva nu a mers. Încearcă din nou.",
    status: 500,
    retryable: true,
  };
}
