# 8 · Guide pas à pas : produire le film complet

Durée totale estimée : **8 à 12 jours ouvrés**, dont l'essentiel en attente de validations SONAS et en génération.
Chaque étape dit **qui** la fait : vous, Codex, ou Claude (sur demande).

## Arborescence de travail
À créer dans `docs/marketing/video-promo/` au fil de l'eau :

```text
voix/        VO_P01.wav … VO_P15.wav, musique_60s.wav      (étape 2)
references/  grace/, patrick/, agent/, mireille/, benie/   (étape 4)
plans/       P01.mp4 … P14.mp4, P13_carte.mp4, P15_carton.mp4, P03_9x16.mp4 …   (étapes 3 et 6)
rendus/      animatic_60s.mp4, master_60s_UHD.mov, exports  (étapes 3, 7 et 8)
```
⚠️ Ces dossiers vont peser lourd (plusieurs Go). Les garder **hors de git** : ajouter `docs/marketing/video-promo/{voix,plans,references,rendus}/` au `.gitignore`, ou les stocker sur un Drive.

---

## Étape 0 · Préparer les outils (vous, 1 h)
| Outil | Pour quoi | Point d'attention |
|---|---|---|
| **ElevenLabs** | voix off et musique | Prendre une offre qui donne la **licence commerciale** (pas l'offre gratuite) |
| **Google Flow** (Veo 3.1), ou Vertex AI | plans vidéo | Vérifier que l'offre souscrite donne accès à **Veo 3.1** et à l'image vers vidéo |
| **Kling** (facultatif) | plans de secours, comparaison | Offre payante pour le 1080p sans filigrane |
| **DaVinci Resolve** (gratuit) | montage final | — |
| **Codex** | scripts de montage automatiques | Ouvrir Codex **à la racine du dépôt** |
| Python 3.13, ffmpeg | déjà installés sur ce poste | — |

## Étape 1 · Valider le concept (vous + SONAS, 1 réunion)
Montrer la **présentation animée** ([rendus/presentation_sonas_motion.mp4](rendus/)) puis [02-strategie.md](02-strategie.md). À trancher :
- [ ] la signature « Avec la SONAS, c'est réglé. »
- [ ] les personnages (Grâce, Patrick, l'agent, Mireille)
- [ ] la voix : comédien de Kinshasa cloné (recommandé) ou voix de synthèse
- [ ] la musique : composition originale (recommandé) ou Eleven Music
- [ ] qui valide les mentions légales, les accords opérateurs et l'accord de la police

## Étape 2 · Enregistrer la voix off (vous, une demi-journée)
1. ElevenLabs → **Voices** :
   - *Comédien* : **Professional Voice Clone**, importer 30 à 60 min d'enregistrement propre et faire signer le contrat.
   - *Synthèse* : **Voice Design**, coller la description de [04-voix-elevenlabs.md](04-voix-elevenlabs.md), générer 3 voix, faire voter 5 personnes de Kinshasa.
2. **Text to Speech** → modèle **Eleven v4** → la voix choisie.
3. Coller **une réplique à la fois** (bloc « Script ElevenLabs · film maître »), sans le repère `[P04 · 0:12]`, mais **avec** les balises `[warm]`, `[short pause]`…
4. Générer 3 à 5 prises, écouter, garder la meilleure, **télécharger en WAV** et nommer `VO_P04.wav` (numéro du plan).
5. Ranger les fichiers dans `docs/marketing/video-promo/voix/`.
6. Musique : **Music** → coller le prompt de [04](04-voix-elevenlabs.md) → exporter `musique_60s.wav` dans le même dossier.

✅ Contrôle : SONAS se prononce « so-nass », les nombres sont dits en toutes lettres, aucune réplique ne dépasse la durée de son plan.

## Étape 3 · Faire le bout-à-bout (animatic) avec Codex (Codex, 30 min)
Coller dans Codex le **prompt A** ci-dessous. Il produit :
- `rendus/animatic_60s.mp4` : les inserts réels, la voix off, et des cartons à la place des plans pas encore générés ;
- `plans/P13_carte.mp4` : la carte animée des agences ;
- `plans/P15_carton.mp4` : le carton final.

Regarder l'animatic : si le rythme ne va pas, **corriger les temps** dans [03-scenario-storyboard.md](03-scenario-storyboard.md) et relancer `python docs/marketing/outils/animatic.py`. **On ne génère aucune vidéo IA tant que le rythme n'est pas validé** : c'est ce qui coûte.

## Étape 4 · Créer les personnages (vous, une demi-journée)
1. Dans Flow (ou votre générateur d'images), coller le prompt de **Grâce** de [05-prompts-images-video.md](05-prompts-images-video.md).
2. Générer une dizaine de propositions, puis garder **un seul visage**. Il devient « la » Grâce.
3. À partir de ce visage, générer les 3 vues (face, trois quarts, en pied) et les ranger dans `references/grace/`.
4. Même chose pour Patrick, l'agent, Mireille et Bénie (de loin seulement).
5. Faire valider les visages et les tenues par 2 ou 3 personnes de Kinshasa, et comparer l'uniforme de l'agent avec de vraies photos.

## Étape 5 · Choisir le modèle sur 2 plans tests (vous, 2 h)
1. Générer **P03** (boutique) et **P07** (contrôle routier, avec la réplique) dans **Veo 3.1** puis dans **Kling 3.0**, avec les mêmes références.
2. Comparer : rendu des peaux, mains, téléphone, accent de l'agent, décor de Kinshasa.
3. Retenir le modèle. Par défaut : **Veo 3.1**, et Kling pour les plans sans dialogue si c'est moins cher et aussi beau.

## Étape 6 · Générer tous les plans (vous, 2 à 3 jours)
Pour chaque plan P01 à P14 marqué « IA » :
1. **Image clé** : générer la première image avec les références du personnage et le prompt du plan. La retoucher jusqu'à ce qu'elle soit parfaite.
2. **Vidéo** : Flow → *Frames to Video* (ou « image vers vidéo ») → cette image → coller le prompt du plan **et** le bloc de style commun → 16:9, 8 s.
3. Faire **4 essais**, garder le meilleur et le passer à la **check-list qualité** de [05](05-prompts-images-video.md).
4. Télécharger en **1080p** (en **4K** pour P07 et P14) et nommer `plans/P07.mp4`.
5. Pour les 5 plans clés des formats verticaux (P03, P05, P07, P10, P14) : refaire une image clé verticale et générer `plans/P07_9x16.mp4`.

Astuce : relancer l'animatic après chaque série de plans (`python docs/marketing/outils/animatic.py`). Les cartons sont remplacés automatiquement et on voit le film se construire.

## Étape 7 · Finition dans DaVinci Resolve (vous ou un monteur, 2 jours)
1. Projet en **3840×2160, 25 i/s**. Importer l'animatic comme **piste de référence**, puis tous les fichiers de `plans/`, `inserts/` et `voix/`.
2. Reconstruire la timeline sur l'animatic (mêmes points d'entrée), puis affiner les coupes.
3. **Étalonnage** : harmoniser les plans IA, peaux riches et naturelles, le jaune des écrans reste la couleur la plus vive.
4. **Plaques** : remplacer toute plaque lisible par « 4521AB 01 ».
5. **Titrage** : logo officiel, polices **Saira** et **Atkinson Hyperlegible Next**, mentions légales du carton final.
6. **Mixage** : voix à −23 LUFS pour la TV et −14 LUFS pour le web, musique baissée sous la voix.
7. Exporter `rendus/master_60s_UHD.mov` en ProRes 422 HQ.

## Étape 8 · Exports et déclinaisons avec Codex (Codex, 1 h)
Coller le **prompt B** ci-dessous. Il produit les sous-titres, les versions 60 s, 30 s, 15 s et 6 s, les formats 16:9 et 9:16, le fichier WhatsApp et un rapport de contrôle.

## Étape 9 · Valider et diffuser (vous + SONAS)
Dérouler la check-list « Validation avant diffusion » de [06-montage-livraison.md](06-montage-livraison.md), puis faire une **projection test devant 10 personnes de Kinshasa**. Ne diffuser que lorsque le service réel est ouvert.

---

## Prompt A · à coller dans Codex maintenant
```text
Tu travailles dans ce dépôt (plateforme d'assurance en ligne de la SONAS, RDC). Lis d'abord CLAUDE.md
(règles du dépôt : ne jamais committer, rester dans son périmètre), puis docs/marketing/README.md.

Ta mission : exécuter, dans cet ordre, les tâches « Codex n° 1 », « Codex n° 2 » et « Codex n° 3 » décrites dans
docs/marketing/video-promo/07-prompts-codex.md (animatic du film de 60 s, carte animée des agences P13, carton
final P15). Chaque tâche contient son contexte, ses fichiers d'entrée, ses sorties et ses critères d'acceptation :
respecte-les à la lettre.

Contraintes communes :
- N'écris QUE dans docs/marketing/ (scripts dans docs/marketing/outils/, vidéos dans docs/marketing/video-promo/).
  Ne modifie ni web/, ni packages/, ni les fichiers racine (package.json, pnpm-workspace.yaml…). Ne committe pas.
- Environnement : Windows 11, Git Bash et PowerShell, Python 3.13 (Pillow et numpy installés), ffmpeg dans le
  PATH, Node 22 et pnpm 11. Si un paquet Python manque, installe-le avec `python -m pip install --user`.
- ATTENTION : le ffmpeg du PATH est une vieille version 32 bits (2013) qui manque de mémoire. Toujours passer
  `-threads 4`, envoyer des images brutes (`-f rawvideo -pix_fmt rgb24`) plutôt que des PNG en flux, et ne
  jamais garder des milliers d'images en mémoire. Exemple qui marche : docs/marketing/outils/inserts_ui.py.
- Charte graphique : DESIGN.md (couleurs, polices Saira et Atkinson Hyperlegible Next). Textes en français,
  casse de phrase, espaces insécables avant « : ; ? ! % ».
- N'écris jamais le nom du dépôt dans une vidéo ou un sous-titre : le service s'appelle « La SONAS en ligne ».
- Pour l'animatic, les plans IA n'existent pas encore : les cartons de remplacement sont normaux. Le script doit
  tourner à nouveau sans modification quand les fichiers plans/Pxx.mp4 et voix/VO_Pxx.wav arriveront.
- Une fois la carte (n° 2) et le carton (n° 3) rendus, relance l'animatic (n° 1) pour qu'il les intègre.

À la fin, donne-moi : la liste des fichiers créés, la commande pour relancer chaque script, la durée exacte de
l'animatic, la liste des plans encore manquants, et 3 images extraites (à 10 s, 30 s et 58 s) que tu as
vérifiées toi-même.
```

## Prompt B · à coller dans Codex après le montage (étape 8)
```text
Tu travailles dans ce dépôt. Lis CLAUDE.md puis docs/marketing/README.md. Le master monté se trouve dans
docs/marketing/video-promo/rendus/master_60s_UHD.mov.
Exécute les tâches « Codex n° 4 » puis « Codex n° 5 » de docs/marketing/video-promo/07-prompts-codex.md
(sous-titres et exports, puis déclinaisons 30 s, 15 s et 6 s en 16:9 et 9:16), en respectant leurs critères.
N'écris que dans docs/marketing/, ne committe pas. À la fin, donne le rapport de contrôle (durées, résolutions,
cadences, loudness) et signale tout fichier hors spécification.
```

## Prompt C · voix off de la présentation SONAS (facultatif)
```text
Tu travailles dans ce dépôt. La présentation animée docs/marketing/video-promo/rendus/presentation_sonas_motion.mp4
est muette. Les voix off par scène sont dans docs/marketing/video-promo/voix/presentation/S01.wav … S14.wav
(texte et temps de départ dans docs/marketing/video-promo/09-presentation-sonas.md, tableau « Voix off »).
Écris docs/marketing/outils/motion/mixer_voix.py qui pose chaque WAV au temps de départ de sa scène, ajoute
musique_presentation.wav s'il existe (baissée de 12 dB sous la voix), normalise à -16 LUFS et produit
rendus/presentation_sonas_motion_voix.mp4 sans réencoder la vidéo (-c:v copy). Vérifie qu'aucune voix ne
déborde sur la scène suivante et liste les dépassements. N'écris que dans docs/marketing/, ne committe pas.
```
