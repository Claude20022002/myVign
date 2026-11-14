import { z } from 'zod';
import { Id, IsoDate, IsoDateTime, PhoneCD } from './common';

/**
 * Rendez-vous en agence (bouton « Prendre RDV » du localisateur et de la page d'erreur E6).
 * Sans compte : téléphone + nom suffisent, confirmation par SMS.
 */

export const AppointmentSubject = z.enum([
  'souscription',
  'sinistre',
  'attestation',
  'modification_contrat',
  'autre',
]);

export const AppointmentSlotsQuery = z.object({
  /** Premier jour souhaité ; l'API renvoie les créneaux des 7 jours ouvrables suivants. */
  from: IsoDate.optional(),
});

export const AppointmentSlot = z.object({
  id: z.string(),
  /** Heure locale de l'agence, avec son fuseau (Kinshasa UTC+1, Lubumbashi UTC+2). */
  start: IsoDateTime,
  end: IsoDateTime,
});

export const AppointmentSlotList = z.object({
  agencySlug: z.string(),
  timeZone: z.enum(['Africa/Kinshasa', 'Africa/Lubumbashi']),
  items: z.array(AppointmentSlot),
});

export const CreateAppointmentBody = z.object({
  agencySlug: z.string().min(1).max(120),
  slotId: z.string().min(1),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: PhoneCD,
  subject: AppointmentSubject.default('souscription'),
  /** Dossier en cours, transmis au conseiller (« inutile de tout répéter »). */
  draftId: Id.nullable().default(null),
});

export const Appointment = z.object({
  id: Id,
  reference: z.string(),
  agencyName: z.string(),
  agencyAddress: z.string().nullable(),
  start: IsoDateTime,
  end: IsoDateTime,
  /** Le SMS de confirmation contient la référence, l'adresse et un lien d'annulation. */
  smsSentTo: z.string(),
});

/**
 * Coordonnées du centre de contact (colonne « Contactez nos conseillers »).
 * Servies par l'API pour être modifiables sans redéploiement du site.
 */
export const ContactInfo = z.object({
  phones: z.array(
    z.object({
      purpose: z.enum(['information', 'sinistre', 'urgence']),
      label: z.string(),
      number: z.string(),
      /** Horaires lisibles (« Lun–ven · 7 h 30–16 h ») ; nul = 24 h/24. */
      hours: z.string().nullable(),
    }),
  ),
  email: z.string(),
  whatsappChannelUrl: z.url().nullable(),
});
