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
 * Attestation d'assurance (certificat SNECA pour la RC auto).
 * Le QR code pointe vers la page publique /verifier/{code} d'apps/web.
 */
export const Certificate = z.object({
  code: z.string().describe('Code de vérification imprimé sous le QR code'),
  snecaNumber: z.string().nullable().describe('Numéro attribué par le SNECA (ARCA)'),
  policyNumber: z.string(),
  holderName: z.string(),
  insuredObject: z.string(),
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
