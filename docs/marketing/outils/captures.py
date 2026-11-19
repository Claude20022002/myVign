"""
Captures d'écran marketing du site (vidéos promotionnelles).

  py -I captures.py desktop            # Chromium local, 1920x1080 @2x
  py -I captures.py mobile             # Chrome de l'émulateur Android (CDP sur localhost:9222)

Prérequis mobile :
  adb reverse tcp:3000 tcp:3000
  adb forward tcp:9222 localabstract:chrome_devtools_remote
  (Chrome lancé avec le débogage : `adb shell am set-debug-app --persistent com.android.chrome`)

Le site doit tourner (`pnpm dev` à la racine). Les éléments propres à la démo
(bandeau « Démonstration », plaques d'essai, simulateur d'opérateur, indicateur Next.js)
sont masqués au moment de la capture : le code du site n'est pas modifié.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

MODE = sys.argv[1] if len(sys.argv) > 1 else "desktop"
BASE = "http://localhost:3000"
RACINE = Path(__file__).resolve().parents[1] / "captures" / MODE
RACINE.mkdir(parents=True, exist_ok=True)
ENV_ADB = {**os.environ, "MSYS_NO_PATHCONV": "1"}

MASQUER = r"""
() => {
  const style = document.getElementById('__promo') || Object.assign(document.createElement('style'), { id: '__promo' });
  style.textContent = 'nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; } * { caret-color: transparent !important; }';
  document.head.appendChild(style);
  for (const el of document.querySelectorAll('div, p, details, span')) {
    const t = (el.textContent || '').trim();
    if (el.children.length < 3 && t.startsWith('Démonstration myVign')) el.style.display = 'none';
    if (el.tagName === 'SPAN' && /myVign/.test(t) && el.children.length === 0) el.style.display = 'none';
    if (t.startsWith('Démo : plaques') && el.classList.contains('border-dashed')) el.style.display = 'none';
    if (el.tagName === 'DETAILS' && t.startsWith('Démo :')) el.style.display = 'none';
  }
}
"""

compteur = 0


def shot(page: Page, nom: str, pleine_page: bool = False) -> None:
    global compteur
    if pleine_page and MODE == "mobile":
        return  # Chrome Android piloté par CDP recolle mal les captures pleine page : on s'en passe
    compteur += 1
    page.wait_for_timeout(450)
    page.evaluate("() => document.activeElement && document.activeElement.blur && document.activeElement.blur()")
    page.evaluate(MASQUER)
    if pleine_page:
        # Les en-têtes et pieds collants se dessinent au milieu d'une capture pleine page : on les remet dans le flux.
        page.evaluate("() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('body *')) { const p = getComputedStyle(e).position; if (p === 'sticky' || p === 'fixed') e.style.position = 'relative'; } }")
    page.wait_for_timeout(150)
    fichier = RACINE / f"{compteur:02d}-{nom}.png"
    for essai in range(3):
        try:
            page.screenshot(path=str(fichier), full_page=pleine_page, animations="disabled")
            break
        except Exception:
            if essai == 2:
                raise
            page.wait_for_timeout(1000)
    if MODE == "mobile":
        appareil = RACINE / "appareil" / f"{compteur:02d}-{nom}.png"
        appareil.parent.mkdir(exist_ok=True)
        with open(appareil, "wb") as f:
            subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=f, env=ENV_ADB, check=False)
    print("  ✓", fichier.name, flush=True)


def aller(page: Page, chemin: str) -> None:
    page.goto(BASE + chemin, wait_until="networkidle")
    page.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
    page.reload(wait_until="networkidle")
    page.evaluate(MASQUER)


def cliquer(loc) -> None:
    """Sur mobile (CDP), clic JavaScript : le viewport de l'émulateur bouge et Playwright attend indéfiniment la stabilité."""
    if MODE == "mobile":
        loc.wait_for(state="attached")
        loc.evaluate("e => { e.scrollIntoView({block: 'center'}); (e.closest('label') || e).click(); }")
    else:
        loc.click()


def cta(page: Page, texte: str | None = None) -> None:
    """Clique le bouton jaune du pied collant (ou un bouton par son texte)."""
    if texte:
        cliquer(page.get_by_role("button", name=texte, exact=False).last)
    else:
        cliquer(page.locator("div.sticky.bottom-0 button").last)
    page.wait_for_timeout(900)
    page.wait_for_load_state("networkidle")


def choisir(page: Page, libelle: str) -> None:
    cliquer(page.get_by_text(libelle, exact=True).first)


SANS_CLAVIER = "() => document.querySelectorAll('input, textarea').forEach(e => e.setAttribute('inputmode', 'none'))"


def remplir(page: Page, label: str, valeur: str, exact: bool = True) -> None:
    champ = page.get_by_label(label, exact=exact).first
    if MODE == "mobile":
        page.evaluate(SANS_CLAVIER)
    page.evaluate(MASQUER)
    champ.fill(valeur)


def selectionner(page: Page, label: str, valeur: str | None = None, index: int = 1) -> None:
    s = page.get_by_label(label, exact=True).first
    if valeur:
        s.select_option(label=valeur)
    else:
        s.select_option(index=index)


def devise(page: Page, code: str) -> None:
    cliquer(page.get_by_role("group", name="Devise d'affichage").first.get_by_role("button", name=code, exact=True))
    page.wait_for_timeout(400)


# ---------------------------------------------------------------- Scènes

def accueil(page: Page) -> None:
    aller(page, "/")
    shot(page, "accueil")
    shot(page, "accueil-complet", pleine_page=True)
    devise(page, "$")
    shot(page, "accueil-dollars")
    devise(page, "FC")


def souscription(page: Page) -> None:
    aller(page, "/souscrire/auto")
    remplir(page, "Immatriculation", "4521AB 01")
    shot(page, "souscrire-plaque")
    cta(page)
    shot(page, "souscrire-vehicule-trouve")
    cta(page)
    choisir(page, "Privé et trajet travail")
    choisir(page, "Garage fermé")
    shot(page, "souscrire-usage")
    cta(page)
    remplir(page, "Date de naissance", "1988-03-14")
    remplir(page, "Date d’obtention du permis", "2010-06-02")
    shot(page, "souscrire-conducteur")
    cta(page)
    page.wait_for_timeout(800)
    shot(page, "souscrire-tarif")
    remplir(page, "Valeur actuelle du véhicule", "12000")
    devise(page, "$")
    shot(page, "souscrire-tarif-dollars")
    devise(page, "FC")
    cta(page)
    remplir(page, "Prénom", "Grâce")
    remplir(page, "Nom", "Mbuyi")
    remplir(page, "Téléphone", "812345678")
    selectionner(page, "Profession", "Commerçant(e)")
    shot(page, "souscrire-identite")
    cta(page)
    selectionner(page, "Commune", "Gombe") if page.get_by_label("Commune").first.locator("option", has_text="Gombe").count() else selectionner(page, "Commune", index=4)
    remplir(page, "Avenue et numéro", "24, avenue Colonel Mondjiba")
    shot(page, "souscrire-adresse")
    cliquer(page.get_by_role("button", name="Choisir sur la carte"))
    page.wait_for_timeout(500)
    shot(page, "souscrire-carte-provinces")
    cta(page)
    # Cocher les cases elles-mêmes (cliquer le texte peut tomber sur le lien des conditions générales)
    for i in range(2):
        page.locator("input[type=checkbox]").nth(i).evaluate("e => { if (!e.checked) e.click(); }")
    shot(page, "souscrire-validation")
    cta(page)
    shot(page, "paiement-choix")
    cliquer(page.get_by_role("button", name="Payer", exact=False).last)
    page.wait_for_timeout(1500)
    shot(page, "paiement-attente")
    page.get_by_text("Vous êtes assuré", exact=False).first.wait_for(timeout=30000)
    page.wait_for_timeout(1500)
    shot(page, "certificat")
    shot(page, "certificat-complet", pleine_page=True)
    page.locator("img[alt^='QR code']").first.evaluate("e => e.scrollIntoView({block: 'center'})")
    page.wait_for_timeout(500)
    shot(page, "certificat-qr")
    page.evaluate("() => window.scrollTo(0, 0)")
    lien = page.get_by_text("Tester la vérification", exact=False)
    if lien.count():
        href = lien.first.evaluate("e => (e.closest('a') || e).getAttribute('href')")
        if href:
            page.goto(href if href.startswith("http") else BASE + href, wait_until="networkidle")
        else:
            cliquer(lien.first)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        shot(page, "verification-valide")


def sinistre(page: Page) -> None:
    aller(page, "/sinistre")
    shot(page, "sinistre-choix")
    aller(page, "/sinistre/auto")
    shot(page, "sinistre-securite-112")
    choisir(page, "Oui, personne n’est blessé")
    cta(page)
    remplir(page, "Prénom", "Patrick")
    remplir(page, "Nom", "Kabongo")
    remplir(page, "Téléphone", "812345678")
    remplir(page, "Plaque du véhicule assuré", "4521AB 01")
    shot(page, "sinistre-coordonnees")
    cta(page)
    choisir(page, "Accident")
    shot(page, "sinistre-type")
    cta(page)
    remplir(page, "Date", time.strftime("%Y-%m-%d"))
    remplir(page, "Heure", "18:30")
    selectionner(page, "Commune", "Lingwala") if page.get_by_label("Commune").first.locator("option", has_text="Lingwala").count() else selectionner(page, "Commune", index=5)
    shot(page, "sinistre-quand-ou")
    cta(page)
    remplir(page, "Ce qui s’est passé", "À l’arrêt au feu rouge du boulevard du 30 Juin, un taxi m’a percuté par l’arrière.")
    shot(page, "sinistre-recit")
    cta(page)
    zone = page.locator("svg [role=button], svg [tabindex='0'], button[aria-pressed]").first
    if zone.count():
        cliquer(zone)
    shot(page, "sinistre-zones")
    cta(page)
    choisir(page, "Oui")
    page.wait_for_timeout(300)
    if page.get_by_label("Nom de l’autre conducteur").count():
        remplir(page, "Nom de l’autre conducteur", "Mukendi")
        remplir(page, "Sa plaque", "7810KC 01", exact=False)
    shot(page, "sinistre-tiers")
    cta(page)
    shot(page, "sinistre-recapitulatif")
    cta(page)
    page.get_by_text("Déclaration envoyée", exact=False).first.wait_for(timeout=20000)
    shot(page, "sinistre-envoye")
    suivre = page.get_by_role("link", name="Suivre mon dossier")
    if suivre.count():
        cliquer(suivre.first)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(11000)  # le mock passe le dossier en « reçu » après 10 s
        shot(page, "suivi-chronologie")


def gestion(page: Page) -> None:
    aller(page, "/gestion")
    page.wait_for_timeout(800)
    shot(page, "gestion-file")


def agences(page: Page) -> None:
    aller(page, "/agences")
    page.wait_for_timeout(1200)
    shot(page, "agences")
    for nom in ("Haut-Katanga",):
        cible = page.get_by_role("button", name=nom)
        if cible.count():
            cliquer(cible.first)
            page.wait_for_timeout(1200)
            shot(page, "agences-haut-katanga")
    aller(page, "/agences/haut_katanga/lubumbashi")
    page.wait_for_timeout(1000)
    shot(page, "agences-lubumbashi")
    rdv = page.get_by_role("button", name="Prendre RDV")
    if rdv.count():
        cliquer(rdv.first)
        page.wait_for_timeout(1500)
        shot(page, "agences-rendez-vous")


def verifier(page: Page) -> None:
    aller(page, "/verifier")
    shot(page, "verifier")


SCENES = [accueil, souscription, sinistre, gestion, agences, verifier]
# Pour ne relancer qu'une scène : python captures.py mobile sinistre gestion


def main() -> None:
    seules = set(sys.argv[2:])
    with sync_playwright() as p:
        if MODE == "mobile":
            navigateur = p.chromium.connect_over_cdp("http://localhost:9222")
            contexte = navigateur.contexts[0]
            page = contexte.pages[0] if contexte.pages else contexte.new_page()
        else:
            navigateur = p.chromium.launch()
            # desktop : écran 1920x1080 ; laptop : écran de portable 1440x900 (16:10), pour l'ordinateur des vidéos
            taille = {"width": 1440, "height": 900} if MODE == "laptop" else {"width": 1920, "height": 1080}
            contexte = navigateur.new_context(viewport=taille, device_scale_factor=2, locale="fr-FR", timezone_id="Africa/Kinshasa")
            page = contexte.new_page()
        page.set_default_timeout(15000)
        for scene in SCENES:
            if seules and scene.__name__ not in seules:
                continue
            print(f"[{MODE}] {scene.__name__}", flush=True)
            try:
                scene(page)
            except Exception as e:  # une scène ratée ne bloque pas les suivantes
                print(f"  ✗ {scene.__name__} : {type(e).__name__}: {str(e).splitlines()[0][:200]}", flush=True)
                shot(page, f"erreur-{scene.__name__}")
        if MODE != "mobile":
            navigateur.close()


if __name__ == "__main__":
    main()
