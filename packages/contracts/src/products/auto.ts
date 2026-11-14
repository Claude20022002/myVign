import { z } from 'zod';
import {
  AddressCD,
  ChassisNumber,
  Company,
  Email,
  IdentityDocument,
  IsoDate,
  Money,
  PhoneCD,
  PlateCD,
} from '../common';
import { VehicleCategory, VehicleEnergy } from '../vehicles';

/**
 * Souscription auto. Champs alignés sur docs/recherche_formulaires_rdc.md §3.1
 * (Code des assurances : CA). Chaque schéma valide UN bloc de données ; le front
 * reste libre de répartir ces blocs sur ses écrans (ex. 4 phases Vous / Véhicule / Formule / Paiement).
 * Le même schéma tourne dans le navigateur et dans l'API.
 */

/** Bloc « holder » : le souscripteur. */
export const AutoStepHolder = z
  .object({
    subscriberType: z.enum(['particulier', 'entreprise']),
    /** Renseigné quand subscriberType = entreprise (flottes, CA 108). */
    company: Company.nullable(),
    mainDriver: z.enum(['moi', 'conjoint', 'concubin', 'enfant', 'autre']),
    civility: z.enum(['madame', 'monsieur']),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    /** Post-nom, usuel en RDC. */
    postName: z.string().max(80).nullable(),
    birthDate: IsoDate,
    /** Obligatoire sur le certificat d'assurance (CA 121). */
    profession: z.string().min(2).max(80),
    identityDocument: IdentityDocument,
    /** Facultatif : beaucoup d'assurés n'ont pas d'e-mail actif, le téléphone suffit. */
    email: Email.nullable(),
    phone: PhoneCD,
    address: AddressCD,
  })
  .refine((v) => v.subscriberType === 'particulier' || v.company !== null, {
    message: 'Renseignez la société souscriptrice',
    path: ['company'],
  });

const AdditionalDriver = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  birthDate: IsoDate,
  licenseNumber: z.string().min(3).max(40),
  licenseDate: IsoDate,
  relation: z.enum(['conjoint', 'concubin', 'enfant', 'employe', 'autre']),
});

/** Bloc « drivers » : permis du conducteur principal et conducteurs additionnels. */
export const AutoStepDrivers = z.object({
  licenseNumber: z.string().min(3).max(40),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  licenseDate: IsoDate,
  licenseIssuedInDrc: z.boolean(),
  additionalDrivers: z.array(AdditionalDriver).max(4),
});

/** Bloc « vehicle » : identification et critères de tarif. */
export const AutoStepVehicle = z
  .object({
    category: VehicleCategory,
    /** Nul pour un véhicule neuf pas encore immatriculé : le châssis est alors obligatoire. */
    plate: PlateCD.nullable(),
    chassisNumber: ChassisNumber.nullable(),
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    energy: VehicleEnergy,
    fiscalHorsepower: z.int().min(1).max(100),
    seats: z.int().min(1).max(80),
    manufactureYear: z.int().min(1950).max(2100),
    firstRegistrationDate: IsoDate.nullable(),
    /** Date de la carte rose (certificat d'immatriculation DGI). */
    registrationCardDate: IsoDate.nullable(),
    registrationCardHolder: z.enum(['souscripteur', 'conjoint', 'entreprise', 'autre']),
    /** Valeur vénale : requise pour les formules qui couvrent le véhicule (vol, incendie, dommages). */
    marketValue: Money.nullable(),
  })
  .refine((v) => v.plate !== null || v.chassisNumber !== null, {
    message: 'Indiquez la plaque ou, pour un véhicule neuf, le numéro de châssis',
    path: ['plate'],
  });

/** Bloc « history » : antécédents sur 36 mois. Au-delà de 2 sinistres, souscription en agence. */
export const AutoStepHistory = z.object({
  claimsLast36Months: z.enum(['0', '1', '2', '3+']),
  licenseSuspended: z.boolean(),
  licenseSuspensionDate: IsoDate.nullable(),
});

/** Bloc « usage » : usages commerciaux inclus (majoritaires en RDC). */
export const AutoStepUsage = z.object({
  usage: z.enum([
    'prive',
    'domicile_travail',
    'professionnel',
    'taxi',
    'moto_taxi',
    'transport_public',
    'location',
  ]),
  annualKm: z.int().min(0).max(300_000),
  nightParking: z.enum(['voie_publique', 'cour_parcelle', 'parking_ferme', 'garage_ferme']),
  nightParkingAddress: AddressCD.nullable().describe(
    'Nul si identique à l’adresse du souscripteur',
  ),
});

/** Bloc « formula » : formule, franchise et options. */
export const AutoStepFormula = z.object({
  formulaCode: z.enum(['tiers', 'tiers_etendu', 'tous_risques']),
  deductible: z.enum(['standard', 'reduite']),
  /** Rachat de franchise (environ 20 % de la prime pure selon sonas.cd). */
  deductibleBuyBack: z.boolean(),
  options: z.object({
    /** Individuelle occupant (plafonds 1 000 / 1 200 / 750 $ selon sonas.cd). */
    occupantCover: z.boolean(),
    /** Extension carte jaune SADC / COMESA, utile à l'Est et au Katanga. */
    yellowCard: z.boolean(),
  }),
});

/** Bloc « contract » : effet (après paiement, CA 16) et durée. */
export const AutoStepContract = z
  .object({
    /** Date d'effet souhaitée ; la couverture ne démarre jamais avant le paiement confirmé. */
    startDate: IsoDate,
    duration: z.enum(['annuelle', 'courte_duree']),
    /** Courte durée au prorata (sonas.cd). */
    shortDurationMonths: z.int().min(1).max(11).nullable(),
  })
  .refine((v) => v.duration === 'annuelle' || v.shortDurationMonths !== null, {
    message: 'Indiquez la durée en mois',
    path: ['shortDurationMonths'],
  });

/**
 * Bloc « declaration » : juste avant le paiement (CA 13-15, Code du numérique art. 2).
 * Cases jamais précochées. L'API horodate ces réponses.
 */
export const AutoStepDeclaration = z.object({
  certifiesAccuracy: z.literal(true, {
    error: 'Vous devez certifier l’exactitude de vos réponses',
  }),
  consentsToDataProcessing: z.literal(true, {
    error: 'Votre accord est nécessaire pour traiter votre dossier',
  }),
  /** Notice et conditions générales téléchargées avant paiement (CA 7, 9). */
  acceptsTerms: z.literal(true, { error: 'Vous devez accepter les conditions générales' }),
});

export const AutoSteps = {
  holder: AutoStepHolder,
  drivers: AutoStepDrivers,
  vehicle: AutoStepVehicle,
  history: AutoStepHistory,
  usage: AutoStepUsage,
  formula: AutoStepFormula,
  contract: AutoStepContract,
  declaration: AutoStepDeclaration,
} as const;

export const AutoStepKey = z.enum([
  'holder',
  'drivers',
  'vehicle',
  'history',
  'usage',
  'formula',
  'contract',
  'declaration',
]);
export type AutoStepKey = z.infer<typeof AutoStepKey>;

/** Ordre de référence des blocs ; « payment » n'a pas de saisie (géré par les appels paiement). */
export const AUTO_STEP_ORDER = [...AutoStepKey.options, 'payment'] as const;

/** Blocs nécessaires au calcul du devis (avant le choix de formule). */
export const AUTO_QUOTE_PREREQUISITES = [
  'holder',
  'drivers',
  'vehicle',
  'history',
  'usage',
] as const;

/** Dossier complet, tel que l'API le valide avant le paiement. */
export const AutoApplication = z
  .object(AutoSteps)
  .refine((v) => v.formula.formulaCode === 'tiers' || v.vehicle.marketValue !== null, {
    message: 'La valeur vénale du véhicule est requise pour cette formule',
    path: ['vehicle', 'marketValue'],
  });
export type AutoApplication = z.infer<typeof AutoApplication>;
