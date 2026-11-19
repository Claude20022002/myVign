# 6 · Montage, finitions et livraison

## Outils
- **DaVinci Resolve** (gratuit) : montage, étalonnage, remplacement d'écran (Fusion), mixage (Fairlight). CapCut convient pour les formats sociaux simples.
- **ffmpeg** : conversions et exports automatiques (scripts confiés à Codex, voir [07-prompts-codex.md](07-prompts-codex.md)).

## Réglages du projet
| Paramètre | Valeur |
|---|---|
| Cadence | **25 i/s** (télévision en RDC). Les plans Veo à 24 i/s sont conformés à 25 (+4 %, invisible) |
| Résolution de travail | 3840×2160 (UHD), export 1920×1080 et 3840×2160 |
| Espace couleur | Rec.709, gamma 2.4 |
| Audio | 48 kHz, 24 bits |

## Ordre de travail
1. **Bout-à-bout (animatic)** avec les inserts réels, la voix off et des cartons à la place des plans IA manquants. On valide le rythme **avant** de payer la génération vidéo (script Codex n° 1).
2. **Génération** des plans IA ([05](05-prompts-images-video.md)), 4 essais chacun, on garde les meilleurs.
3. **Montage image** : remplacer les cartons par les plans IA. Coupes franches, un fondu seulement pour entrer dans le souvenir (P02) et en sortir.
4. **Remplacement d'écran** (seulement si un plan IA montre l'écran) : suivi planaire dans Fusion, puis on incruste la capture correspondante de [../captures/mobile/](../captures/mobile/).
5. **Plaques** : remplacer toute plaque nette par « 4521AB 01 » (la même que dans les inserts).
6. **Étalonnage** : harmoniser les plans IA entre eux (balance des blancs, contraste), peaux riches et naturelles, et le jaune des inserts comme couleur la plus vive de l'image.
7. **Habillage** : logo officiel fourni par la SONAS (jamais généré), polices de la charte : **Saira** pour les titres, **Atkinson Hyperlegible Next** pour les textes et sous-titres.
8. **Mixage** : voix, musique baissée sous la voix, ambiances des plans, bruitages des taps (discrets).
9. **Sous-titres** français incrustés pour les réseaux, fichier SRT séparé pour YouTube et la TV (sourds et malentendants).

## Les inserts produit (déjà rendus)
Dans [inserts/](inserts/), 25 i/s, sans texte. Téléphone : **vrai cadre de Pixel 8**, en 16:9 (1920×1080) et 9:16 (1080×1920). Ordinateur (`pc_*`) : **photo réelle d'un portable**, la capture projetée sur son écran, en 16:9 :

| Fichier | Plan | Contenu |
|---|---|---|
| `accueil_*` | ouverture des formats courts | Accueil, bascule FC → $ |
| `souscription_*` | P04 | Plaque → véhicule retrouvé → 3 formules → prix en $ |
| `paiement_*` | P06 | Choix M-Pesa → validation sur le téléphone → certificat → défilement jusqu’au QR |
| `verification_*` | P08 | « Attestation valide » |
| `sinistre_*` | P10 | 112 d'abord → type → zones touchées → « Déclaration envoyée » |
| `suivi_*` | P11 | Chronologie du dossier |
| `agences_*` | P13 | 59 agences → Lubumbashi → prise de rendez-vous |
| `pc_accueil`, `pc_souscription`, `pc_sinistre`, `pc_agences`, `pc_gestion`, `pc_verification` | au choix | Les mêmes parcours sur ordinateur (vue PC) |

Pour les refaire (par exemple après un changement d'interface) : relancer le site (`pnpm dev`), puis `docs/marketing/outils/captures.py` et `inserts_ui.py` (voir [../README.md](../README.md)).

## Fichiers à livrer
| Format | Fichier | Spécification |
|---|---|---|
| TV 30 s | `SONAS_CestRegle_TV30_1080p25.mov` | ProRes 422 HQ ou XDCAM HD 50, −23 LUFS, 10 s de noir + mire et top son selon la chaîne |
| Web 60 s | `SONAS_CestRegle_60_UHD.mp4` | H.264 ou H.265, 3840×2160, −14 LUFS |
| Web 30 s | `SONAS_CestRegle_30_1080p.mp4` | H.264, 1920×1080 |
| Social 15 s vertical | `SONAS_CestRegle_15_9x16.mp4` | 1080×1920, sous-titres incrustés, moins de 16 Mo pour WhatsApp Statut |
| Bumpers 6 s | `SONAS_Bumper_QR_6s.mp4`, `…_Plaque_6s`, `…_Sinistre_6s` | 1920×1080 et 1080×1920 |
| Sous-titres | `*.srt` | Français, 42 caractères par ligne au maximum |
| Vignette | `SONAS_CestRegle_vignette.jpg` | 1280×720, Grâce au contrôle + « Assuré en 5 minutes » |

## Validation avant diffusion
- [ ] Le service réel est ouvert et toutes les promesses du film y sont vraies ([02-strategie.md](02-strategie.md), tableau des preuves).
- [ ] Mentions légales validées par la direction juridique SONAS.
- [ ] Accords des opérateurs mobile money pour les noms cités.
- [ ] Mention « Images générées par IA » présente, et option « contenu modifié ou synthétique » cochée sur YouTube, Meta et TikTok.
- [ ] Contrats signés avec la voix (clonage) et le musicien (droits de la musique).
- [ ] Projection test devant 10 personnes de Kinshasa : la ville, l'accent et l'humour sonnent-ils juste ?
