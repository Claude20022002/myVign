import { z } from 'zod';
import { type Currency, IsoDate, IsoDateTime, type Money } from './common';

/**
 * Taux de change du jour USD → CDF.
 * Source de référence : taux indicatif publié chaque jour ouvrable par la Banque centrale du Congo (BCC).
 * L'API le récupère chaque jour (worker) ; un administrateur peut le saisir à la main en secours.
 * Le taux appliqué à un paiement est FIGÉ au moment du paiement (voir Payment.exchange).
 */
export const ExchangeRate = z.object({
  base: z.literal('USD'),
  quote: z.literal('CDF'),
  /** Nombre de francs congolais pour 1 dollar (ex. 2850.5). */
  rate: z.number().positive(),
  source: z.enum(['bcc', 'manual', 'mock']),
  /** Date de validité du taux (jour de publication). */
  effectiveDate: IsoDate,
  fetchedAt: IsoDateTime,
});
export type ExchangeRate = z.infer<typeof ExchangeRate>;

/**
 * Convertit un montant d'une devise à l'autre au taux donné (CDF pour 1 USD).
 * Travaille en unités mineures entières, arrondi au plus proche : aucun flottant ne sort d'ici.
 * Même fonction côté front (affichage) et côté API (montant facturé) : les deux tombent juste.
 */
export function convertMoney(money: Money, to: Currency, rateCdfPerUsd: number): Money {
  if (!(rateCdfPerUsd > 0)) throw new Error('Taux de change invalide');
  if (money.currency === to) return money;
  const amount =
    to === 'USD'
      ? Math.round(money.amount / rateCdfPerUsd)
      : Math.round(money.amount * rateCdfPerUsd);
  return { amount, currency: to };
}
