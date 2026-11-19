"""
Pose les voix off sur une vidéo, avec la musique douce en fond (baissée automatiquement sous la voix).

  python mixer_voix.py presentation   # rendus/presentation_sonas_motion.mp4 → rendus/presentation_sonas_motion_voix.mp4
  python mixer_voix.py site           # rendus/site_sonas_en_ligne.mp4       → rendus/site_sonas_en_ligne_voix.mp4

Temps de pose : tableau « Voix off » de 09-presentation-sonas.md / 10-video-site.md. Voix : voix/<projet>/Sxx.mp3.
Niveaux : voix à -19 dB RMS, musique à -30 dB RMS hors voix, -38 dB sous la voix (descente et remontée de 0,4 s).
L'image n'est pas réencodée (-c:v copy).
"""

import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

import musique

ICI = Path(__file__).resolve().parent
VP = ICI.parent / "video-promo"
PROJETS = {
    "presentation": ("09-presentation-sonas.md", "presentation_sonas_motion"),
    "site": ("10-video-site.md", "site_sonas_en_ligne"),
}
SR = musique.SR


def poses(doc: Path) -> list[tuple[str, float]]:
    out = []
    for l in doc.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| (S\d\d) \| (\d):(\d\d\.\d) \|", l)
        if m:
            out.append((m.group(1), int(m.group(2)) * 60 + float(m.group(3))))
    return out


def lire_mp3(f: Path) -> np.ndarray:
    brut = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-f", "s16le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(brut, "<i2").reshape(-1, 2).astype(float) / 32768


def db(x: float) -> float:
    return 10 ** (x / 20)


def main() -> None:
    projet = sys.argv[1]
    doc, base = PROJETS[projet]
    video = VP / "rendus" / f"{base}.mp4"
    duree = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout)
    n = int(duree * SR)
    voix = np.zeros((n, 2))
    presence = np.zeros(n)
    for ident, t in poses(VP / doc):
        v = lire_mp3(VP / "voix" / projet / f"{ident}.mp3")
        v = v * (db(-19) / max(1e-6, np.sqrt((v ** 2).mean())))
        i = int(t * SR)
        k = min(len(v), n - i)
        voix[i:i + k] += v[:k]
        presence[i:i + k] = 1
        print(f"  {ident} à {t:5.1f} s ({len(v) / SR:.1f} s)")
    # enveloppe de la musique : -30 dB hors voix, -38 dB sous la voix, transitions de 0,4 s
    lissage = int(0.4 * SR)

    def moyenne_glissante(x: np.ndarray) -> np.ndarray:   # somme cumulée : instantané, même sur 5 millions d'échantillons
        c = np.cumsum(np.concatenate([np.zeros(lissage // 2), x, np.zeros(lissage - lissage // 2)]))
        return (c[lissage:] - c[:-lissage]) / lissage

    p = moyenne_glissante(moyenne_glissante(presence))[:n].clip(0, 1)
    gain = db(-30) * (1 - p) + db(-38) * p
    m = musique.composer(duree)
    m = m / np.sqrt((m ** 2).mean())
    mix = voix + m * gain[:, None]
    crete = np.abs(mix).max()
    if crete > 0.95:
        mix *= 0.95 / crete
    wav = VP / "voix" / projet / f"mix_{base}.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype("<i2").tobytes())
    sortie = VP / "rendus" / f"{base}_voix.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-i", str(wav), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "libvo_aacenc", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(sortie)], check=True)
    print(f"✓ {sortie.name} ({duree:.1f} s)")


if __name__ == "__main__":
    main()
