"use client";

import { useSyncExternalStore } from "react";

/*
 * Heure courante, rafraîchie chaque minute, sans setState dans un effet.
 * Côté serveur (et pendant le pré-rendu) : null, pour ne jamais figer une heure dans le HTML statique.
 */
const abonnes = new Set<() => void>();
let instant = 0;
let minuteur: ReturnType<typeof setInterval> | null = null;

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  if (!minuteur) {
    instant = Date.now();
    minuteur = setInterval(() => {
      instant = Date.now();
      for (const a of abonnes) a();
    }, 60_000);
  }
  return () => {
    abonnes.delete(rappel);
    if (abonnes.size === 0 && minuteur) {
      clearInterval(minuteur);
      minuteur = null;
    }
  };
}

function lire() {
  if (!instant) instant = Date.now();
  return instant;
}

export function useMaintenant(): Date | null {
  const t = useSyncExternalStore(abonner, lire, () => 0);
  return t ? new Date(t) : null;
}
