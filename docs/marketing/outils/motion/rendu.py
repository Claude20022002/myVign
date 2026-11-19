"""
Rendu image par image de la présentation animée (presentation.html) en MP4.

  python preparer.py <cache>                       # une fois (site + API simulée lancés)
  python rendu.py <cache>                          # vidéo complète
  python rendu.py <cache> --images 12.5 40 75      # quelques images de contrôle (PNG)
  python rendu.py <cache> --page site.html --sortie site_sonas_en_ligne.mp4   # une autre page

Sortie : docs/marketing/video-promo/rendus/<sortie> (1920x1080, 25 i/s, H.264, sans son).
Par défaut : presentation.html → presentation_sonas_motion.mp4.
"""

import io
import subprocess
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
CACHE = Path(sys.argv[1]).resolve()
SORTIE = ICI.parents[1] / "video-promo" / "rendus"
SORTIE.mkdir(parents=True, exist_ok=True)


def option(nom: str, defaut: str) -> str:
    return sys.argv[sys.argv.index(nom) + 1] if nom in sys.argv else defaut


def main() -> None:
    controles = None
    if "--images" in sys.argv:
        controles = []
        for x in sys.argv[sys.argv.index("--images") + 1:]:
            if x.startswith("--"):
                break
            controles.append(float(x))
    page_html = option("--page", "presentation.html")
    nom_sortie = option("--sortie", "presentation_sonas_motion.mp4")
    with sync_playwright() as p:
        nav = p.chromium.launch(args=["--allow-file-access-from-files"])

        def nouvelle_page():
            pg = nav.new_page(viewport={"width": 1920, "height": 1080})
            pg.goto((ICI / page_html).as_uri() + "?cache=" + CACHE.as_uri())
            pg.evaluate("() => window.MOTION.prete()")
            pg.wait_for_timeout(500)
            return pg

        page = nouvelle_page()
        polices = page.evaluate("() => [document.fonts.check('600 40px Saira'), document.fonts.check('400 20px \"Atkinson Hyperlegible Next\"')]")
        print("polices Saira / Atkinson chargées :", polices, flush=True)
        total, fps = page.evaluate("() => [window.MOTION.TOTAL, window.MOTION.FPS]")

        if controles:
            for t in controles:
                page.evaluate("t => window.MOTION.render(t)", t)
                f = CACHE / f"controle_{t:06.2f}.png"
                page.screenshot(path=str(f))
                print(" ", f, flush=True)
            nav.close()
            return

        n = round(total * fps)
        if "--jusqua" in sys.argv:  # extrait de contrôle : --jusqua 300 (images)
            n = min(n, int(sys.argv[sys.argv.index("--jusqua") + 1]))

        def capture() -> bytes:
            for essai in range(5):
                try:
                    return page.screenshot(type="png")
                except Exception:
                    if essai == 4:
                        raise
                    page.wait_for_timeout(500)
            return b""
        fichier = SORTIE / nom_sortie
        # Images brutes (rgb24) : l'ffmpeg 32 bits du poste manque de mémoire en décodant des PNG en flux.
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(fps), "-i", "-",
                               "-c:v", "libx264", "-threads", "4", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(fichier)],
                              stdin=subprocess.PIPE)
        for i in range(n):
            if i and i % 600 == 0:  # page neuve régulièrement : Chromium garde les images en mémoire
                page.close()
                page = nouvelle_page()
            page.evaluate("t => window.MOTION.render(t)", i / fps)
            ff.stdin.write(Image.open(io.BytesIO(capture())).convert("RGB").tobytes())
            if i % 250 == 0:
                print(f"  {i}/{n} images", flush=True)
        ff.stdin.close()
        ff.wait()
        nav.close()
        print(f"✓ {fichier} ({total:.1f} s)", flush=True)


if __name__ == "__main__":
    main()
