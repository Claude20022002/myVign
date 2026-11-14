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

## Demandes de l'utilisateur (2026-11-14)

### Formulaire : le plus simple et le plus rapide possible
Le contrat 1.2.0 est taillé pour ça (`packages/contracts/src/products/auto.ts`). Ordre recommandé, **prix d'abord** :

| Écran | Bloc | Ce que le client fait vraiment |
|---|---|---|
| 1 | `vehicle` | Tape sa **plaque** → `lookupVehicle` pré-remplit marque, modèle, énergie, CV, places, année → il confirme d'un tap. Lien « Pas encore de plaque » → n° de châssis. |
| 2 | `usage` | 2 choix en cartes : usage, stationnement de nuit |
| 3 | `driver` | Date de naissance, date du permis, sinistres sur 3 ans (« Aucun » présélectionné) |
| → | `createQuote` | **Le prix s'affiche ici**, avant toute question d'identité |
| 4 | `formula` | 1 carte à choisir (Tous risques recommandée). Options repliées. Valeur du véhicule demandée seulement si la formule le couvre. |
| 5 | `holder` | Prénom, nom, téléphone, profession (liste + recherche), province (pré-remplie), commune, avenue |
| 6 | `declaration` | 2 cases non précochées, puis paiement |

Règles : un sujet par écran ; **ne jamais afficher un champ qui a une valeur par défaut** (sauf repli « Modifier ») ; clavier numérique pour téléphone et dates ; téléphone pré-rempli pour le paiement ; pas d'e-mail obligatoire ; pièce d'identité demandée **après** le paiement, par SMS, pour le certificat définitif. Sinistre : même logique (champs secondaires par défaut, blessés et 112 en premier).

### Devises : CDF ↔ USD au taux du jour
- `GET /v1/exchange-rate` donne le taux du jour (source BCC). Mettre en cache côté serveur (1 h) ; afficher « Taux BCC du JJ/MM : 1 $ = 2 850 FC ».
- **Bascule FC / $** visible près du prix (pied collant), mémorisée (cookie). Conversion avec `convertMoney()` de `@myvign/contracts` : le même calcul que l'API, au centime près.
- Au paiement : proposer de payer en FC ou en $ (`currency` dans `createPayment`). Le reçu montre le montant payé, le montant du tarif et le taux figé (`Payment.exchange`).

### Carte interactive des provinces
- Données prêtes : `@myvign/geo/map` (`PROVINCE_MAP_VIEWBOX`, `PROVINCE_SHAPES[code].path`, 31 Ko) et `GET /v1/provinces` (nombre d'agences par province). La SONAS couvre **20 provinces sur 26**.
- Usages : (1) choisir sa province dans le bloc `holder` ; (2) localisateur d'agences (clic sur une province → `listAgencies?province=`).
- SVG inline, sans bibliothèque de cartes. Provinces couvertes en couleur, non couvertes en gris (« Pas encore d'agence : souscription en ligne possible »).
- **Accessibilité et rapidité** : chaque province est focusable au clavier, avec un nom accessible et l'état sélectionné. La carte ne remplace jamais une **liste ou une recherche** (Kinshasa et Kasaï-Oriental sont minuscules). Pré-sélectionner la province par géolocalisation (bouton « Utiliser ma position »), sinon Kinshasa.
- Mention obligatoire sous la carte : « © contributeurs OpenStreetMap » (licence ODbL).

### Gabarits inspirés de Macif (demande du 2026-11-14)
L'utilisateur veut « le même genre » que deux pages Macif : la **structure et l'ergonomie**, pas l'identité visuelle. Aucun logo, nom, slogan ni couleur Macif : tout reste en charte SONAS (`DESIGN.md`).

**1. Page agences par ville** (`/agences/[province]/[ville]`, générée statiquement depuis `@myvign/geo`, une page par ville = référencement local)
- Fil d'Ariane : Accueil › Trouver une agence › {Province} › {Ville}. Titre « Assurance {Ville} · {Province} ».
- Barre « Ma recherche : {ville} » + « Modifier ma recherche » (texte, « Utiliser ma position »).
- Titre « {n} agences SONAS à {Ville} » ; **liste numérotée à gauche, carte à droite** avec marqueurs numérotés **synchronisés** (survol ou focus d'une carte ↔ marqueur). Sur mobile : liste d'abord, carte repliable « Voir sur la carte ».
- Chaque agence : nom, adresse (ou « Adresse communiquée par téléphone » si `address` est nul), distance, **statut « Ouvert » / « Fermé actuellement »** calculé depuis `openingHours` dans le fuseau `timeZone` de l'agence, boutons **« Prendre RDV »** (`listAppointmentSlots` → `createAppointment`) et « Voir plus » (fiche agence : horaires, appeler, itinéraire, nous écrire).
- Bloc **« Réalisez votre devis en ligne »** : tuiles des produits (`listProducts`), le bouton jaune unique de la page.
- Bloc **« Agences dans les villes à proximité »** : villes les plus proches (même province d'abord), liens internes.
- **Pas de bloc d'avis** : la SONAS n'a aucun avis public. N'afficher **aucune note ni étoile inventée**. Un vrai recueil d'avis après sinistre ou souscription pourra venir plus tard.
- Carte : **MapLibre GL** chargée à la demande. Fond de carte : **ne pas utiliser `tile.openstreetmap.org`** (interdit pour un usage en production). Préférer des tuiles vectorielles **Protomaps (fichier PMTiles de la RDC auto-hébergé sur le CDN**, sans clé ni coût par requête), sinon un fournisseur commercial. Mention « © contributeurs OpenStreetMap ».
- Les horaires du mock sont **fictifs** tant que la SONAS ne les a pas confirmés.

**2. Parcours de devis : stepper + colonne d'aide**
- Bandeau stepper en haut, étapes nommées : **Véhicule · Usage · Conducteur · Tarif · Coordonnées · Validation · Paiement** (correspond aux blocs du contrat ; même logique que Macif : tarif avant coordonnées). Étapes faites cochées et cliquables pour revenir, étapes futures grisées.
- Colonne de droite (sous le contenu sur mobile) : un argument de réassurance, encart **« Faites-vous rappeler »** (`createCallback`, contexte du brouillon transmis), **« Contactez nos conseillers »** avec numéros et horaires venant de `getContactInfo` (jamais en dur).
- **Page d'erreur technique (E6)**, même structure que l'exemple : titre « Une erreur technique est survenue », phrase rassurante (« Vos réponses sont enregistrées »), action principale **« Prendre rendez-vous »**, alternative « Être rappelé », numéro du centre de contact. Le brouillon reste repris possible (60 jours).
- Mentions légales en bas du parcours : consentement, traitement des données, droits (Code du numérique), en texte simple et court.

## Exigences de qualité (bloquantes en CI à terme)
- **Performance**, profil mobile en 3G lente : LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JavaScript < 120 Ko compressés par page de parcours. Server Components par défaut, polices auto-hébergées, images AVIF/WebP, photos de sinistre compressées sur le téléphone (environ 300 Ko) avant envoi.
- **Accessibilité** : WCAG 2.2 AA, zéro violation axe sérieuse.
- **Formulaires** utilisables sans JavaScript (Server Actions avec amélioration progressive), enregistrement à chaque étape, cases de consentement jamais précochées.
- **Design** : skills `impeccable` et `ui-ux-pro-max` disponibles. Les hooks impeccable vérifient chaque modification d'interface (`.claude/settings.json`). Note : `.claude/` est ignoré par git. Si tu travailles dans un worktree séparé, copie `.claude/` et `.impeccable/` depuis le dépôt principal.
- **Tests** : Playwright dans `e2e/`, parcours nominal + chaque cas E1 à E6, sur profil mobile.

## Tes phases (le rendez-vous valide chaque phase avec B)
| Phase | Ta part | Rendez-vous |
|---|---|---|
| 1 | Accueil (façon Macif, segmenté Particuliers / Professionnels), pages produits, localisateur d'agences (carte des provinces, position, liste, ouvert/fermé, appel, itinéraire, rappel), bascule FC / $ | Site public branché sur l'API réelle |
| 2 | Souscription auto complète (blocs `vehicle` → `declaration`, prix après `driver`, paiement FC ou $) + E1 à E6 + page `/verifier/[code]` | Souscription de bout en bout |
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
