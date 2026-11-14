# @myvign/contracts

Contrat d'API de myVign : **source unique de vérité** entre le front (`web/`), l'API (`apps/api`) et la future application mobile.

| Fichier | Rôle |
|---|---|
| `src/routes.ts` | Registre des 24 routes `/v1` : méthode, chemin, schémas d'entrée et de sortie, statuts d'erreur |
| `src/products/auto.ts` | Souscription auto en 6 blocs, **prix après les 3 premiers**, valeurs par défaut partout où c'est possible |
| `src/exchange.ts` | Taux du jour USD → CDF et `convertMoney()` (même calcul côté front et côté API) |
| `src/products/auto-claim.ts` | Blocs de la déclaration de sinistre auto (§3.4) |
| `src/steps.ts` | Registre des parcours : ajouter une branche = une entrée ici |
| `src/client.ts` | Client typé (côté serveur Next.js uniquement) |
| `mock/` | Serveur simulé qui implémente tout le contrat (`pnpm mock`, port 4010) |
| `test/` | Parcours complet et cas d'erreur, joués contre le mock |

## Utiliser le client (dans un composant serveur ou une Server Action)
```ts
import { createApiClient } from '@myvign/contracts/client';

const api = createApiClient({ baseUrl: process.env.API_URL!, validateResponses: process.env.NODE_ENV !== 'production' });

const result = await api.call('saveDraftStep', {
  params: { draftId, step: 'vehicle' },
  body: { values: formValues },
});
if (!result.ok) {
  // result.error.code choisit l'écran : VALIDATION_FAILED (+ fields), VEHICLE_NOT_FOUND, PAYMENT_REFUSED…
}
```
Valider un formulaire dans le navigateur avec **le même schéma** que l'API :
```ts
import { AutoSteps } from '@myvign/contracts';
const check = AutoSteps.vehicle.safeParse(values); // erreurs par champ dans check.error.issues
```

## Scénarios du serveur simulé (maquette, cas E1 à E6)
| Déclencheur | Résultat |
|---|---|
| Plaque au mauvais format (`4521A`) | 422 `VALIDATION_FAILED` (E1) |
| Plaque commençant par `0000` | 404 `VEHICLE_NOT_FOUND` (E2) |
| Plaque `4521AB01` | Peugeot 208 de la maquette ; toute autre plaque valide → Toyota Corolla |
| Téléphone de paiement finissant par `0001` | paiement `failed` (E3) |
| … par `0002` | paiement `expired` (E4) |
| … par `0003` | paiement `verifying` (E5), aucune couverture |
| Autre numéro | `pending` puis `succeeded` après `MOCK_PAYMENT_DELAY_MS` (5 s), contrat + certificat provisoire |
| Paiement `agency` | référence `PAG-…`, reste `pending` (confirmation par un agent) |
| En-tête `x-mock-scenario: technical-error` | 500 sur toute route (E6) |
| En-tête `x-mock-scenario: rate-limited` / `slow` | 429 / +3 s |
| Brouillon `draft_expired` | 410 `DRAFT_EXPIRED` |
| Sinistre déclaré | passe `received` 10 s plus tard |
| `currency: 'USD'` au paiement | montant converti au taux simulé, taux figé dans `exchange` |

Variables : `MOCK_PORT` (4010), `MOCK_USD_CDF_RATE` (2850), `MOCK_LATENCY_MS` (300), `MOCK_PAYMENT_DELAY_MS` (5000), `MOCK_WEB_URL` (http://localhost:3000, lien du QR).

**Toute réponse du mock est validée par le schéma du contrat** : le mock ne peut pas diverger de ce que l'API réelle devra renvoyer.

## Faire évoluer le contrat
1. Modifier les schémas, incrémenter `CONTRACT_VERSION` (`src/index.ts`) et `version` (`package.json`).
2. Adapter le mock et les tests (`pnpm --filter @myvign/contracts test`).
3. Noter le changement dans `docs/coordination/CONTRACT_CHANGES.md` (additif ou cassant).

Le tarif du mock est **factice** (`mock/pricing.ts`) : le vrai barème vivra dans `packages/domain`.
