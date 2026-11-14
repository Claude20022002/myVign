import { AGENCY_SEED, type AgencySeed, PROVINCES, type ProvinceCode } from "@myvign/geo";

/** Compare sans accents ni casse (« Mbuji-Mayi » = « mbuji mayi »). */
export function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[\s-]+/g, " ").trim();
}

export function slugVille(ville: string) {
  return fold(ville).replace(/\s+/g, "-");
}

export type Ville = { province: ProvinceCode; ville: string; slug: string; agences: AgencySeed[] };

/** Villes ayant au moins une agence : une page « Assurance {ville} » chacune (référencement local). */
export const VILLES: Ville[] = (() => {
  const m = new Map<string, Ville>();
  for (const a of AGENCY_SEED) {
    const cle = `${a.province}/${slugVille(a.city)}`;
    const v = m.get(cle) ?? { province: a.province, ville: a.city, slug: slugVille(a.city), agences: [] };
    v.agences.push(a);
    m.set(cle, v);
  }
  return [...m.values()].sort((a, b) => a.ville.localeCompare(b.ville, "fr"));
})();

export const nomProvince = (p: ProvinceCode) => PROVINCES[p].name;
