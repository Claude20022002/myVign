import { z } from 'zod';
import { PlateCD } from './common';

export const VehicleCategory = z.enum([
  'particulier',
  '4x4_suv_pickup',
  'utilitaire_leger',
  'moto',
  'autre',
]);

/** Pré-remplissage à partir de la plaque (« pré-remplir plutôt que demander »). */
export const VehicleLookupQuery = z.object({ plate: PlateCD });

export const VehicleInfo = z.object({
  plate: z.string(),
  make: z.string(),
  model: z.string(),
  version: z.string().nullable(),
  category: VehicleCategory,
  energy: z.enum(['essence', 'diesel', 'hybride', 'electrique']).nullable(),
  firstRegistrationDate: z.iso.date().nullable(),
  /** Valeur estimée en unités mineures USD, utilisée pour les garanties dommages. */
  estimatedValueUsd: z.int().nullable(),
});
export type VehicleInfo = z.infer<typeof VehicleInfo>;
