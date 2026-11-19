# 7 · Tâches à confier à Codex (pour réduire le coût)

Ce sont des tâches mécaniques : scripts ffmpeg ou Python, animations 2D, sous-titres. Chaque prompt est **autonome** : le coller tel quel dans Codex, ouvert à la racine du dépôt.
Règles communes, rappelées dans chaque prompt : ne rien modifier en dehors de `docs/marketing/`, ne rien committer, tout en français.

---

## Codex n° 1 · Bout-à-bout (animatic) du film de 60 s

```text
Contexte : ce dépôt (plateforme d'assurance en ligne de la SONAS, RDC). Le dossier docs/marketing/ contient la
production d'un film publicitaire. Lis d'abord docs/marketing/video-promo/03-scenario-storyboard.md (tableau
« Film maître · 60 s », plans P01 à P15, avec temps de début et de fin, source IA / INSERT / MOTION et voix off).

Tâche : écris docs/marketing/outils/animatic.py (Python 3.13, Pillow, ffmpeg dans le PATH) qui fabrique
docs/marketing/video-promo/rendus/animatic_60s.mp4 (1920x1080, 25 i/s, H.264, yuv420p) :
1. Lis le découpage depuis un fichier docs/marketing/video-promo/decoupage_60s.json que tu crées à partir du
   tableau (id, debut, fin, source, insert éventuel, texte de la voix off, description de l'image).
2. Plans INSERT : utilise docs/marketing/video-promo/inserts/<nom>_16x9.mp4, ralenti ou accéléré pour tenir
   exactement la durée du plan (filtre setpts), sans couper le début.
3. Plans IA : si docs/marketing/video-promo/plans/<id>.mp4 existe, utilise-le (conformé en 25 i/s, recadré en
   1920x1080) ; sinon, génère un carton : fond #0A405C, id du plan en haut à gauche (blanc, 36 px), description
   de l'image au centre (blanc, 40 px, retour à la ligne à 50 caractères), police C:/Windows/Fonts/segoeui.ttf.
4. Plans MOTION : même logique (fichier s'il existe dans plans/, sinon carton).
5. Voix off : si docs/marketing/video-promo/voix/VO_<id>.wav existe, place-la au début du plan ; sinon,
   sous-titre la voix off en bas de l'image (blanc sur bandeau noir à 60 %).
6. Musique : si docs/marketing/video-promo/voix/musique_60s.wav existe, mixe-la sous la voix (sidechaincompress
   ou baisse de 8 dB pendant la voix), normalisation finale loudnorm I=-14.
7. Le script affiche la durée finale (elle doit faire 60,0 s à ±0,1 s) et la liste des plans encore manquants.
Contraintes : ne modifie rien en dehors de docs/marketing/, ne committe pas. Teste le script et montre la sortie.
```

## Codex n° 2 · Carte animée des agences (plan P13)

```text
Contexte : ce dépôt. Le package packages/geo exporte la carte SVG des 26 provinces de la RDC
(packages/geo/src/provinces-map.ts : PROVINCE_MAP_VIEWBOX, PROVINCE_SHAPES[code].path et .center) et la liste
des agences (packages/geo/src/agencies.ts, 59 agences rattachées à 20 provinces). Charte : DESIGN.md
(bleu-logo #1790CD, bleu-teinte #E8F4FB, filet #D5DDE5, encre #1B2733, fond #F5F7F9, jaune-logo #F5C800).

Tâche : crée docs/marketing/outils/carte_agences.ts (exécutable avec `pnpm dlx tsx`) qui produit des images PNG
puis une vidéo docs/marketing/video-promo/plans/P13_carte.mp4 (1920x1080, 25 i/s, 4 s, H.264) :
- 0,0–0,5 s : carte des 26 provinces en gris clair (#D5DDE5) sur fond #F5F7F9, apparition en fondu.
- 0,5–2,0 s : les 20 provinces couvertes passent en bleu-teinte, l'une après l'autre (Kinshasa en premier,
  puis par nombre d'agences décroissant), contour bleu-logo.
- 1,5–3,0 s : les 59 agences apparaissent en points bleu-logo (rayon 6 px) avec un petit rebond, à la position
  de leur province (center + léger décalage déterministe si plusieurs agences).
- 3,0–4,0 s : compteur en Saira 600 (ou Segoe UI Semibold si Saira absente) « 59 agences · 20 provinces »,
  encre, en bas à gauche.
- Mention en bas à droite, 14 px, texte-2 #4E5D6C : « © contributeurs OpenStreetMap ».
Rendu : génère un SVG par image (100 images), convertis avec @resvg/resvg-js (installe-le en devDependency
temporaire via pnpm dlx, sans toucher au package.json racine), puis assemble avec ffmpeg.
Fais aussi la version 1080x1920 (P13_carte_9x16.mp4), carte centrée en haut, compteur en dessous.
Contraintes : ne modifie rien en dehors de docs/marketing/, ne committe pas. Montre une image extraite à 3,5 s.
```

## Codex n° 3 · Carton final et signature (plan P15)

```text
Contexte : ce dépôt, charte DESIGN.md. Logo : web/public/logo-sonas.png.
Tâche : crée docs/marketing/outils/carton_final.py qui produit docs/marketing/video-promo/plans/P15_carton.mp4
(1920x1080, 25 i/s, 3,5 s, H.264) et sa version 1080x1920 :
- Fond blanc. Filet bleu-logo #1790CD de 6 px en haut de l'image.
- 0,0–0,6 s : le logo apparaît (fondu + montée de 20 px, courbe ease-out), centré, hauteur 220 px (16:9).
- 0,4–1,2 s : signature « Avec la SONAS, c'est réglé. » en dessous (Saira 600 si disponible, sinon Segoe UI
  Semibold, 64 px, encre #1B2733), apparition mot par mot.
- 1,2–3,5 s : sous la signature, un bouton jaune #F5C800 aux coins arrondis (12 px) avec le texte encre
  « Assurez-vous en 5 minutes » et, en dessous, l'adresse du site en texte-2 #4E5D6C : mettre un paramètre
  --url (valeur par défaut « sonas.cd »).
- Bandeau de mentions légales en bas (texte-2, 18 px, 2 lignes max), lu depuis un paramètre --mentions,
  valeur par défaut tirée de docs/marketing/video-promo/03-scenario-storyboard.md (paragraphe « Mentions »).
Contraintes : ne modifie rien en dehors de docs/marketing/, ne committe pas. Montre l'image finale.
```

## Codex n° 4 · Sous-titres et exports de toutes les versions

```text
Contexte : ce dépôt. Le montage final 60 s est exporté par le monteur dans
docs/marketing/video-promo/rendus/master_60s_UHD.mov. Le découpage est dans
docs/marketing/video-promo/decoupage_60s.json (créé par le script animatic.py) et le texte de la voix off dans
docs/marketing/video-promo/04-voix-elevenlabs.md.
Tâche : crée docs/marketing/outils/exports.py qui :
1. Génère master_60s.fr.srt depuis le découpage (42 caractères par ligne au maximum, 2 lignes, 1 à 6 s par
   sous-titre, coupure aux signes de ponctuation).
2. Exporte : 60 s UHD H.264 (-14 LUFS), 60 s 1080p, version 9:16 recadrée au centre (1080x1920) avec
   sous-titres incrustés (police Atkinson Hyperlegible si présente dans docs/marketing/polices/, sinon
   Segoe UI, 54 px, texte #1B2733 sur boîte blanche à 90 %, marge basse 420 px), et une version WhatsApp
   de moins de 16 Mo (2 passes, débit calculé).
3. Vérifie chaque fichier avec ffprobe (durée, résolution, cadence, loudness avec ebur128) et écrit un
   rapport rendus/rapport_exports.md.
Contraintes : ne modifie rien en dehors de docs/marketing/, ne committe pas.
```

## Codex n° 5 · Déclinaisons 30 s, 15 s et 6 s depuis le master

```text
Contexte : identique au n° 4. Le storyboard (docs/marketing/video-promo/03-scenario-storyboard.md) décrit les
versions 30 s, 15 s et les 3 bumpers de 6 s en citant les plans du master (P01…P15).
Tâche : crée docs/marketing/outils/declinaisons.py qui découpe les plans dans
rendus/master_60s_UHD.mov (en s'appuyant sur decoupage_60s.json), les réassemble dans l'ordre de chaque version,
pose la voix off correspondante si les fichiers voix/VO30_*.wav, VO15_*.wav existent, et exporte en 16:9 et 9:16.
Les durées doivent tomber juste (30,0 / 15,0 / 6,0 s) : ajuste la vitesse des plans de ±8 % au maximum,
sinon raccourcis le plan le plus long. Écris un rapport des ajustements.
Contraintes : ne modifie rien en dehors de docs/marketing/, ne committe pas.
```

> Règle de contenu : ne jamais écrire le nom du dépôt dans une vidéo, un sous-titre ou un document destiné au public ou à la SONAS. Le service s'appelle « La SONAS en ligne ».
