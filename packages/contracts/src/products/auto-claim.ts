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
    email: Email.nullable(),
    plate: PlateCD.nullable(),
    policyNumber: z.string().max(40).nullable(),
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
  city: z.string().min(2).max(80),
  commune: z.string().min(2).max(80),
  placeDescription: z.string().max(200).nullable(),
  abroad: z.boolean(),
});

/** Bloc « circumstances » : situation et récit libre (500 caractères). */
export const AutoClaimStepCircumstances = z.object({
  vehicleSituation: z.enum([
    'en_circulation',
    'stationnement_voie_publique',
    'parking_garage',
    'ne_sais_pas',
  ]),
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
  zones: z.array(DamageZone).max(9),
  natures: z.array(z.enum(['carrosserie', 'pare_brise', 'serrure', 'optiques', 'interieur'])),
  vehicleDrivable: z.boolean(),
  objectsStolen: z.boolean(),
});

/**
 * Bloc « people » : blessés, police, conducteur au moment des faits.
 * Blessés → afficher le 112 et la ligne sinistre SONAS (+243 81 641 5515) en priorité.
 * Le permis du conducteur conditionne la garantie (exclusion si permis invalide, CA 114).
 */
export const AutoClaimStepPeople = z.object({
  injured: z.boolean(),
  deceased: z.boolean(),
  policeIntervened: z.boolean(),
  policeReportNumber: z.string().max(60).nullable(),
  driver: z.enum(['assure', 'conjoint_ou_employe', 'autre']),
  driverIdentity: z
    .object({
      lastName: z.string().min(1).max(80),
      firstName: z.string().min(1).max(80),
      licenseNumber: z.string().min(3).max(40),
    })
    .nullable(),
});

/** Bloc « liability » : tiers et responsabilité estimée. */
export const AutoClaimStepLiability = z.object({
  liabilityPercent: z.enum(['0', '50', '100', 'unknown']),
  thirdPartyInvolved: z.boolean(),
  thirdParty: z
    .object({
      lastName: z.string().min(1).max(80),
      firstName: z.string().max(80).nullable(),
      phone: PhoneCD.nullable(),
      plate: PlateCD.nullable(),
      /** Utile au recours entre assureurs. */
      insurerName: z.string().max(80).nullable(),
      certificateNumber: z.string().max(60).nullable(),
    })
    .nullable(),
});

/** Bloc « documents » : facultatif, jamais bloquant. */
export const AutoClaimStepDocuments = z.object({
  documentIds: z.array(z.string()).max(20),
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
