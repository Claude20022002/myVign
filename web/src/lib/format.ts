const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 1290000 -> "1 290 000 FC" (espaces insécables). */
export function fc(montant: number): string {
  return `${nf.format(Math.round(montant))} FC`;
}

export function nombre(n: number): string {
  return nf.format(n);
}

const df = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function dateLongue(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "" : df.format(d);
}

export function isoJour(d: Date = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function ajouterJours(iso: string, jours: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + jours);
  return isoJour(d);
}

export function ajouterMois(iso: string, mois: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + mois);
  d.setDate(d.getDate() - 1);
  return isoJour(d);
}

/** Âge en années révolues à partir d'une date ISO. */
export function age(isoNaissance: string): number {
  const n = new Date(isoNaissance);
  if (Number.isNaN(n.getTime())) return 0;
  const t = new Date();
  let a = t.getFullYear() - n.getFullYear();
  const m = t.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < n.getDate())) a--;
  return a;
}

/** Garde uniquement les 9 chiffres après +243. */
export function telNational(saisie: string): string {
  let d = saisie.replace(/\D/g, "");
  if (d.startsWith("243")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 9);
}

export function telAffiche(neufChiffres: string): string {
  const d = telNational(neufChiffres);
  if (!d) return "";
  return `+243 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`.trim();
}

export function telMasque(neufChiffres: string): string {
  const d = telNational(neufChiffres);
  return d.length === 9 ? `+243 ${d.slice(0, 2)} ••• •${d.slice(6, 7)}${d.slice(7)}` : "";
}

export function numeroDossier(prefixe: string): string {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `${prefixe}-${new Date().getFullYear()}-${n}`;
}
