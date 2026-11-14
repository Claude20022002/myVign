// Référentiel local simplifié (démo). En production : liste maintenue avec la SONAS,
// éventuellement complétée par un accès DGI si une convention le permet.

export type CategorieVehicule = "particulier" | "suv" | "utilitaire" | "moto" | "minibus" | "camion";

export const CATEGORIES: { value: CategorieVehicule; label: string; sous: string }[] = [
  { value: "particulier", label: "Voiture particulière", sous: "Berline, citadine, break" },
  { value: "suv", label: "4×4, SUV ou pick-up", sous: "Jeep, Land Cruiser, Hilux…" },
  { value: "utilitaire", label: "Utilitaire léger", sous: "Fourgonnette, camionnette" },
  { value: "moto", label: "Moto ou tricycle", sous: "Y compris moto-taxi" },
  { value: "minibus", label: "Minibus ou bus", sous: "Transport de personnes" },
  { value: "camion", label: "Camion", sous: "Plus de 3,5 tonnes" },
];

export type Modele = { marque: string; modele: string; categorie: CategorieVehicule; cv: number; places: number; energie: string };

export const MODELES: Modele[] = [
  { marque: "Toyota", modele: "Corolla", categorie: "particulier", cv: 8, places: 5, energie: "Essence" },
  { marque: "Toyota", modele: "RAV4", categorie: "suv", cv: 11, places: 5, energie: "Essence" },
  { marque: "Toyota", modele: "Land Cruiser Prado", categorie: "suv", cv: 15, places: 7, energie: "Diesel" },
  { marque: "Toyota", modele: "Hilux", categorie: "suv", cv: 14, places: 5, energie: "Diesel" },
  { marque: "Toyota", modele: "HiAce", categorie: "minibus", cv: 13, places: 15, energie: "Diesel" },
  { marque: "Toyota", modele: "Ist", categorie: "particulier", cv: 7, places: 5, energie: "Essence" },
  { marque: "Nissan", modele: "X-Trail", categorie: "suv", cv: 11, places: 5, energie: "Essence" },
  { marque: "Nissan", modele: "Navara", categorie: "suv", cv: 13, places: 5, energie: "Diesel" },
  { marque: "Hyundai", modele: "Tucson", categorie: "suv", cv: 10, places: 5, energie: "Essence" },
  { marque: "Hyundai", modele: "i10", categorie: "particulier", cv: 5, places: 5, energie: "Essence" },
  { marque: "Kia", modele: "Sportage", categorie: "suv", cv: 10, places: 5, energie: "Essence" },
  { marque: "Mitsubishi", modele: "Pajero", categorie: "suv", cv: 14, places: 7, energie: "Diesel" },
  { marque: "Mercedes-Benz", modele: "Classe C", categorie: "particulier", cv: 11, places: 5, energie: "Essence" },
  { marque: "Peugeot", modele: "208", categorie: "particulier", cv: 6, places: 5, energie: "Essence" },
  { marque: "Suzuki", modele: "Swift", categorie: "particulier", cv: 6, places: 5, energie: "Essence" },
  { marque: "Isuzu", modele: "D-Max", categorie: "suv", cv: 13, places: 5, energie: "Diesel" },
  { marque: "Bajaj", modele: "Boxer", categorie: "moto", cv: 2, places: 2, energie: "Essence" },
  { marque: "TVS", modele: "HLX 125", categorie: "moto", cv: 2, places: 2, energie: "Essence" },
  { marque: "Haojue", modele: "HJ125", categorie: "moto", cv: 2, places: 2, energie: "Essence" },
  { marque: "Mercedes-Benz", modele: "Actros", categorie: "camion", cv: 30, places: 2, energie: "Diesel" },
];

export const MARQUES = Array.from(new Set(MODELES.map((m) => m.marque))).sort();

/** Plaques de démonstration : simule la recherche dans un fichier d'immatriculation. */
const PLAQUES_DEMO: Record<string, { modele: Modele; annee: number; miseEnCirculation: string }> = {
  "4521AB01": { modele: MODELES.find((m) => m.modele === "208")!, annee: 2021, miseEnCirculation: "2021-03" },
  "1234KN01": { modele: MODELES.find((m) => m.modele === "Land Cruiser Prado")!, annee: 2019, miseEnCirculation: "2019-07" },
  "7788BC04": { modele: MODELES.find((m) => m.modele === "Hilux")!, annee: 2022, miseEnCirculation: "2022-01" },
  "3030MT01": { modele: MODELES.find((m) => m.modele === "Boxer")!, annee: 2024, miseEnCirculation: "2024-02" },
};

export const PLAQUES_EXEMPLES = ["4521AB 01", "1234KN 01", "7788BC 04", "3030MT 01"];

export function normaliserPlaque(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Format accepté : 4 chiffres, 2 lettres, 2 chiffres (province). Ancien et nouveau formats tolérés. */
export function plaqueValide(s: string): boolean {
  return /^\d{4}[A-Z]{2}\d{2}$/.test(normaliserPlaque(s));
}

export function formaterPlaque(s: string): string {
  const n = normaliserPlaque(s);
  return n.length > 6 ? `${n.slice(0, 6)} ${n.slice(6, 8)}` : n;
}

export async function rechercherPlaque(s: string) {
  await new Promise((r) => setTimeout(r, 700)); // latence réseau simulée
  return PLAQUES_DEMO[normaliserPlaque(s)] ?? null;
}
