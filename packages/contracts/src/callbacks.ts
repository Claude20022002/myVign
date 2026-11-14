import { z } from 'zod';
import { Id, IsoDateTime, PhoneCD } from './common';

/** Créneaux de rappel (écran « Être rappelé gratuitement »). */
export const CallbackSlot = z.object({
  id: z.string(),
  label: z.string().describe('ex. « Dès que possible », « Aujourd’hui · 14 h–16 h »'),
  estimatedDelayMinutes: z.int().nullable(),
});

export const CallbackSlotList = z.object({ items: z.array(CallbackSlot) });

export const CreateCallbackBody = z.object({
  phone: PhoneCD,
  slotId: z.string(),
  subject: z.string().min(2).max(120),
  /** Contexte transmis au conseiller : « votre dossier est transmis, inutile de tout répéter ». */
  context: z
    .object({
      draftId: Id.nullable(),
      claimId: Id.nullable(),
      step: z.string().nullable(),
    })
    .nullable(),
});

export const Callback = z.object({
  id: Id,
  reference: z.string(),
  slotLabel: z.string(),
  createdAt: IsoDateTime,
});
