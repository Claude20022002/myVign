"use client";

/*
 * Liaison entre les écrans et les blocs du contrat (@myvign/contracts).
 * Les données d'un parcours sont rangées par bloc : { vehicle: {...}, usage: {...}, ... }.
 * La validation réutilise LES MÊMES schémas Zod que l'API, limités aux champs de l'écran.
 */

import type { z } from "zod";
import { type Donnees, type Erreurs, useParcours } from "./parcours";

export type Blocs = Record<string, Record<string, unknown>>;

/** Champ lié à un bloc : const [plaque, setPlaque, erreur] = useChamp<string>("vehicle", "plate"). */
export function useChamp<T>(bloc: string, champ: string, defaut?: T) {
  const { d, maj, erreurs, setErreurs } = useParcours<Donnees>();
  const valeursBloc = (d[bloc] as Record<string, unknown> | undefined) ?? {};
  const valeur = (valeursBloc[champ] as T | undefined) ?? defaut;
  const cle = `${bloc}.${champ}`;
  const set = (v: T) => {
    maj({ [bloc]: { ...valeursBloc, [champ]: v } });
    if (Object.keys(erreurs).some((k) => k === cle || k.startsWith(`${cle}.`))) {
      setErreurs(Object.fromEntries(Object.entries(erreurs).filter(([k]) => k !== cle && !k.startsWith(`${cle}.`))));
    }
  };
  return [valeur as T, set, erreurs[cle]] as const;
}

/** Met à jour plusieurs champs d'un bloc. */
export function majBloc(d: Donnees, maj: (p: Partial<Donnees>) => void, bloc: string, patch: Record<string, unknown>) {
  maj({ [bloc]: { ...((d[bloc] as Record<string, unknown>) ?? {}), ...patch } });
}

/**
 * Valide un bloc avec son schéma et ne garde que les erreurs des champs listés
 * (l'écran n'affiche qu'une partie du bloc). Clés renvoyées : « bloc.champ ».
 */
export function validerChamps(schema: z.ZodType, bloc: string, valeurs: unknown, champs: readonly string[]): Erreurs {
  const r = schema.safeParse(valeurs ?? {});
  if (r.success) return {};
  const erreurs: Erreurs = {};
  for (const issue of r.error.issues) {
    const tete = String(issue.path[0] ?? "");
    if (!champs.includes(tete)) continue;
    const cle = `${bloc}.${issue.path.map(String).join(".")}`;
    erreurs[cle] ??= messageLisible(issue.message);
  }
  return erreurs;
}

/** Les messages Zod par défaut sont en anglais : on les remplace par une consigne claire. */
function messageLisible(message: string): string {
  if (/^(Invalid input|Required|expected)/i.test(message)) return "Ce champ est à compléter.";
  if (/Too small|>=|at least/i.test(message)) return "Valeur trop courte ou trop petite.";
  if (/Too big|<=|at most/i.test(message)) return "Valeur trop longue ou trop grande.";
  return message;
}

/** Convertit les erreurs de l'API (« champ » ou « bloc.champ ») vers les clés des écrans. */
export function erreursApi(bloc: string, champs?: Record<string, string>): Erreurs {
  if (!champs) return {};
  return Object.fromEntries(Object.entries(champs).map(([k, v]) => [k.startsWith(`${bloc}.`) ? k : `${bloc}.${k}`, v]));
}
