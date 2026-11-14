import { z } from 'zod';
import { ProductCode } from './catalog';
import { Id, IsoDateTime, Money } from './common';

/**
 * Brouillon de parcours (souscription ou déclaration de sinistre), sans compte.
 * Stocké côté serveur, identifié par un jeton aléatoire posé en cookie httpOnly par le BFF (apps/web).
 * Enregistré à chaque étape, conservé 60 jours, reprise possible par lien SMS.
 */
export const DraftKind = z.enum(['subscription', 'claim']);
export type DraftKind = z.infer<typeof DraftKind>;

export const DraftStatus = z.enum(['in_progress', 'awaiting_payment', 'completed', 'expired']);

export const CreateDraftBody = z.object({
  kind: DraftKind,
  product: ProductCode,
});

export const SaveStepBody = z.object({
  /** Valeurs de l'étape : validées par le schéma de l'étape (ex. AutoSteps.vehicle). */
  values: z.record(z.string(), z.unknown()),
});

/** Estimation affichée dans le pied de page collant (« prix toujours visible »). */
export const PriceEstimate = z.object({
  annual: Money,
  formulaCode: z.string().nullable(),
  isFinal: z.boolean(),
});

export const Draft = z.object({
  id: Id,
  kind: DraftKind,
  product: ProductCode,
  status: DraftStatus,
  /** Valeurs déjà validées, par clé d'étape. */
  steps: z.record(z.string(), z.record(z.string(), z.unknown())),
  completedSteps: z.array(z.string()),
  nextStep: z.string().nullable(),
  totalSteps: z.int().positive(),
  estimate: PriceEstimate.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  expiresAt: IsoDateTime,
});
export type Draft = z.infer<typeof Draft>;

export const DraftParams = z.object({ draftId: Id });
export const DraftStepParams = z.object({ draftId: Id, step: z.string().min(1).max(40) });

/** Envoi d'un lien de reprise par SMS. */
export const SendResumeLinkBody = z.object({ phone: z.string() });
export const SendResumeLinkResponse = z.object({ sentTo: z.string().describe('Numéro masqué') });
