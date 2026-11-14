import { randomBytes, randomUUID } from 'node:crypto';
import { type Context, Hono } from 'hono';
import type { z } from 'zod';
import {
  type ApiError,
  AutoApplication,
  AutoClaimDeclaration,
  type Claim,
  type Draft,
  type ErrorCode,
  getJourney,
  getStepSchema,
  type Payment,
  type Policy,
  type RouteDef,
  type RouteKey,
  routes,
} from '../src';
import {
  AGENCIES,
  CALLBACK_SLOTS,
  KNOWN_VEHICLES,
  PRODUCT_SUMMARIES,
  productDetail,
} from './fixtures';
import { estimateAuto, priceAuto } from './pricing';

/**
 * Serveur simulé : implémente TOUT le contrat avec des données factices,
 * pour que le front (partie A) avance sans attendre l'API réelle (partie B).
 *
 * Scénarios déclenchables (maquette, cas d'erreur E1 à E6) :
 * - Plaque au format invalide (ex. « 4521A »)          → 422 VALIDATION_FAILED          (E1)
 * - Plaque commençant par 0000 (ex. « 0000AA00 »)      → 404 VEHICLE_NOT_FOUND          (E2)
 * - Téléphone de paiement finissant par 0001           → paiement refusé (failed)       (E3)
 * - Téléphone de paiement finissant par 0002           → demande expirée (expired)      (E4)
 * - Téléphone de paiement finissant par 0003           → en vérification (verifying)    (E5)
 * - En-tête `x-mock-scenario: technical-error`         → 500 sur n'importe quelle route (E6)
 * - En-tête `x-mock-scenario: rate-limited`            → 429
 * - En-tête `x-mock-scenario: slow`                    → +3 s de latence
 * - Brouillon `draft_expired`                          → 410 DRAFT_EXPIRED
 * Tout autre paiement passe à « succeeded » après `paymentDelayMs`.
 */

export interface MockOptions {
  /** Latence ajoutée à chaque réponse, pour tester les états de chargement. */
  latencyMs?: number;
  /** Délai avant qu'un paiement mobile money soit confirmé. */
  paymentDelayMs?: number;
  /** URL publique de ce serveur (liens d'envoi de fichiers, PDF). */
  publicUrl?: string;
  /** URL du site web (lien de vérification dans le QR code). */
  webUrl?: string;
  /** Horloge injectable pour les tests. */
  now?: () => Date;
}

type Out<K extends RouteKey> = z.output<(typeof routes)[K]['success']['schema']>;

interface StoredDraft extends Omit<Draft, 'estimate'> {
  estimate: Draft['estimate'];
}

interface StoredPayment extends Payment {
  outcome: 'succeeded' | 'failed' | 'expired' | 'verifying';
}

const DAY = 24 * 60 * 60 * 1000;

export function createMockApp(options: MockOptions = {}) {
  const latencyMs = options.latencyMs ?? 0;
  const paymentDelayMs = options.paymentDelayMs ?? 5000;
  const publicUrl = options.publicUrl ?? 'http://localhost:4010';
  const webUrl = options.webUrl ?? 'http://localhost:3000';
  const now = options.now ?? (() => new Date());
  const iso = (offsetMs = 0) => new Date(now().getTime() + offsetMs).toISOString();

  const drafts = new Map<string, StoredDraft>();
  const payments = new Map<string, StoredPayment>();
  const paymentsByIdempotencyKey = new Map<string, string>();
  const policies = new Map<string, Policy>();
  const claims = new Map<string, Claim & { createdMs: number }>();
  const certificates = new Map<string, { policyId: string }>();
  let sequence = 0;

  const newId = (prefix: string) => `${prefix}_${randomBytes(16).toString('hex')}`;
  const nextNumber = (prefix: string) =>
    `${prefix}-${now().getFullYear()}-${String(++sequence).padStart(6, '0')}`;

  const app = new Hono();

  // --- Latence et scénarios globaux ---
  app.use('*', async (c, next) => {
    const scenario = c.req.header('x-mock-scenario');
    const delay = latencyMs + (scenario === 'slow' ? 3000 : 0);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if (scenario === 'technical-error')
      return fail(c, 500, 'INTERNAL_ERROR', 'Erreur technique simulée');
    if (scenario === 'rate-limited')
      return fail(c, 429, 'RATE_LIMITED', 'Trop de tentatives, réessayez plus tard');
    await next();
  });

  // --- Helpers ---
  function fail(
    c: Context,
    status: number,
    code: ErrorCode,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    const body: ApiError = { error: { code, message, ...(fields ? { fields } : {}) } };
    return c.json(body, status as 400);
  }

  /** Toute réponse simulée est validée par le schéma du contrat : le mock ne peut pas dériver. */
  function ok<K extends RouteKey>(c: Context, key: K, data: Out<K>) {
    const route: RouteDef = routes[key];
    const parsed = route.success.schema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Mock non conforme au contrat (${key}) : ${parsed.error.message}`);
    }
    return c.json(parsed.data as object, route.success.status);
  }

  function fieldErrors(error: z.ZodError): Record<string, string[]> {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] = [...(fields[key] ?? []), issue.message];
    }
    return fields;
  }

  async function parseBody<S extends z.ZodType>(c: Context, schema: S) {
    const raw = await c.req.json().catch(() => undefined);
    return schema.safeParse(raw);
  }

  const toHonoPath = (path: string) => path.replace(/\{(\w+)\}/g, ':$1');
  const r = (key: RouteKey) => toHonoPath(routes[key].path);
  const param = (c: Context, name: string) => c.req.param(name) ?? '';

  function loadDraft(c: Context): StoredDraft | Response {
    const draftId = c.req.param('draftId') ?? '';
    if (draftId === 'draft_expired') return fail(c, 410, 'DRAFT_EXPIRED', 'Ce brouillon a expiré');
    const draft = drafts.get(draftId);
    if (!draft) return fail(c, 404, 'NOT_FOUND', 'Brouillon introuvable');
    if (new Date(draft.expiresAt).getTime() < now().getTime()) {
      return fail(c, 410, 'DRAFT_EXPIRED', 'Ce brouillon a expiré');
    }
    return draft;
  }

  function refreshProgress(draft: StoredDraft) {
    const journey = getJourney(draft.kind, draft.product);
    const order = journey?.order ?? [];
    draft.completedSteps = order.filter((s) => s in draft.steps);
    draft.nextStep = order.find((s) => !(s in draft.steps)) ?? null;
    draft.updatedAt = iso();
    if (draft.kind === 'subscription' && draft.product === 'auto') {
      const vehicle = draft.steps.vehicle as { category?: string } | undefined;
      const history = draft.steps.history as { claimsLast36Months?: string } | undefined;
      const usage = draft.steps.usage as { parking?: string } | undefined;
      const formula = draft.steps.formula as { formulaCode?: string } | undefined;
      if (vehicle) {
        draft.estimate = {
          annual: estimateAuto(
            {
              category: vehicle.category,
              claimsLast36Months: history?.claimsLast36Months,
              parking: usage?.parking,
            },
            formula?.formulaCode ?? 'tous_risques',
          ),
          formulaCode: formula?.formulaCode ?? null,
          isFinal: Boolean(formula),
        };
      }
    }
  }

  function settlePayment(payment: StoredPayment) {
    if (payment.status !== 'pending') return;
    const elapsed = now().getTime() - new Date(payment.createdAt).getTime();
    if (elapsed < paymentDelayMs) return;
    payment.status = payment.outcome;
    if (payment.outcome === 'failed') payment.failureReason = 'insufficient_funds';
    if (payment.outcome === 'succeeded') payment.policyId = issuePolicy(payment.draftId);
  }

  function issuePolicy(draftId: string): string {
    const draft = drafts.get(draftId);
    const app = AutoApplication.safeParse(draft?.steps);
    const holder = app.success ? app.data.holder : undefined;
    const vehicle = app.success ? app.data.vehicle : undefined;
    const formula = app.success ? app.data.formula.formulaCode : 'tous_risques';
    const start = app.success ? app.data.contract.startDate : iso().slice(0, 10);
    const end = new Date(new Date(start).getTime() + 365 * DAY - DAY).toISOString().slice(0, 10);
    const offer = priceAuto({}).find((o) => o.formulaCode === formula);
    const policyId = newId('pol');
    const code = randomBytes(5).toString('hex').toUpperCase();
    certificates.set(code, { policyId });
    policies.set(policyId, {
      id: policyId,
      number: nextNumber('AUTO'),
      product: 'auto',
      formulaCode: formula,
      formulaName: offer?.formulaName ?? formula,
      status: 'active',
      holderName: holder ? `${holder.firstName} ${holder.lastName}` : 'Client démo',
      insuredObject: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : 'Véhicule',
      startDate: start,
      endDate: end,
      annualPremium: offer?.annualPremium ?? { amount: 0, currency: 'CDF' },
      certificateCode: code,
      createdAt: iso(),
    });
    if (draft) draft.status = 'completed';
    return policyId;
  }

  function claimView(claim: Claim & { createdMs: number }): Claim {
    // Démo : le dossier passe « reçu » 10 s après la déclaration.
    const { createdMs, ...view } = claim;
    if (view.status === 'declared' && now().getTime() - createdMs > 10_000) {
      view.status = 'received';
      view.timeline = [
        ...view.timeline,
        {
          at: iso(),
          status: 'received',
          message: 'Votre déclaration a été reçue par un gestionnaire.',
        },
      ];
      claims.set(view.id, { ...view, createdMs });
    }
    return view;
  }

  // --- Routes ---
  app.get(r('health'), (c) => ok(c, 'health', { status: 'ok', version: 'mock-1.0.0' }));

  app.get(r('listProducts'), (c) => ok(c, 'listProducts', { items: PRODUCT_SUMMARIES }));

  app.get(r('getProduct'), (c) => {
    const product = productDetail(param(c, 'code'));
    return product ? ok(c, 'getProduct', product) : fail(c, 404, 'NOT_FOUND', 'Produit inconnu');
  });

  app.get(r('listAgencies'), (c) => {
    const query = routes.listAgencies.query.safeParse(c.req.query());
    if (!query.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Recherche invalide', fieldErrors(query.error));
    }
    const { q, region, lat, lng } = query.data;
    const needle = q?.toLowerCase();
    const items = AGENCIES.filter((a) => !region || a.region === region)
      .filter((a) => !needle || `${a.name} ${a.city} ${a.address}`.toLowerCase().includes(needle))
      .map((a) => ({
        ...a,
        distanceKm:
          lat !== undefined && lng !== undefined && a.location
            ? Math.round(haversineKm(lat, lng, a.location.lat, a.location.lng) * 10) / 10
            : null,
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return ok(c, 'listAgencies', { items, total: items.length });
  });

  app.get(r('getAgency'), (c) => {
    // Le slug contient un « / » : il arrive encodé dans le chemin.
    const slug = decodeURIComponent(param(c, 'slug'));
    const agency = AGENCIES.find((a) => a.slug === slug || a.id === slug);
    return agency ? ok(c, 'getAgency', agency) : fail(c, 404, 'NOT_FOUND', 'Agence introuvable');
  });

  app.get(r('lookupVehicle'), (c) => {
    const query = routes.lookupVehicle.query.safeParse(c.req.query());
    if (!query.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Plaque invalide', fieldErrors(query.error));
    }
    const plate = query.data.plate;
    if (plate.startsWith('0000')) {
      return fail(c, 404, 'VEHICLE_NOT_FOUND', 'Aucun véhicule trouvé pour cette plaque');
    }
    const vehicle = KNOWN_VEHICLES[plate] ?? {
      plate,
      make: 'Toyota',
      model: 'Corolla',
      version: null,
      category: 'particulier' as const,
      energy: 'essence' as const,
      firstRegistrationDate: '2018-06-01',
      estimatedValueUsd: 900_000,
    };
    return ok(c, 'lookupVehicle', vehicle);
  });

  app.post(r('createDraft'), async (c) => {
    const body = await parseBody(c, routes.createDraft.body);
    if (!body.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Requête invalide', fieldErrors(body.error));
    }
    const journey = getJourney(body.data.kind, body.data.product);
    if (!journey) {
      return fail(c, 422, 'VALIDATION_FAILED', "Ce parcours n'est pas encore disponible en ligne");
    }
    const draft: StoredDraft = {
      id: newId('drf'),
      kind: body.data.kind,
      product: body.data.product,
      status: 'in_progress',
      steps: {},
      completedSteps: [],
      nextStep: journey.order[0] ?? null,
      totalSteps: journey.order.length,
      estimate: null,
      createdAt: iso(),
      updatedAt: iso(),
      expiresAt: iso(60 * DAY),
    };
    drafts.set(draft.id, draft);
    return ok(c, 'createDraft', draft);
  });

  app.get(r('getDraft'), (c) => {
    const draft = loadDraft(c);
    return draft instanceof Response ? draft : ok(c, 'getDraft', draft);
  });

  app.put(r('saveDraftStep'), async (c) => {
    const draft = loadDraft(c);
    if (draft instanceof Response) return draft;
    const step = c.req.param('step') ?? '';
    const schema = getStepSchema(draft.kind, draft.product, step);
    if (!schema) return fail(c, 404, 'NOT_FOUND', `Étape inconnue : ${step}`);
    const body = await parseBody(c, routes.saveDraftStep.body);
    if (!body.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Requête invalide', fieldErrors(body.error));
    }
    const values = schema.safeParse(body.data.values);
    if (!values.success) {
      return fail(
        c,
        422,
        'VALIDATION_FAILED',
        'Certains champs sont à corriger',
        fieldErrors(values.error),
      );
    }
    draft.steps[step] = values.data as Record<string, unknown>;
    refreshProgress(draft);
    return ok(c, 'saveDraftStep', draft);
  });

  app.post(r('sendResumeLink'), async (c) => {
    const draft = loadDraft(c);
    if (draft instanceof Response) return draft;
    const body = await parseBody(c, routes.sendResumeLink.body);
    if (!body.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Numéro invalide', fieldErrors(body.error));
    }
    const digits = body.data.phone.replace(/\D/g, '');
    return ok(c, 'sendResumeLink', { sentTo: `+243 ••• ${digits.slice(-4)}` });
  });

  const createUpload = async (c: Context, key: 'createDraftUpload' | 'createClaimUpload') => {
    const body = await parseBody(c, routes[key].body);
    if (!body.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'Fichier refusé', fieldErrors(body.error));
    }
    const documentId = newId('doc');
    return ok(c, key, {
      documentId,
      uploadUrl: `${publicUrl}/mock/uploads/${documentId}`,
      method: 'PUT',
      headers: { 'content-type': body.data.contentType },
      expiresAt: iso(15 * 60 * 1000),
    });
  };

  app.post(r('createDraftUpload'), async (c) => {
    const draft = loadDraft(c);
    return draft instanceof Response ? draft : createUpload(c, 'createDraftUpload');
  });

  app.put('/mock/uploads/:documentId', (c) => c.body(null, 200));

  app.post(r('createQuote'), (c) => {
    const draft = loadDraft(c);
    if (draft instanceof Response) return draft;
    if (draft.kind !== 'subscription') {
      return fail(c, 409, 'DRAFT_INCOMPLETE', "Un devis ne s'applique qu'à une souscription");
    }
    const required = ['holder', 'drivers', 'vehicle', 'history', 'usage'];
    const missing = required.filter((s) => !(s in draft.steps));
    if (missing.length > 0) {
      return fail(c, 409, 'DRAFT_INCOMPLETE', `Étapes à compléter : ${missing.join(', ')}`);
    }
    const vehicle = draft.steps.vehicle as { category?: string };
    const history = draft.steps.history as { claimsLast36Months?: string };
    const usage = draft.steps.usage as { parking?: string };
    const contract = draft.steps.contract as { paymentFrequency?: 'annual' } | undefined;
    return ok(c, 'createQuote', {
      id: newId('quo'),
      draftId: draft.id,
      tariffVersion: 'mock-2026.1',
      offers: priceAuto({
        category: vehicle.category,
        claimsLast36Months: history.claimsLast36Months,
        parking: usage.parking,
        frequency: contract?.paymentFrequency,
      }),
      createdAt: iso(),
      validUntil: iso(30 * DAY),
    });
  });

  app.post(r('createPayment'), async (c) => {
    const draft = loadDraft(c);
    if (draft instanceof Response) return draft;
    const headers = routes.createPayment.headers.safeParse({
      'idempotency-key': c.req.header('idempotency-key'),
    });
    if (!headers.success) {
      return fail(c, 422, 'VALIDATION_FAILED', 'En-tête Idempotency-Key (UUID) obligatoire');
    }
    const key = headers.data['idempotency-key'];
    const existing = paymentsByIdempotencyKey.get(key);
    if (existing) {
      const payment = payments.get(existing);
      if (!payment || payment.draftId !== draft.id) {
        return fail(c, 409, 'IDEMPOTENCY_CONFLICT', 'Clé déjà utilisée pour un autre dossier');
      }
      return ok(c, 'createPayment', stripOutcome(payment));
    }
    const application = AutoApplication.safeParse(draft.steps);
    if (!application.success) {
      return fail(
        c,
        409,
        'DRAFT_INCOMPLETE',
        'Le dossier doit être complet avant le paiement',
        fieldErrors(application.error),
      );
    }
    const body = await parseBody(c, routes.createPayment.body);
    if (!body.success) {
      return fail(
        c,
        422,
        'VALIDATION_FAILED',
        'Moyen de paiement invalide',
        fieldErrors(body.error),
      );
    }
    const offer = priceAuto({
      category: application.data.vehicle.category,
      claimsLast36Months: application.data.history.claimsLast36Months,
      parking: application.data.usage.parking,
    }).find((o) => o.formulaCode === application.data.formula.formulaCode);

    const phone = 'phone' in body.data ? body.data.phone : null;
    const outcome = phone?.endsWith('0001')
      ? 'failed'
      : phone?.endsWith('0002')
        ? 'expired'
        : phone?.endsWith('0003')
          ? 'verifying'
          : 'succeeded';
    const operator = {
      mpesa: 'M-Pesa',
      orange_money: 'Orange Money',
      airtel_money: 'Airtel Money',
      card: 'carte',
    }[body.data.method];
    const id = newId('pay');
    const payment: StoredPayment = {
      id,
      draftId: draft.id,
      method: body.data.method,
      status: 'pending',
      amount: offer?.annualPremium ?? { amount: 0, currency: 'CDF' },
      maskedPhone: phone ? `${phone.slice(0, 7)} ••• ${phone.slice(-4)}` : null,
      instructions:
        body.data.method === 'card'
          ? ['Vous allez être redirigé vers la page de paiement sécurisée de votre banque.']
          : [
              `Une demande de paiement ${operator} a été envoyée sur votre téléphone.`,
              'Saisissez votre code PIN pour la valider.',
            ],
      redirectUrl: body.data.method === 'card' ? `${publicUrl}/mock/3ds/${id}` : null,
      failureReason: null,
      policyId: null,
      createdAt: iso(),
      expiresAt: iso(5 * 60 * 1000),
      outcome,
    };
    payments.set(id, payment);
    paymentsByIdempotencyKey.set(key, id);
    draft.status = 'awaiting_payment';
    return ok(c, 'createPayment', stripOutcome(payment));
  });

  app.get('/mock/3ds/:paymentId', (c) =>
    c.html(
      '<!doctype html><meta charset="utf-8"><title>3-D Secure simulé</title><p>Paiement par carte simulé : vous pouvez fermer cette page.</p>',
    ),
  );

  app.get(r('getPayment'), (c) => {
    const payment = payments.get(param(c, 'paymentId'));
    if (!payment) return fail(c, 404, 'NOT_FOUND', 'Paiement introuvable');
    settlePayment(payment);
    return ok(c, 'getPayment', stripOutcome(payment));
  });

  app.get(r('getPolicy'), (c) => {
    const policy = policies.get(param(c, 'policyId'));
    return policy ? ok(c, 'getPolicy', policy) : fail(c, 404, 'NOT_FOUND', 'Contrat introuvable');
  });

  app.get(r('getCertificate'), (c) => {
    const policy = policies.get(param(c, 'policyId'));
    if (!policy?.certificateCode) return fail(c, 404, 'NOT_FOUND', 'Attestation introuvable');
    return ok(c, 'getCertificate', {
      code: policy.certificateCode,
      snecaNumber: `SNECA-MOCK-${policy.certificateCode}`,
      policyNumber: policy.number,
      holderName: policy.holderName,
      insuredObject: policy.insuredObject,
      validFrom: policy.startDate,
      validTo: policy.endDate,
      verifyUrl: `${webUrl}/verifier/${policy.certificateCode}`,
      pdfUrl: `${publicUrl}/mock/certificates/${policy.certificateCode}.pdf`,
    });
  });

  app.get('/mock/certificates/:file', (c) => {
    c.header('content-type', 'application/pdf');
    return c.body(MINIMAL_PDF);
  });

  app.get(r('verifyCertificate'), (c) => {
    const code = param(c, 'code').toUpperCase();
    const entry = certificates.get(code);
    const policy = entry ? policies.get(entry.policyId) : undefined;
    if (!policy) {
      return ok(c, 'verifyCertificate', {
        code,
        status: 'unknown',
        maskedHolderName: null,
        insuredObject: null,
        validFrom: null,
        validTo: null,
        insurer: 'SONAS SA',
        checkedAt: iso(),
      });
    }
    const expired = new Date(policy.endDate).getTime() < now().getTime();
    return ok(c, 'verifyCertificate', {
      code,
      status: expired ? 'expired' : 'valid',
      maskedHolderName: maskName(policy.holderName),
      insuredObject: policy.insuredObject,
      validFrom: policy.startDate,
      validTo: policy.endDate,
      insurer: 'SONAS SA',
      checkedAt: iso(),
    });
  });

  app.post(r('submitClaim'), (c) => {
    const draft = loadDraft(c);
    if (draft instanceof Response) return draft;
    if (draft.kind !== 'claim') {
      return fail(c, 409, 'DRAFT_INCOMPLETE', "Ce brouillon n'est pas une déclaration de sinistre");
    }
    const declaration = AutoClaimDeclaration.safeParse(draft.steps);
    if (!declaration.success) {
      return fail(
        c,
        409,
        'DRAFT_INCOMPLETE',
        'La déclaration est incomplète',
        fieldErrors(declaration.error),
      );
    }
    const d = declaration.data;
    const docs: Claim['requiredDocuments'] = [
      {
        code: 'photos',
        label: 'Photos des dégâts',
        hint: 'Une vue d’ensemble et un gros plan de chaque zone touchée.',
        mandatory: false,
        status: d.documents.documentIds.length > 0 ? 'received' : 'missing',
      },
    ];
    if (d.type.type === 'vol_vandalisme' || d.people.policeIntervened) {
      docs.push({
        code: 'police_report',
        label: 'Procès-verbal de police',
        hint: 'Délivré par le commissariat où vous avez déclaré les faits.',
        mandatory: true,
        status: 'missing',
      });
    }
    if (d.type.type === 'accident' && d.liability.thirdPartyInvolved) {
      docs.push({
        code: 'amicable_report',
        label: 'Constat amiable signé',
        hint: 'Signé par les deux conducteurs, si vous en avez rempli un.',
        mandatory: false,
        status: 'missing',
      });
    }
    const id = newId('clm');
    const claim = {
      id,
      number: nextNumber('SIN'),
      product: draft.product,
      type: d.type.type,
      status: 'declared' as const,
      statusReason: null,
      requiredDocuments: docs,
      timeline: [
        {
          at: iso(),
          status: 'declared' as const,
          message: 'Votre déclaration a bien été envoyée.',
        },
      ],
      callbackPlanned: true,
      createdAt: iso(),
      updatedAt: iso(),
      createdMs: now().getTime(),
    };
    claims.set(id, claim);
    draft.status = 'completed';
    return ok(c, 'submitClaim', claimView(claim));
  });

  app.get(r('getClaim'), (c) => {
    const claim = claims.get(param(c, 'claimId'));
    return claim
      ? ok(c, 'getClaim', claimView(claim))
      : fail(c, 404, 'NOT_FOUND', 'Sinistre introuvable');
  });

  app.post(r('createClaimUpload'), async (c) => {
    if (!claims.has(param(c, 'claimId'))) return fail(c, 404, 'NOT_FOUND', 'Sinistre introuvable');
    return createUpload(c, 'createClaimUpload');
  });

  app.get(r('listCallbackSlots'), (c) => ok(c, 'listCallbackSlots', { items: CALLBACK_SLOTS }));

  app.post(r('createCallback'), async (c) => {
    const body = await parseBody(c, routes.createCallback.body);
    if (!body.success) {
      return fail(
        c,
        422,
        'VALIDATION_FAILED',
        'Demande de rappel invalide',
        fieldErrors(body.error),
      );
    }
    const slot = CALLBACK_SLOTS.find((s) => s.id === body.data.slotId);
    if (!slot)
      return fail(c, 422, 'VALIDATION_FAILED', 'Créneau indisponible', {
        slotId: ['Créneau inconnu'],
      });
    return ok(c, 'createCallback', {
      id: newId('cbk'),
      reference: nextNumber('RAP'),
      slotLabel: slot.label,
      createdAt: iso(),
    });
  });

  app.notFound((c) => fail(c, 404, 'NOT_FOUND', 'Route inconnue'));
  app.onError((err, c) => {
    console.error(err);
    return fail(c, 500, 'INTERNAL_ERROR', 'Erreur interne du serveur simulé');
  });

  return app;
}

function stripOutcome(payment: StoredPayment): Payment {
  const { outcome: _outcome, ...rest } = payment;
  return rest;
}

function maskName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) =>
      part.length <= 1 ? part : `${part[0]}${'•'.repeat(Math.min(part.length - 1, 4))}`,
    )
    .join(' ');
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** PDF minimal valide (une page) pour simuler l'attestation. */
const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 66>>stream
BT /F1 18 Tf 72 760 Td (Attestation d'assurance - document simule) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

export { randomUUID };
