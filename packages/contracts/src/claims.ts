import { z } from 'zod';
import { ProductCode } from './catalog';
import { Id, IsoDateTime } from './common';

/**
 * Statuts d'un sinistre, tous visibles par le client (réponse à la plainte n°1 : l'opacité).
 * declared → received → under_review → expertise → offer_made → accepted → paid
 * Sorties possibles : rejected (toujours motivé), closed.
 */
export const ClaimStatus = z.enum([
  'declared',
  'received',
  'under_review',
  'expertise',
  'offer_made',
  'accepted',
  'paid',
  'rejected',
  'closed',
]);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

export const RequiredDocument = z.object({
  code: z.string(),
  label: z.string(),
  /** Explique pourquoi la pièce est demandée et où la trouver. */
  hint: z.string().nullable(),
  mandatory: z.boolean(),
  status: z.enum(['missing', 'received', 'validated', 'rejected']),
});

export const ClaimEvent = z.object({
  at: IsoDateTime,
  status: ClaimStatus,
  /** Message lisible par le client, jamais un code interne. */
  message: z.string(),
});

export const Claim = z.object({
  id: Id,
  number: z.string().describe('Numéro de sinistre lisible, ex. SIN-2026-004512'),
  product: ProductCode,
  type: z.string(),
  status: ClaimStatus,
  /** Motif obligatoire quand status = rejected. */
  statusReason: z.string().nullable(),
  requiredDocuments: z.array(RequiredDocument),
  timeline: z.array(ClaimEvent),
  callbackPlanned: z.boolean(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type Claim = z.infer<typeof Claim>;

export const ClaimParams = z.object({ claimId: Id });

/** Envoi de fichier en deux temps : l'API donne une URL signée, le navigateur envoie directement. */
export const DocumentCategory = z.enum([
  'photo_overview',
  'photo_damage',
  'police_report',
  'amicable_report',
  'repair_invoice',
  'identity',
  'other',
]);

export const CreateUploadBody = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  /** Taille en octets, plafonnée à 10 Mo (les photos sont compressées côté client). */
  size: z.int().positive().max(10 * 1024 * 1024),
  category: DocumentCategory,
});

export const UploadTicket = z.object({
  documentId: Id,
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  expiresAt: IsoDateTime,
});
