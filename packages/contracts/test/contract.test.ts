import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createMockApp } from '../mock/app';
import {
  AutoApplication,
  AutoStepVehicle,
  convertMoney,
  normalizePhoneCD,
  PhoneCD,
  PlateCD,
} from '../src';
import { type ApiClient, createApiClient } from '../src/client';

const RATE = 2850;

/** Client typé branché directement sur le serveur simulé (sans réseau). */
function setup(options: { paymentDelayMs?: number; clock?: { t: number } } = {}) {
  const clock = options.clock ?? { t: Date.parse('2026-11-14T10:00:00Z') };
  const app = createMockApp({
    paymentDelayMs: options.paymentDelayMs ?? 0,
    now: () => new Date(clock.t),
    usdCdfRate: RATE,
  });
  const api = createApiClient({
    baseUrl: 'http://mock.local',
    fetch: (input, init) => Promise.resolve(app.fetch(new Request(input, init))),
    validateResponses: true,
  });
  return { api, clock };
}

/**
 * Saisie MINIMALE d'un client pressé : uniquement ce qu'il tape vraiment.
 * Tout le reste vient de la plaque (pré-remplissage) ou des valeurs par défaut.
 */
const vehicleFromPlate = {
  plate: '4521AB 01',
  make: 'Peugeot',
  model: '208',
  energy: 'essence',
  fiscalHorsepower: 6,
  seats: 5,
  manufactureYear: 2020,
};

const minimalSteps: Record<string, Record<string, unknown>> = {
  vehicle: { ...vehicleFromPlate, marketValue: { amount: 1_450_000, currency: 'USD' } },
  usage: { usage: 'domicile_travail', nightParking: 'garage_ferme' },
  driver: { birthDate: '1990-04-12', licenseDate: '2010-06-01' },
  formula: { formulaCode: 'tous_risques' },
  holder: {
    firstName: 'Mireille',
    lastName: 'Kabongo',
    profession: 'Comptable',
    phone: '081 234 5678',
    address: { province: 'kinshasa', commune: 'Ngaliema', street: '24, avenue Colonel Mondjiba' },
  },
  declaration: { certifiesAccuracyAndTerms: true, consentsToDataProcessing: true },
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

async function newDraft(api: ApiClient, kind: 'subscription' | 'claim' = 'subscription') {
  const created = await api.call('createDraft', { body: { kind, product: 'auto' } });
  if (!created.ok) throw new Error(created.error.message);
  return created.data.id;
}

async function completeAutoDraft(api: ApiClient) {
  const draftId = await newDraft(api);
  await saveSteps(api, draftId, minimalSteps);
  return draftId;
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
    const neuf = { ...vehicleFromPlate, plate: null, chassisNumber: 'VF3 CC8HP0 KW123456' };
    expect(AutoStepVehicle.safeParse(neuf).success).toBe(true);
    expect(AutoStepVehicle.safeParse({ ...neuf, chassisNumber: null }).success).toBe(false);
  });

  it('complète les valeurs par défaut (le client ne les saisit pas)', () => {
    const parsed = AutoApplication.parse(minimalSteps);
    expect(parsed.vehicle.category).toBe('particulier');
    expect(parsed.driver.claimsLast36Months).toBe('0');
    expect(parsed.formula.options).toEqual({ occupantCover: false, yellowCard: false });
    expect(parsed.holder.identityDocument).toBeNull();
    expect(parsed.holder.address.landmark).toBeNull();
  });

  it('exige la valeur du véhicule dès que la formule le couvre', () => {
    const sansValeur = { ...minimalSteps, vehicle: vehicleFromPlate };
    expect(AutoApplication.safeParse(sansValeur).success).toBe(false);
    const tiers = { ...sansValeur, formula: { formulaCode: 'tiers' } };
    expect(AutoApplication.safeParse(tiers).success).toBe(true);
  });
});

describe('change USD ↔ CDF', () => {
  it('convertit en unités mineures entières, dans les deux sens', () => {
    const cdf = { amount: 1_290_000_00, currency: 'CDF' as const };
    const usd = convertMoney(cdf, 'USD', RATE);
    expect(usd).toEqual({ amount: 45_263, currency: 'USD' }); // 452,63 $
    expect(convertMoney(usd, 'CDF', RATE).amount).toBe(128_999_550); // écart d'arrondi < 1 cent
    expect(convertMoney(cdf, 'CDF', RATE)).toBe(cdf);
  });

  it('expose le taux du jour', async () => {
    const { api } = setup();
    const rate = await api.call('getExchangeRate', {});
    expect(rate.ok && rate.data.rate).toBe(RATE);
    expect(rate.ok && rate.data.effectiveDate).toBe('2026-11-14');
  });
});

describe('parcours de souscription auto (serveur simulé)', () => {
  it('donne le prix après 3 blocs, sans aucune donnée d’identité', async () => {
    const { api } = setup();
    const draftId = await newDraft(api);
    await saveSteps(api, draftId, {
      vehicle: minimalSteps.vehicle,
      usage: minimalSteps.usage,
      driver: minimalSteps.driver,
    });
    const quote = await api.call('createQuote', { params: { draftId } });
    expect(quote.ok && quote.data.offers).toHaveLength(3);
  });

  it('va de la saisie minimale au certificat provisoire vérifiable', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);

    const draft = await api.call('getDraft', { params: { draftId } });
    expect(draft.ok && draft.data.nextStep).toBe('payment');
    expect(draft.ok && draft.data.estimate?.isFinal).toBe(true);

    const payment = await pay(api, draftId, { method: 'mpesa', phone: '+243 81 234 5678' });
    expect(payment.status).toBe('pending');
    expect(payment.exchange).toBeNull();

    const settled = await api.call('getPayment', { params: { paymentId: payment.id } });
    if (!settled.ok) throw new Error(settled.error.message);
    expect(settled.data.status).toBe('succeeded');
    expect(settled.data.receipt?.operatorTransactionId).toBeTruthy();
    const policyId = settled.data.policyId;
    if (!policyId) throw new Error('policyId manquant');

    const policy = await api.call('getPolicy', { params: { policyId } });
    expect(policy.ok && policy.data.startDate).toBe('2026-11-14'); // dès le paiement (CA 16)

    const certificate = await api.call('getCertificate', { params: { policyId } });
    if (!certificate.ok) throw new Error(certificate.error.message);
    expect(certificate.data.kind).toBe('provisoire');
    expect(certificate.data.holderProfession).toBe('Comptable');
    expect(certificate.data.insurer.arcaAgreement).toBe('12007');

    const verification = await api.call('verifyCertificate', {
      params: { code: certificate.data.code },
    });
    expect(verification.ok && verification.data.status).toBe('valid');
    expect(verification.ok && verification.data.maskedHolderName).not.toContain('Kabongo');
  });

  it('paie en dollars au taux du jour, taux figé dans le paiement', async () => {
    const { api } = setup();
    const draftId = await completeAutoDraft(api);
    const quote = await api.call('createQuote', { params: { draftId } });
    if (!quote.ok) throw new Error();
    const tariff = quote.data.offers.find((o) => o.formulaCode === 'tous_risques')?.annualPremium;
    if (!tariff) throw new Error();

    const payment = await pay(api, draftId, {
      method: 'airtel_money',
      phone: '+243 97 123 4567',
      currency: 'USD',
    });
    expect(payment.amount).toEqual(convertMoney(tariff, 'USD', RATE));
    expect(payment.exchange?.rateCdfPerUsd).toBe(RATE);
    expect(payment.exchange?.tariffAmount).toEqual(tariff);
  });

  it('refuse une étape invalide avec les erreurs par champ', async () => {
    const { api } = setup();
    const draftId = await newDraft(api);
    const saved = await api.call('saveDraftStep', {
      params: { draftId, step: 'holder' },
      body: { values: { ...minimalSteps.holder, profession: '' } },
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) {
      expect(saved.error.code).toBe('VALIDATION_FAILED');
      expect(saved.error.fields?.profession).toBeDefined();
    }
  });

  it('refuse le paiement sans la case de certification (CA 13-15)', async () => {
    const { api } = setup();
    const draftId = await newDraft(api);
    const { declaration: _omitted, ...withoutDeclaration } = minimalSteps;
    await saveSteps(api, draftId, withoutDeclaration);
    const payment = await api.call('createPayment', {
      params: { draftId },
      headers: { 'idempotency-key': randomUUID() },
      body: { method: 'mpesa', phone: '+243812345678' },
    });
    expect(!payment.ok && payment.error.code).toBe('DRAFT_INCOMPLETE');
  });

  it('bloque le devis tant que le dossier est incomplet', async () => {
    const { api } = setup();
    const quote = await api.call('createQuote', { params: { draftId: await newDraft(api) } });
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
    const payment = await pay(api, await completeAutoDraft(api), {
      method: 'afrimoney',
      phone: '+243 90 123 4567',
    });
    expect(payment.instructions.join(' ')).toContain('Afrimoney');
  });

  it('paiement en agence : référence remise, pas de couverture avant confirmation', async () => {
    const { api } = setup();
    const payment = await pay(api, await completeAutoDraft(api), { method: 'agency' });
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
    const payment = await pay(api, await completeAutoDraft(api), {
      method: 'mpesa',
      phone: `+24381234${suffix}`,
    });
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
  /** Saisie minimale : les champs à valeur par défaut sont omis. */
  const claimSteps = (overrides: Record<string, unknown> = {}) => ({
    contact: {
      lastName: 'Kabongo',
      firstName: 'Mireille',
      phone: '+243812345678',
      plate: '4521AB01',
    },
    type: { type: 'accident' },
    whenWhere: { date: '2026-11-05', time: '18:30', province: 'kinshasa', commune: 'Ngaliema' },
    circumstances: {
      description: "À l'arrêt au feu rouge, un véhicule m'a percuté par l'arrière.",
    },
    damage: { zones: ['arriere_gauche', 'arriere'] },
    people: { injured: false },
    liability: {
      thirdPartyInvolved: true,
      thirdParty: { lastName: 'Mukendi', plate: '7810KC01', insurerName: 'Rawsur' },
    },
    documents: {},
    ...overrides,
  });

  async function declare(api: ApiClient, steps: Record<string, unknown>) {
    const draftId = await newDraft(api, 'claim');
    await saveSteps(api, draftId, steps);
    const claim = await api.call('submitClaim', { params: { draftId } });
    if (!claim.ok) throw new Error(claim.error.message);
    return claim.data;
  }

  it('déclare un accident et suit son statut', async () => {
    const { api, clock } = setup();
    const claim = await declare(api, claimSteps());
    expect(claim.status).toBe('declared');
    expect(claim.requiredDocuments.map((d) => d.code)).toEqual(
      expect.arrayContaining(['police_report', 'repair_quote', 'amicable_report']),
    );

    clock.t += 11_000;
    const later = await api.call('getClaim', { params: { claimId: claim.id } });
    expect(later.ok && later.data.status).toBe('received');
  });

  it('demande les pièces d’un vol (police, clés, carte rose)', async () => {
    const { api } = setup();
    const claim = await declare(api, claimSteps({ type: { type: 'vol' } }));
    expect(claim.requiredDocuments.map((d) => d.code)).toEqual(
      expect.arrayContaining(['police_report', 'keys', 'registration_card']),
    );
  });

  it('accepte une identification par n° de contrat sans plaque', async () => {
    const { api } = setup();
    const steps = claimSteps({
      contact: {
        lastName: 'Kabongo',
        firstName: 'Mireille',
        phone: '+243812345678',
        policyNumber: 'AUTO-2026-000001',
      },
    });
    await expect(declare(api, steps)).resolves.toBeDefined();
  });
});

describe('provinces et agences', () => {
  it('liste les 26 provinces avec la couverture SONAS', async () => {
    const { api } = setup();
    const result = await api.call('listProvinces', {});
    if (!result.ok) throw new Error();
    expect(result.data.items).toHaveLength(26);
    const covered = result.data.items.filter((p) => p.agencyCount > 0);
    expect(covered).toHaveLength(20);
    expect(result.data.items.find((p) => p.code === 'haut_katanga')?.agencyCount).toBe(10);
  });

  it('filtre les agences par province', async () => {
    const { api } = setup();
    const result = await api.call('listAgencies', { query: { province: 'nord_kivu' } });
    if (!result.ok) throw new Error();
    expect(result.data.items.map((a) => a.city).sort()).toEqual(['Beni', 'Butembo', 'Goma']);
  });

  it('trie par distance quand la position est connue', async () => {
    const { api } = setup();
    const result = await api.call('listAgencies', { query: { lat: -11.66, lng: 27.48 } });
    if (!result.ok) throw new Error();
    expect(result.data.items[0]?.city).toBe('Lubumbashi');
    expect(result.data.items[0]?.distanceKm).not.toBeNull();
  });
});
