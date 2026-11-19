"""Film produit SONAS. Depuis la racine : python docs/marketing/outils/motion/film_produit.py

Utilise les captures du dépôt, Pillow, NumPy, PyAV et les polices Segoe UI de Windows.
L'option --planche fichier.jpg génère les vues de contrôle au lieu de la vidéo.
"""

import argparse
import math
import os
import sys
from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
from pathlib import Path
from tempfile import mkstemp

import av
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent))
from appareils import ecran_telephone, ordinateur, telephone
from musique import basse, f, likembe, poser

MARKETING = ICI.parents[1]
CAPTURES = MARKETING / "captures"
DEST = MARKETING / "video-promo/rendus/sonas-visite-du-site-v2.mp4"
W, H, FPS, HZ = 1920, 1080, 25, 48000
NUIT, ENCRE, JAUNE = "#08394e", "#102f43", "#ffd244"


@dataclass(frozen=True)
class Plan:
    secondes: int
    rubrique: str
    titre: str
    texte: str
    vues: tuple
    legendes: tuple
    # Coordonnées en pixels de la capture laptop originale.
    cadre: tuple = ()
    sombre: bool = False


PLANS = [
    Plan(7, "Présentation du site", "La SONAS\nen ligne.", "De la première estimation au suivi d’un sinistre, découvrez les services proposés aux assurés en RDC.",
         ("01-accueil",), ("L’accueil sur ordinateur",), (230, 0, 2660, 1310), True),
    Plan(8, "Accueil", "Choisir son\nassurance", "Le catalogue distingue l’auto, accessible en ligne, des autres assurances, pour lesquelles le site oriente vers une agence.",
         ("02-accueil-complet",), ("Le catalogue des assurances",), (260, 1370, 2630, 2600)),
    Plan(8, "Devis auto", "Tout commence\npar la plaque", "Saisissez l’immatriculation. Si le véhicule est reconnu, sa fiche apparaît avec la marque, le modèle et la puissance à confirmer.",
         ("03-souscrire-plaque", "04-souscrire-vehicule-trouve"), ("Saisir la plaque", "Confirmer le véhicule")),
    Plan(8, "Devis auto", "Préciser\nl’usage", "Choisissez l’usage du véhicule et son lieu de stationnement, puis renseignez les dates de naissance et de permis du conducteur principal.",
         ("05-souscrire-usage", "06-souscrire-conducteur"), ("Usage et stationnement", "Profil du conducteur")),
    Plan(8, "Devis auto", "Comparer\nles formules", "Les garanties et le tarif annuel sont affichés avant la saisie de vos coordonnées. Basculez des francs congolais aux dollars pour comparer.",
         ("07-souscrire-tarif", "08-souscrire-tarif-dollars"), ("Tarifs en francs congolais", "Équivalent en dollars"), sombre=True),
    Plan(8, "Souscription", "Vérifier avant\nde valider", "Après le choix de la formule, indiquez vos coordonnées et votre adresse. Le récapitulatif permet de corriger chaque rubrique avant le paiement.",
         ("11-souscrire-carte-provinces", "12-souscrire-validation"), ("Choisir sa province", "Relire la demande")),
    Plan(9, "Paiement", "Valider sur\nson téléphone", "Sélectionnez un opérateur mobile money et confirmez la demande sur votre téléphone. Le site propose aussi la carte bancaire et le paiement en agence.",
         ("13-paiement-choix", "14-paiement-attente"), ("Choix du moyen de paiement", "Confirmation sur le téléphone")),
    Plan(8, "Attestation", "Garder son\ncertificat", "Après confirmation du paiement, le certificat provisoire est disponible au téléchargement. Il réunit le véhicule assuré, la période de couverture et un QR code.",
         ("15-certificat", "16-certificat-qr"), ("Certificat provisoire", "QR code du certificat"), sombre=True),
    Plan(8, "Vérification", "Contrôler une\nattestation", "Scannez le QR code ou saisissez le code du certificat. La page de vérification affiche sa validité, le véhicule et les dates, avec le nom de l’assuré masqué.",
         ("33-verifier", "17-verification-valide"), ("Saisir le code", "Lire le résultat")),
    Plan(9, "Déclaration de sinistre", "Déclarer\nun accident", "Le parcours commence par la sécurité des personnes. Une fois en sécurité, indiquez vos coordonnées, le type de sinistre, le lieu et l’heure.",
         ("19-sinistre-securite-112", "22-sinistre-quand-ou"), ("Vérifier la sécurité de chacun", "Situer le sinistre")),
    Plan(8, "Déclaration de sinistre", "Montrer\nles dégâts", "Décrivez les faits, touchez la partie du véhicule endommagée et indiquez les tiers impliqués. Après l’envoi, conservez la référence et la liste des pièces à préparer.",
         ("24-sinistre-zones", "27-sinistre-envoye"), ("Désigner la zone touchée", "Retrouver les pièces à préparer")),
    Plan(9, "Espace gestionnaire", "Traiter\nles dossiers", "Côté SONAS, les déclarations arrivent dans une file. Le gestionnaire sélectionne un dossier pour l’instruire, demander une expertise ou transmettre une offre.",
         ("31-gestion-file",), ("La file des sinistres déclarés",), (258, 585, 2610, 1770), True),
    Plan(9, "Suivi du sinistre", "Voir où en est\nson dossier", "Avec votre référence et votre téléphone, retrouvez la chronologie, les pièces attendues et l’option de rappel. Chaque nouvelle étape apparaît dans le suivi.",
         ("30-suivi-chronologie",), ("La chronologie côté assuré",), (385, 245, 2495, 1440)),
    Plan(8, "Réseau d’agences", "Trouver une\nagence", "Recherchez une ville ou filtrez par province. La liste et la carte permettent de repérer une agence, de vérifier ses horaires et de préparer son itinéraire.",
         ("32-agences",), ("La carte et la liste des agences",), (260, 215, 2620, 1720)),
    Plan(8, "Rendez-vous", "Choisir\nun créneau", "À Lubumbashi, par exemple, ouvrez la fiche d’une agence, puis choisissez un jour et une heure dans le calendrier de rendez-vous.",
         ("31-agences-lubumbashi", "32-agences-rendez-vous"), ("Sélectionner l’agence", "Consulter les créneaux disponibles")),
    Plan(8, "Assistance", "Demander\nde l’aide", "Le bouton Aide ouvre les questions fréquentes et la discussion avec un conseiller. Pour être rappelé, laissez votre numéro et choisissez un créneau.",
         ("34-aide", "35-aide-rappel"), ("Contacter un conseiller", "Programmer un rappel")),
    Plan(6, "Services aux assurés", "Votre espace\nSONAS en ligne", "Un tarif pour choisir. Un certificat à présenter. Un dossier à suivre, sur ordinateur comme sur téléphone.",
         ("01-accueil", "28-suivi-chronologie"), ("Souscrire", "Suivre un sinistre"), sombre=True),
]

# Agrandissements tirés du second écran, pour lire les détails pendant la visite.
DETAILS = {
    "04-souscrire-vehicule-trouve": ((38, 625, 1044, 1320), "Le véhicule retrouvé"),
    "08-souscrire-tarif-dollars": ((33, 838, 1048, 1285), "Le prix et les garanties"),
    "16-certificat-qr": ((275, 822, 805, 1310), "Le code à scanner"),
    "27-sinistre-envoye": ((37, 820, 1048, 1630), "Les pièces du dossier"),
    "32-agences-rendez-vous": ((34, 365, 1040, 1003), "Les heures proposées"),
}


@lru_cache
def police(taille, gras=False):
    return ImageFont.truetype("segoeuib.ttf" if gras else "segoeui.ttf", taille)


def couper(texte, fonte, largeur):
    lignes = []
    for mot in texte.split():
        if lignes and fonte.getlength(lignes[-1] + " " + mot) <= largeur:
            lignes[-1] += " " + mot
        else:
            lignes.append(mot)
    return lignes


def doux(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)


@lru_cache(maxsize=2)
def decor(sombre):
    fond = Image.new("RGB", (W, H), NUIT if sombre else "#f8f8f2")
    d = ImageDraw.Draw(fond)
    # La planche de droite isole le blanc des captures du texte éditorial.
    d.rectangle((704, 0, W, H), fill="#105469" if sombre else "#dfedf0")
    traits = "#286679" if sombre else "#c7dcdf"
    for rayon in (270, 425, 590, 765):
        d.arc((1455-rayon, 535-rayon, 1455+rayon, 535+rayon), 196, 352, fill=traits, width=2)
        d.arc((1455-rayon, 535-rayon, 1455+rayon, 535+rayon), 8, 166, fill=traits, width=2)
    for x in range(746, W, 48):
        for y in (35, 1044):
            d.ellipse((x, y, x+2, y+2), fill=traits)
    return fond


def portable(source, region):
    # L'écran photographié est au format 16:10. Élargir la zone visible autour
    # du contenu conserve les proportions des textes et des icônes.
    x0, y0, x1, y1 = region
    largeur = max(x1-x0, round((y1-y0)*1.6))
    hauteur = round(largeur/1.6)
    x = max(0, min(source.width-largeur, (x0+x1-largeur)//2))
    y = max(0, min(source.height-hauteur, (y0+y1-hauteur)//2))
    capture = source.crop((x, y, x+largeur, y+hauteur))
    # Contour du châssis mesuré dans la photo de Matthew Henry. La projection
    # réutilise les quatre coins de la dalle déjà étalonnés dans appareils.py.
    cadre = (2680, 2220, 4000, 3260)
    taille = (1320, 1040)
    photo = ordinateur(capture, cadre, taille)
    silhouette = Image.new("L", taille)
    d = ImageDraw.Draw(silhouette)
    d.rounded_rectangle((71, 47, 1237, 851), radius=29, fill=255)
    d.polygon([(73,824),(1236,824),(1291,950),(1290,968),(1284,975),
               (1264,983),(58,983),(36,979),(31,973),(32,950)], fill=255)
    appareil = photo.convert("RGBA")
    appareil.putalpha(silhouette.filter(ImageFilter.GaussianBlur(.8)))
    ombre = Image.new("L", taille)
    ImageDraw.Draw(ombre).ellipse((42, 951, 1280, 999), fill=95)
    composition = Image.new("RGBA", taille, "#1a2733")
    composition.putalpha(ombre.filter(ImageFilter.GaussianBlur(12)))
    composition.alpha_composite(appareil)
    return composition.resize((1188, 936), Image.Resampling.LANCZOS)


def ecran(plan, nom):
    dossier = "laptop" if plan.cadre else "mobile"
    with Image.open(CAPTURES / dossier / (nom + ".png")) as source:
        if not plan.cadre:
            return telephone(ecran_telephone(source)).resize((369, 781), Image.Resampling.LANCZOS)
        return portable(source, plan.cadre)


class Scene:
    def __init__(self, index):
        self.index = index
        self.plan = p = PLANS[index]
        self.fond = decor(p.sombre).copy()
        self.encre = "#ffffff" if p.sombre else ENCRE
        gris = "#c1dce1" if p.sombre else "#45606b"
        d = ImageDraw.Draw(self.fond)
        d.rectangle((68, 88, 116, 95), fill=JAUNE if p.sombre else "#0978a8")
        d.text((130, 71), p.rubrique.upper(), font=police(26, True), fill=self.encre)
        d.text((70, 962), "SONAS  /  DÉMONSTRATION DU SITE", font=police(20, True), fill=gris)
        self.titre = Image.new("RGBA", (635, 242))
        taille = 82 if index in (0, len(PLANS)-1) else 72
        f = police(taille, True)
        for ligne in p.titre.splitlines():
            if f.getlength(ligne) > 630:
                raise ValueError(f"Titre trop large : {ligne}")
        ImageDraw.Draw(self.titre).multiline_text((0, 0), p.titre, font=f, fill=self.encre, spacing=-2)
        self.corps = Image.new("RGBA", (575, 348))
        f = police(34)
        lignes = couper(p.texte, f, 558)
        if len(lignes) * 48 > self.corps.height:
            raise ValueError(f"Texte trop haut : {p.titre}")
        c = ImageDraw.Draw(self.corps)
        for j, ligne in enumerate(lignes):
            c.text((0, j*48), ligne, font=f, fill=gris)
        self.visuels = [ecran(p, nom) for nom in p.vues]
        self.detail = None
        if p.vues[-1] in DETAILS:
            rect, self.titre_detail = DETAILS[p.vues[-1]]
            with Image.open(CAPTURES / "mobile" / (p.vues[-1]+".png")) as source:
                detail = source.crop(rect).convert("RGB")
            detail.thumbnail((540, 405), Image.Resampling.LANCZOS)
            self.detail = Image.new("RGBA", (detail.width+20, detail.height+20))
            ImageDraw.Draw(self.detail).rounded_rectangle(
                (0, 0, self.detail.width-1, self.detail.height-1), radius=14, fill="#ffffff", outline="#8daeb7", width=2)
            self.detail.paste(detail, (10, 10))
        self.legendes = []
        for legende in p.legendes:
            label = Image.new("RGBA", (680, 50))
            ImageDraw.Draw(label).text((340, 0), legende, anchor="mt", font=police(25, True), fill=self.encre)
            self.legendes.append(label)

    def image(self, t):
        p = self.plan
        im = self.fond.copy()
        # Le masque fixe révèle le texte pendant que les écrans se mettent en place.
        for calque, y, delai in ((self.titre, 292, 0), (self.corps, 540, .17)):
            avance = doux((t - delai) / .67)
            decalage = round(calque.height * (1 - avance))
            if decalage < calque.height:
                part = calque if not decalage else calque.crop((0, 0, calque.width, calque.height-decalage))
                im.paste(part, (66, y+decalage), part)
        zoom = doux((t-3.35)/.75) if self.detail else 0
        for j, visuel in enumerate(self.visuels):
            entre = doux((t-.12-j*.42)/.82)
            centre = 1310 if p.cadre else (1072, 1550)[j]
            centre += round(zoom * (-148 if j==0 else 72))
            opacite = entre * (1-zoom if j==0 else 1)
            haut = (H-visuel.height)//2-5 if p.cadre else (103, 162)[j]
            x = round(centre-visuel.width/2 + (1-entre)*65)
            y = round(haut + (1-entre)*95 - doux(t/p.secondes)*9)
            if opacite <= 0:
                continue
            if opacite < 1:
                masque = visuel.getchannel("A").point(lambda a: round(a*opacite))
                im.paste(visuel, (x, y), masque)
            else:
                im.paste(visuel, (x, y), visuel)
            legende = self.legendes[j]
            if opacite > .86:
                im.paste(legende, (centre-340, y+visuel.height+17), legende)
        d = ImageDraw.Draw(im)
        if zoom:
            cx, cy = 1083, 543
            x = round(cx-self.detail.width/2+(1-zoom)*60)
            y = cy-self.detail.height//2
            d.line((x+self.detail.width-2, cy, x+self.detail.width+round(zoom*(1428-x-self.detail.width)), cy),
                   fill="#3990a7", width=3)
            im.paste(self.detail, (x, y), self.detail.getchannel("A").point(lambda a: round(a*zoom)))
            if zoom > .8:
                d.text((cx, y-28), self.titre_detail, anchor="mb", font=police(29, True), fill=self.encre)
        # Repère de lecture animé, avec un temps de maintien en fin de plan.
        d.rectangle((68, 1018, 629, 1021), fill="#426573" if p.sombre else "#d0dedd")
        fraction = (self.index + doux(t / p.secondes))/len(PLANS)
        d.rectangle((68, 1017, round(69+560*fraction), 1022), fill=JAUNE if p.sombre else "#057eaa")
        return im


def musique(duree):
    """Piano feutré, basse tenue et réponses de likembé à 72 BPM."""
    piste = np.zeros((round(duree*HZ), 2), dtype=np.float32)
    temps = 60/72
    mesure = 4*temps
    accords = ((41,(57,60,64,67)), (48,(55,60,64,67)), (38,(57,60,62,65)),
               (46,(53,57,60,65)), (43,(55,58,62,65)), (45,(57,60,64,67)),
               (46,(53,57,62,65)), (48,(55,60,62,65)))

    def stereo(son, debut, gain, pan):
        poser(piste[:,0], son, debut, gain*math.sqrt(1-pan))
        poser(piste[:,1], son, debut, gain*math.sqrt(pan))

    @lru_cache
    def piano(midi):
        t = np.arange(round(5.4*HZ))/HZ
        phase = 2*np.pi*f(midi)*t
        corde = (np.sin(phase) + .50*np.sin(phase*1.0015))*np.exp(-t/1.9)
        attaque = .34*np.sin(phase*2.001)*np.exp(-t/.83) + .10*np.sin(phase*3.006)*np.exp(-t/.34)
        return (corde+attaque)*np.minimum(t/.024, 1)*np.minimum((5.4-t)/.45, 1)

    for i in range(math.ceil(duree/mesure)):
        debut = i*mesure
        if debut > duree-4.8:
            break
        accord_grave, notes = accords[i % len(accords)]
        if debut+mesure > duree-4.8:
            accord_grave, notes = accords[0]  # résolution avant le fondu du dernier écran
        stereo(basse(f(accord_grave), 3.2), debut, .31, .5)
        for j, midi in enumerate(notes):
            stereo(piano(midi), debut+.055*j, (.19,.14,.12,.10)[j], .30+.13*j)
        if i % 4 in (1, 3) and debut+mesure < duree-5:
            # Une courte réponse entre les accords, dans le registre de la main droite.
            for battement, midi in ((2.05, notes[2]+12), (3.15, notes[1]+12)):
                stereo(likembe(f(midi), 1.55), debut+battement*temps, .072, .62)
    # Premières réflexions courtes : donner de l'espace aux accords sans
    # prolonger les attaques sous la parole.
    for canal, retard in enumerate((.079, .107)):
        n = round(retard*HZ)
        piste[n:,canal] += .12*piste[:-n,1-canal]
    piste[:HZ] *= np.linspace(0, 1, HZ)[:,None]
    fin = round(3*HZ)
    piste[-fin:] *= np.linspace(1, 0, fin)[:,None]
    rms = np.sqrt(np.mean(np.square(piste), dtype=np.float64))
    piste *= 10**(-31/20)/rms
    return piste


def rendu(destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    duree = sum(p.secondes for p in PLANS)
    son = musique(duree)
    # Créer le fichier directement dans rendus pour hériter de ses droits Windows.
    fd, chemin = mkstemp(dir=destination.parent, suffix=".mp4")
    os.close(fd)
    fichier = Path(chemin)
    try:
        with av.open(str(fichier), "w", options={"movflags": "+faststart"}) as conteneur:
            conteneur.metadata["title"] = "La SONAS en ligne — Visite du site"
            video = conteneur.add_stream("libx264", rate=FPS)
            video.width, video.height, video.pix_fmt = W, H, "yuv420p"
            video.options = {"preset": "veryfast", "crf": "18", "threads": "4"}
            audio = conteneur.add_stream("aac", rate=HZ)
            audio.layout, audio.bit_rate = "stereo", 160000
            numero = echantillon = 0
            precedente = None
            for i, p in enumerate(PLANS):
                scene = Scene(i)
                print(f"{i+1:02d}/{len(PLANS)}  {p.rubrique}", flush=True)
                for j in range(p.secondes*FPS):
                    im = scene.image(j/FPS)
                    # Volet horizontal en jaune SONAS entre deux chapitres.
                    if precedente is not None and j < 12:
                        bord = round(W*doux((j+1)/12))
                        im.paste(precedente.crop((bord, 0, W, H)), (bord, 0))
                        if bord < W:
                            ImageDraw.Draw(im).rectangle((bord, 0, bord+8, H), fill=JAUNE)
                    trame = av.VideoFrame.from_image(im)
                    trame.pts = numero
                    conteneur.mux(video.encode(trame))
                    numero += 1
                    while echantillon < numero*HZ//FPS:
                        segment = np.ascontiguousarray(son[echantillon:echantillon+1024].T)
                        paquet = av.AudioFrame.from_ndarray(segment, format="fltp", layout="stereo")
                        paquet.sample_rate, paquet.pts, paquet.time_base = HZ, echantillon, Fraction(1,HZ)
                        conteneur.mux(audio.encode(paquet))
                        echantillon += segment.shape[1]
                precedente = im
            conteneur.mux(video.encode())
            conteneur.mux(audio.encode())
        fichier.replace(destination)
    finally:
        fichier.unlink(missing_ok=True)
    print(destination, flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--planche", type=Path)
    args = parser.parse_args()
    if args.planche:
        planche = Image.new("RGB", (1280, math.ceil(len(PLANS)/3)*240), "#e5ecec")
        for i in range(len(PLANS)):
            vue = Scene(i).image(3).resize((424, 238), Image.Resampling.LANCZOS)
            planche.paste(vue, ((i%3)*427, (i//3)*240))
        planche.save(args.planche)
    else:
        rendu(DEST)
