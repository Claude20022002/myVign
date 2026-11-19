"""
Musique douce d'arrière-plan, composée par programme (aucun droit à payer, aucune attribution).

Ambiance : chaleureuse et posée, 84 BPM, ré majeur (Ré maj7 – Si m7 – Sol maj7 – La sus2).
Timbres : likembe (piano à pouces congolais) en arpèges, nappe douce, basse ronde, shaker très léger, réverbération.

  python musique.py 109.0 sortie.wav                     # génère une musique de 109 s
  python musique.py 109.0 sortie.wav --video in.mp4 out.mp4 [--niveau -26]
      → copie de la vidéo avec la musique, sans réencoder l'image ; niveau = volume moyen (dB RMS), -26 par défaut
"""

import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
BPM = 84
TEMPS = 60 / BPM
MESURE = 4 * TEMPS
rng = np.random.default_rng(243)   # graine fixe : même musique à chaque rendu

# (basse, notes de la nappe) en numéros MIDI, deux mesures par accord
ACCORDS = [
    (50, [54, 57, 61, 62]),   # Ré maj7
    (47, [54, 57, 59, 62]),   # Si m7
    (43, [55, 59, 62, 66]),   # Sol maj7
    (45, [57, 59, 61, 64]),   # La sus2 / La
]
# arpège du likembe (indices dans les notes de l'accord, une octave plus haut), None = silence
MOTIF = [0, 2, 1, 3, 2, None, 3, 1, 0, 2, None, 3, 2, 1, 3, None]


def f(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def likembe(freq: float, duree: float = 2.2) -> np.ndarray:
    t = np.arange(int(duree * SR)) / SR
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t / 1.1)
         + 0.22 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t / 0.22)
         + 0.08 * np.sin(2 * np.pi * freq * 5.43 * t) * np.exp(-t / 0.07))
    attaque = np.minimum(1, t / 0.004)
    return s * attaque


def basse(freq: float, duree: float) -> np.ndarray:
    t = np.arange(int(duree * SR)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * 2 * freq * t)
    return s * np.minimum(1, t / 0.03) * np.exp(-t / 1.6)


def nappe(notes: list[int], duree: float, desaccord: float) -> np.ndarray:
    t = np.arange(int(duree * SR)) / SR
    s = np.zeros_like(t)
    for m in notes:
        for c in (-desaccord, 0, desaccord):
            s += np.sin(2 * np.pi * f(m + c / 100) * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / 1.6) * np.minimum(1, (duree - t) / 1.6)
    return s * env * (1 + 0.08 * np.sin(2 * np.pi * 0.25 * t)) / (3 * len(notes))


def poser(piste: np.ndarray, son: np.ndarray, t0: float, gain: float) -> None:
    i = int(t0 * SR)
    if i >= len(piste):
        return
    n = min(len(son), len(piste) - i)
    piste[i:i + n] += gain * son[:n]


def reverb(x: np.ndarray, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    t = np.arange(int(2.6 * SR)) / SR
    ir = r.standard_normal(len(t)) * np.exp(-t / 0.85)
    ir[: int(0.012 * SR)] = 0                       # pré-délai
    ir /= np.sqrt((ir ** 2).sum())
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return y


def composer(duree: float) -> np.ndarray:
    n = int(duree * SR)
    G, D = np.zeros(n), np.zeros(n)
    pistes_nappe, pistes_lik, pistes_basse, shaker = np.zeros(n), (np.zeros(n), np.zeros(n)), np.zeros(n), np.zeros(n)
    fin_musique = duree - 2.5
    k = 0
    t = 0.0
    while t < duree:
        b, notes = ACCORDS[k % len(ACCORDS)]
        long = 2 * MESURE
        poser(pistes_nappe, nappe(notes, long + 1.6, 4), max(0, t - 0.8), 1.0)
        if t >= MESURE * 2 and t < fin_musique:                    # la basse entre à la 3e mesure
            for demi in range(4):
                poser(pistes_basse, basse(f(b), 2 * TEMPS + 0.4), t + demi * 2 * TEMPS, 1.0)
        for j, idx in enumerate(MOTIF):                           # 16 croches sur deux mesures
            tj = t + j * TEMPS / 2
            if idx is None or tj < 1.4 or tj > fin_musique:
                continue
            m = notes[idx] + 12
            vel = 0.75 + 0.25 * rng.random()
            g = 0.5 + (0.22 if j % 2 else -0.22)                 # panoramique alterné, discret
            son = likembe(f(m))
            poser(pistes_lik[0], son, tj + rng.uniform(0, 0.006), vel * (1 - g))
            poser(pistes_lik[1], son, tj + rng.uniform(0, 0.006), vel * g)
        if t >= MESURE * 4 and t < fin_musique:                    # shaker très léger à partir de la 5e mesure
            for j in range(16):
                if j % 2 == 1:
                    bruit = np.diff(rng.standard_normal(int(0.09 * SR) + 1))
                    env = np.exp(-np.arange(len(bruit)) / SR / 0.025)
                    poser(shaker, bruit * env, t + j * TEMPS / 2, 0.5 + 0.2 * rng.random())
        t += long
        k += 1
    sec_G = 0.11 * pistes_nappe + 0.24 * pistes_lik[0] + 0.17 * pistes_basse + 0.012 * shaker
    sec_D = 0.11 * pistes_nappe + 0.24 * pistes_lik[1] + 0.17 * pistes_basse + 0.012 * shaker
    G = sec_G + 0.28 * reverb(sec_G, 1)
    D = sec_D + 0.28 * reverb(sec_D, 2)
    tt = np.arange(n) / SR
    fondu = np.minimum(1, tt / 2.0) * np.minimum(1, (duree - tt) / 4.0)
    st = np.stack([G * fondu, D * fondu], axis=1)
    return st / np.abs(st).max() * 0.89                            # crête à -1 dBFS


def ecrire(st: np.ndarray, chemin: Path, niveau_db: float | None = None) -> None:
    if niveau_db is not None:
        rms = np.sqrt((st ** 2).mean())
        st = st * (10 ** (niveau_db / 20) / rms)
        st = np.clip(st, -0.99, 0.99)
    pcm = (st * 32767).astype("<i2")
    with wave.open(str(chemin), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    duree, sortie = float(sys.argv[1]), Path(sys.argv[2])
    sortie.parent.mkdir(parents=True, exist_ok=True)
    musique = composer(duree)
    ecrire(musique, sortie)
    print(f"✓ {sortie} ({duree:.1f} s)")
    if "--video" in sys.argv:
        i = sys.argv.index("--video")
        video, resultat = sys.argv[i + 1], sys.argv[i + 2]
        niveau = float(sys.argv[sys.argv.index("--niveau") + 1]) if "--niveau" in sys.argv else -26.0
        tmp = sortie.with_name(sortie.stem + f"_niveau{int(niveau)}.wav")
        ecrire(musique, tmp, niveau)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", str(tmp), "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "libvo_aacenc", "-b:a", "192k", "-shortest", "-movflags", "+faststart", resultat], check=True)
        print(f"✓ {resultat} (musique à {niveau:.0f} dB RMS)")
