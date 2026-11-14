import { z } from 'zod';
import { ProductCode } from './catalog';
import { Id, IsoDateTime, PhoneCD } from './common';

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
  size: z
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  category: DocumentCategory,
});

export const UploadTicket = z.object({
  documentId: Id,
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  expiresAt: IsoDateTime,
});

/**
 * Transitions autorisées (règle partagée : l'API la fait respecter, le back-office n'affiche
 * que les actions possibles). Un refus est toujours motivé.
 */
export const CLAIM_TRANSITIONS: Record<ClaimStatus, readonly ClaimStatus[]> = {
  declared: ['received', 'rejected'],
  received: ['under_review', 'rejected'],
  under_review: ['expertise', 'offer_made', 'rejected'],
  expertise: ['offer_made', 'rejected'],
  offer_made: ['accepted', 'rejected'],
  accepted: ['paid'],
  paid: ['closed'],
  rejected: ['closed'],
  closed: [],
};

/** Libellés lisibles par le client (jamais de code interne à l'écran). */
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  declared: 'Déclaration envoyée',
  received: 'Déclaration reçue',
  under_review: 'Dossier en instruction',
  expertise: 'Expertise en cours',
  offer_made: "Offre d'indemnisation",
  accepted: 'Offre acceptée',
  paid: 'Indemnité versée',
  rejected: 'Demande refusée',
  closed: 'Dossier clôturé',
};

/** Suivi sans compte : n° de sinistre + téléphone de la déclaration. */
export const ClaimLookupQuery = z.object({
  number: z.string().min(5).max(40),
  phone: PhoneCD,
});

/** Ligne de la file de travail du back-office. */
export const ClaimSummary = z.object({
  id: Id,
  number: z.string(),
  product: ProductCode,
  type: z.string(),
  status: ClaimStatus,
  holderName: z.string(),
  maskedPhone: z.string(),
  plate: z.string().nullable(),
  missingDocuments: z.int().nonnegative(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

export const ClaimSummaryList = z.object({ items: z.array(ClaimSummary) });

export const TransitionClaimBody = z
  .object({
    status: ClaimStatus,
    /** Message affiché au client dans la chronologie (sinon un message standard). */
    message: z.string().max(300).nullable().default(null),
    /** Motif obligatoire en cas de refus. */
    reason: z.string().max(300).nullable().default(null),
  })
  .refine((v) => v.status !== 'rejected' || (v.reason ?? '').trim().length >= 10, {
    message: 'Un refus doit être motivé (10 caractères au moins)',
    path: ['reason'],
  });
export type ClaimSummary = z.infer<typeof ClaimSummary>;
