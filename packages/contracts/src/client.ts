import type { z } from 'zod';
import { ApiError } from './common';
import { type RouteDef, type RouteKey, type Routes, routes } from './routes';

type InputOf<R> = (R extends { params: infer P extends z.ZodType }
  ? { params: z.input<P> }
  : { params?: never }) &
  (R extends { query: infer Q extends z.ZodType } ? { query: z.input<Q> } : { query?: never }) &
  (R extends { body: infer B extends z.ZodType } ? { body: z.input<B> } : { body?: never }) &
  (R extends { headers: infer H extends z.ZodType }
    ? { headers: z.input<H> }
    : { headers?: Record<string, string> });

type OutputOf<R> = R extends { success: { schema: infer S extends z.ZodType } }
  ? z.output<S>
  : never;

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError['error'] };

export interface ApiClientOptions {
  /** URL de l'API (côté serveur Next.js uniquement : le navigateur ne parle jamais à l'API). */
  baseUrl: string;
  fetch?: typeof fetch;
  /** En-têtes ajoutés à chaque appel (traçage, jeton de service…). */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Valide les réponses avec le schéma Zod (recommandé en dev et en test). */
  validateResponses?: boolean;
  timeoutMs?: number;
}

export function buildPath(path: string, params?: Record<string, unknown>): string {
  return path.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params?.[name];
    if (value === undefined || value === null) throw new Error(`Paramètre manquant : ${name}`);
    return encodeURIComponent(String(value));
  });
}

function toQueryString(query?: Record<string, unknown>): string {
  if (!query) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Client typé généré à partir du registre des routes.
 * Exemple : `await api.call('getDraft', { params: { draftId } })`.
 * Ne lève jamais d'exception pour une erreur HTTP : renvoie `{ ok: false, error }`,
 * dont le `code` choisit l'écran d'erreur (E1 à E6 de la maquette).
 */
export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? fetch;

  async function call<K extends RouteKey>(
    key: K,
    input: InputOf<Routes[K]>,
  ): Promise<ApiResult<OutputOf<Routes[K]>>> {
    const route: RouteDef = routes[key];
    const { params, query, body, headers } = input as {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
    };
    const url = `${options.baseUrl.replace(/\/$/, '')}${buildPath(route.path, params)}${toQueryString(query)}`;
    const extra = (await options.headers?.()) ?? {};

    let response: Response;
    try {
      response = await doFetch(url, {
        method: route.method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...extra,
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
    } catch {
      return {
        ok: false,
        status: 0,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service injoignable' },
      };
    }

    const payload: unknown = await response.json().catch(() => null);

    if (response.status !== route.success.status) {
      const parsed = ApiError.safeParse(payload);
      return {
        ok: false,
        status: response.status,
        error: parsed.success
          ? parsed.data.error
          : { code: 'INTERNAL_ERROR', message: `Réponse inattendue (${response.status})` },
      };
    }

    if (options.validateResponses) {
      const parsed = route.success.schema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          `Réponse non conforme au contrat pour ${String(key)} : ${parsed.error.message}`,
        );
      }
      return { ok: true, status: response.status, data: parsed.data as OutputOf<Routes[K]> };
    }
    return { ok: true, status: response.status, data: payload as OutputOf<Routes[K]> };
  }

  return { call };
}

export type ApiClient = ReturnType<typeof createApiClient>;
