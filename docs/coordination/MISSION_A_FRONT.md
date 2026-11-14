# Mission A : expérience front

> Fiche autonome : un agent qui démarre sans contexte doit pouvoir travailler à partir d'ici.
> Lire aussi [CLAUDE.md](../../CLAUDE.md) (règles communes) et [STATUS.md](STATUS.md) (état courant).

## Contexte en 5 lignes
- La SONAS (assureur public, RDC) n'a aucun parcours en ligne. myVign permet de souscrire (auto d'abord), payer en mobile money, recevoir un certificat PDF + QR, déclarer et suivre un sinistre, trouver une agence.
- Les utilisateurs sont souvent sur **Android d'entrée de gamme et réseau 3G** : le site doit être léger et rapide.
- Règles métier : [docs/recherche_formulaires_rdc.md](../recherche_formulaires_rdc.md) (fait foi). Charte : [DESIGN.md](../../DESIGN.md) (fait foi). Ergonomie de référence : macif.fr / agences.macif.fr.
- Maquette (parcours et cas d'erreur E1 à E6) : [docs/Sonas - troisieme version.pdf](../Sonas%20-%20troisieme%20version.pdf). Benchmark : [docs/benchmark_concurrents.md](../benchmark_concurrents.md).
- Ce que personne ne fait en RDC et qui nous différencie : parcours complet devis → paiement → certificat, **prix affichés**, suivi de sinistre par statuts, localisateur d'agences soigné.

## Ton périmètre (toi seul le modifies)
`web/` · futur `backoffice/` · `e2e/` · `DESIGN.md` · `docs/design/` · `docs/readme/`.
**Tu ne modifies pas** : `packages/*` (sauf `packages/contracts` via la procédure de changement), `apps/*`, `infra/`, les fichiers racine. Besoin d'un changement là ? Écris-le dans `STATUS.md`.

## Pile technique (déjà en place dans `web/`)
Next.js 16 (App Router, React 19, Server Components) · Tailwind CSS 4 · TypeScript. Ajouts prévus :
- **next-intl** (français d'abord, lingala/swahili ensuite) ;
- **Serwist** (PWA : coque en cache, brouillon conservé hors ligne) ;
- **MapLibre GL + OpenStreetMap** pour la carte des agences (chargée seulement sur cette page) ;
- primitives accessibles (Radix / shadcn) si besoin, sans bibliothèque d'interface lourde.

## Architecture à respecter
- **BFF** : le navigateur ne parle jamais à l'API. Les composants serveur et les Server Actions de `web/` appellent l'API avec le client typé :
  ```ts
  import { createApiClient } from '@myvign/contracts/client';
  const api = createApiClient({ baseUrl: process.env.API_URL! }); // http://localhost:4010 en dev (mock)
  ```
- Le **jeton de brouillon** (`draftId`) est stocké dans un cookie `httpOnly`, `Secure`, `SameSite=Lax`, posé par `web/`. Il n'est jamais exposé au JavaScript du navigateur.
- **Validation** : le même schéma Zod côté client et côté serveur (`AutoSteps.vehicle`, etc.). Les erreurs de l'API arrivent par champ dans `error.fields`.
- **Choix de l'écran d'erreur** par `error.code` : `VALIDATION_FAILED`, `VEHICLE_NOT_FOUND` (E2), statut de paiement `failed`/`expired`/`verifying` (E3–E5), `INTERNAL_ERROR`/`SERVICE_UNAVAILABLE` (E6), `DRAFT_EXPIRED`.
- **Paiement** : après `createPayment`, interroger `getPayment` toutes les 2 à 3 s. Statut `verifying` : **interdire un second paiement** et rassurer. La couverture ne démarre qu'à `succeeded` (CA 16).
- **Idempotence** : générer un UUID `Idempotency-Key` par tentative de paiement, côté serveur.

## Travailler contre le serveur simulé
```bash
pnpm install && pnpm mock   # à la racine → API simulée sur http://localhost:4010
```
Il implémente tout le contrat, avec les scénarios d'erreur (plaque `0000…` → introuvable, téléphone finissant par `0001`/`0002`/`0003` → refus/expiration/vérification, en-tête `x-mock-scenario: technical-error` → E6). Liste complète : [packages/contracts/README.md](../../packages/contracts/README.md).

### Brancher `web/` sur `@myvign/contracts` : décision à prendre
`web/` est aujourd'hui un projet **npm** hors du workspace pnpm. Deux options :
1. **Recommandée** : intégrer `web/` au workspace pnpm. Toi : renommer en `@myvign/web`, supprimer `web/package-lock.json`, ajouter `"@myvign/contracts": "workspace:*"` et `transpilePackages: ['@myvign/contracts']` dans `next.config.ts`. Moi (B) : ajouter `web` à `pnpm-workspace.yaml` et à la CI.
2. Garder npm et dépendre de `file:../packages/contracts` (plus fragile).
→ Réponds dans `STATUS.md`.

### Code existant à faire converger
`web/src/lib/tarif.ts`, `vehicules.ts` et `stockage.ts` simulent tarif, véhicules et stockage côté client. À terme, ces données viennent de l'API via le BFF (le mock les fournit déjà). Garde-les le temps de la transition, puis supprime-les.

## Exigences de qualité (bloquantes en CI à terme)
- **Performance**, profil mobile en 3G lente : LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JavaScript < 120 Ko compressés par page de parcours. Server Components par défaut, polices auto-hébergées, images AVIF/WebP, photos de sinistre compressées sur le téléphone (environ 300 Ko) avant envoi.
- **Accessibilité** : WCAG 2.2 AA, zéro violation axe sérieuse.
- **Formulaires** utilisables sans JavaScript (Server Actions avec amélioration progressive), enregistrement à chaque étape, cases de consentement jamais précochées.
- **Design** : skills `impeccable` et `ui-ux-pro-max` disponibles. Les hooks impeccable vérifient chaque modification d'interface (`.claude/settings.json`). Note : `.claude/` est ignoré par git. Si tu travailles dans un worktree séparé, copie `.claude/` et `.impeccable/` depuis le dépôt principal.
- **Tests** : Playwright dans `e2e/`, parcours nominal + chaque cas E1 à E6, sur profil mobile.

## Tes phases (le rendez-vous valide chaque phase avec B)
| Phase | Ta part | Rendez-vous |
|---|---|---|
| 1 | Accueil (façon Macif, segmenté Particuliers / Professionnels), pages produits, localisateur d'agences (position, liste/carte, ouvert/fermé, appel, itinéraire, rappel) | Site public branché sur l'API réelle |
| 2 | Souscription auto complète (blocs `holder` → `declaration`, puis paiement) + E1 à E6 + page `/verifier/[code]` | Souscription de bout en bout |
| 3 | Déclaration de sinistre auto, envoi des photos, page de suivi par statuts | Sinistre déclaré et suivi |
| 4 | Habitation (souscription et sinistre) | Habitation de bout en bout |
| 5 | Espace client (connexion OTP, contrats, certificats, sinistres, renouvellement) | Connexion et consultation |
| 6 | Écrans du back-office | Sinistre traité côté agent, visible côté client |
| 7 | Autres branches (voyage, scolaire, incendie ; transport et entreprise en devis assisté) | Toutes les branches |
| 8 | Performance, accessibilité, finitions | Prêt pour la production |

## Cohabitation
- Une branche `front/*` (ou un worktree). Fusion dans `main` quand la CI est verte. Rebase fréquent.
- Besoin d'un champ ou d'une route en plus ? Propose un changement **additif** du contrat (voir `CONTRACT_CHANGES.md`) ; B l'implémente côté API.
- Mets à jour `STATUS.md` (section A) à chaque fin de tâche.
