import type { z } from 'zod';
import type { ProductCode } from './catalog';
import type { DraftKind } from './drafts';
import { AUTO_STEP_ORDER, AutoSteps } from './products/auto';
import { AUTO_CLAIM_STEP_ORDER, AutoClaimSteps } from './products/auto-claim';

type StepMap = Record<string, z.ZodObject>;

interface Journey {
  /** Schémas des étapes de saisie, par clé. */
  steps: StepMap;
  /** Ordre complet affiché au client, y compris les étapes sans saisie (paiement, récapitulatif). */
  order: readonly string[];
}

/**
 * Registre des parcours disponibles. Ajouter une branche = ajouter une entrée ici
 * (schémas dans src/products/<produit>.ts), sans toucher au reste du contrat.
 */
export const JOURNEYS: Record<DraftKind, Partial<Record<ProductCode, Journey>>> = {
  subscription: {
    auto: { steps: AutoSteps, order: AUTO_STEP_ORDER },
  },
  claim: {
    auto: { steps: AutoClaimSteps, order: AUTO_CLAIM_STEP_ORDER },
  },
};

export function getJourney(kind: DraftKind, product: ProductCode): Journey | undefined {
  return JOURNEYS[kind][product];
}

export function getStepSchema(
  kind: DraftKind,
  product: ProductCode,
  step: string,
): z.ZodObject | undefined {
  return getJourney(kind, product)?.steps[step];
}
