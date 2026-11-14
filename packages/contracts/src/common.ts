import { PROVINCE_CODES } from '@myvign/geo/provinces';
import { z } from 'zod';

/** Devises acceptées. Le marché RDC raisonne en francs congolais et en dollars. */
export const Currency = z.enum(['CDF', 'USD']);
export type Currency = z.infer<typeof Currency>;

/**
 * Montant en unités mineures (entier) : jamais de flottant pour de l'argent.
 * CDF : 1 franc = 100 centimes. USD : 1 dollar = 100 cents.
 */
export const Money = z.object({
  amount: z.int().nonnegative(),
  currency: Currency,
});
export type Money = z.infer<typeof Money>;

/** Date calendaire ISO (AAAA-MM-JJ). */
export const IsoDate = z.iso.date();
/** Horodatage ISO 8601 avec fuseau. */
export const IsoDateTime = z.iso.datetime({ offset: true });

/** Identifiant opaque généré par l'API. */
export const Id = z.string().min(1).max(64);

/**
 * Téléphone RDC au format E.164 (+243 suivi de 9 chiffres).
 * La saisie libre (« 081 234 5678 », « +243 81 234 5678 ») est normalisée.
 */
export const PhoneCD = z
  .string()
  .transform((raw) => normalizePhoneCD(raw))
  .pipe(z.string().regex(/^\+243[1-9]\d{8}$/, 'Numéro RDC invalide (ex. +243 81 234 5678)'));

export function normalizePhoneCD(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+243')) return digits;
  if (digits.startsWith('00243')) return `+${digits.slice(2)}`;
  if (digits.startsWith('243')) return `+${digits}`;
  if (digits.startsWith('0')) return `+243${digits.slice(1)}`;
  return digits;
}

/**
 * Plaque d'immatriculation RDC : 4 chiffres, 2 lettres, 2 chiffres (ex. « 4521AB 01 »).
 * Espaces et tirets ignorés, lettres passées en majuscules.
 * À ÉLARGIR quand le format de la nouvelle plaque sécurisée DGI (janvier 2026) sera connu :
 * les deux formats devront être acceptés (docs/recherche_formulaires_rdc.md §2).
 */
export const PlateCD = z
  .string()
  .transform((raw) => normalizePlateCD(raw))
  .pipe(z.string().regex(/^\d{4}[A-Z]{2}\d{2}$/, 'Plaque invalide (format attendu : 4521AB 01)'));

export function normalizePlateCD(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

export const Email = z.email();

/** Numéro de châssis (VIN) ou de moteur : identifie un véhicule sans plaque (CA 121). */
export const ChassisNumber = z
  .string()
  .transform((raw) => raw.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{6,20}$/, 'Numéro de châssis invalide'));

/** Les 26 provinces de la RDC (référentiel : @myvign/geo). */
export const Province = z.enum(PROVINCE_CODES);
export type Province = z.infer<typeof Province>;

/**
 * Adresse au format RDC : pas de code postal, un point de repère libre
 * (« en face de la paroisse… »). Ex. : 96, av. Kamba, C/Dilala, Q/Biashara, Kolwezi.
 */
export const AddressCD = z.object({
  province: Province,
  /** Facultatif : déduit de la province si omis (ex. Kinshasa). */
  city: z.string().min(2).max(80).nullable().default(null),
  commune: z.string().min(2).max(80),
  quartier: z.string().max(80).nullable().default(null),
  street: z.string().min(2).max(120).describe('Avenue et numéro'),
  landmark: z.string().max(160).nullable().default(null).describe('Point de repère'),
});
export type AddressCD = z.infer<typeof AddressCD>;

/** Pièces d'identité courantes en RDC (pas de CNI généralisée en 2026). */
export const IdentityDocument = z.object({
  type: z.enum(['carte_electeur', 'passeport', 'permis_conduire', 'cni_onip', 'carte_resident']),
  number: z.string().min(3).max(40),
  /** Sans objet pour la carte d'électeur. */
  expiresAt: IsoDate.nullable().default(null),
});

/** Personne morale (flottes, incendie des bâtiments professionnels, RC pro). */
export const Company = z.object({
  name: z.string().min(2).max(160),
  rccm: z.string().min(3).max(40),
  idNat: z.string().min(3).max(40),
  nif: z.string().min(3).max(40),
  representative: z.object({
    fullName: z.string().min(2).max(160),
    role: z.string().min(2).max(80),
  }),
});

/** Codes d'erreur stables : le front s'appuie dessus pour choisir l'écran d'erreur. */
export const ErrorCode = z.enum([
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'VEHICLE_NOT_FOUND',
  'DRAFT_EXPIRED',
  'DRAFT_INCOMPLETE',
  'QUOTE_EXPIRED',
  'PAYMENT_REFUSED',
  'PAYMENT_EXPIRED',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** Format unique des erreurs renvoyées par l'API (et par le serveur simulé). */
export const ApiError = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    /** Erreurs de champ : clé = chemin du champ (ex. « vehicle.plate »). */
    fields: z.record(z.string(), z.array(z.string())).optional(),
    traceId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

export const Paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.int().nonnegative(),
  });
