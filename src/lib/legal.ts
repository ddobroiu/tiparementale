/**
 * Datele juridice ale operatorului și versiunea documentelor legale, într-un
 * singur loc: subsol, pagini legale, JSON-LD, consimțământul la plată și la
 * crearea contului citesc toate de aici.
 *
 * Când se schimbă termenii sau politicile, se schimbă `LEGAL_VERSION` (și
 * eticheta de mai jos): versiunea se salvează la fiecare plată și la fiecare
 * cont nou, deci se știe exact la ce text a spus omul „da”.
 */

import { SITE } from "./site";

export const LEGAL_VERSION = "2026-09-29";
export const LEGAL_VERSION_LABEL = "Versiunea 3";
/** Data de intrare în vigoare, cum se afișează în pagini. */
export const LEGAL_EFFECTIVE = "29.09.2026";

export const OPERATOR = {
  name: "CULOAREA DIN VIAȚA SA S.R.L.",
  cui: "44820819",
  regCom: "J2021001108100",
  euid: "ROONRC.J2021001108100",
  vatStatus: "neplătitor de TVA",
  address: {
    street: "Sat Topliceni nr. 214, Com. Topliceni",
    locality: "Topliceni",
    county: "jud. Buzău",
    region: "Buzău",
    postalCode: "127630",
    country: "România",
    countryCode: "RO",
  },
  email: SITE.email,
} as const;

export const OPERATOR_ADDRESS =
  `${OPERATOR.address.street}, ${OPERATOR.address.county}, ` +
  `${OPERATOR.address.postalCode}, ${OPERATOR.address.country}`;

/** Firma nu e plătitoare de TVA: prețul afișat e cel final. */
export const PRICE_NOTE = "Preț final; furnizorul nu este plătitor de TVA.";

export const ANPC_URL = "https://anpc.ro";
export const ANPC_SAL_URL = "https://anpc.ro/ce-este-sal/";
export const ANSPDCP_URL = "https://www.dataprotection.ro";

/** Pentru JSON-LD (schema.org Organization). */
export const organizationLegal = {
  legalName: OPERATOR.name,
  taxID: OPERATOR.cui,
  address: {
    "@type": "PostalAddress",
    streetAddress: OPERATOR.address.street,
    addressLocality: OPERATOR.address.locality,
    addressRegion: OPERATOR.address.region,
    postalCode: OPERATOR.address.postalCode,
    addressCountry: OPERATOR.address.countryCode,
  },
} as const;
