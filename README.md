# myVign

Plateforme web de souscription d’assurances **SONAS** en République démocratique du Congo : devis instantané, paiement mobile money, attestation, déclaration de sinistre, et localisateur d’agences.

Aujourd’hui, aucun assureur en RDC n’offre un parcours web complet devis → souscription → paiement → attestation. myVign vise cet espace, pour le compte de la SONAS.

## Produits

| Branche | Mode visé |
|---|---|
| Auto | Devis et souscription en ligne |
| Habitation / incendie | En ligne (incendie obligatoire art. 210 CA) |
| Voyage, scolaire | En ligne |
| Transport, entreprise | Questionnaire court puis rappel conseiller |

Paiements prévus : M-Pesa, Orange Money, Airtel Money, Afrimoney, carte, paiement en agence.

Références d’ergonomie : [macif.fr](https://www.macif.fr/) et [agences.macif.fr](https://agences.macif.fr/). Identité visuelle : couleurs du logo SONAS (bleu, jaune, rouge), sans reprendre la palette verte des maquettes mobiles.

## État du dépôt

| Partie | État |
|---|---|
| Charte ([DESIGN.md](DESIGN.md)) | Définie |
| Recherche métier ([docs/](docs/)) | Disponible |
| Contrat d’API (`@myvign/contracts`) | Schémas Zod, routes `/v1`, parcours auto (souscription + sinistre) |
| Tarif simulé, référentiels, agences | Présents dans `web/src` |
| Interface Next.js | Échafaudage create-next-app, pages métier non branchées |
| API Nest, mock HTTP, infra Docker | Annoncés dans les scripts, pas encore en place |

Le contrat d’API (`packages/contracts`) est la source de vérité partagée : front, futur back et tests s’alignent dessus. Version actuelle : `1.0.0`.

## Structure

```
myVign/
├── web/                      # App Next.js (App Router)
├── packages/
│   ├── contracts/            # Schémas Zod, routes, client typé
│   └── config/               # TypeScript partagé
├── docs/                     # Besoins RDC, benchmark, descriptif
├── DESIGN.md                 # Système de design (obligatoire pour l’UI)
└── pnpm-workspace.yaml
```

`pnpm-workspace.yaml` prévoit aussi `apps/*` et `e2e` pour les prochains packages.

## Prérequis

- Node.js ≥ 22.12
- pnpm 11

## Commandes

```bash
pnpm install
pnpm dev          # Next.js (web)
pnpm build
pnpm typecheck
pnpm lint         # Biome
pnpm format
```

Autres scripts racine (cibles encore incomplètes) : `pnpm mock`, `pnpm openapi`, `pnpm infra:up`.

En développement, ouvrir [http://localhost:3000](http://localhost:3000).

## Parcours auto (cible UI)

Quatre phases, un sujet par écran, cinq champs visibles au maximum, pied collant (estimation + bouton jaune unique) :

1. **Vous** — conducteur, identité, pièce, contact, permis
2. **Votre véhicule** — plaque ou châssis, carte rose, usage, antécédents
3. **Votre formule** — Tiers / Tiers étendu / Tous risques, options, contrat
4. **Paiement** — récapitulatif, mobile money, certification d’exactitude

La couverture commence **après paiement** (Code des assurances, art. 16). Un certificat provisoire (PDF + QR) est délivré tout de suite ; le définitif passe par le SNECA.

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/descriptif.md](docs/descriptif.md) | Brief produit |
| [DESIGN.md](DESIGN.md) | Couleurs, typo, anatomie des écrans, composants |
| [docs/recherche_formulaires_rdc.md](docs/recherche_formulaires_rdc.md) | Champs, pièces, règles légales |
| [docs/benchmark_concurrents.md](docs/benchmark_concurrents.md) | Offre digitale des assureurs RDC |
| [docs/Etude_marche_SONAS.docx](docs/Etude_marche_SONAS.docx) | Étude de marché |

Site institutionnel SONAS : [sonas.cd](https://www.sonas.cd/).
