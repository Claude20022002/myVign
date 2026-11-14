import type { z } from 'zod';
import type { Agency, Product, ProductList, VehicleInfo } from '../src';

/**
 * Données factices du serveur simulé. Les agences reprennent quelques adresses publiques
 * de sonas.cd (le jeu complet, nettoyé et géocodé, arrive avec l'API réelle en phase 1).
 * Coordonnées approximatives, horaires fictifs.
 */

const weekdayHours = (opens: string, closes: string) =>
  (['mon', 'tue', 'wed', 'thu', 'fri'] as const).map((day) => ({ day, opens, closes }));

export const AGENCIES: z.output<typeof Agency>[] = [
  {
    id: 'agc_siege',
    slug: 'direction-generale/gombe-boulevard-30-juin',
    name: 'Siège social · Gombe',
    region: 'direction-generale',
    regionLabel: 'Direction générale',
    address: '6664, Immeuble Sankuru, boulevard du 30 Juin',
    city: 'Kinshasa · Gombe',
    timeZone: 'Africa/Kinshasa',
    phone: '+243816877156',
    email: 'sonas@sonas.cd',
    location: { lat: -4.3036, lng: 15.3061 },
    openingHours: weekdayHours('07:30', '16:00'),
    isHeadOffice: true,
  },
  {
    id: 'agc_limete',
    slug: 'kinshasa-est-bandundu/limete',
    name: 'Agence de Limete',
    region: 'kinshasa-est-bandundu',
    regionLabel: 'Kinshasa-Est / Bandundu',
    address: '337, place Mandrandele, 7e rue',
    city: 'Kinshasa · Limete',
    timeZone: 'Africa/Kinshasa',
    phone: null,
    email: 'sonas@sonas.cd',
    location: { lat: -4.3655, lng: 15.3398 },
    openingHours: weekdayHours('08:00', '16:00'),
    isHeadOffice: false,
  },
  {
    id: 'agc_gombe_dgi',
    slug: 'kinshasa-ouest-equateur/gombe-dgi',
    name: 'Agence de la Gombe · DGI',
    region: 'kinshasa-ouest-equateur',
    regionLabel: 'Kinshasa-Ouest / Équateur',
    address: 'Bâtiment DGI, Gombe',
    city: 'Kinshasa · Gombe',
    timeZone: 'Africa/Kinshasa',
    phone: null,
    email: 'sonas@sonas.cd',
    location: { lat: -4.3105, lng: 15.2963 },
    openingHours: weekdayHours('08:00', '16:00'),
    isHeadOffice: false,
  },
  {
    id: 'agc_matadi',
    slug: 'region-ouest/matadi',
    name: 'Agence de Matadi',
    region: 'ouest',
    regionLabel: 'Région Ouest',
    address: 'Avenue Major Vangu n° 15, quartier Ville basse',
    city: 'Matadi',
    timeZone: 'Africa/Kinshasa',
    phone: null,
    email: 'sonas@sonas.cd',
    location: { lat: -5.8167, lng: 13.45 },
    openingHours: weekdayHours('08:00', '16:00'),
    isHeadOffice: false,
  },
  {
    id: 'agc_goma',
    slug: 'region-est/goma',
    name: 'Agence de Goma',
    region: 'est',
    regionLabel: 'Région Est',
    address: '50, boulevard Kanyamuhanga, quartier des Volcans',
    city: 'Goma',
    timeZone: 'Africa/Lubumbashi',
    phone: '+243893221604',
    email: 'sonas@sonas.cd',
    location: { lat: -1.6792, lng: 29.2228 },
    openingHours: weekdayHours('08:00', '16:00'),
    isHeadOffice: false,
  },
  {
    id: 'agc_lubumbashi',
    slug: 'region-sud/lubumbashi',
    name: 'Agence de Lubumbashi',
    region: 'sud',
    regionLabel: 'Région Sud',
    address: '7678, avenue Munongo, quartier Makutano',
    city: 'Lubumbashi',
    timeZone: 'Africa/Lubumbashi',
    phone: null,
    email: 'sonas@sonas.cd',
    location: { lat: -11.6609, lng: 27.4794 },
    openingHours: weekdayHours('08:00', '16:00'),
    isHeadOffice: false,
  },
];

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
    "La responsabilité civile automobile est obligatoire en RDC. Choisissez la formule qui protège aussi votre véhicule.",
  guarantees: [
    { code: 'rc', label: 'Responsabilité civile', description: 'Dommages causés aux tiers (obligatoire).' },
    { code: 'defense', label: 'Défense et recours', description: 'Assistance juridique après un accident.' },
    { code: 'vol_incendie', label: 'Vol et incendie', description: 'Votre véhicule volé ou incendié.' },
    { code: 'bris_glace', label: 'Bris de glace', description: 'Pare-brise, vitres et optiques.' },
    { code: 'dommages', label: 'Dommages tous accidents', description: 'Réparations même si vous êtes responsable.' },
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
    estimatedValueUsd: 1_450_000,
  },
};

export const CALLBACK_SLOTS = [
  { id: 'asap', label: 'Dès que possible', estimatedDelayMinutes: 15 },
  { id: 'today_14_16', label: 'Aujourd’hui · 14 h–16 h', estimatedDelayMinutes: null },
  { id: 'tomorrow_9_11', label: 'Demain · 9 h–11 h', estimatedDelayMinutes: null },
];
