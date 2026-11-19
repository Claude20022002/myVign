# 4 · Voix off et musique avec ElevenLabs

## Modèle à utiliser
| Usage | Modèle | Pourquoi |
|---|---|---|
| **Voix off du film** | **Eleven v4** (sorti le 28/09/2026) | Le modèle de synthèse vocale le plus expressif d'ElevenLabs, classé 1er sur le Speech Arena d'Artificial Analysis selon l'éditeur. Il accepte les **balises d'émotion** entre crochets (`[warm]`, `[short pause]`…) |
| Repli | Eleven v3 | Mêmes balises. Utile si une prise v4 sonne trop « jouée » |
| Pas pour ce film | Eleven v4 Turbo, Flash | Faits pour le temps réel (agents vocaux), moins nuancés |

Sources : [Eleven v4](https://elevenlabs.io/blog/eleven-v4), [balises audio v3](https://elevenlabs.io/blog/v3-audiotags), [accents avec v3](https://elevenlabs.io/de/blog/eleven-v3-audio-tags-emulating-accents-with-precision).
⚠️ Les balises SSML (`<break>`, `<phoneme>`) **ne sont pas prises en compte** par v3 et v4. On rythme avec la ponctuation (virgules, points de suspension) et les balises entre crochets.

## Choix de la voix (par ordre de préférence)
1. **Le mieux : une vraie voix congolaise clonée avec son accord.** Engager un comédien ou une comédienne de Kinshasa (radio, doublage), enregistrer 30 à 60 min de voix propre et créer un **Professional Voice Clone**. Contrat écrit : usage publicitaire, durée, territoires, rémunération. C'est ce qui donnera l'accent juste.
2. **Sinon : Voice Design** (créer une voix à partir d'une description), avec ce texte :
   > Warm, confident Congolese francophone voice from Kinshasa, around 40 years old, gentle smile in the voice, trustworthy and modern, like a popular radio host. Clear French articulation with a light, natural Kinshasa accent. Studio quality, close microphone, no reverb.

   Générer 3 voix (une féminine, une masculine, une au choix), les faire écouter à 5 personnes de Kinshasa, garder celle qu'elles trouvent **la plus naturelle**. Ne pas forcer l'accent avec une balise : une voix caricaturale serait pire que pas d'accent.
3. **Voice Library** : chercher « African French », « Congolese », « Ivorian French ». Vérifier la licence d'usage commercial de la voix choisie.

**Réglages de départ** : stabilité moyenne (ni robotique ni instable), similarité élevée, style bas. Vitesse normale. Faire **5 prises par réplique** et monter les meilleures.

## Prononciations à vérifier à l'écoute
| Mot | Prononciation voulue | Astuce si c'est faux |
|---|---|---|
| SONAS | « so-NASS » | écrire `Sonasse` dans le texte envoyé |
| M-Pesa | « èm-PÉ-sa » | `èm-Pésa` |
| QR | « ku-ÈR » | `code Q R` ou `code kuère` |
| 59, 20, 5 | en lettres | toujours écrire les nombres en toutes lettres |

## Script ElevenLabs · film maître 60 s
À coller **réplique par réplique** (une génération par ligne), pour caler chaque phrase sur son plan. Les temps renvoient au [storyboard](03-scenario-storyboard.md).

```text
[P01 · 0:00] [softly] [sighs] L'assurance auto…

[P02 · 0:04] [tired] c'était la file, les papiers… [short pause] une demi-journée perdue.

[P03 · 0:08] [warm] [smiling] Aujourd'hui, ça se règle sur votre téléphone.

[P04 · 0:12] [confident] Votre plaque suffit : [short pause] la Sonasse retrouve votre véhicule, et vous donne votre prix, tout de suite.

[P05 · 0:19] [warm] Vous payez en mobile money…

[P06 · 0:22] [pleased] et votre certificat arrive, avec son code Q R.

[P09 · 0:33] [serious] [softly] Et si un jour… ça arrive…

[P10 · 0:37] [reassuring] vous déclarez votre sinistre en quelques minutes, même en retard.

[P11 · 0:43] [reassuring] Et vous suivez votre dossier, étape par étape.

[P12 · 0:47] [warm] Une assurance qui vous répond.

[P13 · 0:50] [proud] Cinquante-neuf agences, dans vingt provinces. [short pause] Et maintenant, la Sonasse en ligne.

[P14 · 0:54] [bright] Assuré en cinq minutes.

[P15 · 0:57] [warm] [smiling] Avec la Sonasse, c'est réglé.
```

## Script · version 30 s
```text
[softly] L'assurance auto, c'était une demi-journée perdue.
[warm] Aujourd'hui, votre plaque suffit : votre prix, tout de suite.
[confident] Vous payez en mobile money, votre certificat arrive avec son code Q R.
[reassuring] Un sinistre ? Déclarez-le, et suivez-le, étape par étape.
[bright] Assuré en cinq minutes. [short pause] [warm] Avec la Sonasse, c'est réglé.
```

## Script · version 15 s et bumpers 6 s
```text
[confident] Votre plaque, votre prix. Payez en mobile money, recevez votre certificat avec code Q R.
[bright] Assuré en cinq minutes. [warm] Avec la Sonasse, c'est réglé.
```
```text
[confident] Votre plaque. [short pause] Votre prix. [short pause] [warm] C'est réglé.
```

## Réplique de l'agent (plan P07)
Deux possibilités :
- **A (préférée)** : la laisser générer par **Veo 3.1 avec le plan** (le son est produit avec l'image et la synchronisation labiale est meilleure). Texte dans le prompt P07.
- **B** : une 2ᵉ voix ElevenLabs (homme, la cinquantaine, voix posée), puis synchronisation labiale au montage. Texte :
```text
[friendly] [warm] C'est en ordre, Madame. [short pause] Bonne route !
```
Variante avec une touche de lingala, **à faire valider par un locuteur natif** : « Ezali malamu, Mama. Bonne route ! »

## Musique (Eleven Music, ou mieux : composition originale)
Recommandation : comme AXA en Afrique, **faire composer une musique originale** par un musicien de Kinshasa. Elle deviendra la signature sonore de la SONAS (les 3 notes de guitare du carton final). Pour la maquette, ou si le budget est serré, générer avec **Eleven Music** après avoir vérifié la licence commerciale de l'offre :

```text
Modern Congolese rumba meets afro-pop, instrumental, 60 seconds, 104 BPM.
Bright, clean sebene electric guitar lines, warm round bass, light congas and shaker, soft synth pad.
0:00-0:08 sparse and slightly melancholic (single guitar, ambient street texture).
0:08 the groove starts, optimistic and confident.
0:33 sudden stop, two seconds of suspended pad (tension), then the groove returns at 0:37.
0:50 builds with fuller drums and a joyful guitar riff.
0:57 ends on a clean three-note guitar signature motif, resolving warmly. No vocals.
```
Exporter aussi une version **30 s** (même structure, compressée) et une **boucle de 15 s**.

## Livraison audio
- WAV 48 kHz / 24 bits, une piste par réplique, nommées `VO_P04_take3.wav`.
- Mixage : voix à −23 LUFS intégré pour la TV (norme EBU R128), −14 LUFS pour les réseaux sociaux. La musique est baissée automatiquement sous la voix (6 à 9 dB).
