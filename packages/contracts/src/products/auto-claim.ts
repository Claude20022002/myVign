import { z } from 'zod';
import { Email, IsoDate, PhoneCD, PlateCD } from '../common';

/**
 * Déclaration de sinistre auto (maquette « 3 · Déclaration de sinistre auto »).
 * 8 étapes de questions, puis récapitulatif. Brouillon conservé 60 jours.
 */

/** C1 · Vos coordonnées */
export const AutoClaimStepContact = z.object({
  lastName: z.string().min(1).max(80),
  firstName: z.string().min(1).max(80),
  phone: PhoneCD,
  workPhone: PhoneCD.nullable(),
  email: Email.nullable(),
  plate: PlateCD,
  policyNumber: z.string().max(40).nullable(),
});

export const AutoClaimType = z.enum([
  'accident',
  'vol_vandalisme',
  'bris_de_glace',
  'incendie',
  'evenement_climatique',
  'panne',
]);
export type AutoClaimType = z.infer<typeof AutoClaimType>;

/** C2 · Le type de sinistre */
export const AutoClaimStepType = z.object({ type: AutoClaimType });

/** C3 · La date et le lieu */
export const AutoClaimStepWhenWhere = z.object({
  date: IsoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  city: z.string().min(2).max(80),
  commune: z.string().min(2).max(80),
  abroad: z.boolean(),
  vehicleStillAbroad: z.boolean().nullable(),
});

/** C4 · La situation et les circonstances */
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

/** C5 · Les dégâts */
export const AutoClaimStepDamage = z.object({
  zones: z.array(DamageZone).max(9),
  natures: z.array(z.enum(['carrosserie', 'pare_brise', 'serrure', 'optiques', 'interieur'])),
  vehicleDrivable: z.boolean(),
  objectsStolen: z.boolean(),
});

/** C6 · Les personnes impliquées */
export const AutoClaimStepPeople = z.object({
  injured: z.boolean(),
  policeIntervened: z.boolean(),
  driver: z.enum(['main_driver', 'spouse_or_employee', 'other']),
  otherDriver: z
    .object({ lastName: z.string().min(1).max(80), firstName: z.string().min(1).max(80) })
    .nullable(),
  noviceDriver: z.boolean(),
  usage: z.enum(['prive', 'domicile_travail', 'professionnel']),
});

/** C7 · La responsabilité */
export const AutoClaimStepLiability = z.object({
  liability: z.enum(['none', 'full', 'shared', 'unknown']),
  thirdPartyInvolved: z.boolean(),
  thirdParty: z
    .object({
      lastName: z.string().min(1).max(80),
      firstName: z.string().max(80).nullable(),
      commune: z.string().max(80).nullable(),
      plate: PlateCD.nullable(),
    })
    .nullable(),
});

/** C8 · Photos et documents (facultatif : jamais bloquant) */
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
