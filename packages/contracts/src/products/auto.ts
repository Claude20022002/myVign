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
 * Souscription auto : LE PLUS COURT POSSIBLE.
 *
 * Principes :
 * 1. Le prix d'abord : véhicule → usage → conducteur suffisent au devis. Aucune question
 *    d'identité avant d'avoir vu le prix.
 * 2. Pré-remplir plutôt que demander : la plaque (lookupVehicle) remplit marque, modèle,
 *    énergie, puissance, places et année. Le client confirme.
 * 3. Valeurs par défaut partout où un choix courant existe (`.default(...)`) : le front peut
 *    omettre ces champs, l'API les complète.
 * 4. Rien de ce qui peut attendre n'est demandé avant le paiement : la pièce d'identité n'est
 *    exigée que pour le certificat DÉFINITIF (SNECA, sous 10 jours, CA 120), via un lien SMS.
 *
 * Saisie minimale réelle (plaque reconnue, cas courant) : ~14 champs.
 *   vehicle 1 (plaque) · usage 2 · driver 3 · formula 1 · holder 6 (prénom, nom, téléphone,
 *   profession, commune, avenue ; province pré-sélectionnée) · declaration 2 cases.
 * Champs juridiquement requis : docs/recherche_formulaires_rdc.md §3.1.
 */

/** 1 · Le véhicule (pré-rempli par la plaque). */
export const AutoStepVehicle = z
  .object({
    category: VehicleCategory.default('particulier'),
    /** Nul pour un véhicule neuf pas encore immatriculé : le châssis est alors obligatoire. */
    plate: PlateCD.nullable(),
    chassisNumber: ChassisNumber.nullable().default(null),
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    energy: VehicleEnergy,
    /** Critères du tarif RC SONAS. */
    fiscalHorsepower: z.int().min(1).max(100),
    seats: z.int().min(1).max(80),
    manufactureYear: z.int().min(1950).max(2100),
    /** Valeur vénale : demandée seulement si la formule couvre le véhicule (voir AutoApplication). */
    marketValue: Money.nullable().default(null),
    registrationCardHolder: z
      .enum(['souscripteur', 'conjoint', 'entreprise', 'autre'])
      .default('souscripteur'),
  })
  .refine((v) => v.plate !== null || v.chassisNumber !== null, {
    message: 'Indiquez la plaque ou, pour un véhicule neuf, le numéro de châssis',
    path: ['plate'],
  });

/** 2 · L'usage (2 questions). Usages commerciaux inclus : majoritaires en RDC. */
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
  nightParking: z.enum(['voie_publique', 'cour_parcelle', 'parking_ferme', 'garage_ferme']),
});

const AdditionalDriver = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  birthDate: IsoDate,
  licenseDate: IsoDate,
});

/** 3 · Le conducteur principal (3 questions) : âge, ancienneté du permis, sinistres. */
export const AutoStepDriver = z.object({
  birthDate: IsoDate,
  licenseDate: IsoDate,
  claimsLast36Months: z.enum(['0', '1', '2', '3+']).default('0'),
  licenseSuspended: z.boolean().default(false),
  /** Utiles au sinistre, pas au prix : peuvent être donnés plus tard. */
  licenseNumber: z.string().min(3).max(40).nullable().default(null),
  additionalDrivers: z.array(AdditionalDriver).max(4).default([]),
});

/** 4 · La formule (1 choix ; le reste a des valeurs par défaut). */
export const AutoStepFormula = z
  .object({
    formulaCode: z.enum(['tiers', 'tiers_etendu', 'tous_risques']),
    deductible: z.enum(['standard', 'reduite']).default('standard'),
    /** Rachat de franchise (environ 20 % de la prime pure selon sonas.cd). */
    deductibleBuyBack: z.boolean().default(false),
    options: z
      .object({
        /** Individuelle occupant (plafonds 1 000 / 1 200 / 750 $ selon sonas.cd). */
        occupantCover: z.boolean().default(false),
        /** Extension carte jaune SADC / COMESA, utile à l'Est et au Katanga. */
        yellowCard: z.boolean().default(false),
      })
      .default({ occupantCover: false, yellowCard: false }),
    /** Nul = dès la confirmation du paiement (la couverture ne démarre jamais avant, CA 16). */
    startDate: IsoDate.nullable().default(null),
    duration: z.enum(['annuelle', 'courte_duree']).default('annuelle'),
    /** Courte durée au prorata (sonas.cd). */
    shortDurationMonths: z.int().min(1).max(11).nullable().default(null),
  })
  .refine((v) => v.duration === 'annuelle' || v.shortDurationMonths !== null, {
    message: 'Indiquez la durée en mois',
    path: ['shortDurationMonths'],
  });

/** 5 · Le souscripteur (après le prix). Province pré-sélectionnée par géolocalisation ou carte. */
export const AutoStepHolder = z
  .object({
    subscriberType: z.enum(['particulier', 'entreprise']).default('particulier'),
    /** Renseigné quand subscriberType = entreprise (flottes, CA 108). */
    company: Company.nullable().default(null),
    /** Qui conduit : par défaut le souscripteur lui-même (le bloc driver le décrit). */
    mainDriver: z.enum(['moi', 'conjoint', 'concubin', 'enfant', 'autre']).default('moi'),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    /** Post-nom, usuel en RDC : facultatif. */
    postName: z.string().max(80).nullable().default(null),
    /** Obligatoire sur le certificat d'assurance (CA 121). */
    profession: z.string().min(2).max(80),
    phone: PhoneCD,
    /** Facultatif : beaucoup d'assurés n'ont pas d'e-mail actif, le téléphone suffit. */
    email: Email.nullable().default(null),
    address: AddressCD,
    /** Peut être fourni après paiement : requis pour le certificat définitif seulement. */
    identityDocument: IdentityDocument.nullable().default(null),
  })
  .refine((v) => v.subscriberType === 'particulier' || v.company !== null, {
    message: 'Renseignez la société souscriptrice',
    path: ['company'],
  });

/**
 * 6 · La déclaration (2 cases, jamais précochées), juste avant le paiement.
 * CA 13-15 (exactitude), CA 7-9 (conditions remises avant), Code du numérique art. 2 (données).
 */
export const AutoStepDeclaration = z.object({
  /** « Je certifie l'exactitude de mes réponses et j'accepte les conditions générales. » */
  certifiesAccuracyAndTerms: z.literal(true, {
    error: 'Cochez cette case pour continuer',
  }),
  /** « J'accepte que la SONAS traite mes données pour gérer mon contrat. » */
  consentsToDataProcessing: z.literal(true, {
    error: 'Votre accord est nécessaire pour traiter votre dossier',
  }),
});

export const AutoSteps = {
  vehicle: AutoStepVehicle,
  usage: AutoStepUsage,
  driver: AutoStepDriver,
  formula: AutoStepFormula,
  holder: AutoStepHolder,
  declaration: AutoStepDeclaration,
} as const;

export const AutoStepKey = z.enum([
  'vehicle',
  'usage',
  'driver',
  'formula',
  'holder',
  'declaration',
]);
export type AutoStepKey = z.infer<typeof AutoStepKey>;

/** Ordre recommandé : le prix tombe après « driver ». « payment » n'a pas de saisie. */
export const AUTO_STEP_ORDER = [...AutoStepKey.options, 'payment'] as const;

/** Blocs nécessaires au devis : 6 questions environ, aucune donnée d'identité. */
export const AUTO_QUOTE_PREREQUISITES = ['vehicle', 'usage', 'driver'] as const;

/** Dossier complet, tel que l'API le valide avant le paiement. */
export const AutoApplication = z
  .object(AutoSteps)
  .refine((v) => v.formula.formulaCode === 'tiers' || v.vehicle.marketValue !== null, {
    message: 'La valeur du véhicule est requise pour cette formule',
    path: ['vehicle', 'marketValue'],
  });
export type AutoApplication = z.infer<typeof AutoApplication>;
