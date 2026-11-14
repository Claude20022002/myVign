import { z } from 'zod';
import { ProductCode } from './catalog';
import { Id, IsoDate, IsoDateTime, Money } from './common';

export const PolicyStatus = z.enum(['active', 'pending_start', 'expired', 'cancelled']);

export const Policy = z.object({
  id: Id,
  number: z.string().describe('Numéro de contrat lisible, ex. AUTO-2026-000123'),
  product: ProductCode,
  formulaCode: z.string(),
  formulaName: z.string(),
  status: PolicyStatus,
  holderName: z.string(),
  /** Objet assuré résumé : « Peugeot 208 · 4521AB01 » ou « Appartement · Gombe ». */
  insuredObject: z.string(),
  startDate: IsoDate,
  endDate: IsoDate,
  annualPremium: Money,
  certificateCode: z.string().nullable(),
  createdAt: IsoDateTime,
});
export type Policy = z.infer<typeof Policy>;

export const PolicyParams = z.object({ policyId: Id });

/**
 * Certificat d'assurance RC auto. Mentions obligatoires CA 121-122.
 * Après paiement : certificat PROVISOIRE immédiat (valable 1 mois au plus), puis DÉFINITIF
 * via le SNECA sous 10 jours (CA 120). Le QR code pointe vers la page publique /verifier/{code} du site.
 */
export const Certificate = z.object({
  code: z.string().describe('Code de vérification imprimé sous le QR code'),
  kind: z.enum(['provisoire', 'definitif']),
  snecaNumber: z.string().nullable().describe('Numéro attribué par le SNECA (ARCA), si définitif'),
  insurer: z.object({
    name: z.literal('SONAS SA'),
    address: z.string(),
    arcaAgreement: z.literal('12007'),
  }),
  policyNumber: z.string(),
  holderName: z.string(),
  holderAddress: z.string(),
  holderProfession: z.string(),
  /** Nature, type, marque, immatriculation ou n° de châssis. */
  insuredObject: z.string(),
  /** Pays couverts si extension carte jaune. */
  coveredCountries: z.array(z.string()),
  validFrom: IsoDate,
  validTo: IsoDate,
  verifyUrl: z.url(),
  /** URL signée et temporaire du PDF. */
  pdfUrl: z.url(),
});
export type Certificate = z.infer<typeof Certificate>;

/**
 * Résultat public de vérification (policier, contrôle routier) :
 * données minimales, nom masqué, pour limiter l'exposition des données personnelles.
 */
export const CertificateVerification = z.object({
  code: z.string(),
  status: z.enum(['valid', 'expired', 'revoked', 'unknown']),
  maskedHolderName: z.string().nullable(),
  insuredObject: z.string().nullable(),
  validFrom: IsoDate.nullable(),
  validTo: IsoDate.nullable(),
  insurer: z.literal('SONAS SA'),
  checkedAt: IsoDateTime,
});

export const CertificateParams = z.object({ code: z.string().min(6).max(32) });
