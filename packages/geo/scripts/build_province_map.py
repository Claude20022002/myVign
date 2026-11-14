"""Construit une carte SVG légère des 26 provinces de la RDC à partir de geoBoundaries (ODbL).

Usage : python -I build_province_map.py <entree.geojson> <sortie.ts>
Simplification Douglas-Peucker par anneau, projection équirectangulaire (la RDC est proche
de l'équateur, la déformation est négligeable), coordonnées arrondies au dixième de pixel.
"""
import json
import math
import sys
import unicodedata

NAME_TO_CODE = {
    "Central Kasai": "kasai_central",
    "Lower Uele": "bas_uele",
    "Upper Uele": "haut_uele",
    "North Kivu": "nord_kivu",
    "South Kivu": "sud_kivu",
}

WIDTH = 1000.0
EPSILON_DEG = 0.025  # tolérance de simplification (~1 px à cette échelle)


def to_code(name: str) -> str:
    if name in NAME_TO_CODE:
        return NAME_TO_CODE[name]
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return ascii_name.lower().replace("-", "_").replace(" ", "_")


def perpendicular(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    return abs(dy * x - dx * y + x2 * y1 - y2 * x1) / math.hypot(dx, dy)


def douglas_peucker(points, eps):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        best, index = 0.0, None
        for i in range(start + 1, end):
            d = perpendicular(points[i], points[start], points[end])
            if d > best:
                best, index = d, i
        if index is not None and best > eps:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def ring_area(ring):
    return 0.5 * sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]))


def centroid(ring):
    a = ring_area(ring)
    if a == 0:
        xs, ys = zip(*ring)
        return sum(xs) / len(xs), sum(ys) / len(ys)
    cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        f = x1 * y2 - x2 * y1
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    return cx / (6 * a), cy / (6 * a)


def polygons(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    return geometry["coordinates"]


def main(src: str, dst: str) -> None:
    with open(src, encoding="utf-8") as f:
        data = json.load(f)

    all_points = [
        pt
        for feat in data["features"]
        for poly in polygons(feat["geometry"])
        for ring in poly
        for pt in ring
    ]
    min_lon = min(p[0] for p in all_points)
    max_lon = max(p[0] for p in all_points)
    min_lat = min(p[1] for p in all_points)
    max_lat = max(p[1] for p in all_points)
    k = WIDTH / (max_lon - min_lon)
    height = (max_lat - min_lat) * k

    def project(pt):
        return ((pt[0] - min_lon) * k, (max_lat - pt[1]) * k)

    provinces = {}
    for feat in data["features"]:
        code = to_code(feat["properties"]["shapeName"])
        parts = []
        largest, largest_area = None, -1.0
        for poly in polygons(feat["geometry"]):
            outer = poly[0]
            area = abs(ring_area([tuple(p[:2]) for p in outer]))
            if area > largest_area:
                largest, largest_area = outer, area
            for ring in poly:
                simplified = douglas_peucker([tuple(p[:2]) for p in ring], EPSILON_DEG)
                # Écarte les îlots minuscules, garde toujours l'anneau principal.
                if len(simplified) < 4 and ring is not outer:
                    continue
                if len(simplified) < 4:
                    simplified = [tuple(p[:2]) for p in ring][:: max(1, len(ring) // 6)]
                coords = [project(p) for p in simplified]
                parts.append(
                    "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in coords) + "Z"
                )
        lon, lat = centroid([tuple(p[:2]) for p in largest])
        lx, ly = project((lon, lat))
        provinces[code] = {
            "path": "".join(parts),
            "label": [round(lx, 1), round(ly, 1)],
            "center": [round(lat, 4), round(lon, 4)],
        }

    if len(provinces) != 26:
        raise SystemExit(f"26 provinces attendues, {len(provinces)} trouvées")

    lines = [
        "// FICHIER GÉNÉRÉ par build_province_map.py : ne pas modifier à la main.",
        "// Source : geoBoundaries COD ADM1 (2017), données © contributeurs OpenStreetMap, licence ODbL 1.0.",
        "// Simplifié (Douglas-Peucker, tolérance 0,025°) et projeté en équirectangulaire.",
        "import type { ProvinceCode } from './provinces';",
        "",
        f"export const PROVINCE_MAP_VIEWBOX = '0 0 {WIDTH:.0f} {height:.0f}';",
        "",
        "/** Projection utilisée : x = (lng - minLng) * scale ; y = (maxLat - lat) * scale. */",
        f"export const PROVINCE_MAP_PROJECTION = {{ minLng: {min_lon:.6f}, maxLat: {max_lat:.6f}, scale: {k:.6f} }} as const;",
        "",
        "/** Projette un point [latitude, longitude] dans le repère de la carte. */",
        "export function projeter(lat: number, lng: number): [number, number] {",
        "  const { minLng, maxLat, scale } = PROVINCE_MAP_PROJECTION;",
        "  return [(lng - minLng) * scale, (maxLat - lat) * scale];",
        "}",
        "",
        "export interface ProvinceShape {",
        "  /** Tracé SVG (attribut d) dans le repère PROVINCE_MAP_VIEWBOX. */",
        "  path: string;",
        "  /** Position conseillée de l'étiquette, dans le même repère. */",
        "  label: readonly [number, number];",
        "  /** Centre géographique approximatif [latitude, longitude]. */",
        "  center: readonly [number, number];",
        "}",
        "",
        "export const PROVINCE_SHAPES: Record<ProvinceCode, ProvinceShape> = {",
    ]
    for code in sorted(provinces):
        p = provinces[code]
        lines.append(f"  {code}: {{")
        lines.append(f"    path: '{p['path']}',")
        lines.append(f"    label: [{p['label'][0]}, {p['label'][1]}],")
        lines.append(f"    center: [{p['center'][0]}, {p['center'][1]}],")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    size = sum(len(p["path"]) for p in provinces.values())
    print(f"{len(provinces)} provinces, {size / 1024:.1f} Ko de tracés, viewBox 0 0 {WIDTH:.0f} {height:.0f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
