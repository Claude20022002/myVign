import { z } from 'zod';
import { Money } from './common';

/** Toutes les branches prévues. Auto et habitation sont les produits de référence. */
export const ProductCode = z.enum([
  'auto',
  'habitation',
  'voyage',
  'scolaire',
  'incendie',
  'transport',
  'entreprise',
]);
export type ProductCode = z.infer<typeof ProductCode>;

export const Segment = z.enum(['particulier', 'professionnel']);

/**
 * online : devis et souscription 100 % en ligne.
 * assisted : questionnaire court puis rappel d'un conseiller (risques non tarifables automatiquement).
 */
export const SubscriptionMode = z.enum(['online', 'assisted']);

export const Guarantee = z.object({
  code: z.string(),
  label: z.string(),
  description: z.string(),
});

export const Formula = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  guarantees: z.array(z.string()).describe('Codes des garanties incluses'),
  /** Prix d'appel indicatif (« à partir de »), le prix réel vient du devis. */
  fromPrice: Money.nullable(),
  recommended: z.boolean(),
});

export const ProductSummary = z.object({
  code: ProductCode,
  name: z.string(),
  tagline: z.string(),
  segments: z.array(Segment),
  subscriptionMode: SubscriptionMode,
  /** Obligation légale (RC auto, incendie…), affichée de façon pédagogique. */
  mandatory: z.boolean(),
  subscriptionSteps: z.int().positive(),
  claimSupported: z.boolean(),
});

export const Product = ProductSummary.extend({
  description: z.string(),
  guarantees: z.array(Guarantee),
  formulas: z.array(Formula),
});
export type Product = z.infer<typeof Product>;

export const ProductList = z.object({ items: z.array(ProductSummary) });
