// Persistance de démonstration dans le navigateur (localStorage). Rien n'est envoyé.

export type Attestation = {
  numero: string;
  contrat: string;
  produit: "auto" | "habitation";
  souscripteur: string;
  profession?: string;
  adresse: string;
  objet: string; // véhicule ou logement
  formule: string;
  debut: string;
  fin: string;
  montant: number;
  moyen: string;
  telephone: string;
  creeLe: string;
};

export type EtapeSuivi = { cle: string; titre: string; detail: string; date?: string };

export type Dossier = {
  numero: string;
  type: "sinistre-auto" | "sinistre-habitation" | "souscription-auto" | "souscription-habitation";
  telephone: string;
  resume: string;
  creeLe: string;
  etape: number;
  etapes: EtapeSuivi[];
  pieces: string[];
};

const CLE_ATT = "myvign.attestations";
const CLE_DOS = "myvign.dossiers";

function lire<T>(cle: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(cle) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function ecrire<T>(cle: string, v: T[]) {
  window.localStorage.setItem(cle, JSON.stringify(v));
}

export function enregistrerAttestation(a: Attestation) {
  ecrire(CLE_ATT, [a, ...lire<Attestation>(CLE_ATT).filter((x) => x.numero !== a.numero)]);
}

/** Attestations fictives toujours présentes, pour tester la vérification sans souscrire. */
const ATTESTATIONS_DEMO: Attestation[] = [
  {
    numero: "CA-2026-48213",
    contrat: "AUTO-2026-48213",
    produit: "auto",
    souscripteur: "Mireille Kabongo",
    profession: "Commerçante",
    adresse: "24, av. Colonel Mondjiba, Ngaliema, Kinshasa",
    objet: "Peugeot 208, plaque 4521AB 01",
    formule: "Tous risques",
    debut: "2026-11-07",
    fin: "2027-11-06",
    montant: 1_290_000,
    moyen: "M-Pesa",
    telephone: "812345678",
    creeLe: "2026-11-07T10:42:00",
  },
];

export function trouverAttestation(saisie: string): Attestation | null {
  const q = saisie.toUpperCase().replace(/\s/g, "");
  const toutes = [...lire<Attestation>(CLE_ATT), ...ATTESTATIONS_DEMO];
  return (
    toutes.find(
      (a) =>
        a.numero.replace(/\s/g, "") === q ||
        a.contrat.replace(/\s/g, "") === q ||
        a.objet.toUpperCase().replace(/\s/g, "").includes(q.length >= 8 ? q : "§"),
    ) ?? null
  );
}

export function enregistrerDossier(d: Dossier) {
  ecrire(CLE_DOS, [d, ...lire<Dossier>(CLE_DOS).filter((x) => x.numero !== d.numero)]);
}

export function listerDossiers(): Dossier[] {
  return lire<Dossier>(CLE_DOS);
}

export function trouverDossier(numero: string, tel: string): Dossier | null {
  const n = numero.toUpperCase().replace(/\s/g, "");
  const t = tel.replace(/\D/g, "").slice(-9);
  return lire<Dossier>(CLE_DOS).find((d) => d.numero.replace(/\s/g, "") === n && (!t || d.telephone === t)) ?? null;
}

export function avancerDossier(numero: string): Dossier | null {
  const tous = lire<Dossier>(CLE_DOS);
  const d = tous.find((x) => x.numero === numero);
  if (!d) return null;
  if (d.etape < d.etapes.length - 1) {
    d.etape += 1;
    d.etapes[d.etape].date = new Date().toISOString();
  }
  ecrire(CLE_DOS, tous);
  return d;
}

export function etapesSinistre(): EtapeSuivi[] {
  return [
    { cle: "recue", titre: "Déclaration reçue", detail: "Votre dossier est enregistré." },
    { cle: "appel", titre: "Appel de votre gestionnaire", detail: "Sous 24 h ouvrées, pour compléter avec vous." },
    { cle: "pieces", titre: "Pièces vérifiées", detail: "Le dossier est complet." },
    { cle: "expertise", titre: "Expertise", detail: "Évaluation des dégâts, sur place ou sur photos." },
    { cle: "offre", titre: "Offre d'indemnisation", detail: "Au plus tard 3 mois après le dossier complet." },
    { cle: "paiement", titre: "Paiement", detail: "Sur votre compte mobile money ou bancaire." },
  ];
}
