"""
Prépare les données de la présentation animée (présentation interne SONAS) :
  - tracés des 26 provinces (packages/geo), couverture et agences (API simulée, port 4010) ;
  - icônes lucide (celles du site) en SVG ;
  - images des inserts produit (25 i/s), recadrées sur le téléphone.

  python preparer.py <dossier_cache>

Écrit <dossier_cache>/donnees.js et <dossier_cache>/images/<insert>/0001.jpg…
"""

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[3]
CACHE = Path(sys.argv[1] if len(sys.argv) > 1 else ICI / ".cache").resolve()
INSERTS = ICI.parents[1] / "video-promo" / "inserts"
API = "http://localhost:4010/v1"
ICONES = ["car", "smartphone", "qr-code", "shield-check", "map-pin", "clock", "siren", "file-check", "users", "wallet",
          "scan-line", "languages", "wifi", "building-2", "list-checks", "banknote", "circle-check", "landmark", "rocket",
          "trending-up", "receipt", "search", "calendar-check", "gauge", "handshake", "file-text"]


def api(chemin: str):
    with urllib.request.urlopen(API + chemin, timeout=10) as r:
        return json.load(r)


def provinces() -> dict:
    src = (RACINE / "packages/geo/src/provinces-map.ts").read_text(encoding="utf-8")
    proj = re.search(r"minLng: ([\d.\-]+), maxLat: ([\d.\-]+), scale: ([\d.]+)", src)
    min_lng, max_lat, scale = map(float, proj.groups())
    formes = {m.group(1): m.group(2) for m in re.finditer(r"(\w+): \{\s*path: '([^']+)'", src)}
    couverture = {p["code"]: p for p in api("/provinces")["items"]}
    agences = api("/agencies?limit=200")["items"]
    points = []
    vus: dict[tuple, int] = {}
    for a in agences:
        lat, lng = a["location"]["lat"], a["location"]["lng"]
        x, y = (lng - min_lng) * scale, (max_lat - lat) * scale
        cle = (round(x), round(y))
        n = vus.get(cle, 0)
        vus[cle] = n + 1
        if n:  # agences au même point (même commune) : petite spirale déterministe
            import math
            ang = n * 2.4
            r = 7 + 3.2 * math.sqrt(n)
            x, y = x + r * math.cos(ang), y + r * math.sin(ang)
        points.append({"x": round(x, 1), "y": round(y, 1), "province": a["province"], "nom": a["name"]})
    return {
        "formes": [{"code": c, "d": d, "agences": couverture.get(c, {}).get("agencyCount", 0), "nom": couverture.get(c, {}).get("name", c)} for c, d in formes.items()],
        "agences": points,
    }


def icones() -> dict:
    dossier = next(RACINE.glob("node_modules/.pnpm/lucide-react@*/node_modules/lucide-react/dist/esm/icons"))
    sortie = {}
    for nom in ICONES:
        src = (dossier / f"{nom}.mjs").read_text(encoding="utf-8")
        elements = []
        for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{([^}]*)\}\s*\]', src):  # nœuds sur une ou plusieurs lignes
            a = " ".join(f'{k}="{v}"' for k, v in re.findall(r'(\w+): "([^"]*)"', attrs) if k != "key")
            elements.append(f"<{tag} {a}/>")
        sortie[nom] = "".join(elements)
    return sortie


def images() -> dict:
    comptes = {}
    for f in sorted(INSERTS.glob("*_16x9.mp4")):
        nom = f.stem.replace("_16x9", "")
        d = CACHE / "images" / nom
        d.mkdir(parents=True, exist_ok=True)
        for vieux in d.glob("*.jpg"):
            vieux.unlink()
        # téléphone : recadré sur l'appareil ; ordinateur (pc_*) : la photo entière, réduite
        filtre = "null" if nom.startswith("pc_") else "crop=760:1080:580:0"   # PC en pleine définition (plein écran possible)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-threads", "4", "-i", str(f), "-vf", filtre, "-q:v", "2", str(d / "%04d.jpg")], check=True)
        comptes[nom] = len(list(d.glob("*.jpg")))
    return comptes


def telephone_detoure() -> None:
    """Téléphone réel détouré (PNG transparent) avec la page d'accueil, pour l'ouverture."""
    sys.path.insert(0, str(ICI.parent))
    import appareils as A
    from PIL import Image
    page = Image.open(next((ICI.parents[1] / "captures" / "mobile").glob("*-accueil.png")))
    tel = A.telephone(A.ecran_telephone(page))
    tel.resize((500, round(tel.height * 500 / tel.width)), Image.LANCZOS).save(CACHE / "telephone_accueil.png")


if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    telephone_detoure()
    donnees ={"carte": provinces(), "icones": icones(), "images": images()}
    (CACHE / "donnees.js").write_text("window.DONNEES = " + json.dumps(donnees, ensure_ascii=False) + ";", encoding="utf-8")
    print("provinces", len(donnees["carte"]["formes"]), "agences", len(donnees["carte"]["agences"]),
          "couvertes", sum(1 for f in donnees["carte"]["formes"] if f["agences"] > 0), "images", donnees["images"])
