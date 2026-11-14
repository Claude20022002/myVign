import { AGENCY_SEED, PROVINCES, REGION_LABELS } from '@myvign/geo';
import type { z } from 'zod';
import type { Agency, Product, ProductList, VehicleInfo } from '../src';

/**
 * Données du serveur simulé. Agences : référentiel réel nettoyé (@myvign/geo).
 * Produits, véhicules et créneaux : factices.
 */

const weekdayHours = (opens: string, closes: string) =>
  (['mon', 'tue', 'wed', 'thu', 'fri'] as const).map((day) => ({ day, opens, closes }));

/** Les 59 agences réelles (référentiel @myvign/geo). Horaires FICTIFS en attendant la SONAS. */
export const AGENCIES: z.output<typeof Agency>[] = AGENCY_SEED.map((seed) => ({
  id: `agc_${seed.slug.replace(/-/g, '_')}`,
  slug: seed.slug,
  name: seed.name,
  region: seed.region,
  regionLabel: REGION_LABELS[seed.region],
  province: seed.province,
  provinceLabel: PROVINCES[seed.province].name,
  city: seed.city,
  commune: seed.commune,
  address: seed.address,
  timeZone: PROVINCES[seed.province].timeZone,
  phone: seed.phone,
  email: 'sonas@sonas.cd',
  location: { lat: seed.location[0], lng: seed.location[1], precision: seed.locationPrecision },
  openingHours: seed.isHeadOffice ? weekdayHours('07:30', '16:00') : weekdayHours('08:00', '16:00'),
  isHeadOffice: seed.isHeadOffice,
}));

const cdf = (francs: number) => ({ amount: francs * 100, currency: 'CDF' as const });

const AUTO: z.output<typeof Product> = {
  code: 'auto',
  name: 'Assurance auto',
  tagline: 'Roulez assuré, attestation immédiate',
  segments: ['particulier', 'professionnel'],
  subscriptionMode: 'online',
  mandatory: true,
  subscriptionSteps: 9,
  claimSupported: true,
  description:
    'La responsabilité civile automobile est obligatoire en RDC. Choisissez la formule qui protège aussi votre véhicule.',
  guarantees: [
    {
      code: 'rc',
      label: 'Responsabilité civile',
      description: 'Dommages causés aux tiers (obligatoire).',
    },
    {
      code: 'defense',
      label: 'Défense et recours',
      description: 'Assistance juridique après un accident.',
    },
    {
      code: 'vol_incendie',
      label: 'Vol et incendie',
      description: 'Votre véhicule volé ou incendié.',
    },
    { code: 'bris_glace', label: 'Bris de glace', description: 'Pare-brise, vitres et optiques.' },
    {
      code: 'dommages',
      label: 'Dommages tous accidents',
      description: 'Réparations même si vous êtes responsable.',
    },
    { code: 'assistance', label: 'Assistance 24 h/24', description: 'Dépannage et remorquage.' },
  ],
  formulas: [
    {
      code: 'tiers',
      name: 'Tiers essentiel',
      description: "L'obligation légale, au juste prix.",
      guarantees: ['rc', 'defense'],
      fromPrice: cdf(637_000),
      recommended: false,
    },
    {
      code: 'tiers_etendu',
      name: 'Tiers étendu',
      description: 'Le tiers, plus le vol, l’incendie et le bris de glace.',
      guarantees: ['rc', 'defense', 'vol_incendie', 'bris_glace'],
      fromPrice: cdf(1_028_000),
      recommended: false,
    },
    {
      code: 'tous_risques',
      name: 'Tous risques',
      description: 'Votre véhicule est couvert dans tous les cas.',
      guarantees: ['rc', 'defense', 'vol_incendie', 'bris_glace', 'dommages', 'assistance'],
      fromPrice: cdf(1_290_000),
      recommended: true,
    },
  ],
};

type Summary = z.output<typeof ProductList>['items'][number];

const summaries: Summary[] = [
  {
    code: 'auto',
    name: AUTO.name,
    tagline: AUTO.tagline,
    segments: AUTO.segments,
    subscriptionMode: 'online',
    mandatory: true,
    subscriptionSteps: 9,
    claimSupported: true,
  },
  {
    code: 'habitation',
    name: 'Assurance habitation',
    tagline: 'Votre logement et vos biens protégés',
    segments: ['particulier'],
    subscriptionMode: 'online',
    mandatory: false,
    subscriptionSteps: 9,
    claimSupported: true,
  },
  {
    code: 'voyage',
    name: 'Assurance voyage',
    tagline: 'Frais médicaux et rapatriement à l’étranger',
    segments: ['particulier', 'professionnel'],
    subscriptionMode: 'online',
    mandatory: false,
    subscriptionSteps: 5,
    claimSupported: false,
  },
  {
    code: 'scolaire',
    name: 'Assurance scolaire',
    tagline: 'Vos enfants couverts toute l’année scolaire',
    segments: ['particulier'],
    subscriptionMode: 'online',
    mandatory: false,
    subscriptionSteps: 4,
    claimSupported: false,
  },
  {
    code: 'incendie',
    name: 'Assurance incendie',
    tagline: 'Obligatoire pour les bâtiments',
    segments: ['particulier', 'professionnel'],
    subscriptionMode: 'online',
    mandatory: true,
    subscriptionSteps: 6,
    claimSupported: false,
  },
  {
    code: 'transport',
    name: 'Assurance transport',
    tagline: 'Marchandises, corps de bateaux, aviation',
    segments: ['professionnel'],
    subscriptionMode: 'assisted',
    mandatory: true,
    subscriptionSteps: 3,
    claimSupported: false,
  },
  {
    code: 'entreprise',
    name: 'Assurance entreprise',
    tagline: 'Multirisque, responsabilité civile, chantiers',
    segments: ['professionnel'],
    subscriptionMode: 'assisted',
    mandatory: false,
    subscriptionSteps: 3,
    claimSupported: false,
  },
];

export const PRODUCT_SUMMARIES = summaries;

/** Seul l'auto a un détail complet en v1 du contrat ; les autres sont dérivés du résumé. */
export function productDetail(code: string): z.output<typeof Product> | undefined {
  if (code === 'auto') return AUTO;
  const summary = summaries.find((s) => s.code === code);
  if (!summary) return undefined;
  return { ...summary, description: summary.tagline, guarantees: [], formulas: [] };
}

/** Véhicule de la maquette (écran A3). */
export const KNOWN_VEHICLES: Record<string, z.output<typeof VehicleInfo>> = {
  '4521AB01': {
    plate: '4521AB01',
    make: 'Peugeot',
    model: '208',
    version: '1.2 PureTech 100 Essence',
    category: 'particulier',
    energy: 'essence',
    firstRegistrationDate: '2021-03-01',
    fiscalHorsepower: 6,
    seats: 5,
    manufactureYear: 2020,
  },
};

export const CALLBACK_SLOTS = [
  { id: 'asap', label: 'Dès que possible', estimatedDelayMinutes: 15 },
  { id: 'today_14_16', label: 'Aujourd’hui · 14 h–16 h', estimatedDelayMinutes: null },
  { id: 'tomorrow_9_11', label: 'Demain · 9 h–11 h', estimatedDelayMinutes: null },
];
