# DESIGN.md · myVign (SONAS)

Système de design de la plateforme web myVign. Il fait référence pour toute page ou tout composant.
Version 1, 14/11/2026.

## 1. Intention

1. **Les couleurs du logo SONAS** (bleu, jaune, rouge) sont la marque. On les respecte sans les répandre partout.
2. **L'interface repose les yeux** : fonds neutres légèrement teintés, texte très lisible, aucun aplat saturé sur de grandes surfaces.
3. **La couleur vive signale ce qu'on cherche** : elle est réservée à ce que le client doit trouver tout de suite.
4. **Les formulaires sont découpés** en petites étapes regroupées par phases, pour ne jamais fatiguer.

Cette charte **remplace la palette verte des maquettes** (« Sonas - troisième version »). Elle en conserve
l'ergonomie : un sujet par écran, pied de page collant, aide contextuelle.

---

## 2. Couleurs

Tous les contrastes sont mesurés selon le WCAG 2.2. Cibles : 4,5:1 pour le texte, 3:1 pour les contours et les grands textes.

### 2.1 Couleurs de marque (issues du logo)

| Jeton        | Hex       | Rôle                                                                           | Contraste                                                                |
| ------------ | --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `bleu-logo`  | `#1790CD` | Identité : logo, icônes produits, barre de progression, filet de marque, puces | 3,55:1 sur blanc : **jamais pour du texte courant**                      |
| `jaune-logo` | `#F5C800` | **Action principale de l'écran** (fond du bouton)                              | Texte encre dessus : 9,49:1. **Jamais comme couleur de texte** (1,60:1). |
| `rouge-logo` | `#CA0920` | **Urgence** (112, assistance)                                                  | Texte blanc dessus : 5,88:1                                              |

### 2.2 Couleurs dérivées (même teinte, luminosité ajustée)

| Jeton          | Hex       | Rôle                                                                     | Contraste                                      |
| -------------- | --------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `bleu-action`  | `#116A97` | Liens, bouton secondaire, choix sélectionné, focus, onglet actif         | 5,95:1 sur blanc, 5,31:1 sur `bleu-teinte`     |
| `bleu-survol`  | `#0D5173` | Survol et appui des éléments bleus                                       | 8,60:1                                         |
| `bleu-nuit`    | `#0A405C` | Pied de page, bandeau de l'espace client (surfaces sombres peu saturées) | Blanc dessus : 11,05:1 ; jaune dessus : 6,92:1 |
| `bleu-teinte`  | `#E8F4FB` | Fond d'un choix sélectionné, encadré d'information                       | Surface                                        |
| `jaune-survol` | `#E6BB00` | Survol du bouton principal                                               | Encre dessus : 8,29:1                          |
| `jaune-teinte` | `#FFF9E0` | Mise en avant très ponctuelle (formule recommandée)                      | Surface                                        |
| `rouge-texte`  | `#B0081C` | Message d'erreur, texte d'urgence                                        | 7,25:1 sur blanc                               |
| `rouge-teinte` | `#FEF0F2` | Fond du bandeau d'urgence ou d'erreur                                    | `rouge-texte` dessus : 6,54:1                  |

### 2.3 Neutres (environ 85 % de chaque écran)

| Jeton         | Hex       | Rôle                                                                | Contraste                             |
| ------------- | --------- | ------------------------------------------------------------------- | ------------------------------------- |
| `fond`        | `#F5F7F9` | Fond de page, légèrement bleuté, moins éblouissant que le blanc pur | Surface                               |
| `carte`       | `#FFFFFF` | Cartes, champs, en-tête                                             | Surface                               |
| `encre`       | `#1B2733` | Titres et texte courant, plus doux que le noir pur                  | 14,12:1 sur `fond`                    |
| `texte-2`     | `#4E5D6C` | Aides sous les champs, légendes                                     | 6,30:1 sur `fond`                     |
| `texte-3`     | `#6B7885` | Mentions secondaires (jamais sous 14 px)                            | 4,52:1 sur blanc                      |
| `filet-champ` | `#7A8794` | Contour des champs et des cases                                     | 3,67:1 sur blanc (seuil 3:1 respecté) |
| `filet`       | `#D5DDE5` | Séparateurs et bordures de cartes (décoratif)                       | n/a                                   |

### 2.4 États fonctionnels

| Jeton                            | Hex                   | Rôle                                                |
| -------------------------------- | --------------------- | --------------------------------------------------- |
| `succes` / `succes-teinte`       | `#1E6B45` / `#EAF5EF` | Paiement confirmé, champ validé (6,47:1 / 5,80:1)   |
| `vigilance` / `vigilance-teinte` | `#7A4B00` / `#FFF6E0` | Conseil, sous-assurance, document manquant (6,88:1) |

Le vert de succès n'est pas une couleur de marque : il ne sert qu'aux confirmations.
La vigilance est brun-ambre, volontairement éloignée du jaune des boutons pour ne pas être confondue avec une action.

---

## 3. Hiérarchie de l'attention

La couleur vive est un **budget**. Chaque écran le dépense sur ce que le client doit trouver en premier.

| Niveau         | Couleurs                   | Ce qui y a droit                                                                                               | Limite                                                  |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **1 · Vif**    | `jaune-logo`               | L'action principale : « Obtenir mon devis », « Continuer », « Payer 1 290 000 FC », « Envoyer ma déclaration » | **Un seul bouton jaune par écran**                      |
| **1 · Vif**    | `rouge-logo`               | L'urgence : « Appeler le 112 », assistance 24 h/24 dans les parcours sinistre                                  | Uniquement en contexte de sinistre ou de danger         |
| **2 · Marque** | `bleu-logo`, `bleu-action` | Repères : progression, choix sélectionné, liens, bouton secondaire, icônes produits, onglet actif              | Lignes et petites surfaces, pas d'aplats pleine largeur |
| **3 · Calme**  | Neutres                    | Tout le reste : textes, cartes, champs, séparateurs                                                            | n/a                                                     |

**Règles**

- Le **prix** se distingue par sa taille et sa graisse (Saira 600, encre), pas par une couleur vive.
- Le **rouge du logo** n'apparaît jamais en décoration (titres, pictogrammes, liserés) : il perdrait sa valeur d'alerte. Seul le logo l'utilise librement.
- Le **jaune** n'est jamais un fond de section, de carte ou de bandeau, seulement celui du bouton principal. Exception unique : `jaune-teinte`, très pâle, pour signaler la formule recommandée.
- Pas de dégradés décoratifs. Si un grand fond coloré est nécessaire (pied de page, en-tête de l'espace client), il est en `bleu-nuit`, sombre et peu saturé.
- L'erreur utilise `rouge-texte` + `rouge-teinte`. Elle s'accompagne toujours d'une icône et d'un texte, jamais de la couleur seule.

---

## 4. Confort visuel (anti-fatigue)

- Page en `fond`, contenus sur `carte` blanche : le blanc pur ne remplit jamais tout l'écran.
- Texte `encre` (`#1B2733`) plutôt que noir pur : contraste élevé (14:1) sans scintillement.
- Corps de texte à **17 px**, interlignage 1,55, lignes de **70 caractères maximum**.
- Grands espaces blancs entre les groupes (24 à 32 px) plutôt que des encadrés en cascade.
- Pas d'animation automatique. Les transitions répondent seulement à une action (ouvrir l'aide, valider un choix), durent 150 à 200 ms et sont désactivées si `prefers-reduced-motion` est actif.
- Zones tactiles d'au moins **44 × 44 px**.
- Mode sombre (phase 2) : base `#0B1A26`, texte `#E6EDF3`, `bleu-logo` éclairci en `#8CD0F2` pour les liens, jaune inchangé sur les boutons.

---

## 5. Typographie

| Usage                 | Police                           | Taille / interlignage       | Graisse        |
| --------------------- | -------------------------------- | --------------------------- | -------------- |
| Titre d'écran (H1)    | **Saira** (police du site SONAS) | 28 / 34 px (mobile 24 / 30) | 600            |
| Titre de section (H2) | Saira                            | 21 / 28 px                  | 600            |
| Prix                  | Saira, chiffres tabulaires       | 24 / 30 px                  | 600            |
| Texte courant         | **Atkinson Hyperlegible Next**   | 17 / 26 px                  | 400            |
| Libellé de champ      | Atkinson Hyperlegible Next       | 16 / 22 px                  | 600            |
| Aide sous le champ    | Atkinson Hyperlegible Next       | 15 / 22 px                  | 400, `texte-2` |
| Bouton                | Atkinson Hyperlegible Next       | 17 px                       | 700            |

**Pourquoi Atkinson Hyperlegible** : cette police a été conçue pour la lisibilité. Elle distingue clairement `0/O`, `1/l/I` et `5/S`, ce qui compte pour saisir **plaques, numéros de téléphone, n° de châssis et codes de paiement**, y compris sur des écrans d'entrée de gamme. Saira garde le lien avec l'identité SONAS dans les titres.
Les deux polices sont libres (OFL) ; prévoir `font-display: swap` et un sous-ensemble latin.

Casse de phrase partout (« Votre véhicule », pas « VOTRE VÉHICULE »).
Montants au format `1 290 000 FC` avec espaces insécables.

---

## 6. Formulaires : découper pour ne pas fatiguer

### 6.1 Règles

1. **Un sujet par écran**, et un titre qui pose la question (« Quelle est la plaque de votre véhicule ? »).
2. **Cinq champs visibles au maximum** par écran. Un groupe d'adresse compte pour un champ.
3. **Phases nommées** : le client voit 4 grandes étapes (_Vous, Votre véhicule, Votre formule, Paiement_), puis sa position dans la phase (« 2 sur 4 »). On ne montre jamais « étape 11 sur 17 ».
4. **Questions conditionnelles** : un champ n'apparaît que s'il est utile (« Autres conducteurs ? Oui » ouvre la fiche).
5. **Préremplir plutôt que demander** : la plaque retrouve marque et modèle ; le numéro de téléphone propose l'opérateur de paiement.
6. **Choix visibles plutôt que listes déroulantes** quand il y a 7 options ou moins (cartes radio, boutons segmentés).
7. **Validation au moment de quitter le champ**, avec un message qui dit comment corriger. À l'envoi, le focus va sur la première erreur.
8. **Sauvegarde automatique** à chaque écran (« Enregistré automatiquement »), reprise par lien SMS.
9. **Pied de page collant** : estimation de prix à gauche, bouton jaune à droite (pleine largeur sur mobile).
10. **Temps annoncé** sur l'écran d'accueil du parcours (« environ 6 minutes »).
11. **Récapitulatif** par phase, chaque bloc modifiable sans tout refaire.

### 6.2 Anatomie d'un écran

```
┌─────────────────────────────────────┐
│ [logo SONAS]                 (Aide) │  en-tête blanc, filet bleu-logo 3 px en haut
├─────────────────────────────────────┤
│ ● Vous ─ ● Véhicule ─ ○ Formule ─ ○ Paiement │  phases : bleu-logo (fait/en cours), filet (à venir)
│ Votre véhicule, 1 sur 4             │  texte-2
│                                     │
│ Quelle est la plaque                │  H1 Saira, encre
│ de votre véhicule ?                 │
│ On retrouve le modèle pour vous.    │  texte-2
│                                     │
│ Immatriculation                     │  libellé 16/600
│ ┌─────────────────────────────────┐ │
│ │ 4521AB 01                       │ │  champ blanc, filet-champ, focus bleu-action 2 px
│ └─────────────────────────────────┘ │
│ Je n'ai pas encore de plaque        │  lien bleu-action
│                                     │
├─────────────────────────────────────┤
│ Estimation        1 290 000 FC / an │  pied collant blanc, prix Saira 600
│ ┌─────────────────────────────────┐ │
│ │            Continuer            │ │  SEUL élément jaune de l'écran
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6.3 Découpage proposé : souscription auto

Le parcours passe des 9 écrans chargés des maquettes à **15 écrans courts** (3 à 5 champs chacun),
regroupés en 4 phases. Les champs viennent de [docs/recherche_formulaires_rdc.md](docs/recherche_formulaires_rdc.md).

| Phase              | Écran                              | Champs                                                      |
| ------------------ | ---------------------------------- | ----------------------------------------------------------- |
| **Vous**           | 1. Le conducteur                   | Qui conduit principalement · particulier ou entreprise      |
|                    | 2. Votre identité                  | Civilité · prénom · nom · post-nom · date de naissance      |
|                    | 3. Votre profession et votre pièce | Profession · type de pièce · numéro                         |
|                    | 4. Vous joindre                    | Téléphone · e-mail (facultatif) · adresse (groupe)          |
|                    | 5. Votre permis                    | Date d'obtention · numéro · catégorie · délivré en RDC      |
|                    | 6. Autres conducteurs              | Oui / non (puis une fiche courte par conducteur)            |
| **Votre véhicule** | 7. La plaque                       | Immatriculation, ou n° de châssis si pas de plaque          |
|                    | 8. Le véhicule                     | Catégorie · puissance fiscale · places · année (préremplis) |
|                    | 9. La carte rose                   | Date · titulaire · valeur du véhicule (si formule étendue)  |
|                    | 10. L'usage                        | Usage · km par an · stationnement de nuit                   |
|                    | 11. Vos antécédents                | Sinistres sur 3 ans · suspension de permis                  |
| **Votre formule**  | 12. La formule                     | 3 cartes de formule (la recommandée sur `jaune-teinte`)     |
|                    | 13. Vos options                    | Franchise · individuelle occupant · carte jaune             |
|                    | 14. Le contrat                     | Date d'effet · durée                                        |
| **Paiement**       | 15. Récapitulatif et paiement      | Récap par phase · moyen de paiement · validation            |

Les mêmes règles s'appliquent aux parcours habitation et sinistre : phases _Vous, Le logement / Le sinistre,
Les garanties / Les dégâts, Envoi_.

---

## 7. Composants clés

| Composant         | Repos                                                                     | Survol / focus                                            | Sélectionné / actif                                           | Désactivé                     |
| ----------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------- |
| Bouton principal  | Fond `jaune-logo`, texte `encre` 700, rayon 10 px                         | `jaune-survol` ; focus : anneau `bleu-action` 3 px décalé | n/a                                                           | Fond `filet`, texte `texte-3` |
| Bouton secondaire | Fond blanc, filet et texte `bleu-action`                                  | Fond `bleu-teinte`                                        | n/a                                                           | idem désactivé                |
| Bouton d'urgence  | Fond `rouge-logo`, texte blanc                                            | `rouge-texte`                                             | n/a                                                           | n/a                           |
| Champ             | Fond blanc, filet `filet-champ` 1 px, rayon 8 px, hauteur 48 px           | Filet `bleu-action` 2 px                                  | n/a                                                           | Fond `fond`                   |
| Champ en erreur   | Filet `rouge-texte` 2 px + message `rouge-texte` avec icône sous le champ |                                                           |                                                               |                               |
| Carte de choix    | Fond blanc, filet `filet`                                                 | Filet `bleu-action`                                       | Fond `bleu-teinte`, filet `bleu-action` 2 px, pastille cochée | Opacité 0,5                   |
| Lien              | `bleu-action`, souligné                                                   | `bleu-survol`                                             | n/a                                                           | n/a                           |
| Barre de phases   | Pastille `filet`                                                          | n/a                                                       | Faite : `bleu-logo` pleine ; en cours : anneau `bleu-logo`    | n/a                           |

Rayons hiérarchisés : 8 px pour les champs, 10 px pour les boutons, 14 px pour les cartes et les panneaux.

---

## 8. À valider

- Libellés officiels des formules et des garanties (SONAS).
- Accord de la SONAS pour l'usage du logo et de ses déclinaisons.
- Tests de lecture en plein soleil sur téléphone d'entrée de gamme (contrastes de `texte-3` et des filets).
