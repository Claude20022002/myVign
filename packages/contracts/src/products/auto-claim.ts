import { z } from 'zod';
import { Email, IsoDate, PhoneCD, PlateCD, Province } from '../common';

/**
 * Déclaration de sinistre auto, sans compte. Champs alignés sur
 * docs/recherche_formulaires_rdc.md §3.4. Brouillon conservé 60 jours.
 * Une déclaration tardive n'est JAMAIS bloquée (CA 19) ; les pièces ne sont jamais bloquantes.
 */

/** Bloc « contact » : identification par n° de contrat OU par plaque + téléphone. */
export const AutoClaimStepContact = z
  .object({
    lastName: z.string().min(1).max(80),
    firstName: z.string().min(1).max(80),
    phone: PhoneCD,
    email: Email.nullable().default(null),
    plate: PlateCD.nullable().default(null),
    policyNumber: z.string().max(40).nullable().default(null),
  })
  .refine((v) => v.plate !== null || v.policyNumber !== null, {
    message: 'Indiquez le numéro de contrat ou la plaque du véhicule',
    path: ['policyNumber'],
  });

export const AutoClaimType = z.enum([
  'accident',
  'vol',
  'vandalisme',
  'bris_de_glace',
  'incendie',
  'evenement_climatique',
  'panne',
]);
export type AutoClaimType = z.infer<typeof AutoClaimType>;

/** Bloc « type » */
export const AutoClaimStepType = z.object({ type: AutoClaimType });

/** Bloc « whenWhere » : date, heure et lieu. */
export const AutoClaimStepWhenWhere = z.object({
  date: IsoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  province: Province,
  city: z.string().min(2).max(80).nullable().default(null),
  commune: z.string().min(2).max(80),
  placeDescription: z.string().max(200).nullable().default(null),
  abroad: z.boolean().default(false),
});

/** Bloc « circumstances » : situation et récit libre (500 caractères). */
export const AutoClaimStepCircumstances = z.object({
  vehicleSituation: z
    .enum(['en_circulation', 'stationnement_voie_publique', 'parking_garage', 'ne_sais_pas'])
    .default('en_circulation'),
  description: z.string().min(10).max(500),
});

export const DamageZone = z.enum([
  'avant_gauche',
  'avant',
  'avant_droit',
  'cote_gauche',
  'toit',
  'cote_droit',
  'arriere_gauche',
  'arriere',
  'arriere_droit',
]);

/** Bloc « damage » : zones de choc et nature des dégâts. */
export const AutoClaimStepDamage = z.object({
  zones: z.array(DamageZone).max(9).default([]),
  natures: z
    .array(z.enum(['carrosserie', 'pare_brise', 'serrure', 'optiques', 'interieur']))
    .default([]),
  vehicleDrivable: z.boolean().default(true),
  objectsStolen: z.boolean().default(false),
});

/**
 * Bloc « people » : blessés, police, conducteur au moment des faits.
 * Blessés → afficher le 112 et la ligne sinistre SONAS (+243 81 641 5515) en priorité.
 * Le permis du conducteur conditionne la garantie (exclusion si permis invalide, CA 114).
 */
export const AutoClaimStepPeople = z.object({
  injured: z.boolean(),
  deceased: z.boolean().default(false),
  policeIntervened: z.boolean().default(false),
  policeReportNumber: z.string().max(60).nullable().default(null),
  driver: z.enum(['assure', 'conjoint_ou_employe', 'autre']).default('assure'),
  driverIdentity: z
    .object({
      lastName: z.string().min(1).max(80),
      firstName: z.string().min(1).max(80),
      licenseNumber: z.string().min(3).max(40),
    })
    .nullable()
    .default(null),
});

/** Bloc « liability » : tiers et responsabilité estimée. */
export const AutoClaimStepLiability = z.object({
  liabilityPercent: z.enum(['0', '50', '100', 'unknown']).default('unknown'),
  thirdPartyInvolved: z.boolean(),
  thirdParty: z
    .object({
      lastName: z.string().min(1).max(80),
      firstName: z.string().max(80).nullable().default(null),
      phone: PhoneCD.nullable().default(null),
      plate: PlateCD.nullable().default(null),
      /** Utile au recours entre assureurs. */
      insurerName: z.string().max(80).nullable().default(null),
      certificateNumber: z.string().max(60).nullable().default(null),
    })
    .nullable()
    .default(null),
});

/** Bloc « documents » : facultatif, jamais bloquant. */
export const AutoClaimStepDocuments = z.object({
  documentIds: z.array(z.string()).max(20).default([]),
});

export const AutoClaimSteps = {
  contact: AutoClaimStepContact,
  type: AutoClaimStepType,
  whenWhere: AutoClaimStepWhenWhere,
  circumstances: AutoClaimStepCircumstances,
  damage: AutoClaimStepDamage,
  people: AutoClaimStepPeople,
  liability: AutoClaimStepLiability,
  documents: AutoClaimStepDocuments,
} as const;

export const AutoClaimStepKey = z.enum([
  'contact',
  'type',
  'whenWhere',
  'circumstances',
  'damage',
  'people',
  'liability',
  'documents',
]);
export type AutoClaimStepKey = z.infer<typeof AutoClaimStepKey>;

export const AUTO_CLAIM_STEP_ORDER = [...AutoClaimStepKey.options, 'summary'] as const;

export const AutoClaimDeclaration = z.object(AutoClaimSteps);
export type AutoClaimDeclaration = z.infer<typeof AutoClaimDeclaration>;
