// Moteur de tarif SIMULÉ pour la démo. Les vrais barèmes viendront de la SONAS
// (critères relevés sur sonas.cd : puissance fiscale, vétusté, année, usage, places).

import { age } from "./format";

export type FormuleAuto = "tiers" | "tiers-etendu" | "tous-risques";
export type Usage = "prive" | "domicile-travail" | "professionnel" | "taxi";

export type DonneesTarifAuto = {
  categorie?: string;
  cv?: number;
  places?: number;
  annee?: number;
  valeur?: number;
  usage?: Usage;
  km?: number;
  naissance?: string;
  permisDepuis?: string; // AAAA-MM
  sinistres?: "0" | "1" | "2";
  formule?: FormuleAuto;
  franchise?: "standard" | "majoree" | "rachat";
  occupant?: boolean;
  carteJaune?: boolean;
  duree?: "12" | "6" | "3";
};

function baseRC(d: DonneesTarifAuto): number {
  if (d.categorie === "moto") return 95_000;
  const cv = d.cv ?? 8;
  let base = cv <= 5 ? 175_000 : cv <= 7 ? 215_000 : cv <= 10 ? 265_000 : cv <= 14 ? 340_000 : 440_000;
  if (d.categorie === "camion") base *= 1.9;
  if (d.categorie === "minibus") base *= 1.5;
  const placesSup = Math.max(0, (d.places ?? 5) - 5);
  return base + placesSup * 14_000;
}

function coefficient(d: DonneesTarifAuto): number {
  let c = 1;
  c *= { prive: 1, "domicile-travail": 1.08, professionnel: 1.25, taxi: 1.75 }[d.usage ?? "prive"];
  if (d.naissance && age(d.naissance) < 25) c *= 1.25;
  if (d.permisDepuis) {
    const ans = new Date().getFullYear() - Number(d.permisDepuis.slice(0, 4));
    if (ans < 2) c *= 1.2;
  }
  c *= { "0": 1, "1": 1.15, "2": 1.35 }[d.sinistres ?? "0"];
  if ((d.km ?? 12_000) < 7_000) c *= 0.95;
  return c;
}

export function prixFormule(d: DonneesTarifAuto, formule: FormuleAuto): number {
  const rc = baseRC(d) * coefficient(d);
  const valeur = d.valeur && d.valeur > 0 ? d.valeur : 25_000_000;
  const vetuste = d.annee ? Math.max(0.55, 1 - (new Date().getFullYear() - d.annee) * 0.05) : 1;
  let total = rc;
  if (formule === "tiers-etendu") total += valeur * vetuste * 0.012;
  if (formule === "tous-risques") {
    let dommages = valeur * vetuste * 0.032;
    if (d.franchise === "majoree") dommages *= 0.85;
    if (d.franchise === "rachat") dommages *= 1.2; // rachat = 20 % de la prime pure (sonas.cd)
    total += valeur * vetuste * 0.012 + dommages;
  }
  return total;
}

export function prixAuto(d: DonneesTarifAuto): number | null {
  if (!d.categorie || !d.usage) return null;
  let total = prixFormule(d, d.formule ?? "tiers");
  if (d.occupant) total += 35_000;
  if (d.carteJaune) total += 60_000;
  const ratio = { "12": 1, "6": 0.58, "3": 0.32 }[d.duree ?? "12"];
  return Math.round((total * ratio) / 1000) * 1000;
}

// ---------- Habitation ----------
export type FormuleHabitation = "essentielle" | "confort" | "premium";

export type DonneesTarifHabitation = {
  statut?: string;
  type?: string;
  pieces?: number;
  valeurBatiment?: number;
  loyer?: number;
  valeurContenu?: number;
  materiaux?: string;
  sinistres?: "0" | "1" | "2";
  formule?: FormuleHabitation;
  options?: string[];
};

export function prixHabitationFormule(d: DonneesTarifHabitation, f: FormuleHabitation): number {
  const proprio = d.statut === "proprietaire" || d.statut === "bailleur";
  const assiette = proprio ? (d.valeurBatiment ?? 60_000_000) * 0.0022 : (d.loyer ?? 400_000) * 12 * 0.035;
  const contenu = (d.valeurContenu ?? 8_000_000) * 0.006;
  let base = 90_000 + assiette + contenu + (d.pieces ?? 3) * 9_000;
  base *= { dur: 1, "semi-dur": 1.15, leger: 1.4 }[(d.materiaux as "dur") ?? "dur"] ?? 1;
  base *= { "0": 1, "1": 1.12, "2": 1.3 }[d.sinistres ?? "0"];
  return base * { essentielle: 1, confort: 1.45, premium: 2.05 }[f];
}

export function prixHabitation(d: DonneesTarifHabitation): number | null {
  if (!d.statut) return null;
  let total = prixHabitationFormule(d, d.formule ?? "confort");
  total += (d.options?.length ?? 0) * 28_000;
  return Math.round(total / 1000) * 1000;
}
