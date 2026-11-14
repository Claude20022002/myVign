# Benchmark concurrents SONAS : plateformes d'assurance en ligne

Relevé du 14/11/2026. Méthode : lecture du texte des sites (pas de captures d'écran, donc le rendu visuel et les couleurs restent à vérifier à l'œil), recherches de presse.
Rappel : l'étude de marché ([Etude_marche_SONAS.docx](Etude_marche_SONAS.docx)) couvre déjà les chiffres (parts de marché, ratios, mobile money). Ce document se concentre sur **ce que les concurrents proposent en ligne**.

---

## 1. Synthèse en un tableau

| Assureur (RDC) | Site | Devis en ligne | Souscription en ligne | Paiement mobile money | Espace client | Sinistre en ligne | Suivi / attestation | Appli | WhatsApp / USSD |
|---|---|---|---|---|---|---|---|---|---|
| **SONAS** | [sonas.cd](https://www.sonas.cd/) | Non | Non | Non | Non | Non (n° de téléphone) | Non | Non | Chaîne WhatsApp seulement |
| **Rawsur** | [rawsur.com](https://www.rawsur.com/) | Formulaire « Demander un devis » (popup) | Formulaire de demande, sans paiement | Non | Non (web) | Formulaire « déclaration de sinistre » | Non | My Rawsur (2023) : polices + sinistre | Non vu |
| **SFA Congo** | [sfa-congo.com](https://www.sfa-congo.com/) | Non (renvoi vers le contact) | Non | Non | Login (sinistres) | Derrière le login | Non | PWA seulement | Non |
| **Activa RDC** | [rdc.group-activa.com](https://rdc.group-activa.com/) | « Calculatrice » | Via l'appli (Santé Plus) | Annoncé sur A-SureCover (M-Pesa, Orange, Airtel), absent du site | Appli MyACTIVA | Page support + appli | Attestation et réclamations dans l'appli | MyACTIVA | WhatsApp 24/7 ; USSD annoncé (A-SureCover) |
| **SUNU IARD RDC** | [page filiale](https://sunu-group.com/fr/notrereseau/filiales/rdc) | Sélecteur de profil (lien mort) | Non | Non | Non | Non | Non | Non | Non |
| **Mayfair Congo** | [drc.mayfairinsurance.africa](https://drc.mayfairinsurance.africa/) | Boutons « Get a quote » sans cible | Non | Non (Paybill = Kenya uniquement) | Non | Page Claims | Non | Non | Non |
| GPA (Global Pioneer) | Aucun site trouvé | | | | | | | | |

**Conclusion clé :** en RDC, **aucun assureur ne propose aujourd'hui un parcours complet devis → souscription → paiement mobile money → attestation** sur le web. Les plus avancés sont **Activa** (appli MyACTIVA, WhatsApp 24/7, A-SureCover en USSD) et **Rawsur** (formulaires en ligne + appli). C'est l'espace que myVign peut occuper.

---

## 2. Fiches détaillées

### 2.1 SONAS ([sonas.cd](https://www.sonas.cd/))
- **Menu** : Accueil, Présentation (historique, dirigeants, statut, mission, capital…), Produits, Géolocalisation, Actualités, Partenaires, Contact, Mail.
- **Produits affichés** : automobile (obligatoire + facultatives), transport (corps, aviation, facultés), incendie, accidents et risques divers, tous risques chantiers, autres. **Pas d'habitation, voyage ni scolaire** en tant que produits grand public.
- **Page auto** : très mince (texte dupliqué, aucune formule ni aucun prix).
- **Digital** : uniquement un formulaire de contact, une newsletter et une chaîne WhatsApp. Aucun devis, paiement, espace client ni sinistre en ligne.
- **Contacts** : Immeuble Sankuru, bd du 30 Juin, Gombe. Info : +243 840 393 642 / +243 81 687 7156 (7h30–16h). Sinistre : +243 81 641 5515. sonas@sonas.cd. Agrément ARCA n° 12007.
- **Réseau** : environ 60 points (directions Est, Kinshasa-Est/Bandundu, Kinshasa-Ouest/Équateur, Ouest, Sud, Nord-Ouest), avec coquilles et doublons dans la géolocalisation.
- **Technique** : Next.js. Ton institutionnel.
- **À retenir pour myVign** : le réseau d'agences est un atout à valoriser (localisateur façon Macif). Les données d'agences devront être nettoyées. Les horaires sont contradictoires (7h30–16h contre « 24h/24 » sur la page Contact).

### 2.2 Rawsur ([rawsur.com](https://www.rawsur.com/)), filiale de Rawbank
- **Menu** : Nos solutions (Particulier / Professionnel), Offre du mois, À propos, Guide de l'assurance, recherche, FR/EN. Blog, FAQ et boutique dans le pied de page.
- **Gamme particuliers** : Autosur (auto, formules Classic / Confort / Premium), Gosur (voyage), Habitasur (MRH), individuelle accident, Kimia et Securis (vie), Educassur.
- **Gamme pros** : Autosur pro, Gosur pro, multirisque pro, TRC, transport, RC pro, Group Life, santé Vitasur.
- **Digital** : formulaires de devis, de souscription (demande sans paiement) et de déclaration de sinistre (n° de police, type, date, lieu, dégâts). Appli **My Rawsur** (juin 2023 : consultation des polices + sinistre ; souscription annoncée). Produit en ligne « Na Tshombo » (2021). Distribution bancassurance via Rawbank.
- **Faiblesses** : pas de paiement, pas d'espace web, liens « # », URL incohérentes, écran de chargement, adresse et horaires absents.
- **Contacts** : contact@rawsur.com, +243 829 999 300.
- **À retenir** : le concurrent le plus proche en grand public. Le **nommage de produits** (Autosur, Gosur, Habitasur) et le **guide de l'assurance** sont de bonnes idées de contenu.

### 2.3 SFA Congo ([sfa-congo.com](https://www.sfa-congo.com/))
- **Menu** : La SFA (canaux de distribution, fiche de connaissance client), Partenaires (SCOR), Les assurances (Entreprises / Particuliers), **Les assurances obligatoires** (rubrique dédiée), News, Nos bureaux, Contact. Lien « Déclaration sinistre » en haut, qui mène à un login.
- **Particuliers** : RC auto, multirisque auto, incendie, risques politiques, santé, voyage et évacuation sanitaire, **RC scolaire**.
- **Entreprises** : 12 produits (TRC, RC décennale, bris de machine, accidents du travail, transport…).
- **Digital** : espace client avec login, PWA. Devis = formulaire de contact. Pas de paiement.
- **Contacts** : **call center gratuit 42002** depuis la RDC. Rond-point Forescom, Gombe.
- **À retenir** : la **rubrique « assurances obligatoires »** est pédagogique et pertinente (RC auto, incendie…). Le **numéro court gratuit** est aussi une bonne idée. Les actualités ne sont pas à jour (dernière : oct. 2024).

### 2.4 Activa Assurances RDC ([rdc.group-activa.com](https://rdc.group-activa.com/)), groupe camerounais
- **Menu** : Produits (Particuliers / Entreprises), Nos agences, Services, Support & Aide. Bouton **« 24/7 Parlez à ACTIVA »** (WhatsApp).
- **Particuliers** : Automobile, Voyage, Famille, Santé et prévoyance (Santé Plus dès 120 $/an), Habitation, Dommage corporel, Épargne et retraite, RC, Caution, Décès emprunteur. **Remises affichées** en page d'accueil (-10 % auto, -15 % habitation, -25 % voyage).
- **Appli MyACTIVA** : polices et attestations, assistance 24/7, cotation, chat, e-mail, appel, localisateur d'agences, réclamations (dépôt et suivi).
- **A-SureCover** (source : candidature d'Activa aux African Insurance Awards 2026, donc déclaratif) : souscription par **USSD en moins de 3 min**, sur téléphone basique, en **français et lingala**, paiement **Airtel Money / M-Pesa / Orange Money** prélevé sur le portefeuille ou le crédit. Phase 1 en février 2026 (Kinshasa et grandes villes), phase 2 au S2 2026 (villes secondaires). Certifié ISO 27001. **Aucune page web A-SureCover trouvée.**
- **Faiblesses** : gabarits repris d'autres filiales (lien vers un partenaire malaisien), fautes de frappe, numéros incohérents, liens produits mal ciblés, pas de paiement sur le web.
- **Contacts** : (243) 815 570 000, serviceclient.rdc@group-activa.com, lun–ven 8h–17h, 4 av. Pumbu, Gombe.
- **À retenir** : **le concurrent le plus avancé** côté services (appli, WhatsApp 24/7, USSD + mobile money). Il faut au moins égaler ce niveau : attestation téléchargeable, suivi des réclamations, WhatsApp, et lingala à envisager.

### 2.5 SUNU Assurances IARD RDC ([page filiale](https://sunu-group.com/fr/notrereseau/filiales/rdc))
- Pas de site RDC propre : une simple page sur le site du groupe.
- **Produits RDC** : santé, MRH, incendie et multirisque pro, auto, transport marchandises, RC.
- **Digital** : aucun. Le « sélecteur de profil » de l'accueil groupe (pays, âge, type de bien…) mène à un lien mort.
- **Contacts** : 47 av. Ngongo Lutete, Gombe. rdc.iard@sunu-group.com, (+243) 850 184 444, call center 42 04. ARCA n° 12004.
- **À retenir** : l'idée du **sélecteur de profil** (« quelle assurance pour moi ? ») est intéressante pour orienter le visiteur.

### 2.6 Mayfair Insurance Congo ([drc.mayfairinsurance.africa](https://drc.mayfairinsurance.africa/)), groupe kényan
- Sélecteur de pays (KE, ZM, TZ, RW, UG, DRC, BW). Page RDC **majoritairement en anglais** (une version FR existe).
- **Particuliers** : Domestic Package, Motor Private, Personal Accident. **Corporate** très large (cautions, TRC, D&O, marine, carte jaune COMESA…).
- **Digital** : « Get a quote », « File a claim » et « Payment options » pointent vers « # ». Rappel (« Request callback ») disponible. Le Paybill M-Pesa concerne le Kenya uniquement.
- **Contacts** : +243 820 142 209, Rosons Tower 8e, 126 bd du 30 Juin, Gombe, lun–ven 8h30–17h30.
- **À retenir** : orienté entreprises, peu de menace sur le digital grand public.

### 2.7 Autres acteurs
- **GPA (Global Pioneer Assurance)** : agréé non-vie en 2020, aucun site ni aucune donnée trouvés.
- **Assureurs vie** : Rawsur Life, Afrissur, Activa Vie (hors périmètre auto/habitation).
- **Nouveaux entrants annoncés** : Zamara, Britam (Kenya), Jubilee.

---

## 3. Benchmarks hors RDC (inspirations)

### Macif ([agences.macif.fr](https://agences.macif.fr/)), référence d'ergonomie imposée par le README
*macif.fr refuse la lecture automatisée (HTTP 403). Seul le sous-domaine agences a été lu ; la page d'accueil et le parcours de devis Macif sont à analyser à la main dans un navigateur.*
- **Accueil agences** : titre « Assurance autour de moi », champ « Trouver une agence » + **« Utiliser ma position »**, note des avis (4,5/5 sur 151 k avis), liste des villes.
- **Résultats** : bascule **Liste / Carte**, distance, note, **statut ouvert/fermé en direct**, boutons **Prendre RDV** / Voir plus, pagination.
- **Fiche agence** : adresse, note, statut, **Afficher le numéro / Prendre RDV / Itinéraire / Nous écrire**, horaires détaillés par jour, accessibilité, plateforme téléphonique et ses horaires, avis, actualités locales, **raccourcis devis** (8 produits).
- **SEO local** : pages par ville (« assurance auto Paris »…), agences proches. URL au format `/assurance-{ville}-{dpt}/agence-{nom}-{id}`.
- **Pied de page** : mentions légales, données personnelles, cookies, accessibilité, contact.
- **À transposer** : localisateur SONAS par province ou ville (Kinshasa par commune), fiche agence avec horaires, statut, appel, itinéraire et demande de rappel (RDV), raccourcis devis sur chaque fiche.

### Baloon ([baloon.africa](https://baloon.africa/)), Côte d'Ivoire, Sénégal, Cameroun, Gabon
- Aujourd'hui positionné **B2B** (infrastructure d'assurance pour assureurs, télécoms, fintechs), après 9 ans d'assurance auto 100 % digitale en B2C.
- Promesses : **devis + souscription en 2 minutes**, paiement mobile money (Wave, Orange Money…), **signature électronique**, **attestation dématérialisée immédiate**, coffre-fort numérique, déclaration de sinistre mobile/web avec notifications.
- Distribution embarquée : assurance auto intégrée à **Orange Max it** (Côte d'Ivoire, 2025–2026) et à **Wave** (Sénégal, 2026).
- **À retenir** : le modèle « super-app mobile money » est une piste de distribution pour la SONAS (M-Pesa Vodacom, Orange Money RDC, Airtel Money).

### Autres références régionales
- **Côte d'Ivoire** : attestation auto électronique généralisée en 2023 contre la fraude ([Le360 Afrique](https://afrique.le360.ma/economie/cote-divoire-la-digitalisation-des-assurances-automobiles-un-frein-a-la-fraude-aux-attestations_4ICC54UZ4RF35HZ656NRBHDWNE/)).
- **Sénégal** : Assuraf (web + mobile), Wave × Baloon (auto/moto).
- **Cameroun** : Cova (tarification auto par IA + agrégateurs de paiement mobile, février 2026). Activa A-SureCover est né au Cameroun.

---

## 4. Cadre réglementaire

- **SNECA (ARCA)** : système national d'émission des certificats d'assurance, lancé en février 2023. Certificat électronique vérifiable par **scan de QR code**, ou en ligne par chargement du certificat ou saisie de son numéro. Opérationnel pour la RC auto et les facultés à l'importation, pas encore pour l'incendie ni la TRC (état 2024). Aucune doc API publique trouvée : **à obtenir auprès de l'ARCA**. ([présentation ARCA, GCAF 2024](https://gcaf.banque-france.fr/sites/default/files/media/2024/02/08/arca-rdc-le-sneca-ou-la-revolution-digitale-des-assurances-en-rdc.pdf))
- **Assurances obligatoires** : 6, dont RC auto et incendie.
- **Contrôles routiers** : depuis janvier 2026, les automobilistes doivent présenter leurs documents à jour, **dont l'assurance**. Une attestation électronique vérifiable (SNECA) répond directement à ce besoin.

---

## 5. Enseignements pour myVign

**Ce que personne ne fait encore en RDC (différenciation) :**
1. Un parcours web complet **devis → souscription → paiement M-Pesa / Orange Money / Airtel Money → attestation SNECA avec QR code**, sans création de compte (cf. maquette P1).
2. Une **déclaration de sinistre guidée avec suivi par statuts** (plainte n°1 contre la SONAS). Les concurrents ont au mieux un formulaire sans suivi.
3. Des **prix affichés** (aucun site concurrent n'affiche de tarif auto, sauf Activa Santé Plus).
4. Un **localisateur d'agences de qualité** façon Macif. La SONAS a le réseau le plus dense, mais ses données sont mal tenues.

**Le minimum à égaler :**
- WhatsApp 24/7 et un numéro court gratuit (Activa, SFA).
- Attestation et suivi des réclamations dans un espace client (Activa MyACTIVA).
- Rubrique pédagogique sur les **assurances obligatoires** (SFA) et un **guide de l'assurance** (Rawsur).
- Segmentation **Particuliers / Professionnels** (tous les concurrents).

**Erreurs fréquentes à éviter (constatées partout) :**
- Liens « # » et boutons de devis sans cible, gabarits copiés d'autres pays, fautes de frappe, actualités périmées, contacts et horaires incohérents, contenu en anglais.

**Contraintes de contexte à garder :**
- Seulement 8 % de smartphones : web léger et rapide, pensé d'abord pour le mobile ; prévoir un relais USSD/WhatsApp.
- Prix en **FC** dans la maquette, mais le marché parle aussi en **USD** (Activa : 120 $/an) : décider d'un affichage double ou non.
- Langues : FR en priorité ; lingala (et swahili à l'Est) à envisager (Activa propose le lingala en USSD).

---

## 6. Points restés non vérifiés
- Home, méga-menu et parcours de devis de **macif.fr** (403 en lecture automatique) : à analyser à la main.
- Fonctionnement réel de **My Rawsur** et de **MyACTIVA** (non testés) et existence publique d'**A-SureCover** en RDC.
- **API SNECA** et modalités d'intégration pour un assureur.
- Agrégateurs de paiement mobile money disponibles en RDC (à choisir pour l'intégration).
