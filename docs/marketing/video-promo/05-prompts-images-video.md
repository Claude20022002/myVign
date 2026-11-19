# 5 · Images et vidéo générées par IA : modèle, personnages, prompts

## Quel modèle pour quel plan (état au 19/11/2026)

| Modèle | Points forts | Limites | Usage dans ce film |
|---|---|---|---|
| **Google Veo 3.1** | Rendu « cinéma », **son et dialogues générés avec l'image** (synchronisation labiale, français compris), sortie jusqu'en 4K, 16:9 et 9:16, jusqu'à **3 images de référence** pour garder le même personnage (« Ingredients to video »), **première et dernière image** imposées, prolongation (« Extend ») | Plans de 8 s maximum, le plus cher (environ 24 $ par minute générée) | **Modèle principal** : tous les plans avec personnages, et obligatoirement P07 (dialogue de l'agent) |
| **Kling 3.0** | Très bon photoréalisme des personnes, plans jusqu'à 15 s, 4K, 4 à 7 fois moins cher que Veo | Pas de dialogue synchronisé fiable en français | **Alternative** pour les plans sans dialogue (P02, P09, P12, P14) et pour les essais |
| Kling 4.0, Seedance 2.5 | Plans jusqu'à 30 s, beaucoup de références | Trop récents pour être éprouvés en production | À tester seulement si un plan long est nécessaire |
| ~~Sora~~ | — | **Arrêté** (application fermée le 26/04/2026, API le 24/09/2026) | — |

Sources : [Google Developers Blog, Veo 3.1](https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/), [Tech Insider, comparatif 2026](https://tech-insider.org/best-ai-video-generator-2026/), [Versely, comparatif octobre 2026](https://www.versely.studio/blog/best-ai-video-generation-models-2026). Les comparatifs sont des blogs d'éditeurs : les classements sont des avis.

**Décision : Veo 3.1** (via Google Flow, ou Vertex AI / Gemini API), **Kling 3.0 en second**.
**Test obligatoire avant de tout générer** : P03 et P07 dans les deux modèles. On juge le rendu des peaux noires (texture, nuances, pas d'éclaircissement), les mains, le téléphone et le français de l'agent. Ces comparatifs ne testent pas les peaux foncées : il faut vérifier soi-même.

**Budget indicatif** : 15 plans × 4 essais × 8 s ≈ 8 min générées ≈ 190 $ avec Veo 3.1 (au tarif cité), plus les images de référence et les essais Kling. Prévoir le double pour les déclinaisons 9:16.

## La méthode (celle des studios)
1. **Bible des personnages** : pour chaque personnage, 3 images de référence (visage de face, buste de trois quarts, en pied) avec un générateur d'images (celui de Google Flow, Midjourney ou autre), **toujours avec le même prompt de base**.
2. **Image clé** de chaque plan : on génère la **première image** du plan avec les références, et on la retouche jusqu'à ce qu'elle soit parfaite (cadre, lumière, visage).
3. **Image vers vidéo** avec Veo 3.1 : première image imposée, plus le prompt de mouvement ci-dessous. Le personnage reste donc le même d'un plan à l'autre.
4. **4 essais par plan**, garder le meilleur, prolonger avec « Extend » si besoin.
5. Les **écrans de téléphone** ne sont jamais lisibles dans les plans IA : on coupe sur les inserts réels, ou l'écran est remplacé au montage.

## Bloc de style commun (à coller à la fin de chaque prompt)
```text
Shot on ARRI Alexa 35, 35mm anamorphic lens, shallow depth of field, natural soft sunlight,
warm but realistic color grade, rich and accurate rendering of dark skin tones with natural texture,
subtle film grain, documentary realism, modern Kinshasa, Democratic Republic of the Congo.
No text, no logos, no brand names, no subtitles, no watermark, no readable signs, no distorted hands.
```

## Bible des personnages (prompts d'images de référence)

**Grâce Mbuyi**
```text
Portrait of Grâce, a 34-year-old Congolese woman from Kinshasa, warm confident smile, dark brown skin,
short natural hair in neat twists, small gold hoop earrings, wearing a tailored blouse made of colorful
blue and yellow wax print fabric, light makeup, entrepreneurial and elegant but not luxurious.
Three views on neutral light grey background: front close-up face, three-quarter bust, full body standing.
Photorealistic, soft studio light, 85mm lens.
```

**Patrick Kabongo**
```text
Portrait of Patrick, a 46-year-old Congolese taxi driver from Kinshasa, kind tired eyes, short greying hair,
short beard, deep dark skin, wearing a clean light-blue short-sleeved shirt and dark trousers, a simple watch.
Friendly, honest family man. Three views on neutral light grey background: front close-up, three-quarter bust,
full body standing. Photorealistic, soft studio light, 85mm lens.
```

**L'agent de la police de circulation**
```text
Portrait of a 52-year-old Congolese traffic police officer, calm and benevolent expression, dark skin,
neatly trimmed moustache, wearing a generic traffic police uniform with white gloves and a reflective vest,
NO insignia, NO badge text, NO flag. Three views on neutral grey background. Photorealistic, 85mm lens.
```
⚠️ Comparer avec des photos réelles de la police de circulation routière de Kinshasa et corriger les couleurs de l'uniforme. Ne jamais inventer de grade ni d'écusson.

**Mireille** (gestionnaire SONAS)
```text
Portrait of Mireille, a 30-year-old Congolese woman, insurance claims officer, focused and friendly,
dark skin, long braids tied back, wearing a white blouse and a navy blazer, small pendant.
Three views on neutral light grey background. Photorealistic, 85mm lens.
```

**Bénie** (fille de Grâce, 8 ans) : ne générer qu'**un seul plan large**, sans gros plan de visage d'enfant.
```text
An 8-year-old Congolese girl with two puffs of natural hair, yellow t-shirt, joyful, seen from a distance.
```

## Prompts plan par plan (Veo 3.1, image vers vidéo, 8 s, 16:9)
Chaque prompt suppose que la **première image** (générée avec les références) est fournie. Ajouter le bloc de style commun à la fin.

### P01 · Le vieux papier (gros plan)
```text
Close-up inside a small white city car parked in Kinshasa. Grâce's hand opens the glove box and pulls out
a crumpled, stained old paper insurance document (no readable text). She looks at it and sighs softly.
Slow push-in. Late morning light through the windshield. Ambient: distant car horns, street vendors.
```

### P02 · La file d'attente (souvenir)
```text
Wide shot, slightly desaturated memory look: a long queue of Congolese men and women waiting in the hot sun
in front of an administrative office window, some fanning themselves with paper folders, one checks his watch.
Slow lateral dolly. Hazy midday light. Ambient: murmur of the crowd, a rubber stamp thumping.
```

### P03 · La boutique (retour au présent)
```text
Medium shot in a vibrant fabric shop at a Kinshasa market, walls stacked with colorful wax print fabrics.
Grâce, behind her counter, smiles, picks up her Android smartphone and starts tapping, the screen glow
lighting her face (screen not visible to camera). Gentle handheld camera, morning light.
Ambient: market chatter, a radio playing softly.
```

### P05 · La validation du paiement
```text
Extreme close-up of Grâce's thumb tapping to confirm on an Android smartphone held in her hand,
the screen angled away and softly blurred. Then a satisfied smile, shallow focus on her eyes.
Slow rack focus. Warm light. Ambient: shop sounds, a soft confirmation chime.
```

### P07 · Le contrôle routier (dialogue, le plan le plus important)
```text
Boulevard du 30 Juin in Kinshasa, wide avenue with palm trees and traffic, late morning.
A traffic police officer in white gloves raises his hand; Grâce stops her small white car at the roadside,
lowers the window and hands him her Android smartphone. The officer scans the phone screen with his own
phone, nods with a warm smile and says in French with a Congolese accent:
"C'est en ordre, Madame. Bonne route !"
Grâce smiles back and drives off. Over-the-shoulder shot then medium two-shot, slow arc movement.
Ambient: traffic, a whistle in the distance. Only this one line of dialogue, no other speech.
```
⚠️ Vérifier : les phrases sont bien prononcées, Grâce ne touche pas son téléphone en roulant, l'uniforme est neutre.

### P09 · L'accrochage
```text
A yellow taxi sedan stopped at a red light in a busy Kinshasa street, early evening. Another car bumps gently
into its rear at very low speed. Patrick, the taxi driver, gets out calmly, first goes to the other driver and
puts a reassuring hand on his shoulder, asking if he is okay; both nod. No injury, no aggression.
Medium wide shot, handheld, golden hour. Ambient: soft thud, city traffic, then calm.
```

### P10 · La photo des dégâts
```text
Patrick crouches behind his yellow taxi and photographs the slightly dented rear bumper with his Android
smartphone (screen not visible), then stands up and starts typing calmly, reassured.
Medium shot, golden hour, shallow depth of field. Ambient: street sounds.
```

### P11 · La gestionnaire SONAS
```text
Bright modern open-space office, plants, large windows on Kinshasa. Mireille, a claims officer, sits at
a desk with a computer monitor (screen facing away from camera), clicks, then picks up her phone with a smile
as if to call a client. Clean daylight, slow dolly-in. Ambient: quiet office, keyboard.
```

### P12 · Le garage
```text
A small, clean auto repair garage in Kinshasa. The yellow taxi, rear bumper repaired and shiny. Patrick pats
the hood, shakes hands warmly with the mechanic in blue overalls, both laugh. Late afternoon light through
the open garage door. Ambient: tools, laughter.
```

### P14 · Le coucher de soleil (plan final)
```text
Sunset on a wide Kinshasa boulevard lined with palm trees, warm orange sky. Grâce drives her small white car,
window down, hands on the wheel, relaxed smile; in the back seat her 8-year-old daughter laughs, seen from a distance.
Tracking shot from a parallel car, then slow crane up revealing the city. Ambient: wind, distant music.
```

## Versions 9:16 (P03, P05, P07, P10, P14)
Même prompt, en ajoutant au début : `Vertical 9:16 framing, subject centered in the upper two thirds.`
Générer une **nouvelle image clé verticale** plutôt que recadrer l'horizontale.

## Contrôle qualité de chaque plan (avant de le garder)
- [ ] Le visage correspond à la bible (même personne qu'au plan précédent).
- [ ] Les mains ont cinq doigts, les objets tiennent dans les mains.
- [ ] Aucun texte, logo ou plaque lisible inventé.
- [ ] Le rendu des peaux est riche et naturel, sans éclaircissement ni effet « cire ».
- [ ] Rien ne contredit la sécurité routière (pas de téléphone au volant en roulant, ceinture attachée).
- [ ] Le décor ressemble à Kinshasa (et pas à une ville générique), validé par une personne qui y vit.
