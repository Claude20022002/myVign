# 9 · Présentation animée pour les équipes de la SONAS

Pour visiter le site, regarder [La SONAS en ligne — visite du produit, version 2](rendus/sonas-visite-du-site-v2.mp4) (2 min 17 s, Full HD). Ce film suit les écrans sur ordinateur et sur téléphone, du devis au certificat, puis de la déclaration au suivi d’un sinistre. Il présente aussi l’espace gestionnaire, les agences, la prise de rendez-vous et la demande de rappel. Les cinq vues PC sont intégrées à un ordinateur portable photographié. La bande instrumentale au piano et au likembé laisse de la place pour enregistrer une voix off.

La [première version du film](archives/visite-du-site-v1/sonas-visite-du-site.mp4) est archivée. Le [script de montage](../outils/motion/film_produit.py) permet de modifier les textes, les captures, la musique et les durées de la version 2.

**Fichiers** : [rendus/presentation_sonas_motion.mp4](rendus/) (muette) et [rendus/presentation_sonas_motion_musique.mp4](rendus/) (musique douce à −26 dB RMS, composée par `outils/musique.py`) · **1 min 49** · 1920×1080 · 25 i/s. Versions précédentes : [archives/](archives/).
**Public** : direction et équipes de la SONAS. **But** : comprendre le produit et ce qu'il apporte à la SONAS, puis demander une démonstration en direct.

Tous les chiffres viennent de l'étude de marché ([docs/Etude_marche_SONAS.docx](../../Etude_marche_SONAS.docx), sources ARCA 2024) et du benchmark ([docs/benchmark_concurrents.md](../../benchmark_concurrents.md)). Les écrans sont ceux de la démonstration réelle.

## Les 14 scènes
| # | Début | Durée | Scène | Message |
|---|---|---|---|---|
| 1 | 0:00 | 5 s | La SONAS en ligne | Titre, le site sur un vrai ordinateur et un vrai téléphone |
| 2 | 0:05 | 7 s | Le marché | 377,9 M$ de primes en 2024, 600 M$ visés en 2026, 0,5 % du PIB |
| 3 | 0:12 | 10 s | La SONAS | Part de marché de 26,4 % à 17,9 %, croissance de +4,8 % contre +12,6 %, frais de gestion de 79,6 % contre 33 %. Le levier : 1 point de frais de gestion vaut environ 0,6 M$ par an |
| 4 | 0:22 | 6,5 s | La concurrence | My Rawsur, A-SureCover, SNECA. Personne ne fait le parcours complet |
| 5 | 0:28 | 6 s | La solution | Prix → paiement → certificat QR → sinistre suivi |
| 6 | 0:34 | 10 s | Souscrire | Le prix avant l'identité, avec le vrai parcours à l'écran |
| 7 | 0:44 | 9,5 s | Payer | Mobile money, couverture au paiement (art. 16), certificat provisoire puis SNECA (art. 120) |
| 8 | 0:54 | 6,5 s | Contrôle routier | Vérification par QR, nom masqué, frein à la fraude |
| 9 | 1:00 | 10 s | Sinistre | 112 d'abord, jamais bloqué (art. 19), pièces adaptées, suivi par étapes |
| 10 | 1:10 | 7 s | Espace gestionnaire | Vue PC réelle : file des dossiers, actions autorisées, client informé |
| 11 | 1:17 | 8,5 s | Réseau | Vue PC réelle de la page agences (liste + carte) : 59 agences, 20 provinces sur 26 |
| 12 | 1:26 | 9 s | Ce que la SONAS y gagne | Primes, frais de gestion, fraude, confiance, données |
| 13 | 1:35 | 9 s | Prochaines étapes | Plateforme réelle, paiements, SNECA, puis ce dont on a besoin de la SONAS |
| 14 | 1:44 | 5 s | Fin | « Avec la SONAS, c'est réglé. » · Voir la démonstration en direct |

La scène « Pensé pour la RDC » de la version longue a été retirée pour tenir en 1 min 50. Les vues PC (ouverture, espace gestionnaire, agences) sont de vraies captures projetées sur la photo d'un vrai portable ; les vues mobiles sont dans un vrai cadre de Pixel 8. Les points FC / $ et Code des assurances restent dans les scènes 6, 7 et 9. La version longue (2 min 46) peut être refaite depuis l'historique du fichier `presentation.html`.

## Voix off

> **Voix générée le 19/11/2026** : « Adina - Young, Welcoming and Joyful » (bibliothèque ElevenLabs, voix féminine française standard, offre gratuite ; la première version avec « Paul K » est archivée dans `archives/v3_2026-11-19_voix_paul_k/`). Textes réécrits avec des liaisons entre les répliques, modèle Eleven v4, via `outils/voix_elevenlabs.py` (fenêtre Edge dédiée, connectée par l'utilisateur). Fichiers : `voix/presentation/Sxx.mp3`. Mixage : `outils/mixer_voix.py` (voix −19 dB RMS, musique −30 dB, −38 dB sous la voix) → `rendus/presentation_sonas_motion_voix.mp4`.
À générer dans ElevenLabs (Eleven v4, même voix que le film, ton posé et professionnel) : un fichier par scène, `voix/presentation/S01.wav` à `S14.wav`. Le mixage se fait ensuite avec le **prompt C** de [08-guide-production.md](08-guide-production.md). Les textes sont calibrés à environ 2,5 mots par seconde : vérifier à l'écoute qu'aucun ne déborde sur la scène suivante.

| Scène | Pose à | Texte à coller dans ElevenLabs |
|---|---|---|
| S01 | 0:00.2 | `[warm] Voici la Sonasse en ligne : souscrire, payer et être indemnisé, simplement.` |
| S02 | 0:05.8 | `[confident] En RDC, le marché de l'assurance a plus que quintuplé depuis 2019. Pourtant, il reste largement à conquérir.` |
| S03 | 0:13.5 | `[calm] La Sonasse dispose du premier réseau du pays. Mais sa part de marché recule, et ses frais de gestion absorbent près de quatre-vingts pour cent des primes.` |
| S04 | 0:22.5 | `[serious] Pendant ce temps, les concurrents se sont lancés en ligne. Mais aucun n'offre encore le parcours complet.` |
| S05 | 0:28.9 | `[confident] C'est précisément ce que propose la Sonasse en ligne, de bout en bout.` |
| S06 | 0:35.0 | `[warm] D'abord, le client saisit sa plaque et retrouve son véhicule. Ensuite, trois questions suffisent pour afficher le prix, en francs ou en dollars.` |
| S07 | 0:45.0 | `[confident] Puis il paie avec son mobile money. Dès que le paiement est confirmé, il est couvert, et son certificat arrive aussitôt.` |
| S08 | 0:54.5 | `[pleased] Ainsi, au contrôle routier, le code Q R se vérifie en quelques secondes.` |
| S09 | 1:01.0 | `[reassuring] Et en cas de sinistre, la sécurité passe d'abord. La déclaration n'est jamais refusée pour retard, puis le dossier se suit en direct.` |
| S10 | 1:11.0 | `[calm] De leur côté, les gestionnaires instruisent chaque dossier, tandis que le client en voit chaque étape.` |
| S11 | 1:18.0 | `[proud] Enfin, les cinquante-neuf agences des vingt provinces deviennent visibles, avec leurs horaires et la prise de rendez-vous en ligne.` |
| S12 | 1:26.5 | `[confident] Pour la Sonasse, c'est donc plus de primes, moins de frais de gestion, moins de fraude, et davantage de confiance.` |
| S13 | 1:35.5 | `[calm] La démonstration est prête. Pour passer à la suite, il nous faut le barème, les horaires des agences et l'accès au SNECA.` |
| S14 | 1:44.5 | `[warm] Bref, avec la Sonasse, c'est réglé.` |

## La refaire ou la modifier
Les textes, chiffres et durées sont dans `docs/marketing/outils/motion/presentation.html` (une `<section>` par scène, `data-dur` = durée, `data-in` = apparition en secondes).
```bash
pnpm dev                                         # à la racine : site + API simulée (pour la carte)
cd docs/marketing/outils/motion
python preparer.py C:/chemin/cache               # carte, icônes, images des inserts
python rendu.py C:/chemin/cache --images 12 60   # images de contrôle
python rendu.py C:/chemin/cache                  # vidéo complète (environ 10 min)
```
Les polices sont chargées depuis Google Fonts : il faut une connexion Internet pendant le rendu. L'émulateur Android doit être arrêté pendant le rendu, sinon la mémoire du PC est saturée.
