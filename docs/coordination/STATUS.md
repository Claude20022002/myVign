# État du projet et échanges entre agents

Mettre à jour à chaque fin de tâche. Le plus récent en haut de chaque section.
Les commits et les push sont faits par l'utilisateur : les agents ne committent pas.

## Partie B : domaine et plateforme
**2026-11-14 : contrat 1.2.0 + référentiel géographique** (demandes de l'utilisateur).
- **Formulaire au plus court** : 6 blocs, prix après 3 blocs sans identité, ~14 champs tapés au total (plaque reconnue), valeurs par défaut partout ailleurs. Détails pour le front : MISSION_A §« Formulaire ».
- **Change USD ↔ CDF** : `GET /v1/exchange-rate` (taux BCC du jour ; mock : 2 850), `convertMoney()` partagé front/API, paiement possible en USD ou CDF avec taux figé (`Payment.exchange`).
- **Provinces** : `packages/geo` (26 provinces, carte SVG simplifiée de 31 Ko, 59 agences nettoyées et rattachées à leur province) ; `GET /v1/provinces` donne la couverture (**20 provinces sur 26 ont une agence**) ; filtre `province` sur les agences.
- 32 tests verts (29 contrat, 3 géo), lint et typage verts, OpenAPI à 24 opérations.

**2026-11-14 : phase 0 terminée.** Monorepo pnpm + Turborepo, TypeScript 6.0, Biome (périmètre B), CI, `infra/docker-compose.yml` (Postgres, Redis, Mailpit), contrat + serveur simulé.

**Prochaine tâche B : phase 1** (base de données, API catalogue / agences / provinces / taux de change avec récupération quotidienne BCC).

## Partie A : front
_(à remplir par l'agent A)_

**Nouvelles demandes de l'utilisateur à intégrer (2026-11-14)**, détaillées dans MISSION_A :
1. Formulaire le plus simple et le plus rapide possible (ordre « prix d'abord », champs minimum).
2. Bascule d'affichage **CDF ↔ USD** au taux du jour, et choix de la devise au paiement.
3. **Carte interactive des provinces** pour choisir sa province (souscription, recherche d'agence).

## Questions ouvertes
| De → À | Question | Réponse |
|---|---|---|
| B → A | `web/` rejoint-il le workspace pnpm (option recommandée, voir MISSION_A §« Brancher web ») ? Sans cela, `web/` ne peut pas importer `@myvign/contracts` ni `@myvign/geo` (carte). | |
| B → A | Le parcours actuel de `web/` commence par « Vous ». L'utilisateur veut le formulaire le plus rapide : le contrat recommande « prix d'abord » (véhicule → usage → conducteur → prix → identité). D'accord pour adopter cet ordre ? | |
| B → utilisateur | Taux de référence : le taux indicatif de la BCC (bcc.cd) vous convient-il, ou la SONAS applique-t-elle son propre taux ? | |

## Décisions
| Date | Décision | Par |
|---|---|---|
| 2026-11-14 | Prix affichables en CDF et en USD, conversion au taux du jour (bascule) | Utilisateur |
| 2026-11-14 | Carte interactive des provinces (la SONAS couvre 20 provinces sur 26) | Utilisateur |
| 2026-11-14 | Formulaire réduit au strict minimum, le reste différé ou par défaut | Utilisateur |
| 2026-11-14 | Les commits et push sont faits par l'utilisateur | Utilisateur |

## Incidents
- 2026-11-14 · B : un `biome check --write` lancé sans restriction a reformaté 24 fichiers de `web/` et `docs/`. Tous ont été restaurés à l'identique (vérification fichier par fichier). `biome.json` est désormais limité au périmètre B et exclut le Markdown.
