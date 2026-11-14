// Référentiels RDC (voir docs/recherche_formulaires_rdc.md, §2)

export const PROVINCES = [
  "Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Mai-Ndombe", "Kasaï", "Kasaï-Central",
  "Kasaï-Oriental", "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Ituri",
  "Haut-Uele", "Bas-Uele", "Tshopo", "Nord-Ubangi", "Sud-Ubangi", "Mongala", "Équateur",
  "Tshuapa", "Tanganyika", "Haut-Lomami", "Lualaba", "Haut-Katanga",
] as const;

export const COMMUNES_KINSHASA = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vubu", "Kimbanseke", "Kinshasa",
  "Kintambo", "Kisenso", "Lemba", "Limete", "Lingwala", "Makala", "Maluku", "Masina", "Matete",
  "Mont-Ngafula", "Ndjili", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao",
] as const;

export const PIECES_IDENTITE = [
  { value: "electeur", label: "Carte d'électeur" },
  { value: "passeport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "cni", label: "Carte d'identité nationale" },
  { value: "sejour", label: "Carte de résident (étranger)" },
] as const;

export const PROFESSIONS = [
  "Commerçant(e)", "Fonctionnaire", "Employé(e) du privé", "Cadre", "Enseignant(e)",
  "Profession de santé", "Chauffeur", "Entrepreneur(e)", "Profession libérale", "Étudiant(e)",
  "Retraité(e)", "Sans activité", "Autre",
] as const;

export const CATEGORIES_PERMIS = ["A (moto)", "B (voiture)", "C (poids lourd)", "D (transport de personnes)", "E (remorque)"] as const;

/** Préfixes indicatifs : la portabilité existe, on ne bloque jamais sur ce critère. */
export function operateurDepuisTel(neufChiffres: string): "mpesa" | "orange" | "airtel" | "afrimoney" | null {
  const p = neufChiffres.slice(0, 2);
  if (["81", "82", "83"].includes(p)) return "mpesa";
  if (["80", "84", "85", "89"].includes(p)) return "orange";
  if (["97", "98", "99"].includes(p)) return "airtel";
  if (["90", "91"].includes(p)) return "afrimoney";
  return null;
}

export const OPERATEURS = {
  mpesa: { nom: "M-Pesa", sous: "Vodacom, validation par code PIN" },
  orange: { nom: "Orange Money", sous: "Validation par code PIN" },
  airtel: { nom: "Airtel Money", sous: "Validation par code PIN" },
  afrimoney: { nom: "Afrimoney", sous: "Africell, validation par code PIN" },
} as const;

export const SONAS = {
  nom: "SONAS SA",
  agrement: "12007",
  adresse: "6664, Imm. Sankuru, bd du 30 Juin, Gombe, Kinshasa",
  telInfo: "+243 840 393 642",
  telSinistre: "+243 81 641 5515",
  email: "sonas@sonas.cd",
} as const;
