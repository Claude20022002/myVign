"""
Génère les voix off dans ElevenLabs en pilotant une fenêtre Edge déjà connectée (débogage sur le port 9333).

Préparation (une fois) :
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --remote-debugging-port=9333 ^
      --user-data-dir=<dossier dédié> https://elevenlabs.io/app/sign-in
  → se connecter soi-même, ouvrir « Text to Speech », choisir la voix (ici « Paul K — Deep French Narrator »)
    et le modèle Eleven v4.

  python voix_elevenlabs.py presentation     # 14 répliques de 09-presentation-sonas.md
  python voix_elevenlabs.py site             # 10 répliques de 10-video-site.md
  python voix_elevenlabs.py site S03 S05     # seulement certaines répliques

Le son est récupéré dans la réponse réseau de la page (MP3 44,1 kHz) : rien n'est saisi d'autre que le texte.
Sorties : ../video-promo/voix/<projet>/Sxx.mp3
"""

import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
VP = ICI.parent / "video-promo"
SOURCES = {"presentation": VP / "09-presentation-sonas.md", "site": VP / "10-video-site.md"}


def repliques(projet: str) -> list[tuple[str, str]]:
    """(identifiant, texte) depuis le tableau « Voix off » de la fiche."""
    lignes = SOURCES[projet].read_text(encoding="utf-8").splitlines()
    out = []
    for l in lignes:
        m = re.match(r"^\| (S\d\d) \| [\d:.]+ \| `(.+)` \|$", l)
        if m:
            out.append((m.group(1), m.group(2)))
    return out


def duree(f: Path) -> float:
    import subprocess
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)], capture_output=True, text=True).stdout
    return float(out or 0)


def main() -> None:
    projet = sys.argv[1]
    choix = set(sys.argv[2:])
    sortie = VP / "voix" / projet
    sortie.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        nav = p.chromium.connect_over_cdp("http://localhost:9333")
        page = next(x for c in nav.contexts for x in c.pages if "elevenlabs.io/app/speech-synthesis" in x.url)
        for nom in ("Skip", "Got it"):   # petits questionnaires ou annonces d'ElevenLabs
            bt = page.get_by_role("button", name=nom, exact=True)
            if bt.count() and bt.first.is_visible():
                bt.first.click()
                page.wait_for_timeout(500)
        choix_voix = page.get_by_role("button", name=re.compile("^Select voice"))
        voix = (choix_voix.first.get_attribute("aria-label") or "").replace("Select voice - ", "") if choix_voix.count() else "?"
        print(f"voix : {voix}", flush=True)
        for ident, texte in repliques(projet):
            if choix and ident not in choix:
                continue
            f = sortie / f"{ident}.mp3"
            # durée minimale plausible : ~16 caractères parlés par seconde, avec une marge
            mini = len(re.sub(r"\[[^\]]*\]", "", texte)) / 16 * 0.6
            temoin = re.sub(r"\[[^\]]*\]", "", texte).strip()[-25:]   # fin du texte parlé, pour vérifier la saisie
            for essai in range(3):
                # un seul bloc de voix : les blocs en trop (créés par d'anciennes saisies) sont retirés
                while page.get_by_role("button", name="Remove speaker").count() > 1:
                    page.get_by_role("button", name="Remove speaker").last.evaluate("e => e.click()")
                    page.wait_for_timeout(250)
                ed = page.locator("[contenteditable=true]").first
                ed.fill(texte)               # remplace tout le texte de l'éditeur (l'étiquette [ton] devient une puce)
                page.wait_for_timeout(700)
                if temoin not in ed.inner_text():
                    raise SystemExit(f"{ident} : le texte affiché ne correspond pas à la réplique, génération annulée")
                # Une génération peut produire plusieurs réponses audio (un début rapide, puis le son complet) :
                # on les garde toutes et on retient la plus longue.
                recues = []
                ecoute = lambda r: recues.append(r) if ("audio" in r.headers.get("content-type", "") and "elevenlabs" in r.url) else None
                page.on("response", ecoute)
                # « Generate speech » (texte nouveau) ou « Regenerate speech » (nouvel essai sur le même texte)
                page.get_by_role("button", name=re.compile(r"^(re)?generate speech", re.I)).first.click()
                debut, vu = time.time(), 0
                while time.time() - debut < 90:
                    page.wait_for_timeout(500)
                    if recues and len(recues) == vu and time.time() - dernier > 4:
                        break
                    if len(recues) != vu:
                        vu, dernier = len(recues), time.time()
                page.remove_listener("response", ecoute)
                meilleur, d = b"", 0.0
                for r in recues:
                    try:
                        r.finished()
                        corps = r.body()
                    except Exception:
                        continue
                    f.write_bytes(corps)
                    dr = duree(f)
                    if dr > d:
                        meilleur, d = corps, dr
                f.write_bytes(meilleur)
                if d >= mini:
                    break
                print(f"    réplique tronquée ({d:.1f} s < {mini:.1f} s), nouvel essai", flush=True)
                time.sleep(3)
            print(f"  ✓ {f.name} ({d:.1f} s) {texte[:60]}", flush=True)
            time.sleep(2.5)   # laisser l'interface revenir au repos avant la réplique suivante


if __name__ == "__main__":
    main()
