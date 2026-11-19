# Marketing · film promotionnel « C'est réglé »

Production du film publicitaire grand public du service en ligne de la SONAS (« La SONAS en ligne »). Le nom du dépôt n'apparaît dans aucun contenu destiné au public ni à la SONAS.
Concept : **« Avec la SONAS, c'est réglé. »** Film maître de 60 s, puis versions 30 s (TV), 15 s, 6 s et verticales.

## Contenu
| Dossier ou fichier | Quoi |
|---|---|
| [video-promo/01-benchmark.md](video-promo/01-benchmark.md) | Ce que font MACIF, Crédit Agricole, AXA Afrique, Direct Assurance, Ornikar, et les 7 règles qu'on en tire |
| [video-promo/02-strategie.md](video-promo/02-strategie.md) | Brief, insight, promesse, preuves, concept et signature, casting, garde-fous |
| [video-promo/03-scenario-storyboard.md](video-promo/03-scenario-storyboard.md) | Film de 60 s plan par plan, versions 30 s, 15 s, 6 s et 9:16, carton final |
| [video-promo/04-voix-elevenlabs.md](video-promo/04-voix-elevenlabs.md) | Modèle ElevenLabs, choix de la voix, **scripts à coller dans ElevenLabs**, prompt musique |
| [video-promo/05-prompts-images-video.md](video-promo/05-prompts-images-video.md) | Choix du modèle vidéo (**Veo 3.1**, Kling 3.0 en second), bible des personnages, prompts de chaque plan |
| [video-promo/06-montage-livraison.md](video-promo/06-montage-livraison.md) | Montage, étalonnage, mixage, fichiers à livrer, validation avant diffusion |
| [video-promo/07-prompts-codex.md](video-promo/07-prompts-codex.md) | 5 tâches à confier à Codex (animatic, carte animée, carton final, exports, déclinaisons) |
| [video-promo/08-guide-production.md](video-promo/08-guide-production.md) | **Guide pas à pas** du film complet, avec les prompts Codex prêts à coller (A, B, C) |
| [video-promo/09-presentation-sonas.md](video-promo/09-presentation-sonas.md) | Présentation animée pour les équipes SONAS : scènes, sources, voix off facultative |
| [video-promo/rendus/](video-promo/rendus/) | **Présentation SONAS** `presentation_sonas_motion.mp4` (1 min 49, muette) et `_musique.mp4` (musique douce) · **Vidéo du site** `site_sonas_en_ligne.mp4` (1 min 15, muette) et `_musique.mp4` · **Versions avec voix off française + musique** : `presentation_sonas_motion_voix.mp4`, `site_sonas_en_ligne_voix.mp4` |
| [video-promo/10-video-site.md](video-promo/10-video-site.md) | Vidéo de présentation du site : scènes et voix off ElevenLabs |
| [video-promo/musique/](video-promo/musique/) | Musiques douces composées par programme (`outils/musique.py`), sans droits |
| [video-promo/inserts/](video-promo/inserts/) | **Inserts produit** : le vrai site dans un **vrai Pixel 8** (16:9 et 9:16) et sur un **vrai ordinateur portable photographié** (`pc_*`, 16:9) |
| [video-promo/archives/](video-promo/archives/) | Versions précédentes des vidéos, **jamais supprimées** (v1 du 19/11 : téléphone dessiné, présentation 1 min 48) |
| [captures/desktop/](captures/desktop/) | 34 captures PC (1920×1080 affiché, fichiers en 3840×2160) |
| [captures/laptop/](captures/laptop/) | 35 captures au format d'un portable (1440×900, fichiers en 2880×1800), pour la vue PC |
| [captures/mobile/](captures/mobile/) | 33 captures mobiles de page (Chrome Android, 1082×2118) ; `appareil/` : l'écran complet de l'émulateur avec la barre d'état et Chrome |
| [outils/](outils/) | Scripts qui refont les captures et les inserts ; `outils/appareils.py` + `outils/appareils/` : vrais appareils (cadre Pixel 8 de l'AOSP, photo de portable Burst, licences dans `LICENCES.md`) ; `outils/motion/` : la présentation animée (HTML rendu image par image) |

## Refaire les captures et les inserts
```bash
pnpm dev                                    # à la racine : site + API simulée
cd docs/marketing/outils
python captures.py desktop                  # PC 1920×1080, Chromium sans écran
python captures.py laptop                   # portable 1440×900 (vue PC des vidéos)
python captures.py mobile                   # émulateur Android (préparation ci-dessous)
python captures.py mobile sinistre agences  # seulement certaines scènes
python inserts_ui.py                        # tous les inserts, 16:9 et 9:16
```
Préparer l'émulateur (Git Bash) :
```bash
export MSYS_NO_PATHCONV=1
adb reverse tcp:3000 tcp:3000
adb shell 'echo "_ --disable-fre --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
adb shell am start -a android.intent.action.VIEW -d http://localhost:3000/ com.android.chrome
adb forward tcp:9222 localabstract:chrome_devtools_remote
```
Les éléments propres à la démo (bandeau « Démonstration », plaques d'essai, simulateur d'opérateur, indicateur Next.js) sont **masqués au moment de la capture**. Le code du site n'est pas modifié.

## Ce qui reste à faire (dans l'ordre)
1. Valider le concept, la signature et le casting ([02](video-promo/02-strategie.md)).
2. Choisir la voix (idéalement une comédienne ou un comédien de Kinshasa cloné avec son accord) et générer la voix off ([04](video-promo/04-voix-elevenlabs.md)).
3. Faire le bout-à-bout avec Codex n° 1 et valider le rythme.
4. Tester P03 et P07 dans Veo 3.1 et Kling 3.0, puis générer tous les plans ([05](video-promo/05-prompts-images-video.md)).
5. Montage, mixage et exports ([06](video-promo/06-montage-livraison.md), Codex n° 2 à 5).

## Règles de production
- **Ne jamais supprimer une vidéo générée** : avant d'en refaire une, copier l'ancienne dans `video-promo/archives/v<n>_<date>/`.
- **Le nom du dépôt n'apparaît jamais** dans les vidéos, les sous-titres ni les documents pour la SONAS : le service s'appelle « La SONAS en ligne ».
- **Appareils réels uniquement** (`outils/appareils.py`), jamais de téléphone ou d'ordinateur dessiné.
