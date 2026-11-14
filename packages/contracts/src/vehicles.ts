import { z } from 'zod';
import { PlateCD } from './common';

/** Moto ajoutée : très répandue (motos-taxis), citée par la SONAS Tshikapa. */
export const VehicleCategory = z.enum([
  'particulier',
  '4x4_suv_pickup',
  'utilitaire_leger',
  'minibus',
  'camion',
  'moto',
  'autre',
]);

export const VehicleEnergy = z.enum(['essence', 'diesel', 'hybride', 'electrique']);

/** Pré-remplissage à partir de la plaque (« pré-remplir plutôt que demander »). */
export const VehicleLookupQuery = z.object({ plate: PlateCD });

export const VehicleInfo = z.object({
  plate: z.string(),
  make: z.string(),
  model: z.string(),
  version: z.string().nullable(),
  category: VehicleCategory,
  energy: VehicleEnergy.nullable(),
  /** Critères du tarif RC SONAS. */
  fiscalHorsepower: z.int().positive().nullable(),
  seats: z.int().positive().nullable(),
  manufactureYear: z.int().min(1950).max(2100).nullable(),
  firstRegistrationDate: z.iso.date().nullable(),
});
export type VehicleInfo = z.infer<typeof VehicleInfo>;
