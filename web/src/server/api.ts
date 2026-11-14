import { createApiClient, type ApiResult } from "@myvign/contracts/client";

/**
 * Client de l'API myVign, utilisé UNIQUEMENT côté serveur (Server Actions, composants serveur).
 * Le navigateur ne parle jamais à l'API (CLAUDE.md, règle 4).
 * En démo, API_URL pointe vers le serveur simulé (`pnpm mock`, port 4010).
 */
export const api = createApiClient({
  baseUrl: process.env.API_URL ?? "http://localhost:4010",
  validateResponses: process.env.NODE_ENV !== "production",
  timeoutMs: 10_000,
});

/** Résultat simplifié renvoyé aux composants client : sérialisable, sans détail interne. */
export type Resultat<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; champs?: Record<string, string> };

export function versResultat<T>(r: ApiResult<T>): Resultat<T> {
  if (r.ok) return { ok: true, data: r.data };
  const champs = r.error.fields
    ? Object.fromEntries(Object.entries(r.error.fields).map(([k, v]) => [k, v[0] ?? "À corriger"]))
    : undefined;
  return { ok: false, code: r.error.code, message: r.error.message, ...(champs ? { champs } : {}) };
}

/** Erreur « technique » : on bascule sur la page d'erreur (cas E6 de la maquette). */
export function estPanne(code: string): boolean {
  return code === "INTERNAL_ERROR" || code === "SERVICE_UNAVAILABLE";
}
