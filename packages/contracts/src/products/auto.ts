import { z } from 'zod';
import { Email, IsoDate, PhoneCD, PlateCD } from '../common';
import { VehicleCategory } from '../vehicles';

/**
 * Parcours de souscription auto (maquette « 1 · Souscription auto », 9 étapes).
 * Chaque schéma valide UNE étape : le même schéma tourne dans le navigateur et dans l'API.
 */

const Civility = z.enum(['madame', 'monsieur']);
const Address = z.object({
  line: z.string().min(3).max(200),
  commune: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
});

/** A1 · Vos informations */
export const AutoStepHolder = z.object({
  isMainDriver: z.enum(['self', 'spouse', 'child', 'other']),
  civility: Civility,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  birthDate: IsoDate,
  email: Email,
  phone: PhoneCD,
  address: Address,
});

const Driver = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  birthDate: IsoDate,
  licenseDate: IsoDate,
  relation: z.enum(['spouse', 'child', 'employee', 'other']),
});

/** A2 · Les conducteurs */
export const AutoStepDrivers = z.object({
  mainDriverLicenseDate: IsoDate,
  licenseObtainedInDrc: z.boolean(),
  additionalDrivers: z.array(Driver).max(4),
});

/** A3 · Votre véhicule */
export const AutoStepVehicle = z.object({
  category: VehicleCategory,
  plate: PlateCD,
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  version: z.string().max(80).nullable(),
  firstRegistrationDate: IsoDate,
  acquisitionDate: IsoDate,
});

/** A4 · Vos sinistres et infractions (36 derniers mois) */
export const AutoStepHistory = z.object({
  claimsLast36Months: z.enum(['0', '1', '2+']),
  licenseSuspended: z.boolean(),
});

/** A5 · L'usage de votre véhicule */
export const AutoStepUsage = z.object({
  usage: z.enum(['prive', 'domicile_travail', 'professionnel']),
  annualKm: z.int().min(0).max(200_000),
  parking: z.enum(['voie_publique', 'cour_jardin', 'parking_ferme', 'garage_ferme']),
  parkingAddressSameAsHome: z.boolean(),
});

/** A6 · Votre formule */
export const AutoStepFormula = z.object({
  formulaCode: z.enum(['tiers', 'tiers_etendu', 'tous_risques']),
  deductible: z.enum(['standard', 'reduite', 'sans']),
  options: z.object({
    legalProtection: z.boolean(),
    driverProtection: z.boolean(),
  }),
});

/** A7 · Votre contrat */
export const AutoStepContract = z.object({
  startDate: IsoDate,
  paymentFrequency: z.enum(['annual', 'semiannual', 'quarterly']),
  acceptsTerms: z.literal(true, { error: 'Vous devez accepter les conditions générales' }),
});

/** Étapes A8 (paiement) et A9 (récapitulatif) : pas de saisie, gérées par les appels paiement. */
export const AutoSteps = {
  holder: AutoStepHolder,
  drivers: AutoStepDrivers,
  vehicle: AutoStepVehicle,
  history: AutoStepHistory,
  usage: AutoStepUsage,
  formula: AutoStepFormula,
  contract: AutoStepContract,
} as const;

export const AutoStepKey = z.enum([
  'holder',
  'drivers',
  'vehicle',
  'history',
  'usage',
  'formula',
  'contract',
]);
export type AutoStepKey = z.infer<typeof AutoStepKey>;

/** Ordre d'affichage des 9 étapes (les 2 dernières sont gérées par le paiement). */
export const AUTO_STEP_ORDER = [
  'holder',
  'drivers',
  'vehicle',
  'history',
  'usage',
  'formula',
  'contract',
  'payment',
  'summary',
] as const;

/** Dossier complet, tel que l'API le valide avant de calculer un devis définitif. */
export const AutoApplication = z.object({
  holder: AutoStepHolder,
  drivers: AutoStepDrivers,
  vehicle: AutoStepVehicle,
  history: AutoStepHistory,
  usage: AutoStepUsage,
  formula: AutoStepFormula,
  contract: AutoStepContract,
});
export type AutoApplication = z.infer<typeof AutoApplication>;
