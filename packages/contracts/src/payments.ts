import { z } from 'zod';
import { Id, IsoDateTime, Money, PhoneCD } from './common';

export const PaymentMethod = z.enum(['mpesa', 'orange_money', 'airtel_money', 'card']);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

/**
 * Cycle de vie d'un paiement (machine à états dans packages/domain) :
 * initiated → pending (validation sur le téléphone) → succeeded | failed | expired | verifying.
 * failed = E3 « paiement refusé », expired = E4 « demande expirée », verifying = E5 « en vérification ».
 */
export const PaymentStatus = z.enum([
  'initiated',
  'pending',
  'succeeded',
  'failed',
  'expired',
  'verifying',
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

/**
 * En-tête obligatoire `Idempotency-Key` (UUID généré par le BFF) :
 * deux envois identiques ne débitent jamais deux fois.
 */
export const CreatePaymentBody = z.discriminatedUnion('method', [
  z.object({ method: z.literal('mpesa'), phone: PhoneCD }),
  z.object({ method: z.literal('orange_money'), phone: PhoneCD }),
  z.object({ method: z.literal('airtel_money'), phone: PhoneCD }),
  z.object({ method: z.literal('card') }),
]);

export const PaymentFailureReason = z.enum([
  'insufficient_funds',
  'declined_by_user',
  'wrong_pin',
  'operator_unavailable',
  'unknown',
]);

export const Payment = z.object({
  id: Id,
  draftId: Id,
  method: PaymentMethod,
  status: PaymentStatus,
  /** Montant recalculé par le serveur à partir du devis, jamais repris du client. */
  amount: Money,
  /** Numéro masqué (ex. +243 81 ••• 5678). */
  maskedPhone: z.string().nullable(),
  /** Instructions à afficher (ex. « Validez la demande M-Pesa avec votre code PIN »). */
  instructions: z.array(z.string()),
  /** Pour la carte : URL de la page sécurisée 3-D Secure du prestataire. */
  redirectUrl: z.url().nullable(),
  failureReason: PaymentFailureReason.nullable(),
  /** Renseigné quand status = succeeded. */
  policyId: Id.nullable(),
  createdAt: IsoDateTime,
  expiresAt: IsoDateTime,
});
export type Payment = z.infer<typeof Payment>;

export const PaymentParams = z.object({ paymentId: Id });
