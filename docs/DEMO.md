# Script de démonstration myVign

Pour la personne qui présente la plateforme à la SONAS. Durée : 12 à 15 minutes.
Tout est simulé : aucun paiement réel, aucune donnée transmise à la SONAS (un bandeau le rappelle en haut de chaque page).

## Avant la réunion (5 minutes)

1. À la racine du dépôt : `pnpm install`, puis `pnpm dev`.
   Le site démarre sur http://localhost:3000 (ou 3001 si le port est pris) et l'API simulée sur http://localhost:4010.
2. Ouvrir le site **sur un téléphone** si possible (même réseau Wi-Fi, adresse « Network » affichée par `pnpm dev`) : c'est l'usage réel en RDC.
3. Garder un **deuxième onglet** ouvert sur `/gestion` (espace gestionnaire) pour la scène 3.
4. Le serveur simulé repart de zéro à chaque redémarrage : les dossiers créés pendant la démo disparaissent ensuite.

## Scène 1 · Souscrire une assurance auto en 3 minutes

Message : *le prix avant toute question personnelle, le paiement sur le téléphone, le certificat tout de suite.*

| Étape | Action | À souligner |
|---|---|---|
| Accueil | Montrer « Que souhaitez-vous faire ? », puis la bascule **FC / $** (taux du jour) | Aucun compte à créer |
| Plaque | Toucher l'exemple **4521AB 01** puis Continuer | La plaque pré-remplit le véhicule |
| Véhicule | « Oui, c'est mon véhicule » | Rien à taper |
| Usage | « Privé et trajet travail », « Garage fermé » | 2 touches |
| Conducteur | Deux dates (naissance, permis) | **3 questions suffisent pour le prix** |
| Tarif | Comparer les 3 formules, basculer en $ | Prix affichés, ce qu'aucun concurrent ne fait en RDC |
| Coordonnées | Prénom, nom, téléphone **81 234 5678**, profession, commune, avenue | La pièce d'identité est demandée plus tard (certificat définitif) |
| Validation | Les 2 cases | Exigence du Code des assurances (art. 13-15) |
| Paiement | M-Pesa suggéré d'après le numéro, « Payer » | L'écran attend la validation sur le téléphone |
| Certificat | Certificat provisoire avec QR code | Couverture dès le paiement (art. 16) |

**Variante plaque introuvable (cas E2)** : toucher **0000AA00** → l'écran suivant demande de décrire le véhicule.

**Cas de paiement** : le numéro de paiement décide de la réponse de l'opérateur simulé :

| Fin du numéro | Résultat |
|---|---|
| …0001 | Paiement refusé (E3) |
| …0002 | Demande expirée (E4) |
| …0003 | Réseau lent : paiement en vérification, aucun second paiement possible (E5) |
| autre | Paiement validé après quelques secondes |

Le choix **« Payer en agence »** donne une référence à présenter au guichet.

## Scène 2 · Le contrôle routier (1 minute)

Message : *une attestation infalsifiable, vérifiable par la police en 5 secondes.*

Sur le certificat, toucher **« Tester la vérification »** (ou scanner le QR code avec un autre téléphone si le site est accessible sur le réseau). La page affiche « Attestation valide », le véhicule et la période ; **le nom de l'assuré est masqué**. Saisir un faux code sur `/verifier` : « Code inconnu ».

## Scène 3 · Déclarer et suivre un sinistre (5 minutes)

Message : *c'est la plainte n°1 des assurés de la SONAS (indemnisation lente et opaque). Ici, chaque étape est visible.*

1. Client : « Déclarer un sinistre » → **Sinistre auto**. Premier écran : la sécurité et le **112** avant tout.
2. Remplir : téléphone 81 234 5678, plaque 4521AB 01, « Accident », date et heure, commune, une phrase de récit, une zone touchée sur le schéma, un tiers.
3. Envoyer : le numéro de sinistre s'affiche avec **la liste des pièces adaptée au cas** (accident avec tiers : constat, devis, PV). Ouvrir « Suivre mon dossier ».
4. Gestionnaire (onglet `/gestion`) : le dossier apparaît dans la file. Cliquer **« Ouvrir l'instruction »**, puis **« Missionner un expert »**, puis **« Envoyer l'offre »**. Seules les actions autorisées sont proposées ; un refus exige un motif.
5. Revenir à l'onglet client : **la chronologie s'est mise à jour toute seule**, chaque étape datée et expliquée.

Argument chiffré de l'étude : 79,6 % de frais de gestion à la SONAS contre 33 % pour le marché. Un dossier complet dès la déclaration et un suivi en libre-service réduisent les appels et les allers-retours.

## Scène 4 · Le réseau d'agences (1 minute)

`/agences` : 59 agences dans 20 provinces sur 26. Choisir **Kinshasa** puis **Haut-Katanga** : la carte zoome, liste et marqueurs sont numérotés ensemble. **« Prendre RDV »** sur une agence : créneaux à l'heure locale (Lubumbashi a une heure d'avance), confirmation par SMS. Montrer une page ville (`/agences/haut_katanga/lubumbashi`), conçue pour le référencement local.

## Ce qu'il faut dire honnêtement

- Les **tarifs sont indicatifs** : le barème réel viendra de la SONAS.
- Les **horaires d'agence** sont fictifs, et les positions sur la carte approximatives.
- Le **certificat définitif** suppose l'accès au SNECA (ARCA), à obtenir avec la SONAS.
- L'**espace gestionnaire** n'est pas protégé dans la démo ; en production il sera séparé, avec double authentification, rôles et journal d'audit.

## Si quelque chose bloque

- Page « Une erreur technique est survenue » : l'API simulée est arrêtée → relancer `pnpm dev`. Les réponses du client restent enregistrées.
- Dossier de suivi introuvable : le serveur simulé a redémarré (tout est en mémoire) → refaire une déclaration.
