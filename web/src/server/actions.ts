"use server";

/*
 * Server Actions : la seule porte entre le navigateur et l'API.
 * Chaque action est un point d'entrée public (POST) : entrées non fiables, validées ici
 * a minima puis par les schémas du contrat côté API.
 */

import { randomUUID } from "node:crypto";
import type { Certificate, Currency, Draft, PaymentMethod, Policy } from "@myvign/contracts";
import { cookies } from "next/headers";
import { api, type Resultat, versResultat } from "./api";

type Parcours = "souscription" | "sinistre";

const COOKIE: Record<Parcours, string> = {
  souscription: "myvign_brouillon_auto",
  sinistre: "myvign_sinistre_auto",
};

const SOIXANTE_JOURS = 60 * 24 * 60 * 60;

async function lireBrouillon(parcours: Parcours) {
  return (await cookies()).get(COOKIE[parcours])?.value;
}

async function ecrireBrouillon(parcours: Parcours, id: string) {
  (await cookies()).set(COOKIE[parcours], id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SOIXANTE_JOURS,
  });
}

async function nouveauBrouillon(parcours: Parcours) {
  const cree = await api.call("createDraft", {
    body: { kind: parcours === "souscription" ? "subscription" : "claim", product: "auto" },
  });
  if (cree.ok) await ecrireBrouillon(parcours, cree.data.id);
  return cree;
}

const texte = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Enregistre un bloc du parcours. Si le brouillon serveur a disparu (expiré, serveur redémarré),
 * on en crée un nouveau et on rejoue les blocs déjà saisis : le client ne perd rien.
 */
export async function enregistrerBloc(
  parcours: Parcours,
  bloc: string,
  valeurs: Record<string, unknown>,
  dejaSaisis: Record<string, Record<string, unknown>> = {},
): Promise<Resultat<Draft>> {
  let id = await lireBrouillon(parcours);
  if (!id) {
    const cree = await nouveauBrouillon(parcours);
    if (!cree.ok) return versResultat(cree);
    id = cree.data.id;
  }
  const sauver = (draftId: string, step: string, values: Record<string, unknown>) =>
    api.call("saveDraftStep", { params: { draftId, step: texte(step, 40) }, body: { values } });

  let r = await sauver(id, bloc, valeurs);
  if (!r.ok && (r.error.code === "NOT_FOUND" || r.error.code === "DRAFT_EXPIRED")) {
    const cree = await nouveauBrouillon(parcours);
    if (!cree.ok) return versResultat(cree);
    for (const [etape, vals] of Object.entries(dejaSaisis)) {
      if (etape !== bloc) await sauver(cree.data.id, etape, vals);
    }
    r = await sauver(cree.data.id, bloc, valeurs);
  }
  return versResultat(r);
}

export async function oublierParcours(parcours: Parcours) {
  (await cookies()).delete(COOKIE[parcours]);
}

export async function rechercherVehicule(plaque: string) {
  return versResultat(await api.call("lookupVehicle", { query: { plate: texte(plaque, 20) } }));
}

export async function calculerDevis() {
  const id = await lireBrouillon("souscription");
  if (!id) return { ok: false, code: "DRAFT_EXPIRED", message: "Dossier introuvable" } as Resultat<never>;
  return versResultat(await api.call("createQuote", { params: { draftId: id } }));
}

const MOYENS: readonly PaymentMethod[] = ["mpesa", "orange_money", "airtel_money", "afrimoney", "card", "agency"];

export async function lancerPaiement(entree: { methode: PaymentMethod; telephone?: string; devise: Currency }) {
  const id = await lireBrouillon("souscription");
  if (!id) return { ok: false, code: "DRAFT_EXPIRED", message: "Dossier introuvable" } as Resultat<never>;
  if (!MOYENS.includes(entree.methode)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Moyen de paiement inconnu" } as Resultat<never>;
  }
  const currency: Currency = entree.devise === "USD" ? "USD" : "CDF";
  const methode = entree.methode;
  const body =
    methode === "card"
      ? { method: "card" as const, currency }
      : methode === "agency"
        ? { method: "agency" as const, currency }
        : { method: methode, phone: texte(entree.telephone, 20), currency };
  return versResultat(
    await api.call("createPayment", {
      params: { draftId: id },
      // Une clé par tentative : un double clic ne débite jamais deux fois.
      headers: { "idempotency-key": randomUUID() },
      body,
    }),
  );
}

export async function suivrePaiement(paymentId: string) {
  return versResultat(await api.call("getPayment", { params: { paymentId: texte(paymentId, 64) } }));
}

export async function obtenirContrat(
  policyId: string,
): Promise<Resultat<{ contrat: Policy; certificat: Certificate }>> {
  const [contrat, certificat] = await Promise.all([
    api.call("getPolicy", { params: { policyId: texte(policyId, 64) } }),
    api.call("getCertificate", { params: { policyId: texte(policyId, 64) } }),
  ]);
  if (!contrat.ok) return versResultat(contrat);
  if (!certificat.ok) return versResultat(certificat);
  await oublierParcours("souscription");
  return { ok: true, data: { contrat: contrat.data, certificat: certificat.data } };
}

export async function envoyerDeclaration() {
  const id = await lireBrouillon("sinistre");
  if (!id) return { ok: false, code: "DRAFT_EXPIRED", message: "Déclaration introuvable" } as Resultat<never>;
  const r = await api.call("submitClaim", { params: { draftId: id } });
  if (r.ok) await oublierParcours("sinistre");
  return versResultat(r);
}

export async function rechercherSinistre(numero: string, telephone: string) {
  return versResultat(
    await api.call("lookupClaim", { query: { number: texte(numero, 40), phone: texte(telephone, 20) } }),
  );
}

export async function tauxDuJour() {
  return versResultat(await api.call("getExchangeRate", {}));
}

export async function demanderRappel(entree: { telephone: string; creneau: string; sujet: string }) {
  return versResultat(
    await api.call("createCallback", {
      body: {
        phone: texte(entree.telephone, 20),
        slotId: texte(entree.creneau, 40),
        subject: texte(entree.sujet, 120) || "Question générale",
        context: null,
      },
    }),
  );
}

export async function creneauxRendezVous(agence: string) {
  return versResultat(
    await api.call("listAppointmentSlots", { params: { slug: texte(agence, 120) }, query: {} }),
  );
}

export async function prendreRendezVous(entree: {
  agence: string;
  creneau: string;
  prenom: string;
  nom: string;
  telephone: string;
}) {
  return versResultat(
    await api.call("createAppointment", {
      body: {
        agencySlug: texte(entree.agence, 120),
        slotId: texte(entree.creneau, 200),
        firstName: texte(entree.prenom, 80),
        lastName: texte(entree.nom, 80),
        phone: texte(entree.telephone, 20),
      },
    }),
  );
}

/*
 * Back-office de DÉMONSTRATION : non authentifié.
 * En production (phase 6) : application séparée, session agent + double authentification + rôles.
 */
export async function listerSinistresGestion() {
  return versResultat(await api.call("backofficeListClaims", {}));
}

export async function faireAvancerSinistre(entree: {
  id: string;
  statut: string;
  message?: string;
  motif?: string;
}) {
  return versResultat(
    await api.call("backofficeTransitionClaim", {
      params: { claimId: texte(entree.id, 64) },
      body: {
        status: entree.statut as never,
        message: entree.message ? texte(entree.message, 300) : null,
        reason: entree.motif ? texte(entree.motif, 300) : null,
      },
    }),
  );
}

export async function sinistreParId(id: string) {
  return versResultat(await api.call("getClaim", { params: { claimId: texte(id, 64) } }));
}
