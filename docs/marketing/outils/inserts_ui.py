"""
Inserts « produit » des vidéos : le vrai site dans de vrais appareils.

  python inserts_ui.py                    # tous les inserts : téléphone (16:9 et 9:16) et ordinateur (16:9)
  python inserts_ui.py paiement pc_agences

- Téléphone : cadre réel du Pixel 8 (appareils.py), barre d'état Android réelle, transitions d'écran,
  défilement simulé et onde de tap détectée automatiquement sur le bouton jaune.
- Ordinateur : photo réelle d'un portable sur un bureau, la capture projetée sur l'écran, fondus de navigation
  et léger travelling avant.

Entrées : ../captures/mobile/*.png (page Chrome Android) et ../captures/laptop/*.png (1440x900 @2x).
Sorties : ../video-promo/inserts/<nom>_16x9.mp4, <nom>_9x16.mp4 et pc_<nom>_16x9.mp4 (H.264, 25 i/s, sans texte).
Les versions précédentes sont gardées dans ../video-promo/archives/.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import appareils as A

ICI = Path(__file__).resolve().parent
CAPTURES = ICI.parent / "captures"
SORTIE = ICI.parent / "video-promo" / "inserts"
SORTIE.mkdir(parents=True, exist_ok=True)

FPS = 25  # cadence du film (télévision en RDC)
FOND = (245, 247, 249)  # DESIGN.md : fond


def capture(dossier: str, nom: str) -> Image.Image:
    return Image.open(next((CAPTURES / dossier).glob(f"*-{nom}.png"))).convert("RGB")


def cta_jaune(img: Image.Image) -> tuple[float, float] | None:
    """Centre du bouton jaune (#F5C800) le plus bas, en fractions de la largeur et de la hauteur de la page."""
    a = np.asarray(img).astype(int)
    m = (abs(a[..., 0] - 245) < 14) & (abs(a[..., 1] - 200) < 18) & (a[..., 2] < 60)
    ys, xs = np.nonzero(m)
    if len(xs) < 500:
        return None
    bas = ys > ys.max() - img.width * 0.12
    return xs[bas].mean() / img.width, ys[bas].mean() / img.height


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 4 * t**3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def encodeur(fichier: Path, w: int, h: int) -> subprocess.Popen:
    # Images brutes et 4 fils : l'ffmpeg 32 bits du poste manque de mémoire sinon.
    return subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-threads", "4", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(fichier)],
                            stdin=subprocess.PIPE)


# ---------------------------------------------------------------- Téléphone

def onde(ecran: Image.Image, x: float, y: float, t: float) -> Image.Image:
    """Onde de tap (t de 0 à 1) au point (x, y) de l'écran."""
    if t <= 0 or t >= 1:
        return ecran
    w = ecran.width
    calque = Image.new("RGBA", ecran.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    r = w * (0.04 + 0.10 * ease(t))
    a = int(150 * (1 - t))
    d.ellipse((x - r, y - r, x + r, y + r), fill=(27, 39, 51, a // 2), outline=(255, 255, 255, a), width=max(2, w // 160))
    if t < 0.5:
        r0 = w * 0.035
        d.ellipse((x - r0, y - r0, x + r0, y + r0), fill=(27, 39, 51, 110))
    out = ecran.convert("RGBA")
    out.alpha_composite(calque)
    return out.convert("RGB")


def images_telephone(sequence: list[dict]) -> list[Image.Image]:
    """Écrans successifs (1080x2400) avec tenues, taps et transitions."""
    for s in sequence:
        page = capture("mobile", s["capture"])
        s["ecran"] = A.ecran_telephone(page)
        s["cta"] = cta_jaune(page) if s.get("tap") else None
        s.setdefault("tenue", 1.5)
    haut, bas = A.BARRE_ETAT, A.ECRAN_H - A.BARRE_NAV
    dispo = bas - haut
    images = []
    for i, s in enumerate(sequence):
        n = int(s["tenue"] * FPS)
        for k in range(n):
            t = k / max(1, n - 1)
            e = s["ecran"]
            if s["cta"] and i < len(sequence) - 1 and t > 0.55:
                fx, fy = s["cta"]
                e = onde(e, fx * A.ECRAN_W, haut + fy * dispo, (t - 0.55) / 0.45)
            images.append(e)
        if i == len(sequence) - 1:
            break
        a, b = s["ecran"], sequence[i + 1]["ecran"]
        transition = sequence[i + 1].get("transition", "glisser")
        m = int((0.25 if transition == "fondu" else 0.45) * FPS)
        for k in range(1, m + 1):
            t = ease(k / m)
            if transition == "fondu":
                images.append(Image.blend(a, b, t))
                continue
            zone_a, zone_b = a.crop((0, haut, A.ECRAN_W, bas)), b.crop((0, haut, A.ECRAN_W, bas))
            c = Image.new("RGB", (A.ECRAN_W, dispo), (255, 255, 255))
            if transition == "monter":  # défilement simulé
                dy = int(dispo * t)
                c.paste(zone_a, (0, -dy))
                c.paste(zone_b, (0, dispo - dy))
            else:                        # navigation : l'écran suivant glisse depuis la droite
                c.paste(Image.blend(zone_a, Image.new("RGB", zone_a.size, (0, 0, 0)), 0.25 * t), (int(-0.3 * A.ECRAN_W * t), 0))
                c.paste(zone_b, (int(A.ECRAN_W * (1 - t)), 0))
            e = a.copy()
            e.paste(c, (0, haut))
            images.append(e)
    return images


def rendre_telephone(nom: str, sequence: list[dict], format_: str) -> None:
    W, H, largeur = (1920, 1080, 453) if format_ == "16x9" else (1080, 1920, 790)
    ecrans = images_telephone([dict(s) for s in sequence])
    fichier = SORTIE / f"{nom}_{format_}.mp4"
    ff = encodeur(fichier, W, H)
    total = len(ecrans)
    for k, e in enumerate(ecrans):
        t = k / max(1, total - 1)
        entree = ease(min(1.0, k / (0.6 * FPS)))
        zoom = 1.0 + 0.035 * t
        fond = Image.new("RGBA", (int(W / zoom), int(H / zoom)), FOND + (255,))
        A.poser_telephone(fond, A.telephone(e), fond.width / 2, fond.height / 2 + (1 - entree) * fond.height * 0.08, int(largeur / zoom))
        ff.stdin.write(fond.resize((W, H), Image.BILINEAR).convert("RGB").tobytes())
    ff.stdin.close()
    ff.wait()
    print(f"  ✓ {fichier.name} ({total / FPS:.1f} s)", flush=True)


# ---------------------------------------------------------------- Ordinateur

def rendre_ordinateur(nom: str, sequence: list[dict]) -> None:
    W, H = 1920, 1080
    caps = [capture("laptop", s["capture"]) for s in sequence]
    ecrans = []
    for i, s in enumerate(sequence):
        ecrans += [caps[i]] * int(s.get("tenue", 1.8) * FPS)
        if i < len(sequence) - 1:
            m = int(0.3 * FPS)
            ecrans += [Image.blend(caps[i], caps[i + 1], ease(k / m)) for k in range(1, m + 1)]
    fichier = SORTIE / f"{nom}_16x9.mp4"
    ff = encodeur(fichier, W, H)
    total = len(ecrans)
    for k, e in enumerate(ecrans):
        t = ease(k / max(1, total - 1))
        cadre = A.cadre_ordinateur(int(940 + 90 * t), (W, H))   # léger travelling avant sur le portable
        ff.stdin.write(A.ordinateur(e, cadre, (W, H)).tobytes())
    ff.stdin.close()
    ff.wait()
    print(f"  ✓ {fichier.name} ({total / FPS:.1f} s)", flush=True)


TELEPHONE = {
    # Plan 4 du storyboard : la plaque suffit, le prix tout de suite
    "souscription": [
        {"capture": "souscrire-plaque", "tap": True, "tenue": 1.6},
        {"capture": "souscrire-vehicule-trouve", "tap": True, "tenue": 1.4},
        {"capture": "souscrire-tarif", "tenue": 1.3},
        {"capture": "souscrire-tarif-dollars", "transition": "fondu", "tenue": 1.3},
    ],
    # Plan 5 : paiement mobile money → certificat avec QR
    "paiement": [
        {"capture": "paiement-choix", "tap": True, "tenue": 1.4},
        {"capture": "paiement-attente", "tenue": 1.6},
        {"capture": "certificat", "tenue": 1.6, "transition": "fondu"},
        {"capture": "certificat-qr", "tenue": 1.8, "transition": "monter"},
    ],
    # Plan 7 : contrôle routier, attestation valide
    "verification": [{"capture": "verification-valide", "tenue": 2.5}],
    # Plans 9-10 : sinistre (112 d'abord) puis suivi
    "sinistre": [
        {"capture": "sinistre-securite-112", "tenue": 1.4},
        {"capture": "sinistre-type", "tap": True, "tenue": 1.2},
        {"capture": "sinistre-zones", "tap": True, "tenue": 1.2},
        {"capture": "sinistre-envoye", "tenue": 1.5},
    ],
    "suivi": [{"capture": "suivi-chronologie", "tenue": 3.0}],
    # Plan 12 : agences et rendez-vous
    "agences": [
        {"capture": "agences", "tenue": 1.6},
        {"capture": "agences-lubumbashi", "tenue": 1.4},
        {"capture": "agences-rendez-vous", "transition": "fondu", "tenue": 1.6},
    ],
    "accueil": [
        {"capture": "accueil", "tenue": 1.6},
        {"capture": "accueil-dollars", "transition": "fondu", "tenue": 1.4},
    ],
}

ORDINATEUR = {
    "pc_accueil": [{"capture": "accueil", "tenue": 2.2}, {"capture": "accueil-dollars", "tenue": 1.6}],
    "pc_souscription": [{"capture": "souscrire-plaque", "tenue": 1.6}, {"capture": "souscrire-vehicule-trouve", "tenue": 1.4},
                        {"capture": "souscrire-tarif", "tenue": 2.0}],
    "pc_sinistre": [{"capture": "sinistre-securite-112", "tenue": 1.6}, {"capture": "sinistre-envoye", "tenue": 1.6},
                    {"capture": "suivi-chronologie", "tenue": 2.0}],
    # se termine sur la vue nationale (59 agences, carte) : c'est elle qui reste à l'écran
    "pc_agences": [{"capture": "agences-lubumbashi", "tenue": 2.0}, {"capture": "agences-rendez-vous", "tenue": 1.8},
                   {"capture": "agences", "tenue": 3.2}],
    "pc_gestion": [{"capture": "gestion-file", "tenue": 4.0}],
    "pc_verification": [{"capture": "verification-valide", "tenue": 3.0}],
}

if __name__ == "__main__":
    choix = sys.argv[1:] or list(TELEPHONE) + list(ORDINATEUR)
    for nom in choix:
        print(nom, flush=True)
        if nom in ORDINATEUR:
            rendre_ordinateur(nom, ORDINATEUR[nom])
        else:
            for f in ("16x9", "9x16"):
                rendre_telephone(nom, TELEPHONE[nom], f)
