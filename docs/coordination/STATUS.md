# État du projet et échanges entre agents

Mettre à jour à chaque fin de tâche. Le plus récent en haut de chaque section.
Les commits et les push sont faits par l'utilisateur : les agents ne committent pas.

## Marketing (B, à la demande de l'utilisateur)
**2026-11-19 : dossier du film promotionnel « C'est réglé » livré dans `docs/marketing/`.**
- 34 captures PC (3840×2160) et 33 captures mobiles (Chrome de l'émulateur Android `hestim_pixel`, Android 15 en fr-FR), scripts de reprise dans `docs/marketing/outils/`.
- Inserts produit rendus (vrai site dans un téléphone, 16:9 et 9:16, 25 i/s) dans `docs/marketing/video-promo/inserts/`.
- Benchmark, stratégie, storyboard 60/30/15/6 s, scripts ElevenLabs (Eleven v4), prompts Veo 3.1 / Kling 3.0, montage et livraison, 5 prompts Codex.
- Skill local `.claude/skills/film-promo-ia/` (non versionné : `.claude/` est ignoré par git).
- Aucun fichier de `web/` ni de `packages/` modifié. Les éléments de démo sont masqués au moment des captures seulement.
- **2026-11-19 (suite)** : présentation animée pour les équipes SONAS (`docs/marketing/video-promo/rendus/presentation_sonas_motion.mp4`, 1 min 48, chiffres de l'étude de marché, rendu image par image depuis `docs/marketing/outils/motion/`), guide de production pas à pas et prompts Codex A, B, C (`08-guide-production.md`).
- **2026-11-19 (v2)** : demande de l'utilisateur. Plus aucune mention du nom du dépôt dans les contenus ; appareils réels (cadre Pixel 8 de l'AOSP, photo de portable sous licence Burst) au lieu des appareils dessinés ; vues PC ajoutées (captures `captures/laptop/`, inserts `pc_*`). Les versions précédentes sont archivées dans `docs/marketing/video-promo/archives/`. ⚠️ Le site affiche encore « myVign » à 3 endroits (`web/src/components/site/entete.tsx`, `pied.tsx`, `app/(site)/mentions-legales/page.tsx`) : masqués dans les captures, non modifiés dans le code.
- **2026-11-19 (v3)** : présentation v2 archivée (`archives/v2_2026-11-19/`) ; copie avec musique douce composée par programme (`presentation_sonas_motion_musique.mp4`, −26 dB RMS) ; nouvelle vidéo de présentation du site (`site_sonas_en_ligne.mp4` + `_musique.mp4`, 1 min 15, `docs/marketing/video-promo/10-video-site.md`).
- **2026-11-19 (v4)** : voix off française générée dans ElevenLabs (voix « Paul K — Deep French Narrator », Eleven v4, offre gratuite) en pilotant une fenêtre Edge dédiée ; 24 répliques dans `docs/marketing/video-promo/voix/` ; vidéos `presentation_sonas_motion_voix.mp4` et `site_sonas_en_ligne_voix.mp4` (voix + musique douce). Scripts : `outils/voix_elevenlabs.py`, `outils/mixer_voix.py`.
- **2026-11-19 (v5)** : voix off refaite avec « Adina » (voix française, demande de l'utilisateur) et textes réécrits avec des liaisons ; versions Paul K et essais archivés (`archives/v3_…`, `archives/v4_…`). Correctif du script : un seul bloc de voix, texte vérifié avant chaque génération.
- **À décider par l'utilisateur ou la SONAS** : signature, voix (clonage d'un comédien de Kinshasa recommandé), musique originale, mentions légales, accords des opérateurs mobile money et de la police de circulation.

## Partie B : domaine et plateforme
**2026-11-14 : B reprend aussi le front (demande de l'utilisateur, agent A inactif). Démo complète livrée.**
- `web/` intégré au workspace pnpm (`@myvign/web`, `package-lock.json` supprimé) ; `pnpm dev` lance le site **et** l'API simulée.
- Pages : accueil, souscription auto (prix d'abord, 9 écrans), paiement mobile money relié à l'API (E3–E5, FC ou $, agence), certificat provisoire + QR, vérification publique, déclaration de sinistre, suivi par statuts (rafraîchi seul), localisateur d'agences (liste + carte synchronisées, zoom province, rendez-vous), pages ville (53, statiques), espace gestionnaire (démo), mentions légales, données personnelles, erreur technique (E6).
- Contrat 1.4.0 (additif) : suivi par n° + téléphone, back-office.
- Vérifié dans un vrai navigateur (émulation mobile 390 px) : 3 scénarios de bout en bout verts (souscription → certificat ; sinistre → suivi ; gestionnaire → client). `next build` OK (69 pages), ESLint et TypeScript propres, 38 tests verts.
- Supprimés : simulations locales de l'ancien front (`lib/tarif.ts`, `lib/vehicules.ts`, `lib/stockage.ts`, `parcours/paiement.tsx`, `parcours/attestation.tsx`), remplacées par l'API.
- Script de présentation : [docs/DEMO.md](../DEMO.md).

**2026-11-14 : contrat 1.3.0** (additif) : rendez-vous en agence, coordonnées du centre de contact, filtre par ville. Spécification des deux gabarits inspirés de Macif pour A (MISSION_A §« Gabarits »). 35 tests verts, 27 opérations OpenAPI.

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
4. **« Le même genre » que Macif** : page agences par ville (liste + carte synchronisées, Prendre RDV) et parcours avec stepper, colonne « Faites-vous rappeler » et page d'erreur technique. Sans avis inventés, en charte SONAS.

## Questions ouvertes
| De → À | Question | Réponse |
|---|---|---|
| B → A | `web/` rejoint-il le workspace pnpm ? | Fait par B (14/11). |
| B → A | Ordre « prix d'abord » ? | Adopté par B dans `web/` (14/11). |
| B → utilisateur | Horaires et jours d'ouverture réels des agences, et horaires du centre d'appel : la SONAS peut-elle les fournir ? (le site officiel se contredit : « 7 h 30–16 h » et « 24 h/24 ») | |
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
