import { z } from 'zod';
import { Id, IsoDateTime, Money } from './common';

/** Une offre par formule : alimente l'écran « Votre formule » (A6). */
export const QuoteOffer = z.object({
  formulaCode: z.string(),
  formulaName: z.string(),
  annualPremium: Money,
  /** Montant par échéance selon la périodicité choisie. */
  installment: z.object({
    frequency: z.enum(['annual', 'semiannual', 'quarterly']),
    amount: Money,
  }),
  breakdown: z.array(z.object({ label: z.string(), amount: Money })),
  recommended: z.boolean(),
});

export const Quote = z.object({
  id: Id,
  draftId: Id,
  /** Version du barème utilisé : un devis émis reste traçable même si le tarif change. */
  tariffVersion: z.string(),
  offers: z.array(QuoteOffer).min(1),
  createdAt: IsoDateTime,
  validUntil: IsoDateTime,
});
export type Quote = z.infer<typeof Quote>;
