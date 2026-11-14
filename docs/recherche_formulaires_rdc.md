# Besoins SONAS et RDC : ce que les formulaires de myVign doivent demander

Recherche du 14/11/2026. Complète [benchmark_concurrents.md](benchmark_concurrents.md)
(offres concurrentes) et [Etude_marche_SONAS.docx](Etude_marche_SONAS.docx) (chiffres du marché).
Ce document fixe **les champs, les pièces et les règles** que chaque parcours doit respecter, avec
leur justification légale ou métier.

Légende de la colonne « Source » : **CA** = Code des assurances (loi n° 15/005 du 17 mars 2015),
**SITE** = sonas.cd ([docs/sonas-site/](sonas-site/)), **MAQ** = maquettes « Sonas - troisième version ».
Obligatoire : **O** = oui, **F** = facultatif, **C** = conditionnel.

---

## 1. Règles légales qui façonnent les parcours

| Règle | Article | Conséquence pour myVign |
|---|---|---|
| La proposition d'assurance porte les informations nécessaires à l'appréciation du risque ; l'assuré doit répondre exactement aux questions posées | CA 3, 13, 47 | Chaque question de déclaration du risque doit être explicite et fermée. On ne déduit rien en silence. |
| Fausse déclaration intentionnelle : contrat nul et primes conservées. Omission non intentionnelle : surprime ou réduction proportionnelle de l'indemnité | CA 14, 15 | Avertissement clair avant le récapitulatif, case « je certifie l'exactitude » et horodatage des réponses. |
| Projet de contrat ou notice remis avant la conclusion ; les clauses de nullité ou de déchéance doivent être **en caractères apparents** | CA 7, 9 | Notice et conditions générales téléchargeables **avant paiement** ; exclusions et déchéances en gras dans le récapitulatif. |
| Contrat « constaté par écrit » et **signé** ; la note de couverture engage avant la police | CA 6, 8 | La signature en ligne n'est pas prévue par le CA. Le Code du numérique (ord.-loi 23/010 de 2023) reconnaît le contrat électronique (art. 89, 95-97) : **validation juridique SONAS ou ARCA nécessaire**. En attendant : note de couverture en ligne et police signée ensuite (logique « rappel conseiller » des maquettes). |
| **La prise d'effet est subordonnée au paiement de la prime** ; pas de délai de paiement pour l'auto | CA 16 ; SITE | Pas de couverture avant la confirmation du paiement. Un paiement « en vérification » (E5) ne donne aucune couverture. |
| Certificat RC auto délivré **sous 10 jours** ; certificat provisoire valable 1 mois au plus | CA 120 | Après paiement : certificat provisoire immédiat (PDF + QR), certificat définitif via SNECA. |
| Remise à l'assuré du contrat, de la notice et de la proposition signée | CA 20 | Espace « mes documents » ou envoi par e-mail ou SMS avec lien. |
| Avis d'échéance au moins **30 jours avant** | CA 22 | Rappel de renouvellement par SMS, e-mail et WhatsApp à J-30 (et relances). |
| Résiliation annuelle par l'assuré, préavis d'1 mois ; changement de situation dans les 3 mois | CA 25, 27 | Prévoir une demande de résiliation et de modification (au moins par formulaire de contact). |
| Véhicule vendu : suspension au 5e jour, résiliation à 6 mois | CA 32 | Parcours « j'ai vendu mon véhicule » (phase 2). |
| Sinistre : délai contractuel **≥ 8 jours ouvrables** (5 jours pour un vol) ; retard opposable seulement si l'assureur prouve un préjudice | CA 18, 19 | Le site SONAS annonce **48 h pour un vol**, en dessous du minimum légal de 5 jours : à faire corriger par la SONAS. Ne jamais bloquer une déclaration tardive. |
| Offre d'indemnité sous 3 mois après le dossier complet ; rétractation 7 jours ; paiement sous 15 jours | CA 21 | Suivi par statuts avec dates (« dossier complet le… », « offre attendue avant le… »). |
| RC auto : offre sous 6 mois après l'accident | CA 134 | Idem, pour les tiers victimes. |
| Données personnelles : consentement « exprès et non équivoque » | Code du numérique, art. 2 | Case de consentement non précochée, et politique de confidentialité accessible depuis chaque formulaire. |

---

## 2. Données de référence RDC (listes et formats des champs)

**Téléphone**
- Format `+243` suivi de 9 chiffres (national : `0` + 9 chiffres). Afficher `+243` en préfixe fixe.
- Préfixes usuels :
  - Vodacom (M-Pesa) : 81, 82, 83 ;
  - Airtel (Airtel Money) : 97, 98, 99 ;
  - Orange (Orange Money) : 80, 84, 85, 89 ;
  - Africell (Afrimoney) : 90, 91.
- La portabilité rend ces préfixes indicatifs : **ne jamais bloquer** un numéro sur ce critère, seulement préremplir le moyen de paiement.

**Pièce d'identité** (pas de CNI généralisée en 2026)
- Carte d'électeur CENI (pièce de fait la plus répandue), passeport, permis de conduire, CNI biométrique ONIP (en déploiement, identification de masse annoncée pour décembre 2026), carte de résident ou passeport étranger pour les non-nationaux.
- Champs : type, numéro, date d'expiration (sauf carte d'électeur).
- RDC-PASS (identité numérique, juin 2026) : à surveiller comme futur moyen de KYC.

**Personne morale**
- Raison sociale, RCCM, Id. Nat., NIF, représentant légal (nom, fonction), adresse du siège.
- Nécessaire pour les flottes (dès 3 véhicules), l'incendie des bâtiments professionnels (art. 210) et la RC pro.

**Adresse** (pas de code postal en RDC)
- Province, ville, commune, quartier, avenue et numéro, point de repère (texte libre : « en face de… »).
- Les adresses SONAS suivent ce format (« 96, av. Kamba, C/Dilala, Q/Biashara, Kolwezi »).
- Géolocalisation optionnelle (bouton « utiliser ma position »).

**Provinces (26)**
Kinshasa, Kongo-Central, Kwango, Kwilu, Mai-Ndombe, Kasaï, Kasaï-Central, Kasaï-Oriental, Lomami,
Sankuru, Maniema, Sud-Kivu, Nord-Kivu, Ituri, Haut-Uele, Bas-Uele, Tshopo, Nord-Ubangi, Sud-Ubangi,
Mongala, Équateur, Tshuapa, Tanganyika, Haut-Lomami, Lualaba, Haut-Katanga.

**Communes de Kinshasa (24)**
Bandalungwa, Barumbu, Bumbu, Gombe, Kalamu, Kasa-Vubu, Kimbanseke, Kinshasa, Kintambo, Kisenso,
Lemba, Limete, Lingwala, Makala, Maluku, Masina, Matete, Mont-Ngafula, Ndjili, Ngaba, Ngaliema,
Ngiri-Ngiri, Nsele, Selembao. *(Liste à revérifier en cas de réforme administrative.)*

**Immatriculation**
- Nouvelle plaque sécurisée DGI lancée le 6 janvier 2026, pour les véhicules neufs d'abord. Les anciennes plaques restent valables au moins jusqu'à fin 2026.
- Le code pays **CGO devient COD** (décret de janvier 2026).
- Format de la maquette : 4 chiffres, 2 lettres, code province (ex. `4521AB 01`). Le format exact de la nouvelle plaque n'est pas confirmé : la validation doit accepter les deux formats. Toujours proposer « je n'ai pas encore de plaque » (véhicule neuf : n° de châssis).
- Document du véhicule : **carte rose** (certificat d'immatriculation), délivrée par la DGI, avec date de mise en circulation.

**Monnaie**
- Les maquettes sont en FC (CDF), mais le marché et la SONAS raisonnent aussi en USD (plafonds de garanties en dollars sur sonas.cd).
- Le CA renvoie à la réglementation de change de la BCC pour les contrats en devises (art. 356).
- **Décision à prendre** : affichage en FC seul ou double FC/USD, et devise de paiement (les agrégateurs gèrent CDF et USD).

**Langues**
- Français en priorité ; lingala, puis swahili pour l'Est, à prévoir dans l'architecture (i18n) dès le départ.

---

## 3. Champs par parcours

### 3.1 Souscription auto (MAQ A1-A10)

| Étape | Champ | Type | Oblig. | Source / remarque |
|---|---|---|---|---|
| A1 Souscripteur | Qui conduit principalement | radio (moi-même, conjoint, concubin, enfant) | O | MAQ |
| | Type de souscripteur | radio (particulier, entreprise) | O | **Manque dans MAQ** : flottes et personnes morales (CA 108, SITE) |
| | Civilité, prénom, nom (et post-nom) | texte | O | Ajouter **post-nom**, usuel en RDC |
| | Date de naissance | date | O | Âge 21-75 ans (règle relevée sur une page applisonas, à confirmer) |
| | **Profession** | liste + autre | O | **Manque dans MAQ** : mention obligatoire du certificat (CA 121) |
| | Pièce d'identité (type, n°) | liste + texte | O | KYC (voir §2) |
| | E-mail | email | O* | MAQ. *Rendre facultatif si le téléphone suffit : beaucoup d'assurés n'ont pas d'e-mail actif. |
| | Téléphone | tel +243 | O | MAQ |
| | Adresse (province, ville, commune, quartier, avenue, n°, repère) | composé | O | Format RDC (§2) |
| A2 Conducteurs | Date d'obtention du permis | mois/année | O | MAQ ; exclusion si permis absent (CA 114) |
| | **N° et catégorie de permis** | texte + liste | O | Manque dans MAQ, utile au sinistre |
| | Permis délivré en RDC | oui/non | O | MAQ |
| | Autres conducteurs (identité, permis, lien) | répétable | C | MAQ |
| A3 Véhicule | Catégorie | radio (particulier, 4×4/SUV/pick-up, utilitaire, moto, minibus, camion) | O | MAQ ; ajouter **moto** (très répandue, citée par la SONAS Tshikapa) |
| | Immatriculation | texte formaté | C | MAQ ; ou n° de châssis si pas encore de plaque |
| | **N° de châssis / moteur** | texte | C | CA 121 (identification si pas d'immatriculation) |
| | Marque, modèle, énergie | recherche + saisie | O | MAQ |
| | **Puissance fiscale (CV)** | nombre | O | **Manque dans MAQ** : critère de tarif RC (SITE) |
| | **Nombre de places** | nombre | O | **Manque dans MAQ** : critère de tarif pour les tiers transportés (SITE) |
| | **Année de fabrication** | année | O | Critère de tarif (SITE, vétusté) |
| | Date de 1re mise en circulation | mois/année | F | MAQ |
| | Date de la carte rose | mois/année | O | MAQ |
| | Titulaire de la carte rose | radio | O | MAQ |
| | **Valeur vénale** | montant | C | **Manque dans MAQ** : nécessaire pour dommages, incendie, vol et tous risques (SITE) |
| A4 Antécédents | Sinistres sur 36 mois (0, 1, 2+) | segmenté | O | MAQ (blocage au-delà de 2) |
| | Suspension ou annulation de permis | oui/non + date | O | MAQ |
| A5 Usage | Usage | radio (privé, domicile-travail, professionnel, **transport public, taxi, location**) | O | MAQ ; ajouter les usages commerciaux, majoritaires en RDC (taxis, taxis-bus, motos-taxis) |
| | Kilométrage annuel | nombre | O | MAQ |
| | Stationnement de nuit, adresse | radio + adresse | O | MAQ |
| A6 Formule | RC seule, RC + incendie/vol, tous risques | carte | O | MAQ (Tiers Eko, Tiers Intégrale, Tous risques) ; à aligner sur les garanties SONAS |
| | Individuelle occupant | option | F | SITE (plafonds 1 000 / 1 200 / 750 $) |
| | Franchise et rachat de franchise | segmenté | O | MAQ ; rachat possible moyennant 20 % de la prime pure (SITE) |
| | **Extension carte jaune (SADC/COMESA)** | option | F | SITE ; utile à l'Est et au Katanga |
| A7 Contrat | Date d'effet | date (≤ 14 jours si anticipée) | O | MAQ ; effet **après paiement** (CA 16) |
| | **Durée** | radio (1 an, courte durée) | O | **Manque dans MAQ** : courte durée au prorata (SITE) |
| A8 Paiement | Moyen | M-Pesa, Orange Money, Airtel Money, **Afrimoney**, carte, **en agence** | O | MAQ + vidéo (« payer en agence ») ; ajouter Airtel et Afrimoney |
| A9 Récap | Certification d'exactitude et consentement aux données | cases non précochées | O | CA 13-15, Code du numérique |

### 3.2 Souscription habitation / incendie (MAQ B1-B10)

| Champ | Oblig. | Source / remarque |
|---|---|---|
| Statut d'occupation (propriétaire occupant, propriétaire bailleur, locataire, **occupant à titre gratuit**, colocataire) | O | SITE liste aussi l'occupant à titre gratuit et le dépositaire |
| Usage du bâtiment (habitation privée, commerce, bureau, école, santé, industriel, immeuble de rapport) | O | **Manque dans MAQ** : distingue l'incendie **obligatoire** (CA 210) du MRH facultatif |
| Adresse du risque (format RDC) | O | |
| Type (maison, appartement, parcelle avec annexes), nombre de pièces, surface | O | MAQ |
| **Matériaux de construction** (dur, semi-dur, tôle, bois) | O | Critère de risque incendie habituel, absent de la MAQ, à confirmer avec la SONAS |
| Propriétaire : **valeur du bâtiment** ; locataire : **loyer mensuel** | O | SITE : critère explicite de la proposition SONAS |
| Valeur du contenu, objets de valeur | O | MAQ ; une sous-assurance de plus de 33 % entraîne la déchéance (CA 215) : afficher un avertissement |
| Garanties : incendie de base, complémentaires (dommages électriques, tempête, choc de véhicule, feu de brousse, éruption volcanique…), MRH (dégât des eaux, bris de glace, vol, RC chef de famille) | O | SITE ; l'éruption volcanique compte à Goma |
| Antécédents (sinistres 3 ans) | O | MAQ |
| Accord pour une visite ou expertise du risque | O | SITE : la SONAS peut expertiser la valeur |

### 3.3 Voyage (absent des maquettes)

Destination (Schengen ou reste du monde), dates de départ et de retour (9 tranches de durée),
date de naissance de chaque voyageur (tarif < 64 ans ou ≥ 64 ans), passeport (n°, expiration),
contact d'urgence. Sortie : attestation pour le visa Schengen. Source : SITE.

### 3.4 Déclaration de sinistre auto (MAQ C1-C10)

| Champ | Oblig. | Source / remarque |
|---|---|---|
| Identification : n° de contrat **ou** immatriculation + téléphone | O | MAQ ; sans compte |
| Type : accident, vol, vandalisme, bris de glace, incendie, événement climatique, panne | O | MAQ |
| Date, heure, lieu (province, ville, commune, description) | O | MAQ |
| Circonstances (situation + texte libre de 500 caractères) | O | MAQ |
| Zones de choc, nature des dégâts, véhicule roulant | C | MAQ |
| Blessés, intervention de la police | O | MAQ ; s'il y a des blessés : **112** et la ligne sinistre SONAS +243 81 641 5515 |
| Conducteur au moment du sinistre (identité, permis) | O | Exclusion si permis invalide (CA 114) |
| Tiers (identité, immatriculation, **assureur du tiers**, n° de certificat) | C | Manque dans MAQ : utile au recours entre assureurs |
| Responsabilité estimée (0, 50, 100 %) | F | MAQ |
| Pièces (photos, PDF) | F | MAQ : jamais bloquant (aligné sur CA 19) |

**Liste de pièces dynamique** (SITE, gestion des sinistres), affichée selon le cas et transmissible plus tard :

| Cas | Pièces |
|---|---|
| Tout accident | PV ou constat de police |
| Dégâts matériels | Devis de réparation, photos |
| Dommages corporels | Factures de soins, rapport médical, pièce d'identité |
| Décès | Certificat de décès et permis d'inhumation (**originaux** : dépôt en agence à prévoir) |
| Vol | Déclaration à la police, clés, carte rose |
| Incendie du véhicule | Constat de police, justificatifs d'entretien (SITE) |

### 3.5 Déclaration de sinistre habitation (MAQ H1-H10)

Identification, type (dégât des eaux, incendie, dommage électrique, vol ou vandalisme, bris de glace,
événement climatique), situation (locataire, propriétaire…), date et lieu, circonstances,
pièces endommagées, tiers victime ou responsable, biens endommagés (catégorie, marque, valeur), photos.
**Ajouter** : n° de PV de police (vol, incendie), intervention des pompiers, et déclaration sous 15 jours
en cas de victimes corporelles d'un incendie (CA 214).

### 3.6 Transversal

- **Demande de rappel** (MAQ aide) : téléphone, créneau, sujet prérempli et contexte du dossier transmis.
- **Reprise de dossier** : devis conservé 30 jours (MAQ) ; reprise par lien SMS ou n° de dossier + téléphone (OTP).
- **Vérification d'attestation** (à ajouter) : saisie d'un n° de certificat ou d'une immatriculation, ou scan du QR, avec résultat « valide jusqu'au… ». Utile aux contrôles routiers renforcés depuis janvier 2026.

---

## 4. Paiement

- **Opérateurs** : M-Pesa (Vodacom), Orange Money, Airtel Money, Afrimoney (Africell), plus carte bancaire et paiement en agence.
- **Agrégateurs RDC** relevés (multi-opérateurs, CDF et USD, sandbox annoncée ; contrats et tarifs à vérifier) :
  - [FlexPay](https://github.com/davidkathoh/Flexpay) : USSD push, webhook, SDK JS/PHP ;
  - [SerdiPay](https://serdipay.com/) ;
  - [EasyPay Gateway](https://www.easypay-gateway.com/) ;
  - Maxicash.
- **Flux** : USSD push vers le téléphone, puis validation par PIN, puis webhook. Les cas E3 (refus), E4 (expiration 2 min) et E5 (statut incertain) des maquettes correspondent exactement à ce mécanisme. La page de paiement doit interroger le statut et **interdire un second paiement** pendant la vérification.
- **Reçu** : n° de transaction de l'opérateur, montant, devise, date. Ce reçu tient lieu de quittance (exigée notamment pour les mutations immobilières, CA 229).

---

## 5. Attestation / certificat RC auto

**Mentions obligatoires** (CA 121-122) :
- intitulé « Certificat d'assurance » ou « Certificat provisoire d'assurance » ;
- nom et adresse de l'assureur (SONAS SA, agrément ARCA 12007) ;
- nom, adresse **et profession** du souscripteur ;
- n° de contrat et période couverte par la prime payée ;
- véhicule : nature, type, marque, immatriculation ou n° de moteur ou de châssis ;
- pays couverts si extension (carte jaune).

**SNECA (ARCA)**
- Système lancé en février 2023 pour authentifier et tracer les certificats. Interconnecté à SYDONIA (douane) pour les facultés à l'importation et la RC frontière. La RC auto routière était annoncée pour fin 2023 et la police routière a été formée à la plateforme.
- **Aucune documentation d'API publique** : l'intégration (émission et vérification) doit être obtenue auprès de l'ARCA par l'intermédiaire de la SONAS.
- **Duplicata** en cas de perte ou de vol (CA 124) : à prévoir dans l'espace client.

---

## 6. Écarts entre les maquettes et ces besoins

1. **Profession** du souscripteur absente, alors qu'elle est obligatoire sur le certificat (CA 121).
2. **Critères de tarif SONAS** absents : puissance fiscale, nombre de places, année de fabrication, valeur vénale.
3. **Personnes morales et flottes** non prévues (entreprises, administrations : CA 108 al. 4).
4. **Usages commerciaux** (taxi, transport public, moto-taxi) et **motos** absents.
5. **Durée courte** et **carte jaune** absentes.
6. **Airtel Money et Afrimoney** absents ; **paiement en agence** présent dans la vidéo mais pas dans le PDF.
7. **Incendie obligatoire des bâtiments professionnels** non distingué du MRH.
8. **Voyage, individuelle accident, scolaire** : aucun parcours ; la SONAS n'affiche pas d'offre scolaire.
9. **Post-nom** et **adresse sans code postal** à intégrer au formulaire d'identité.
10. **Vérification d'attestation** et **duplicata** absents.

---

## 7. Questions à poser à la SONAS

1. Grilles tarifaires RC et facultatives (puissance fiscale, usage, vétusté, places), et devise de tarification.
2. Liste officielle des pièces KYC acceptées en ligne, et position sur la **signature électronique** (Code du numérique) ou sur la nécessité d'une signature en agence.
3. Accès à l'**API SNECA** (émission et vérification) et délai d'obtention.
4. Agrégateur de paiement et comptes marchands déjà ouverts par la SONAS.
5. Délai réel de déclaration d'un vol (site : 48 h ; loi : 5 jours minimum).
6. Existence d'un produit **scolaire** ; libellés officiels des formules auto et habitation.
7. Horaires, téléphones et coordonnées GPS des 62 agences (données actuelles incomplètes).
8. Charte graphique : vert des maquettes ou identité bleu, jaune et rouge du logo SONAS.

---

## Sources

- Code des assurances, loi n° 15/005 : [texte sur leganet.be](https://www.leganet.be/Legislation/Droit%20economique/Ass/Loi%2015%20mars%202015.html), [JO sur arca.cd](https://arca.cd/wp-content/uploads/2022/04/Code_des_Assurances.pdf)
- Site SONAS : [sonas.cd](https://www.sonas.cd/) (copie locale : [sonas-site/](sonas-site/))
- SNECA : [Actu30](https://actu30.cd/2023/02/rdc-larca-lance-sneca-sa-plate-forme-digitale-pour-assurer-le-controle-des-assurances-obligatoires/), [Le Potentiel](https://lepotentiel.cd/2023/02/23/t-assurances-larca-met-en-place-son-systeme-digital-pour-lemission-des-certificats-authentiques/), [Econews RDC](https://econewsrdc.com/pour-un-meilleur-quadrillage-du-marche-des-assurances-larca-se-dote-dun-systeme-national-demission-des-certificats-dassurance-sneca/), [SNECA-SYDONIA](https://congoprofond.net/interconnexion-sneca-et-sydonia-arca-et-dgda-main-dans-la-main-pour-un-controle-efficace-des-assurances-obligatoires/), [arca.cd](https://arca.cd/)
- RC auto et SONAS : [La Prospérité, cartes roses](https://www.laprosperite.cd/obtention-gratuite-des-cartes-roses-rdc-la-sonas-sa-passe-a-la-vitesse-superieure/), [Le Soft, DGI et SONAS](https://lesoftonline.net/articles/la-sonas-reprend-de-facto-le-monopole-de-l%E2%80%99assurance-automobile), [Netic, Tshikapa](https://www.netic-news.net/tshikapa-la-sonas-accorde-30-jours-aux-proprietaires-de-vehicules-pour-souscrire-a-lassurance-automobile/), [Congo Press](https://www.congo-press.com/economie/kinshasa-vignette-et-assurance-obligatoires-mais-difficilement-accessibles/), [applisonas.com](https://applisonas.com/assurance-automobile/)
- Plaques : [AllAfrica, nouvelle plaque DGI](https://fr.allafrica.com/stories/202601060062.html), [Actualite.cd, décret CGO → COD](https://actualite.cd/2026/01/25/rdc-adoption-du-projet-de-decret-modifiant-et-completant-le-decret-portant-determination), [eplaque.fr](https://www.eplaque.fr/infos/nouvelle-plaque-congo-rdc)
- Identité : [IRB Canada](https://irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=458735), [ID4Africa 2026, ONIP](https://id4africa.com/2026/files/T1-3-5-DR-Congo-FINAL.pdf), [Actualite.cd, identification de masse](https://actualite.cd/2026/09/16/rdc-lidentification-de-masse-de-la-population-annoncee-pour-mi-decembre-2026)
- Téléphonie : [UIT +243](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000370001MSWE.docx), [sent.dm](https://www.sent.dm/en/resources/phone-number-standards/cd)
- Paiement : [FlexPay, blog](https://davidkathoh.medium.com/tout-savoir-sur-lacc%C3%A8s-%C3%A0-l-api-de-paiement-mobile-money-en-rd-congo-3197330fa259), [SerdiPay](https://serdipay.com/), [EasyPay Gateway](https://www.easypay-gateway.com/)
- Numérique : [Code du numérique (droitnumerique.cd)](https://droitnumerique.cd/wp-content/uploads/2024/08/Code-du-numerique-I-RD-Congo.pdf), [mémoire sur le contrat électronique](https://www.memoireonline.com/12/25/14767/m_La-preuve-du-contrat-electronique-sous-lere-du-numerique-en-droit-congolais9.html), [arrêté de février 2026](https://droitmediasfinance.com/index.php/actualites/droit-tech-fintech/1216-rdc-un-arrete-de-fevrier-2026-vient-fixer-les-conditions-et-modalites-des-autorisations-pour-les-activites-et-services-numeriques-avec-delai-de-conformite-au-30-juin-2026)
- Anti-blanchiment : [Ouragan, CENAREF et ARCA](https://ouragan.cd/2024/01/la-cenaref-et-larca-resolument-engagees-dans-la-lutte-contre-le-blanchiment-de-capitaux-et-le-financement-du-terrorisme-en-rdc), [ARCA, règlement 001/19](https://arca.cd/wp-content/uploads/2022/02/Reglement-R-001-_19-relatif-a-la-distribution-des-produits-d039assurances-par-les-banques.pdf)
