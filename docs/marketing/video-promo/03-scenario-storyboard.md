# 3 · Scénario et storyboard

Film maître **« C'est réglé »**, 60 s, 16:9, 25 i/s. Les déclinaisons (30 s, 15 s, 6 s, 9:16) suivent.
Légende des sources : **IA** = plan généré (prompts dans [05-prompts-images-video.md](05-prompts-images-video.md)) · **INSERT** = vrai site dans un téléphone, déjà rendu dans [inserts/](inserts/) · **MOTION** = animation 2D (prompts Codex dans [07-prompts-codex.md](07-prompts-codex.md)).

## Film maître · 60 s

| # | Temps | Source | Image | Voix off / dialogue | Son |
|---|---|---|---|---|---|
| P01 | 0:00–0:04 | IA | Gros plan : la main de Grâce sort de la boîte à gants un vieux papier d'assurance froissé, taché, à la date dépassée (illisible). Elle soupire. | VO : « L'assurance auto… » | Klaxons lointains, ventilateur |
| P02 | 0:04–0:08 | IA | Souvenir, image légèrement désaturée : une longue file sous le soleil devant un guichet, des gens qui s'éventent avec des dossiers. | VO : « …c'était la file, les papiers, une demi-journée perdue. » | Brouhaha, un tampon qui claque |
| P03 | 0:08–0:12 | IA | Retour au présent. Boutique de pagnes colorés, marché de la Gombe. Grâce sourit, prend son téléphone Android. | VO : « Aujourd'hui, ça se règle sur votre téléphone. » | Musique : entrée de la guitare (sebene) |
| P04 | 0:12–0:19 | INSERT `souscription` | Plaque → « Est-ce bien votre véhicule ? » → les 3 formules et leurs prix → bascule FC / $. | VO : « Votre plaque suffit : la SONAS retrouve votre véhicule et vous donne votre prix, tout de suite. » | Taps discrets |
| P05 | 0:19–0:22 | IA | Gros plan : le pouce de Grâce valide le paiement sur un téléphone Android (écran tourné vers elle, lumière de l'écran sur son visage). | VO : « Vous payez en mobile money… » | Petit son de validation |
| P06 | 0:22–0:26 | INSERT `paiement` | Paiement → « Validez sur votre téléphone » → certificat provisoire avec code QR (défilement). | VO : « …et votre certificat arrive, avec son code QR. » | — |
| P07 | 0:26–0:31 | IA (dialogue) | Boulevard du 30 Juin, fin de matinée. Contrôle routier. L'agent fait signe, Grâce s'arrête, tend son téléphone par la fenêtre. L'agent le scanne avec le sien, hoche la tête. | Agent : « C'est en ordre, Madame. Bonne route ! » | Circulation, sifflet |
| P08 | 0:31–0:33 | INSERT `verification` | « Attestation valide ». | — | Petit carillon |
| P09 | 0:33–0:37 | IA | Autre jour, autre quartier. Le taxi jaune de Patrick, arrêté au feu, est percuté doucement par l'arrière. Patrick sort, vérifie d'abord que l'autre conducteur va bien (main sur l'épaule). | VO : « Et si un jour, ça arrive… » | Choc sourd, musique suspendue |
| P10 | 0:37–0:43 | IA + INSERT `sinistre` | Patrick photographie le pare-chocs abîmé, puis l'insert : 112 d'abord → type → zones → « Déclaration envoyée ». | VO : « …vous déclarez votre sinistre en quelques minutes, même en retard. » | Reprise de la musique |
| P11 | 0:43–0:47 | IA + INSERT `suivi` | Bureau SONAS lumineux : Mireille, gestionnaire, fait avancer le dossier sur son ordinateur. Puis l'insert « Votre dossier sinistre » et sa chronologie. | VO : « Et vous suivez votre dossier, étape par étape. » | Notification |
| P12 | 0:47–0:50 | IA | Garage. Le taxi réparé. Patrick tapote le capot, salue le mécanicien et sourit. | VO : « Une assurance qui vous répond. » | Rires, outils |
| P13 | 0:50–0:54 | MOTION + INSERT `agences` | Carte de la RDC : les 20 provinces couvertes s'allument, les 59 agences apparaissent ; puis l'insert agences et rendez-vous. | VO : « Cinquante-neuf agences dans vingt provinces. Et maintenant, la SONAS en ligne. » | Montée musicale |
| P14 | 0:54–0:57 | IA | Coucher de soleil sur le boulevard, Grâce au volant, fenêtre ouverte, Bénie rit sur la banquette arrière. | VO : « Assuré en cinq minutes. » | Musique pleine |
| P15 | 0:57–1:00 | MOTION | Carton final : logo SONAS, adresse du site, signature. | VO : « Avec la SONAS, c'est réglé. » | Signature sonore (3 notes de guitare) |

**Carton final** (fond blanc ou `bleu-nuit`, logo officiel fourni par la SONAS) :
- Signature : **Avec la SONAS, c'est réglé.**
- Adresse du site (à confirmer : domaine de production) · Centre de contact (numéro venant de la SONAS)
- Mentions (corps 14 minimum, 3 s à l'écran) : *SONAS SA, entreprise d'assurances agréée par l'ARCA (n° à confirmer). Certificat provisoire remis au paiement, certificat définitif sous 10 jours. Tarifs selon le barème en vigueur. Paiement mobile money selon l'opérateur. Images générées par intelligence artificielle.*

## Version TV · 30 s
| Temps | Plans | Voix off |
|---|---|---|
| 0:00–0:04 | P01 + P02 (2 s chacun) | « L'assurance auto, c'était une demi-journée perdue. » |
| 0:04–0:11 | P03 (1 s) + P04 raccourci | « Aujourd'hui, votre plaque suffit : votre prix, tout de suite. » |
| 0:11–0:16 | P05 + P06 | « Vous payez en mobile money, votre certificat arrive avec son code QR. » |
| 0:16–0:21 | P07 + P08 | Agent : « C'est en ordre, Madame. » |
| 0:21–0:25 | P10 (insert seul) | « Un sinistre ? Déclarez-le et suivez-le, étape par étape. » |
| 0:25–0:30 | P14 + P15 | « Assuré en cinq minutes. Avec la SONAS, c'est réglé. » |

## Réseaux sociaux · 15 s (9:16 d'abord)
| Temps | Plans | Voix / texte à l'écran |
|---|---|---|
| 0:00–0:02 | P07 en plein cadre (l'agent tend la main) | Texte : « Contrôle routier ? » |
| 0:02–0:08 | P04 + P06 accélérés | VO : « Votre plaque, votre prix, payez en mobile money, votre certificat avec QR. » |
| 0:08–0:11 | P07 (fin) + P08 | Agent : « C'est en ordre, Madame ! » |
| 0:11–0:15 | P15 | VO : « Assuré en cinq minutes. Avec la SONAS, c'est réglé. » |

## Bumpers · 6 s (YouTube, non désactivables)
1. **« QR »** : scan de l'agent (P07, 3 s) → « Attestation valide » (1 s) → carton « Assuré en 5 minutes. C'est réglé. » (2 s).
2. **« Plaque »** : plaque saisie (P04, 2 s) → prix (2 s) → carton (2 s). VO : « Votre plaque. Votre prix. C'est réglé. »
3. **« Sinistre »** : « Tout le monde va bien ? » (1,5 s) → « Déclaration envoyée » (1,5 s) → Patrick sourit au garage (1 s) → carton (2 s).

## Déclinaisons verticales (9:16)
- **Les inserts existent déjà en 9:16** ([inserts/](inserts/)).
- Pour les plans IA : générer directement en 9:16 les 5 plans clés (P03, P05, P07, P10, P14) plutôt que recadrer. Les autres sont recadrés depuis le 16:9 4K.
- Sous-titres incrustés **toujours** (la plupart des vidéos sociales sont regardées sans le son), en Atkinson Hyperlegible, encre sur blanc à 90 %, dans la zone sûre (hors 250 px du haut et 400 px du bas).
- Le 15 s vertical est le format prioritaire pour WhatsApp Statut.

## Règles de réalisation
- **Rythme** : plans de 2 à 5 s, coupe sur l'action, une respiration à P09 (la musique se suspend).
- **Lumière** : soleil de Kinshasa doux (matinée, fin d'après-midi), jamais de midi écrasant ; peaux bien exposées et riches, sans éclaircissement.
- **Couleurs** : décors naturels et pagnes colorés, mais **le jaune vif des écrans et du carton reste l'élément le plus saturé de l'image**, comme dans la charte.
- **Téléphones** : Android d'entrée et de milieu de gamme, jamais d'iPhone (réalisme). L'écran n'est jamais lisible dans les plans IA : on **coupe sur l'insert** pour montrer le site.
- **Aucun texte généré par l'IA** (enseignes, plaques, papiers) : flou ou hors champ, et les plaques nettes sont remplacées au montage par « 4521AB 01 », celle des captures.
