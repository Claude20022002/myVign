import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createMockApp } from '../mock/app';
import { normalizePhoneCD, PhoneCD, PlateCD } from '../src';
import { type ApiClient, createApiClient } from '../src/client';

/** Client typé branché directement sur le serveur simulé (sans réseau). */
function setup(options: { paymentDelayMs?: number; clock?: { t: number } } = {}) {
  const clock = options.clock ?? { t: Date.parse('2026-11-14T10:00:00Z') };
  const app = createMockApp({
    paymentDelayMs: options.paymentDelayMs ?? 0,
    now: () => new Date(clock.t),
  });
  const api = createApiClient({
    baseUrl: 'http://mock.local',
    fetch: (input, init) => Promise.resolve(app.fetch(new Request(input, init))),
    validateResponses: true,
  });
  return { api, clock };
}

const holder = {
  isMainDriver: 'self',
  civility: 'madame',
  firstName: 'Mireille',
  lastName: 'Kabongo',
  birthDate: '1990-04-12',
  email: 'mireille.kabongo@mail.cd',
  phone: '081 234 5678',
  address: { line: '24 avenue Colonel Mondjiba', commune: 'Ngaliema', city: 'Kinshasa' },
};

async function completeAutoDraft(api: ApiClient) {
  const created = await api.call('createDraft', { body: { kind: 'subscription', product: 'auto' } });
  if (!created.ok) throw new Error(created.error.message);
  const draftId = created.data.id;
  const steps: Record<string, unknown> = {
    holder,
    drivers: { mainDriverLicenseDate: '2010-06-01', licenseObtainedInDrc: true, additionalDrivers: [] },
    vehicle: {
      category: 'particulier',
      plate: '4521AB 01',
      make: 'Peugeot',
      model: '208',
      version: '1.2 PureTech 100',
      firstRegistrationDate: '2021-03-01',
      acquisitionDate: '2021-03-01',
    },
    history: { claimsLast36Months: '0', licenseSuspended: false },
    usage: { usage: 'domicile_travail', annualKm: 12000, parking: 'garage_ferme', parkingAddressSameAsHome: true },
    formula: { formulaCode: 'tous_risques', deductible: 'standard', options: { legalProtection: true, driverProtection: false } },
    contract: { startDate: '2026-12-01', paymentFrequency: 'annual', acceptsTerms: true },
  };
  for (const [step, values] of Object.entries(steps)) {
    const saved = await api.call('saveDraftStep', {
      params: { draftId, step },
      body: { values: values as Record<string, unknown> },
    });
    if (!saved.ok) throw new Error(`${step} : ${JSON.stringify(saved.error)}`);
  }
  return draftId;
}

describe('schémas communs', () => {
  it('normalise les téléphones RDC', () => {
    expect(normalizePhoneCD('081 234 5678')).toBe('+243812345678');
    expect(normalizePhoneCD('+243 81 234 5678')).toBe('+243812345678');
    expect(normalizePhoneCD('00243812345678')).toBe('+243812345678');
    expect(PhoneCD.safeParse('12345').success).toBe(false);
  });

  it('normalise et valide les plaques (E1 : format invalide)', () => {
    expect(PlateCD.parse('4521ab 01')).toBe('4521AB01');
    expect(PlateCD.safeParse('4521A').success).toBe(false);
  });
});

describe('parcours de souscription auto (serveur simulé)', () => {
  it('va du brouillon à l’attestation vérifiable', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);

    const draft = await api.call('getDraft', { params: { draftId } });
    expect(draft.ok && draft.data.nextStep).toBe('payment');
    expect(draft.ok && draft.data.estimate?.isFinal).toBe(true);

    const quote = await api.call('createQuote', { params: { draftId } });
    expect(quote.ok && quote.data.offers).toHaveLength(3);

    const payment = await api.call('createPayment', {
      params: { draftId },
      headers: { 'idempotency-key': randomUUID() },
      body: { method: 'mpesa', phone: '+243 81 234 5678' },
    });
    if (!payment.ok) throw new Error(payment.error.message);
    expect(payment.data.status).toBe('pending');

    const settled = await api.call('getPayment', { params: { paymentId: payment.data.id } });
    if (!settled.ok) throw new Error(settled.error.message);
    expect(settled.data.status).toBe('succeeded');
    const policyId = settled.data.policyId;
    if (!policyId) throw new Error('policyId manquant');

    const certificate = await api.call('getCertificate', { params: { policyId } });
    if (!certificate.ok) throw new Error(certificate.error.message);
    expect(certificate.data.verifyUrl).toContain('/verifier/');

    const verification = await api.call('verifyCertificate', {
      params: { code: certificate.data.code },
    });
    expect(verification.ok && verification.data.status).toBe('valid');
    expect(verification.ok && verification.data.maskedHolderName).not.toContain('Kabongo');
  });

  it('refuse une étape invalide avec les erreurs par champ', async () => {
    const { api } = setup();
    const created = await api.call('createDraft', { body: { kind: 'subscription', product: 'auto' } });
    if (!created.ok) throw new Error();
    const saved = await api.call('saveDraftStep', {
      params: { draftId: created.data.id, step: 'holder' },
      body: { values: { ...holder, email: 'pas-un-email' } },
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) {
      expect(saved.error.code).toBe('VALIDATION_FAILED');
      expect(saved.error.fields?.email).toBeDefined();
    }
  });

  it('bloque le devis tant que le dossier est incomplet', async () => {
    const { api } = setup();
    const created = await api.call('createDraft', { body: { kind: 'subscription', product: 'auto' } });
    if (!created.ok) throw new Error();
    const quote = await api.call('createQuote', { params: { draftId: created.data.id } });
    expect(!quote.ok && quote.error.code).toBe('DRAFT_INCOMPLETE');
  });

  it('rejoue un paiement à l’identique avec la même clé d’idempotence', async () => {
    const { api } = setup({ paymentDelayMs: 60_000 });
    const draftId = await completeAutoDraft(api);
    const key = randomUUID();
    const input = {
      params: { draftId },
      headers: { 'idempotency-key': key },
      body: { method: 'orange_money' as const, phone: '+243 89 000 1234' },
    };
    const first = await api.call('createPayment', input);
    const second = await api.call('createPayment', input);
    expect(first.ok && second.ok && first.data.id === second.data.id).toBe(true);
  });
});

describe('cas d’erreur de la maquette', () => {
  it('E2 : véhicule introuvable', async () => {
    const { api } = setup();
    const result = await api.call('lookupVehicle', { query: { plate: '0000AA00' } });
    expect(!result.ok && result.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('E1 : plaque au format invalide', async () => {
    const { api } = setup();
    const result = await api.call('lookupVehicle', { query: { plate: '4521A' } });
    expect(!result.ok && result.status).toBe(422);
  });

  it.each([
    ['0001', 'failed'],
    ['0002', 'expired'],
    ['0003', 'verifying'],
  ])('E3–E5 : téléphone finissant par %s → paiement %s', async (suffix, expected) => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);
    const payment = await api.call('createPayment', {
      params: { draftId },
      headers: { 'idempotency-key': randomUUID() },
      body: { method: 'mpesa', phone: `+24381234${suffix}` },
    });
    if (!payment.ok) throw new Error(payment.error.message);
    const settled = await api.call('getPayment', { params: { paymentId: payment.data.id } });
    expect(settled.ok && settled.data.status).toBe(expected);
  });

  it('E6 : erreur technique sur demande', async () => {
    const { api } = setup();
    const result = await api.call('listProducts', {
      headers: { 'x-mock-scenario': 'technical-error' },
    } as never);
    expect(!result.ok && result.error.code).toBe('INTERNAL_ERROR');
  });

  it('brouillon expiré → 410', async () => {
    const { api } = setup();
    const result = await api.call('getDraft', { params: { draftId: 'draft_expired' } });
    expect(!result.ok && result.error.code).toBe('DRAFT_EXPIRED');
  });
});

describe('déclaration de sinistre auto', () => {
  it('déclare un sinistre et suit son statut', async () => {
    const { api, clock } = setup();
    const created = await api.call('createDraft', { body: { kind: 'claim', product: 'auto' } });
    if (!created.ok) throw new Error();
    const draftId = created.data.id;
    const steps: Record<string, unknown> = {
      contact: { lastName: 'Kabongo', firstName: 'Mireille', phone: '+243812345678', workPhone: null, email: null, plate: '4521AB01', policyNumber: null },
      type: { type: 'accident' },
      whenWhere: { date: '2026-11-05', time: '18:30', city: 'Kinshasa', commune: 'Ngaliema', abroad: false, vehicleStillAbroad: null },
      circumstances: { vehicleSituation: 'en_circulation', description: "À l'arrêt au feu rouge, un véhicule m'a percuté par l'arrière." },
      damage: { zones: ['arriere_gauche', 'arriere'], natures: ['carrosserie', 'optiques'], vehicleDrivable: true, objectsStolen: false },
      people: { injured: false, policeIntervened: false, driver: 'main_driver', otherDriver: null, noviceDriver: false, usage: 'domicile_travail' },
      liability: { liability: 'none', thirdPartyInvolved: true, thirdParty: { lastName: 'Mukendi', firstName: 'Joseph', commune: 'Lingwala', plate: '7810KC01' } },
      documents: { documentIds: [] },
    };
    for (const [step, values] of Object.entries(steps)) {
      const saved = await api.call('saveDraftStep', {
        params: { draftId, step },
        body: { values: values as Record<string, unknown> },
      });
      if (!saved.ok) throw new Error(`${step} : ${JSON.stringify(saved.error)}`);
    }
    const claim = await api.call('submitClaim', { params: { draftId } });
    if (!claim.ok) throw new Error(claim.error.message);
    expect(claim.data.status).toBe('declared');
    expect(claim.data.requiredDocuments.map((d) => d.code)).toContain('amicable_report');

    clock.t += 11_000;
    const later = await api.call('getClaim', { params: { claimId: claim.data.id } });
    expect(later.ok && later.data.status).toBe('received');
  });
});

describe('agences', () => {
  it('trie par distance quand la position est connue', async () => {
    const { api } = setup();
    const result = await api.call('listAgencies', { query: { lat: -4.32, lng: 15.31 } });
    if (!result.ok) throw new Error();
    expect(result.data.items[0]?.city).toContain('Kinshasa');
    expect(result.data.items[0]?.distanceKm).not.toBeNull();
  });
});
