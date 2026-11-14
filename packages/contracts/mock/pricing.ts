import type { z } from 'zod';
import type { QuoteOffer } from '../src';

/**
 * Tarification FACTICE du serveur simulé : elle ne sert qu'à afficher des montants plausibles.
 * Le vrai barème vit dans packages/domain (partie B) et sera validé avec la SONAS.
 */

const BASE_CDF: Record<string, number> = {
  tiers: 637_000,
  tiers_etendu: 1_028_000,
  tous_risques: 1_290_000,
};

const CATEGORY_FACTOR: Record<string, number> = {
  particulier: 1,
  '4x4_suv_pickup': 1.35,
  utilitaire_leger: 1.25,
  moto: 0.45,
  autre: 1.1,
};

const NAMES: Record<string, string> = {
  tiers: 'Tiers essentiel',
  tiers_etendu: 'Tiers étendu',
  tous_risques: 'Tous risques',
};

interface PricingInput {
  category?: string;
  claimsLast36Months?: string;
  parking?: string;
  frequency?: 'annual' | 'semiannual' | 'quarterly';
}

const DIVISOR = { annual: 1, semiannual: 2, quarterly: 4 } as const;

export function priceAuto(input: PricingInput): z.output<typeof QuoteOffer>[] {
  const category = CATEGORY_FACTOR[input.category ?? 'particulier'] ?? 1;
  const history = input.claimsLast36Months === '2+' ? 1.3 : input.claimsLast36Months === '1' ? 1.12 : 1;
  const parking = input.parking === 'garage_ferme' || input.parking === 'parking_ferme' ? 0.95 : 1;
  const frequency = input.frequency ?? 'annual';

  return Object.entries(BASE_CDF).map(([code, base]) => {
    const francs = Math.round((base * category * history * parking) / 1000) * 1000;
    const rc = Math.round((francs * 0.55) / 1000) * 1000;
    const amount = francs * 100;
    return {
      formulaCode: code,
      formulaName: NAMES[code] ?? code,
      annualPremium: { amount, currency: 'CDF' as const },
      installment: {
        frequency,
        amount: { amount: Math.round(amount / DIVISOR[frequency]), currency: 'CDF' as const },
      },
      breakdown: [
        { label: 'Responsabilité civile', amount: { amount: rc * 100, currency: 'CDF' as const } },
        {
          label: 'Garanties du véhicule',
          amount: { amount: (francs - rc) * 100, currency: 'CDF' as const },
        },
      ],
      recommended: code === 'tous_risques',
    };
  });
}

export function estimateAuto(input: PricingInput, formulaCode: string | null) {
  const offers = priceAuto(input);
  const offer = offers.find((o) => o.formulaCode === formulaCode) ?? offers[0];
  return offer?.annualPremium ?? { amount: 0, currency: 'CDF' as const };
}
