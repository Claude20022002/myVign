export * from './agencies';
export * from './appointments';
export * from './callbacks';
export * from './catalog';
export * from './claims';
export * from './common';
export * from './drafts';
export * from './exchange';
export * from './payments';
export * from './policies';
export * from './products/auto';
export * from './products/auto-claim';
export * from './quotes';
export { type RouteDef, type RouteKey, type Routes, routes } from './routes';
export * from './steps';
export * from './vehicles';

/** Version du contrat : à incrémenter à chaque changement (voir docs/coordination/CONTRACT_CHANGES.md). */
export const CONTRACT_VERSION = '1.3.0';
