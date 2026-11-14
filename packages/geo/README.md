# @myvign/geo

Référentiel géographique de myVign (partie B). Aucune dépendance d'exécution.

| Import | Contenu |
|---|---|
| `@myvign/geo/provinces` | Codes des 26 provinces, noms, chefs-lieux, fuseaux ; 24 communes de Kinshasa |
| `@myvign/geo/agencies` | 59 agences SONAS nettoyées (province, ville, commune, adresse, coordonnées approximatives) |
| `@myvign/geo/map` | Carte SVG des 26 provinces : `PROVINCE_MAP_VIEWBOX` et `PROVINCE_SHAPES[code].path` (≈ 31 Ko, ≈ 10 Ko compressé) |

## Carte interactive (exemple pour le front)
```tsx
import { PROVINCE_MAP_VIEWBOX, PROVINCE_SHAPES } from '@myvign/geo/map';

<svg viewBox={PROVINCE_MAP_VIEWBOX} role="group" aria-label="Choisir une province">
  {Object.entries(PROVINCE_SHAPES).map(([code, shape]) => (
    <path key={code} d={shape.path} onClick={() => choose(code)} /* + tabIndex, rôle, nom accessible */ />
  ))}
</svg>
```
La carte ne doit jamais être le seul moyen de choisir : Kinshasa et le Kasaï-Oriental y sont minuscules. Il faut toujours une liste ou une recherche à côté.

## Sources et licences
- **Contours** : [geoBoundaries](https://www.geoboundaries.org/) COD ADM1 (2017), dérivés d'OpenStreetMap. **© contributeurs OpenStreetMap, licence ODbL 1.0** : la mention doit apparaître sous la carte.
  Régénération : `python -I scripts/build_province_map.py <geoBoundaries-COD-ADM1_simplified.geojson> src/provinces-map.ts` (Douglas-Peucker, tolérance 0,025°).
- **Agences** : sonas.cd, relevé du 14/11/2026, nettoyé à la main. Coordonnées approximatives (centre de la commune ou de la ville) : un géocodage précis, validé par la SONAS, reste à faire.
