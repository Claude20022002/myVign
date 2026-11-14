import { z } from 'zod';
import { Id, IsoDateTime, Money, PhoneCD } from './common';

/**
 * Moyens de paiement (docs/recherche_formulaires_rdc.md §4).
 * agency = paiement au guichet : une référence est remise, l'agent confirme dans le back-office.
 */
export const PaymentMethod = z.enum([
  'mpesa',
  'orange_money',
  'airtel_money',
  'afrimoney',
  'card',
  'agency',
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

/**
 * Cycle de vie d'un paiement (machine à états dans packages/domain) :
 * initiated → pending (validation sur le téléphone, ~2 min) → succeeded | failed | expired | verifying.
 * failed = E3 « paiement refusé », expired = E4 « demande expirée », verifying = E5 « statut incertain ».
 * La couverture ne démarre qu'à succeeded (CA 16) : verifying ne couvre RIEN et interdit un second paiement.
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

const MobileMoney = (method: 'mpesa' | 'orange_money' | 'airtel_money' | 'afrimoney') =>
  z.object({ method: z.literal(method), phone: PhoneCD });

/**
 * En-tête obligatoire `Idempotency-Key` (UUID généré par le BFF) :
 * deux envois identiques ne débitent jamais deux fois.
 */
export const CreatePaymentBody = z.discriminatedUnion('method', [
  MobileMoney('mpesa'),
  MobileMoney('orange_money'),
  MobileMoney('airtel_money'),
  MobileMoney('afrimoney'),
  z.object({ method: z.literal('card') }),
  z.object({ method: z.literal('agency') }),
]);

export const PaymentFailureReason = z.enum([
  'insufficient_funds',
  'declined_by_user',
  'wrong_pin',
  'operator_unavailable',
  'unknown',
]);

/** Reçu : tient lieu de quittance (CA 229). */
export const PaymentReceipt = z.object({
  operatorTransactionId: z.string(),
  amount: Money,
  paidAt: IsoDateTime,
});

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
  /** Carte : URL de la page sécurisée 3-D Secure du prestataire. */
  redirectUrl: z.url().nullable(),
  /** Paiement en agence : référence à présenter au guichet. */
  agencyReference: z.string().nullable(),
  failureReason: PaymentFailureReason.nullable(),
  receipt: PaymentReceipt.nullable(),
  /** Renseigné quand status = succeeded. */
  policyId: Id.nullable(),
  createdAt: IsoDateTime,
  expiresAt: IsoDateTime,
});
export type Payment = z.infer<typeof Payment>;

export const PaymentParams = z.object({ paymentId: Id });
