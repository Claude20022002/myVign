"""
Vrais appareils pour les vidéos : le site dans un téléphone Pixel 8 et dans un ordinateur portable photographié.

- Téléphone : cadre officiel « device art » du Pixel 8 (Android Open Source Project, licence Apache 2.0),
  dans outils/appareils/pixel_8/. Écran 1080x2400 : vraie barre d'état Android de l'émulateur, teintée à la
  couleur du site comme une application installée, puis la page, puis la barre de navigation par gestes.
- Ordinateur : photo « Front Facing View Of Minimal Desk Setup » de Matthew Henry (Burst / Shopify, licence
  « Burst Some Rights Reserved » : usage commercial et modification autorisés, attribution facultative),
  dans outils/appareils/ordinateur/. La capture est projetée sur l'écran (4 coins mesurés), l'inscription de
  la marque du portable est effacée.
"""

from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ICI = Path(__file__).resolve().parent
APP = ICI / "appareils"
CAPTURES = ICI.parent / "captures"

BLEU_NUIT = (10, 64, 92)        # theme-color du site
ECRAN_W, ECRAN_H = 1080, 2400   # Pixel 8
BARRE_ETAT = 136                 # hauteur mesurée sur l'émulateur
BARRE_NAV = 56
ICONES_H = 84                    # les icônes de la barre d'état occupent les 84 premières lignes


# ---------------------------------------------------------------- Téléphone

@lru_cache(maxsize=1)
def _barres() -> tuple[Image.Image, Image.Image]:
    """Barre d'état et barre de navigation réelles, prises sur une capture de l'émulateur."""
    src = Image.open(next((CAPTURES / "mobile" / "appareil").glob("*-accueil.png"))).convert("RGB")
    etat = np.asarray(src.crop((0, 0, ECRAN_W, BARRE_ETAT))).copy()
    etat[ICONES_H:] = 0                                    # sous les icônes : message de Chrome (« Aucune connexion… ») effacé
    fond = (etat.max(axis=2) < 40)                        # fond noir → bleu nuit (comme une application installée)
    etat[fond] = BLEU_NUIT
    nav = np.asarray(src.crop((0, ECRAN_H - BARRE_NAV, ECRAN_W, ECRAN_H))).copy()
    clair = (nav.min(axis=2) > 235)                        # fond lavande de Chrome → blanc
    nav[clair] = (255, 255, 255)
    return Image.fromarray(etat), Image.fromarray(nav)


def ecran_telephone(page: Image.Image) -> Image.Image:
    """
    Compose l'écran 1080x2400 : barre d'état + page à pleine largeur (sans rognage : le cadre du téléphone
    recouvre déjà les bords) + barre de navigation. La page de Chrome (sans sa barre d'adresse) est environ 4 %
    moins haute que l'écran d'une application installée : elle est étirée d'autant en hauteur (imperceptible),
    ce qui garde le pied collant contre la barre de navigation.
    """
    etat, nav = _barres()
    dispo = ECRAN_H - BARRE_ETAT - BARRE_NAV
    p = page.convert("RGB").resize((ECRAN_W, dispo), Image.LANCZOS)
    e = Image.new("RGB", (ECRAN_W, ECRAN_H), (255, 255, 255))
    e.paste(etat, (0, 0))
    e.paste(p, (0, BARRE_ETAT))
    e.paste(nav, (0, ECRAN_H - BARRE_NAV))
    return e


@lru_cache(maxsize=1)
def _pixel():
    dos = Image.open(APP / "pixel_8" / "back.webp").convert("RGBA")
    # mask.webp est un calque posé PAR-DESSUS l'écran : coins arrondis et trou de la caméra (alpha 0 au centre)
    masque = Image.open(APP / "pixel_8" / "mask.webp").convert("RGBA")
    return dos, masque


def telephone(ecran: Image.Image) -> Image.Image:
    """Pixel 8 réel (1187x2513, fond transparent) avec l'écran donné (1080x2400)."""
    dos, masque = _pixel()
    out = Image.new("RGBA", dos.size, (0, 0, 0, 0))
    out.paste(ecran.convert("RGB"), (49, 55))
    out.alpha_composite(masque, (49, 55))
    out.alpha_composite(dos)
    # ce qui dépasse du cadre arrondi de l'appareil redevient transparent
    out.putalpha(_silhouette())
    return out


@lru_cache(maxsize=1)
def _silhouette() -> Image.Image:
    """Silhouette pleine de l'appareil : le cadre (alpha de back.webp) plus l'ouverture arrondie de l'écran."""
    dos, masque = _pixel()
    a = np.asarray(dos.split()[-1]).copy()
    ouverture = np.asarray(masque.split()[-1]) == 0          # là où le calque ne masque rien : l'écran visible
    zone = a[55:55 + ECRAN_H, 49:49 + ECRAN_W]
    zone[ouverture] = 255
    return Image.fromarray(a)


@lru_cache(maxsize=1)
def _ombre_telephone(largeur: int) -> Image.Image:
    dos, _ = _pixel()
    h = round(dos.height * largeur / dos.width)
    pad = largeur // 3
    o = Image.new("RGBA", (largeur + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(o).rounded_rectangle((pad + largeur * 0.04, pad + largeur * 0.10, pad + largeur * 0.96, pad + h * 1.0), largeur * 0.12, fill=(10, 30, 50, 80))
    return o.filter(ImageFilter.GaussianBlur(largeur * 0.08))


def poser_telephone(fond: Image.Image, appareil: Image.Image, cx: float, cy: float, largeur: int) -> None:
    """Pose le téléphone (avec ombre douce) sur un fond RGBA, centré en (cx, cy)."""
    h = round(appareil.height * largeur / appareil.width)
    a = appareil.resize((largeur, h), Image.LANCZOS)
    o = _ombre_telephone(largeur)
    pad = largeur // 3
    fond.alpha_composite(o, (int(cx - largeur / 2 - pad), int(cy - h / 2 - pad)))
    fond.alpha_composite(a, (int(cx - largeur / 2), int(cy - h / 2)))


# ---------------------------------------------------------------- Ordinateur

PHOTO = APP / "ordinateur" / "bureau_face.jpg"
# Coins de l'écran sur la photo 6720x4480 (haut-gauche, haut-droit, bas-droit, bas-gauche), mesurés par remplissage.
COINS = [(2781, 2313), (3888, 2312), (3891, 3006), (2779, 3006)]
MARQUE = (3270, 3020, 3405, 3058)   # inscription sous l'écran, effacée


@lru_cache(maxsize=1)
def photo_bureau() -> Image.Image:
    im = Image.open(PHOTO).convert("RGB")
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = MARQUE
    gauche = np.asarray(im.crop((x0 - 40, y0, x0 - 10, y1))).reshape(-1, 3).mean(axis=0)
    d.rectangle(MARQUE, fill=tuple(int(v) for v in gauche))
    return im


def _coeffs(dst, src):
    """Coefficients de Image.transform(PERSPECTIVE) qui envoient les points dst sur src."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    a = np.array(m, dtype=float)
    b = np.array([c for p in src for c in p], dtype=float)
    return np.linalg.solve(a, b).tolist()


def ordinateur(capture: Image.Image, cadre: tuple[int, int, int, int], sortie: tuple[int, int]) -> Image.Image:
    """
    Projette la capture (16:10) sur l'écran de la photo, puis renvoie la zone `cadre` (x0, y0, x1, y1, en pixels
    de la photo) redimensionnée à `sortie`. Travaille à l'échelle de sortie pour rester rapide.
    """
    x0, y0, x1, y1 = cadre
    echelle = sortie[0] / (x1 - x0)
    fond = _fond_reduit(cadre, sortie)
    coins = [((x - x0) * echelle, (y - y0) * echelle) for x, y in COINS]
    w = round(coins[1][0] - coins[0][0]) + 2
    h = round(coins[3][1] - coins[0][1]) + 2
    cap = capture.convert("RGB").resize((max(w, 2) * 2, max(h, 2) * 2), Image.LANCZOS)
    src = [(0, 0), (cap.width, 0), (cap.width, cap.height), (0, cap.height)]
    proj = cap.transform(sortie, Image.PERSPECTIVE, _coeffs(coins, src), Image.BICUBIC)
    masque = Image.new("L", sortie, 0)
    ImageDraw.Draw(masque).polygon(coins, fill=255)
    out = fond.copy()
    out.paste(proj, (0, 0), masque)
    # léger voile pour que l'écran ait la même lumière que la photo (évite l'effet « collé »)
    voile = Image.new("RGB", sortie, (238, 236, 240))
    out = Image.composite(Image.blend(out, voile, 0.04), out, masque)
    return out


@lru_cache(maxsize=8)
def _fond_reduit(cadre, sortie) -> Image.Image:
    return photo_bureau().crop(cadre).resize(sortie, Image.LANCZOS)


def cadre_ordinateur(largeur_portable_px: int, sortie: tuple[int, int], decalage_x: float = 0.0, decalage_y: float = 0.0):
    """
    Calcule un cadre de la photo de proportion `sortie`, centré sur le portable, tel que l'écran du portable
    mesure `largeur_portable_px` pixels de large une fois en sortie. decalage_x/y : déplacement du portable dans
    l'image, en fraction de la largeur/hauteur de sortie (positif = portable vers la droite / le bas).
    """
    ecran_w = COINS[1][0] - COINS[0][0]
    echelle = largeur_portable_px / ecran_w
    w = sortie[0] / echelle
    h = sortie[1] / echelle
    cx = (COINS[0][0] + COINS[1][0]) / 2 - decalage_x * w
    cy = (COINS[0][1] + COINS[3][1]) / 2 + 72 - decalage_y * h    # +72 : centre du portable entier (écran + clavier)
    return (round(cx - w / 2), round(cy - h / 2), round(cx + w / 2), round(cy + h / 2))
