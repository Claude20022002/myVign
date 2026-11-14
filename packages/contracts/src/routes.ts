import { z } from 'zod';
import { Agency, AgencyList, AgencyListQuery, ProvinceList } from './agencies';
import {
  Appointment,
  AppointmentSlotList,
  AppointmentSlotsQuery,
  ContactInfo,
  CreateAppointmentBody,
} from './appointments';
import { Callback, CallbackSlotList, CreateCallbackBody } from './callbacks';
import { Product, ProductCode, ProductList } from './catalog';
import { Claim, ClaimParams, CreateUploadBody, UploadTicket } from './claims';
import {
  CreateDraftBody,
  Draft,
  DraftParams,
  DraftStepParams,
  SaveStepBody,
  SendResumeLinkBody,
  SendResumeLinkResponse,
} from './drafts';
import { ExchangeRate } from './exchange';
import { CreatePaymentBody, Payment, PaymentParams } from './payments';
import {
  Certificate,
  CertificateParams,
  CertificateVerification,
  Policy,
  PolicyParams,
} from './policies';
import { Quote } from './quotes';
import { VehicleInfo, VehicleLookupQuery } from './vehicles';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RouteDef {
  method: HttpMethod;
  /** Chemin OpenAPI, paramètres entre accolades : /v1/drafts/{draftId} */
  path: string;
  summary: string;
  tag: string;
  params?: z.ZodObject;
  query?: z.ZodObject;
  body?: z.ZodType;
  headers?: z.ZodObject;
  success: { status: 200 | 201 | 202; schema: z.ZodType };
  /** Statuts d'erreur possibles (corps toujours au format ApiError). */
  errors: readonly number[];
  /** Accessible sans session (pages publiques, vérification d'attestation). */
  public?: boolean;
}

const IdempotencyHeaders = z.object({ 'idempotency-key': z.uuid() });

/**
 * Registre des routes : SOURCE UNIQUE DE VÉRITÉ du contrat.
 * Il sert à la fois : au client typé (apps/web, apps/backoffice), au serveur simulé (mock/),
 * à la génération OpenAPI (openapi.json) et aux tests de contrat de l'API NestJS.
 *
 * Accès (phases 1 à 4) : brouillons, paiements, contrats et sinistres sont protégés par des
 * identifiants non devinables (≥ 128 bits) que seul le BFF détient (cookie httpOnly).
 * La phase 5 (espace client) ajoute la session authentifiée par OTP.
 */
export const routes = {
  health: {
    method: 'GET',
    path: '/v1/health',
    summary: "État de l'API",
    tag: 'system',
    success: { status: 200, schema: z.object({ status: z.literal('ok'), version: z.string() }) },
    errors: [503],
    public: true,
  },

  // --- Catalogue ---
  listProducts: {
    method: 'GET',
    path: '/v1/products',
    summary: 'Liste des produits (toutes branches)',
    tag: 'catalog',
    success: { status: 200, schema: ProductList },
    errors: [500],
    public: true,
  },
  getProduct: {
    method: 'GET',
    path: '/v1/products/{code}',
    summary: "Détail d'un produit : garanties et formules",
    tag: 'catalog',
    params: z.object({ code: ProductCode }),
    success: { status: 200, schema: Product },
    errors: [404, 500],
    public: true,
  },

  // --- Agences ---
  listAgencies: {
    method: 'GET',
    path: '/v1/agencies',
    summary: 'Recherche d’agences (texte, région, proximité)',
    tag: 'agencies',
    query: AgencyListQuery,
    success: { status: 200, schema: AgencyList },
    errors: [422, 500],
    public: true,
  },
  getAgency: {
    method: 'GET',
    path: '/v1/agencies/{slug}',
    summary: "Fiche d'une agence",
    tag: 'agencies',
    params: z.object({ slug: z.string().min(1).max(120) }),
    success: { status: 200, schema: Agency },
    errors: [404, 500],
    public: true,
  },

  listProvinces: {
    method: 'GET',
    path: '/v1/provinces',
    summary: 'Les 26 provinces et la couverture SONAS (carte interactive)',
    tag: 'agencies',
    success: { status: 200, schema: ProvinceList },
    errors: [500],
    public: true,
  },

  // --- Rendez-vous et contact ---
  listAppointmentSlots: {
    method: 'GET',
    path: '/v1/agencies/{slug}/appointment-slots',
    summary: "Créneaux de rendez-vous d'une agence (7 jours ouvrables)",
    tag: 'agencies',
    params: z.object({ slug: z.string().min(1).max(120) }),
    query: AppointmentSlotsQuery,
    success: { status: 200, schema: AppointmentSlotList },
    errors: [404, 422, 500],
    public: true,
  },
  createAppointment: {
    method: 'POST',
    path: '/v1/appointments',
    summary: 'Prendre rendez-vous en agence (confirmation par SMS)',
    tag: 'agencies',
    body: CreateAppointmentBody,
    success: { status: 201, schema: Appointment },
    errors: [404, 409, 422, 429, 500],
    public: true,
  },
  getContactInfo: {
    method: 'GET',
    path: '/v1/contact',
    summary: 'Numéros, horaires et canaux du centre de contact',
    tag: 'catalog',
    success: { status: 200, schema: ContactInfo },
    errors: [500],
    public: true,
  },

  // --- Change ---
  getExchangeRate: {
    method: 'GET',
    path: '/v1/exchange-rate',
    summary: 'Taux du jour USD → CDF (Banque centrale du Congo)',
    tag: 'catalog',
    success: { status: 200, schema: ExchangeRate },
    errors: [503],
    public: true,
  },

  // --- Véhicules ---
  lookupVehicle: {
    method: 'GET',
    path: '/v1/vehicles/lookup',
    summary: 'Pré-remplissage du véhicule à partir de la plaque',
    tag: 'vehicles',
    query: VehicleLookupQuery,
    success: { status: 200, schema: VehicleInfo },
    errors: [404, 422, 429, 503],
  },

  // --- Brouillons de parcours ---
  createDraft: {
    method: 'POST',
    path: '/v1/drafts',
    summary: 'Démarrer un parcours (souscription ou sinistre) sans compte',
    tag: 'drafts',
    body: CreateDraftBody,
    success: { status: 201, schema: Draft },
    errors: [422, 429, 500],
  },
  getDraft: {
    method: 'GET',
    path: '/v1/drafts/{draftId}',
    summary: 'Reprendre un brouillon',
    tag: 'drafts',
    params: DraftParams,
    success: { status: 200, schema: Draft },
    errors: [404, 410, 500],
  },
  saveDraftStep: {
    method: 'PUT',
    path: '/v1/drafts/{draftId}/steps/{step}',
    summary: "Enregistrer une étape (validation par le schéma de l'étape)",
    tag: 'drafts',
    params: DraftStepParams,
    body: SaveStepBody,
    success: { status: 200, schema: Draft },
    errors: [404, 410, 422, 500],
  },
  sendResumeLink: {
    method: 'POST',
    path: '/v1/drafts/{draftId}/resume-link',
    summary: 'Envoyer un lien de reprise par SMS',
    tag: 'drafts',
    params: DraftParams,
    body: SendResumeLinkBody,
    success: { status: 202, schema: SendResumeLinkResponse },
    errors: [404, 422, 429, 503],
  },
  createDraftUpload: {
    method: 'POST',
    path: '/v1/drafts/{draftId}/uploads',
    summary: 'Obtenir une URL signée pour envoyer une photo ou un document',
    tag: 'drafts',
    params: DraftParams,
    body: CreateUploadBody,
    success: { status: 201, schema: UploadTicket },
    errors: [404, 410, 422, 429, 500],
  },

  // --- Devis ---
  createQuote: {
    method: 'POST',
    path: '/v1/drafts/{draftId}/quote',
    summary: 'Calculer les offres (une par formule) à partir du brouillon',
    tag: 'quotes',
    params: DraftParams,
    success: { status: 201, schema: Quote },
    errors: [404, 409, 410, 500],
  },

  // --- Paiement ---
  createPayment: {
    method: 'POST',
    path: '/v1/drafts/{draftId}/payments',
    summary: 'Lancer le paiement (mobile money ou carte)',
    tag: 'payments',
    params: DraftParams,
    headers: IdempotencyHeaders,
    body: CreatePaymentBody,
    success: { status: 201, schema: Payment },
    errors: [404, 409, 410, 422, 429, 503],
  },
  getPayment: {
    method: 'GET',
    path: '/v1/payments/{paymentId}',
    summary: "Suivre l'état d'un paiement (interrogé toutes les 2 à 3 s)",
    tag: 'payments',
    params: PaymentParams,
    success: { status: 200, schema: Payment },
    errors: [404, 500],
  },

  // --- Contrats et attestations ---
  getPolicy: {
    method: 'GET',
    path: '/v1/policies/{policyId}',
    summary: 'Contrat émis après paiement',
    tag: 'policies',
    params: PolicyParams,
    success: { status: 200, schema: Policy },
    errors: [404, 500],
  },
  getCertificate: {
    method: 'GET',
    path: '/v1/policies/{policyId}/certificate',
    summary: "Attestation d'assurance (PDF signé + QR code)",
    tag: 'policies',
    params: PolicyParams,
    success: { status: 200, schema: Certificate },
    errors: [404, 409, 500],
  },
  verifyCertificate: {
    method: 'GET',
    path: '/v1/certificates/{code}/verify',
    summary: "Vérification publique d'une attestation (scan du QR code)",
    tag: 'policies',
    params: CertificateParams,
    success: { status: 200, schema: CertificateVerification },
    errors: [429, 500],
    public: true,
  },

  // --- Sinistres ---
  submitClaim: {
    method: 'POST',
    path: '/v1/drafts/{draftId}/submit',
    summary: 'Envoyer la déclaration de sinistre',
    tag: 'claims',
    params: DraftParams,
    success: { status: 201, schema: Claim },
    errors: [404, 409, 410, 500],
  },
  getClaim: {
    method: 'GET',
    path: '/v1/claims/{claimId}',
    summary: "Suivi d'un sinistre : statut, chronologie, pièces demandées",
    tag: 'claims',
    params: ClaimParams,
    success: { status: 200, schema: Claim },
    errors: [404, 500],
  },
  createClaimUpload: {
    method: 'POST',
    path: '/v1/claims/{claimId}/uploads',
    summary: 'Ajouter une pièce à un sinistre déclaré',
    tag: 'claims',
    params: ClaimParams,
    body: CreateUploadBody,
    success: { status: 201, schema: UploadTicket },
    errors: [404, 422, 429, 500],
  },

  // --- Rappel conseiller ---
  listCallbackSlots: {
    method: 'GET',
    path: '/v1/callbacks/slots',
    summary: 'Créneaux de rappel disponibles',
    tag: 'callbacks',
    success: { status: 200, schema: CallbackSlotList },
    errors: [500],
    public: true,
  },
  createCallback: {
    method: 'POST',
    path: '/v1/callbacks',
    summary: 'Demander à être rappelé (contexte du dossier transmis)',
    tag: 'callbacks',
    body: CreateCallbackBody,
    success: { status: 201, schema: Callback },
    errors: [422, 429, 500],
    public: true,
  },
} as const satisfies Record<string, RouteDef>;

export type Routes = typeof routes;
export type RouteKey = keyof Routes;
