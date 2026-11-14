# myVign : règles communes aux agents

Plateforme web d'assurance SONAS (RDC) : souscription en ligne, paiement mobile money, attestation PDF + QR, déclaration et suivi de sinistres, localisateur d'agences, back-office.
Deux agents travaillent **en parallèle** sur ce dépôt. Lire d'abord sa fiche de mission, puis `docs/coordination/STATUS.md`.

| Partie | Fiche de mission | Possède (seul à modifier) |
|---|---|---|
| **A · Front** (assuré par l'agent B depuis le 14/11/2026, à la demande de l'utilisateur) | [docs/coordination/MISSION_A_FRONT.md](docs/coordination/MISSION_A_FRONT.md) | `web/` (site public, parcours, espace client), futur `backoffice/`, `e2e/`, `DESIGN.md`, `docs/design/`, `docs/readme/` |
| **B · Domaine et plateforme** | [docs/coordination/MISSION_B_BACK.md](docs/coordination/MISSION_B_BACK.md) | `apps/api`, `apps/worker`, `packages/*` sauf `contracts`, `infra/`, fichiers racine (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `.github/`) |
| **Partagé** | [docs/coordination/CONTRACT_CHANGES.md](docs/coordination/CONTRACT_CHANGES.md) | `packages/contracts` (le contrat d'API), `docs/coordination/` |

## Règles
1. **Ne jamais modifier un dossier de l'autre partie**, même pour un formatage ou un « petit correctif ». Le signaler dans `STATUS.md`.
2. **Ne jamais lancer de formateur ou de linter avec écriture hors de son périmètre.** Biome est limité à la partie B par `biome.json` ; `web/` a son propre ESLint.
3. **Le contrat (`packages/contracts`) est la source de vérité** des échanges front ↔ API. Tout changement : PR ou commit dédié, `CONTRACT_VERSION` incrémentée, entrée dans `CONTRACT_CHANGES.md`. Changement additif : libre. Changement cassant : accord de l'autre agent dans `STATUS.md`.
4. **Le navigateur ne parle jamais directement à l'API** : `web/` appelle l'API côté serveur (BFF) avec le client typé `@myvign/contracts/client`.
5. **Règles métier RDC** : `docs/recherche_formulaires_rdc.md` fait foi (Code des assurances : CA). Exemples : couverture seulement après paiement confirmé (CA 16), profession sur le certificat (CA 121), certification d'exactitude non précochée (CA 13-15), déclaration de sinistre jamais bloquée (CA 19).
6. **Charte** : `DESIGN.md` fait foi (palette du logo SONAS : bleu, jaune, rouge réservé à l'urgence). La palette verte des maquettes PDF n'est **pas** retenue.
7. **Tenir `docs/coordination/STATUS.md` à jour** à chaque fin de tâche : en cours, fait, bloqué, questions.
8. **Montants** : entiers en unités mineures + devise (`Money`). Jamais de flottant. Conversion CDF ↔ USD uniquement avec `convertMoney()` et le taux de `GET /v1/exchange-rate`.
9. **Formulaires au plus court** (exigence de l'utilisateur) : prix d'abord, pré-remplissage, valeurs par défaut, rien de ce qui peut attendre n'est demandé avant le paiement.
10. Langue du produit et des messages : **français**. Prévoir l'i18n (lingala, swahili).
11. **Commits et push : faits par l'utilisateur.** Les agents ne committent pas.

## Commandes (racine, pnpm 11, Node ≥ 22.12)
```bash
pnpm install          # dépendances du workspace (partie B + contrat)
pnpm mock             # API simulée sur http://localhost:4010 (scénarios E1 à E6 : packages/contracts/README.md)
pnpm test             # tests (dont le parcours complet sur le mock)
pnpm typecheck
pnpm lint             # Biome, périmètre partie B
pnpm openapi          # génère packages/contracts/openapi.json
pnpm infra:up         # Postgres, Redis, Mailpit (Docker)
```
Le front `web/` s'installe et se lance à part (voir sa fiche de mission).

## Références
- Géographie (provinces, carte SVG, agences) : `packages/geo`.
- Architecture et plan : `docs/coordination/MISSION_*.md` ; recherche métier : `docs/recherche_formulaires_rdc.md` ; benchmark : `docs/benchmark_concurrents.md`.
- Maquette : `docs/Sonas - troisieme version.pdf` (parcours et cas d'erreur E1 à E6 ; sa palette n'est pas retenue).
