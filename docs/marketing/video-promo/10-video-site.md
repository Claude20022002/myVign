# 10 · Vidéo de présentation du site

**Fichiers** : [rendus/site_sonas_en_ligne.mp4](rendus/) (muette) et [rendus/site_sonas_en_ligne_musique.mp4](rendus/) (musique douce en fond) · **1 min 15** · 1920×1080 · 25 i/s.
**But** : montrer le site lui-même, sans chiffres de marché, sur ordinateur et sur téléphone. Utilisable devant la SONAS, en salon ou sur les réseaux, une fois le service ouvert.
**Appareils** : vrai cadre de Pixel 8 et photo réelle d'un portable (voir [../outils/appareils/LICENCES.md](../outils/appareils/LICENCES.md)).

## Les 10 scènes
| # | Début | Durée | Scène | Vue |
|---|---|---|---|---|
| 1 | 0:00 | 5 s | La SONAS en ligne | Portable + téléphone |
| 2 | 0:05 | 7 s | L'accueil | PC plein écran |
| 3 | 0:12 | 10 s | S'assurer : la plaque suffit | Téléphone |
| 4 | 0:22 | 9 s | Payer en mobile money, certificat QR | Téléphone |
| 5 | 0:31 | 7 s | Vérifier une attestation | PC plein écran |
| 6 | 0:38 | 9 s | Déclarer un sinistre, 112 d'abord | Téléphone |
| 7 | 0:47 | 7 s | Suivre son dossier | PC plein écran |
| 8 | 0:54 | 9 s | Trouver une agence (59 agences, 20 provinces) | PC plein écran |
| 9 | 1:03 | 6 s | Côté SONAS : l'espace gestionnaire | PC |
| 10 | 1:09 | 6 s | « Avec la SONAS, c'est réglé. » | Carton final |

## Voix off ElevenLabs

> **Voix générée le 19/11/2026** : « Adina - Young, Welcoming and Joyful » (bibliothèque ElevenLabs, voix féminine française standard, offre gratuite ; la première version avec « Paul K » est archivée dans `archives/v3_2026-11-19_voix_paul_k/`). Textes réécrits avec des liaisons entre les répliques, modèle Eleven v4, via `outils/voix_elevenlabs.py` (fenêtre Edge dédiée, connectée par l'utilisateur). Fichiers : `voix/site/Sxx.mp3`. Mixage : `outils/mixer_voix.py` (voix −19 dB RMS, musique −30 dB, −38 dB sous la voix) → `rendus/site_sonas_en_ligne_voix.mp4`.
Modèle **Eleven v4**, même voix que le film. Un fichier par scène : `voix/site/S01.wav` à `S10.wav`. Coller **le texte entre guillemets seulement**, sans le numéro ni le temps. Le mixage se fait avec le **prompt C** de [08-guide-production.md](08-guide-production.md), en remplaçant la vidéo et le dossier de voix.

| Scène | Pose à | Texte à coller |
|---|---|---|
| S01 | 0:00.4 | `[warm] Bienvenue sur la Sonasse en ligne. Découvrons le site ensemble.` |
| S02 | 0:05.5 | `[confident] Dès l'accueil, tout est à portée de main : un tarif, un sinistre, un dossier ou une agence.` |
| S03 | 0:12.5 | `[warm] Pour s'assurer, il suffit de saisir sa plaque. Ensuite, trois questions, et le prix s'affiche aussitôt, en francs ou en dollars.` |
| S04 | 0:22.5 | `[confident] Puis on paie avec son mobile money et on valide avec son code. Le certificat arrive alors tout de suite.` |
| S05 | 0:31.5 | `[pleased] Ainsi, lors d'un contrôle, le code Q R se vérifie en quelques secondes.` |
| S06 | 0:38.5 | `[reassuring] Et en cas d'accident ? La sécurité passe d'abord. Ensuite, quelques questions simples suffisent, même en retard.` |
| S07 | 0:47.5 | `[calm] Le dossier se suit ensuite étape par étape, y compris sur ordinateur.` |
| S08 | 0:54.5 | `[proud] Vous cherchez une agence ? Cinquante-neuf agences, réparties dans vingt provinces, affichent leurs horaires et prennent rendez-vous en ligne.` |
| S09 | 1:03.5 | `[calm] Enfin, côté Sonasse, chaque dossier est instruit en ligne.` |
| S10 | 1:09.5 | `[warm] La Sonasse en ligne. [short pause] Avec la Sonasse, c'est réglé.` |

## Musique
Composée par programme (`outils/musique.py`) : likembe, nappe, basse douce, 84 BPM, en ré majeur. Elle n'a aucun droit à payer ni attribution à faire. La version « musique » la mixe à **−26 dB RMS** : un fond doux. Avec une voix off, descendre à −30 dB (`--niveau -30`).
```bash
cd docs/marketing
python outils/musique.py 75 video-promo/musique/musique_douce_75s.wav --video video-promo/rendus/site_sonas_en_ligne.mp4 video-promo/rendus/site_sonas_en_ligne_musique.mp4 --niveau -26
```

## La refaire
Textes et durées : `docs/marketing/outils/motion/site.html` (même moteur que la présentation).
```bash
cd docs/marketing/outils/motion
python preparer.py C:/chemin/cache
python rendu.py C:/chemin/cache --page site.html --sortie site_sonas_en_ligne.mp4
```
