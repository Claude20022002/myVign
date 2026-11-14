import { z } from 'zod';
import { Email, Id } from './common';

/** Directions régionales SONAS (réseau relevé sur sonas.cd). */
export const RegionCode = z.enum([
  'direction-generale',
  'kinshasa-est-bandundu',
  'kinshasa-ouest-equateur',
  'est',
  'ouest',
  'sud',
  'nord-ouest',
]);
export type RegionCode = z.infer<typeof RegionCode>;

export const Weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const OpeningSlot = z.object({
  day: Weekday,
  /** Heure locale de Kinshasa (UTC+1) ou Lubumbashi (UTC+2), au format HH:MM. */
  opens: z.string().regex(/^\d{2}:\d{2}$/),
  closes: z.string().regex(/^\d{2}:\d{2}$/),
});

export const Agency = z.object({
  id: Id,
  slug: z.string(),
  name: z.string(),
  region: RegionCode,
  regionLabel: z.string(),
  address: z.string(),
  city: z.string(),
  /** Fuseau IANA de l'agence (la RDC a deux fuseaux). */
  timeZone: z.enum(['Africa/Kinshasa', 'Africa/Lubumbashi']),
  phone: z.string().nullable(),
  email: Email.nullable(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  openingHours: z.array(OpeningSlot),
  isHeadOffice: z.boolean(),
});
export type Agency = z.infer<typeof Agency>;

export const AgencyListQuery = z.object({
  q: z.string().max(100).optional(),
  region: RegionCode.optional(),
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
