import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { ApiError, CONTRACT_VERSION, type RouteDef, routes } from '../src';

/**
 * Génère openapi.json à partir du registre des routes.
 * Utile pour la documentation, l'application mobile (Expo) et les outils tiers.
 */

const toSchema = (schema: z.ZodType, io: 'input' | 'output') =>
  z.toJSONSchema(schema, { io, target: 'openapi-3.0', unrepresentable: 'any' });

const paths: Record<string, Record<string, unknown>> = {};

for (const [operationId, route] of Object.entries(routes) as [string, RouteDef][]) {
  const parameters: unknown[] = [];
  const addParams = (schema: z.ZodObject | undefined, location: 'path' | 'query' | 'header') => {
    if (!schema) return;
    for (const [name, field] of Object.entries(schema.shape)) {
      parameters.push({
        name,
        in: location,
        required: location === 'path' || !(field as z.ZodType).safeParse(undefined).success,
        schema: toSchema(field as z.ZodType, 'input'),
      });
    }
  };
  addParams(route.params, 'path');
  addParams(route.query, 'query');
  addParams(route.headers, 'header');

  const responses: Record<string, unknown> = {
    [route.success.status]: {
      description: 'Succès',
      content: { 'application/json': { schema: toSchema(route.success.schema, 'output') } },
    },
  };
  for (const status of route.errors) {
    responses[status] = {
      description: 'Erreur',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    };
  }

  const pathItem = paths[route.path] ?? {};
  paths[route.path] = pathItem;
  pathItem[route.method.toLowerCase()] = {
    operationId,
    summary: route.summary,
    tags: [route.tag],
    ...(route.public ? { security: [] } : {}),
    parameters,
    ...(route.body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: toSchema(route.body, 'input') } },
          },
        }
      : {}),
    responses,
  };
}

const document = {
  openapi: '3.0.3',
  info: {
    title: 'API myVign (SONAS)',
    version: CONTRACT_VERSION,
    description:
      'Contrat généré depuis packages/contracts/src/routes.ts. Ne pas modifier à la main.',
  },
  servers: [{ url: 'http://localhost:4010', description: 'Serveur simulé' }],
  paths,
  components: { schemas: { ApiError: toSchema(ApiError, 'output') } },
};

const out = resolve(import.meta.dirname, '..', 'openapi.json');
writeFileSync(out, `${JSON.stringify(document, null, 2)}\n`);
console.log(`OpenAPI écrit : ${out} (${Object.keys(routes).length} opérations)`);
