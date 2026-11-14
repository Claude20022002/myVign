import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createMockApp } from '../mock/app';
import { AutoApplication, AutoStepVehicle, normalizePhoneCD, PhoneCD, PlateCD } from '../src';
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

const address = {
  province: 'kinshasa',
  city: 'Kinshasa',
  commune: 'Ngaliema',
  quartier: 'Binza Pigeon',
  street: '24, avenue Colonel Mondjiba',
  landmark: 'En face de la station-service',
};

const holder = {
  subscriberType: 'particulier',
  company: null,
  mainDriver: 'moi',
  civility: 'madame',
  firstName: 'Mireille',
  lastName: 'Kabongo',
  postName: 'Moba',
  birthDate: '1990-04-12',
  profession: 'Comptable',
  identityDocument: { type: 'carte_electeur', number: 'CD1234567', expiresAt: null },
  email: null,
  phone: '081 234 5678',
  address,
};

const vehicle = {
  category: 'particulier',
  plate: '4521AB 01',
  chassisNumber: null,
  make: 'Peugeot',
  model: '208',
  energy: 'essence',
  fiscalHorsepower: 6,
  seats: 5,
  manufactureYear: 2020,
  firstRegistrationDate: '2021-03-01',
  registrationCardDate: '2021-03-01',
  registrationCardHolder: 'souscripteur',
  marketValue: { amount: 1_450_000, currency: 'USD' },
};

const autoSteps: Record<string, Record<string, unknown>> = {
  holder,
  drivers: {
    licenseNumber: 'KIN-2010-0042',
    licenseCategory: 'B',
    licenseDate: '2010-06-01',
    licenseIssuedInDrc: true,
    additionalDrivers: [],
  },
  vehicle,
  history: { claimsLast36Months: '0', licenseSuspended: false, licenseSuspensionDate: null },
  usage: {
    usage: 'domicile_travail',
    annualKm: 12000,
    nightParking: 'garage_ferme',
    nightParkingAddress: null,
  },
  formula: {
    formulaCode: 'tous_risques',
    deductible: 'standard',
    deductibleBuyBack: false,
    options: { occupantCover: true, yellowCard: true },
  },
  contract: { startDate: '2026-12-01', duration: 'annuelle', shortDurationMonths: null },
  declaration: { certifiesAccuracy: true, consentsToDataProcessing: true, acceptsTerms: true },
};

async function saveSteps(api: ApiClient, draftId: string, steps: Record<string, unknown>) {
  for (const [step, values] of Object.entries(steps)) {
    const saved = await api.call('saveDraftStep', {
      params: { draftId, step },
      body: { values: values as Record<string, unknown> },
    });
    if (!saved.ok) throw new Error(`${step} : ${JSON.stringify(saved.error)}`);
  }
}

async function completeAutoDraft(api: ApiClient) {
  const created = await api.call('createDraft', {
    body: { kind: 'subscription', product: 'auto' },
  });
  if (!created.ok) throw new Error(created.error.message);
  await saveSteps(api, created.data.id, autoSteps);
  return created.data.id;
}

async function pay(api: ApiClient, draftId: string, body: Record<string, unknown>) {
  const payment = await api.call('createPayment', {
    params: { draftId },
    headers: { 'idempotency-key': randomUUID() },
    body: body as never,
  });
  if (!payment.ok) throw new Error(payment.error.message);
  return payment.data;
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

  it('accepte un véhicule neuf sans plaque si le châssis est fourni', () => {
    const neuf = { ...vehicle, plate: null, chassisNumber: 'VF3 CC8HP0 KW123456' };
    expect(AutoStepVehicle.safeParse(neuf).success).toBe(true);
    expect(AutoStepVehicle.safeParse({ ...neuf, chassisNumber: null }).success).toBe(false);
  });

  it('exige la valeur vénale dès que la formule couvre le véhicule', () => {
    const sansValeur = { ...autoSteps, vehicle: { ...vehicle, marketValue: null } };
    expect(AutoApplication.safeParse(sansValeur).success).toBe(false);
    const tiers = {
      ...sansValeur,
      formula: { ...(autoSteps.formula as object), formulaCode: 'tiers' },
    };
    expect(AutoApplication.safeParse(tiers).success).toBe(true);
  });
});

describe('parcours de souscription auto (serveur simulé)', () => {
  it('va du brouillon au certificat provisoire vérifiable', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);

    const draft = await api.call('getDraft', { params: { draftId } });
    expect(draft.ok && draft.data.nextStep).toBe('payment');
    expect(draft.ok && draft.data.estimate?.isFinal).toBe(true);

    const quote = await api.call('createQuote', { params: { draftId } });
    expect(quote.ok && quote.data.offers).toHaveLength(3);

    const payment = await pay(api, draftId, { method: 'mpesa', phone: '+243 81 234 5678' });
    expect(payment.status).toBe('pending');

    const settled = await api.call('getPayment', { params: { paymentId: payment.id } });
    if (!settled.ok) throw new Error(settled.error.message);
    expect(settled.data.status).toBe('succeeded');
    expect(settled.data.receipt?.operatorTransactionId).toBeTruthy();
    const policyId = settled.data.policyId;
    if (!policyId) throw new Error('policyId manquant');

    const certificate = await api.call('getCertificate', { params: { policyId } });
    if (!certificate.ok) throw new Error(certificate.error.message);
    expect(certificate.data.kind).toBe('provisoire');
    expect(certificate.data.holderProfession).toBe('Comptable');
    expect(certificate.data.insurer.arcaAgreement).toBe('12007');
    expect(certificate.data.coveredCountries).toContain('COMESA');

    const verification = await api.call('verifyCertificate', {
      params: { code: certificate.data.code },
    });
    expect(verification.ok && verification.data.status).toBe('valid');
    expect(verification.ok && verification.data.maskedHolderName).not.toContain('Kabongo');
  });

  it('refuse une étape invalide avec les erreurs par champ', async () => {
    const { api } = setup();
    const created = await api.call('createDraft', {
      body: { kind: 'subscription', product: 'auto' },
    });
    if (!created.ok) throw new Error();
    const saved = await api.call('saveDraftStep', {
      params: { draftId: created.data.id, step: 'holder' },
      body: { values: { ...holder, profession: '' } },
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) {
      expect(saved.error.code).toBe('VALIDATION_FAILED');
      expect(saved.error.fields?.profession).toBeDefined();
    }
  });

  it('refuse le paiement sans certification d’exactitude (CA 13-15)', async () => {
    const { api } = setup();
    const created = await api.call('createDraft', {
      body: { kind: 'subscription', product: 'auto' },
    });
    if (!created.ok) throw new Error();
    const { declaration: _omitted, ...withoutDeclaration } = autoSteps;
    await saveSteps(api, created.data.id, withoutDeclaration);
    const payment = await api.call('createPayment', {
      params: { draftId: created.data.id },
      headers: { 'idempotency-key': randomUUID() },
      body: { method: 'mpesa', phone: '+243812345678' },
    });
    expect(!payment.ok && payment.error.code).toBe('DRAFT_INCOMPLETE');
  });

  it('bloque le devis tant que le dossier est incomplet', async () => {
    const { api } = setup();
    const created = await api.call('createDraft', {
      body: { kind: 'subscription', product: 'auto' },
    });
    if (!created.ok) throw new Error();
    const quote = await api.call('createQuote', { params: { draftId: created.data.id } });
    expect(!quote.ok && quote.error.code).toBe('DRAFT_INCOMPLETE');
  });

  it('rejoue un paiement à l’identique avec la même clé d’idempotence', async () => {
    const { api } = setup({ paymentDelayMs: 60_000 });
    const draftId = await completeAutoDraft(api);
    const input = {
      params: { draftId },
      headers: { 'idempotency-key': randomUUID() },
      body: { method: 'orange_money' as const, phone: '+243 89 000 1234' },
    };
    const first = await api.call('createPayment', input);
    const second = await api.call('createPayment', input);
    expect(first.ok && second.ok && first.data.id === second.data.id).toBe(true);
  });

  it('accepte Afrimoney', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);
    const payment = await pay(api, draftId, { method: 'afrimoney', phone: '+243 90 123 4567' });
    expect(payment.instructions.join(' ')).toContain('Afrimoney');
  });

  it('paiement en agence : référence remise, pas de couverture avant confirmation', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);
    const payment = await pay(api, draftId, { method: 'agency' });
    expect(payment.agencyReference).toMatch(/^PAG-/);
    const later = await api.call('getPayment', { params: { paymentId: payment.id } });
    expect(later.ok && later.data.status).toBe('pending');
    expect(later.ok && later.data.policyId).toBeNull();
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
  ])('E3–E5 : téléphone finissant par %s → paiement %s, sans contrat', async (suffix, expected) => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);
    const payment = await pay(api, draftId, { method: 'mpesa', phone: `+24381234${suffix}` });
    const settled = await api.call('getPayment', { params: { paymentId: payment.id } });
    expect(settled.ok && settled.data.status).toBe(expected);
    expect(settled.ok && settled.data.policyId).toBeNull();
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
  const claimSteps = (overrides: Record<string, unknown> = {}) => ({
    contact: {
      lastName: 'Kabongo',
      firstName: 'Mireille',
      phone: '+243812345678',
      email: null,
      plate: '4521AB01',
      policyNumber: null,
    },
    type: { type: 'accident' },
    whenWhere: {
      date: '2026-11-05',
      time: '18:30',
      province: 'kinshasa',
      city: 'Kinshasa',
      commune: 'Ngaliema',
      placeDescription: 'Feu rouge du rond-point Ngaba',
      abroad: false,
    },
    circumstances: {
      vehicleSituation: 'en_circulation',
      description: "À l'arrêt au feu rouge, un véhicule m'a percuté par l'arrière.",
    },
    damage: {
      zones: ['arriere_gauche', 'arriere'],
      natures: ['carrosserie', 'optiques'],
      vehicleDrivable: true,
      objectsStolen: false,
    },
    people: {
      injured: false,
      deceased: false,
      policeIntervened: false,
      policeReportNumber: null,
      driver: 'assure',
      driverIdentity: null,
    },
    liability: {
      liabilityPercent: '0',
      thirdPartyInvolved: true,
      thirdParty: {
        lastName: 'Mukendi',
        firstName: 'Joseph',
        phone: null,
        plate: '7810KC01',
        insurerName: 'Rawsur',
        certificateNumber: null,
      },
    },
    documents: { documentIds: [] },
    ...overrides,
  });

  async function declare(api: ApiClient, steps: Record<string, unknown>) {
    const created = await api.call('createDraft', { body: { kind: 'claim', product: 'auto' } });
    if (!created.ok) throw new Error();
    await saveSteps(api, created.data.id, steps);
    const claim = await api.call('submitClaim', { params: { draftId: created.data.id } });
    if (!claim.ok) throw new Error(claim.error.message);
    return claim.data;
  }

  it('déclare un accident et suit son statut', async () => {
    const { api, clock } = setup();
    const claim = await declare(api, claimSteps());
    expect(claim.status).toBe('declared');
    const codes = claim.requiredDocuments.map((d) => d.code);
    expect(codes).toEqual(
      expect.arrayContaining(['police_report', 'repair_quote', 'amicable_report']),
    );

    clock.t += 11_000;
    const later = await api.call('getClaim', { params: { claimId: claim.id } });
    expect(later.ok && later.data.status).toBe('received');
  });

  it('demande les pièces d’un vol (police, clés, carte rose)', async () => {
    const { api } = setup();
    const claim = await declare(api, claimSteps({ type: { type: 'vol' } }));
    const codes = claim.requiredDocuments.map((d) => d.code);
    expect(codes).toEqual(expect.arrayContaining(['police_report', 'keys', 'registration_card']));
  });

  it('accepte une identification par n° de contrat sans plaque', async () => {
    const { api } = setup();
    const steps = claimSteps({
      contact: {
        lastName: 'Kabongo',
        firstName: 'Mireille',
        phone: '+243812345678',
        email: null,
        plate: null,
        policyNumber: 'AUTO-2026-000001',
      },
    });
    await expect(declare(api, steps)).resolves.toBeDefined();
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
