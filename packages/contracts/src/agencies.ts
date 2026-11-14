import { z } from 'zod';
import { Email, Id, Province } from './common';

/** Directions régionales SONAS (réseau relevé sur sonas.cd). */
export const RegionCode = z.enum([
  'direction-generale',
  'kinshasa-est-bandundu',
  'kinshasa-ouest-equateur',
  'est',
  'ouest',
  'sud',
]);
export type RegionCode = z.infer<typeof RegionCode>;

export const Weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const OpeningSlot = z.object({
  day: Weekday,
  /** Heure locale de l'agence (voir timeZone), au format HH:MM. */
  opens: z.string().regex(/^\d{2}:\d{2}$/),
  closes: z.string().regex(/^\d{2}:\d{2}$/),
});

export const Agency = z.object({
  id: Id,
  slug: z.string(),
  name: z.string(),
  region: RegionCode,
  regionLabel: z.string(),
  province: Province,
  provinceLabel: z.string(),
  city: z.string(),
  commune: z.string().nullable(),
  /** Nul quand l'adresse n'est pas publiée par la SONAS. */
  address: z.string().nullable(),
  /** Fuseau IANA de l'agence (la RDC a deux fuseaux). */
  timeZone: z.enum(['Africa/Kinshasa', 'Africa/Lubumbashi']),
  phone: z.string().nullable(),
  email: Email.nullable(),
  location: z
    .object({ lat: z.number(), lng: z.number(), precision: z.enum(['exacte', 'commune', 'ville']) })
    .nullable(),
  openingHours: z.array(OpeningSlot),
  isHeadOffice: z.boolean(),
});
export type Agency = z.infer<typeof Agency>;

export const AgencyListQuery = z.object({
  q: z.string().max(100).optional(),
  region: RegionCode.optional(),
  province: Province.optional(),
  /** Pages « Assurance {ville} » : correspondance exacte, sans accents ni casse. */
  city: z.string().max(80).optional(),
  /** Tri par distance quand la position de l'utilisateur est connue. */
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const AgencyWithDistance = Agency.extend({
  distanceKm: z.number().nullable(),
});

export const AgencyList = z.object({
  items: z.array(AgencyWithDistance),
  total: z.int().nonnegative(),
});

/**
 * Province pour la carte interactive : couverture SONAS (nombre d'agences).
 * Les tracés de la carte sont dans @myvign/geo/map (données statiques, pas d'appel API).
 */
export const ProvinceSummary = z.object({
  code: Province,
  name: z.string(),
  capital: z.string(),
  agencyCount: z.int().nonnegative(),
  center: z.object({ lat: z.number(), lng: z.number() }),
});

export const ProvinceList = z.object({ items: z.array(ProvinceSummary) });
export type ProvinceSummary = z.infer<typeof ProvinceSummary>;
