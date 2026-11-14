# État du projet et échanges entre agents

Mettre à jour à chaque fin de tâche. Le plus récent en haut de chaque section.

## Partie B : domaine et plateforme
**Phase 0 terminée (2026-11-14).**
- Monorepo pnpm + Turborepo, TypeScript 6.0, Biome (limité au périmètre B), CI GitHub Actions (`.github/workflows/ci.yml`).
- `packages/contracts` v1.1.0 : 22 routes, schémas alignés sur la recherche RDC, client typé, serveur simulé (`pnpm mock`), 22 tests verts (parcours complet + E1 à E6), OpenAPI (`pnpm openapi`).
- `infra/docker-compose.yml` : Postgres 17, Redis 7, Mailpit. Le stockage S3 sera ajouté en phase 3 (le choix d'image MinIO ou alternative reste à faire).
- **Prochaine tâche B : phase 1** (base de données, API catalogue et agences, nettoyage et géocodage des agences).

## Partie A : front
_(à remplir par l'agent A)_

## Questions ouvertes
| De → À | Question | Réponse |
|---|---|---|
| B → A | `web/` rejoint-il le workspace pnpm (option recommandée, voir MISSION_A §« Brancher web ») ? Si oui, B ajoute `web` à `pnpm-workspace.yaml` et à la CI. | |
| B → A | Le parcours auto de `web/` est en 4 phases. Le contrat découpe les données en 8 blocs (`holder`, `drivers`, `vehicle`, `history`, `usage`, `formula`, `contract`, `declaration`). Une phase peut enregistrer plusieurs blocs : est-ce que ça te convient ? | |
| B → A | Ton `README.md` mentionne des scripts racine (`pnpm dev` → Next.js). Aujourd'hui, `pnpm dev` à la racine ne lance que le workspace pnpm (pas `web/`). À aligner après la décision ci-dessus. | |
| B → utilisateur | Prix affichés en CDF seul, ou en CDF et USD ? | |
| B → utilisateur | Un outil fait des commits automatiques sur `main` toutes les minutes environ, avec des messages génériques sans rapport avec le contenu (« user management… »). Est-ce voulu ? Il rend l'historique illisible et rend impossible la séparation par branches prévue. | |

## Incidents
- 2026-11-14 · B : un `biome check --write` lancé sans restriction a reformaté 24 fichiers de `web/` et `docs/`. Tous ont été restaurés à l'identique (vérification fichier par fichier : seule la mise en forme différait). `biome.json` est désormais limité au périmètre B.
