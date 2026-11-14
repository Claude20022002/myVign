import type { Money, ProductCode } from "@myvign/contracts";

/**
 * Contenu éditorial des produits (le catalogue de l'API reste la source des formules et des prix).
 * « fromPrice » : prix d'appel INDICATIF de la démo, à remplacer par le barème SONAS.
 */
export type ProduitSite = {
  code: ProductCode;
  nom: string;
  accroche: string;
  mode: "en_ligne" | "bientot" | "rappel";
  lien?: string;
  aPartirDe?: Money;
  obligatoire?: boolean;
};

export const PRODUITS: ProduitSite[] = [
  {
    code: "auto",
    nom: "Assurance auto",
    accroche: "Responsabilité civile obligatoire, ou tous risques. Certificat immédiat.",
    mode: "en_ligne",
    lien: "/souscrire/auto",
    aPartirDe: { amount: 637_000_00, currency: "CDF" },
    obligatoire: true,
  },
  { code: "habitation", nom: "Assurance habitation", accroche: "Votre logement et vos biens, que vous soyez propriétaire ou locataire.", mode: "bientot" },
  { code: "incendie", nom: "Assurance incendie", accroche: "Obligatoire pour les bâtiments professionnels (art. 210).", mode: "bientot", obligatoire: true },
  { code: "voyage", nom: "Assurance voyage", accroche: "Frais médicaux et rapatriement, attestation pour le visa.", mode: "bientot" },
  { code: "scolaire", nom: "Assurance scolaire", accroche: "Vos enfants couverts toute l’année scolaire.", mode: "bientot" },
  { code: "transport", nom: "Assurance transport", accroche: "Marchandises, corps de bateaux, aviation.", mode: "rappel", obligatoire: true },
  { code: "entreprise", nom: "Assurance entreprise", accroche: "Multirisque, responsabilité civile, chantiers.", mode: "rappel" },
];
