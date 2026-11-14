"use client";

/*
 * Moteur de parcours (DESIGN.md §6) :
 * phases nommées, un sujet par écran, 5 champs visibles au plus, validation au clic,
 * focus sur la première erreur, sauvegarde automatique, pied collant avec prix + bouton jaune.
 */

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BoutonAide, useAide, type QuestionAide } from "@/components/aide/aide";
import { Bouton } from "@/components/ui/bouton";
import { Logo } from "@/components/site/logo";
import { fc } from "@/lib/format";

export type Donnees = Record<string, unknown>;
export type Erreurs = Record<string, string>;

export type Etape<D extends Donnees> = {
  id: string;
  phase: number;
  titre: string | ((d: D) => string);
  sousTitre?: string | ((d: D) => string);
  /** Rendu du contenu de l'écran. */
  contenu: () => ReactNode;
  valider?: (d: D) => Erreurs;
  /** Écran sauté si renvoie false. */
  si?: (d: D) => boolean;
  /** Libellé du bouton principal. */
  cta?: string | ((d: D) => string);
  /** Action avant de passer à la suite (ex. recherche de plaque). Renvoie false pour rester. */
  avant?: (d: D, outils: OutilsParcours<D>) => Promise<boolean> | boolean;
  /** "aucun" : l'écran gère ses propres boutons (paiement, confirmation). */
  pied?: "standard" | "aucun";
  faq?: QuestionAide[];
  /** Cacher l'estimation de prix sur cet écran. */
  sansPrix?: boolean;
};

export type OutilsParcours<D extends Donnees> = {
  d: D;
  maj: (patch: Partial<D>) => void;
  erreurs: Erreurs;
  setErreurs: (e: Erreurs) => void;
  suivant: () => void;
  precedent: () => void;
  allerA: (id: string) => void;
  reinitialiser: () => void;
};

const Ctx = createContext<OutilsParcours<Donnees> | null>(null);

export function useParcours<D extends Donnees>() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useParcours hors Parcours");
  return c as unknown as OutilsParcours<D>;
}

/** Raccourci pour lier un champ : const plaque = useValeur<string>("plaque"). */
export function useValeur<T>(cle: string, defaut?: T) {
  const { d, maj, erreurs, setErreurs } = useParcours<Donnees>();
  const valeur = (d[cle] as T | undefined) ?? defaut;
  const set = (v: T) => {
    maj({ [cle]: v } as Partial<Donnees>);
    if (erreurs[cle]) {
      const { [cle]: _, ...reste } = erreurs;
      void _;
      setErreurs(reste);
    }
  };
  return [valeur as T, set, erreurs[cle]] as const;
}

type ParcoursProps<D extends Donnees> = {
  id: string;
  nom: string;
  phases: string[];
  etapes: Etape<D>[];
  initial: D;
  prix?: (d: D) => number | null;
  /** Prix déjà mis en forme (devise choisie) : prioritaire sur `prix`. */
  rendrePrix?: (d: D) => ReactNode | null;
  prixSuffixe?: string;
  mode: "souscription" | "sinistre";
  dureeAnnoncee: string;
};

export function Parcours<D extends Donnees>({ id, nom, phases, etapes, initial, prix, rendrePrix, prixSuffixe = "/ an", mode, dureeAnnoncee }: ParcoursProps<D>) {
  const cle = `myvign.parcours.${id}`;
  const [d, setD] = useState<D>(initial);
  const [index, setIndex] = useState(0);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const { definirContexte } = useAide();

  // Reprise du brouillon
  useEffect(() => {
    try {
      const brut = localStorage.getItem(cle);
      if (brut) {
        const s = JSON.parse(brut) as { d: D; index: number };
        setD({ ...initial, ...s.d });
        setIndex(Math.min(s.index, etapes.length - 1));
      }
    } catch {}
    setCharge(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  // Sauvegarde automatique
  useEffect(() => {
    if (charge) localStorage.setItem(cle, JSON.stringify({ d, index }));
  }, [cle, d, index, charge]);

  const visibles = useMemo(() => etapes.filter((e) => !e.si || e.si(d)), [etapes, d]);
  const etape = etapes[index];
  const posVisible = Math.max(0, visibles.indexOf(etape));
  const dansPhase = visibles.filter((e) => e.phase === etape.phase);
  const rangDansPhase = dansPhase.indexOf(etape) + 1;

  useEffect(() => {
    definirContexte({ lieu: `${nom}, ${phases[etape.phase]}`, mode, faq: etape.faq });
    return () => definirContexte(null);
  }, [definirContexte, nom, phases, etape, mode]);

  const allerIndex = useCallback((i: number) => {
    setIndex(i);
    setErreurs({});
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => titreRef.current?.focus({ preventScroll: true }));
  }, []);

  const outils: OutilsParcours<D> = {
    d,
    maj: (patch) => setD((p) => ({ ...p, ...patch })),
    erreurs,
    setErreurs,
    suivant: () => {
      const prochaine = visibles[posVisible + 1];
      if (prochaine) allerIndex(etapes.indexOf(prochaine));
    },
    precedent: () => {
      const avant = visibles[posVisible - 1];
      if (avant) allerIndex(etapes.indexOf(avant));
    },
    allerA: (eid) => allerIndex(Math.max(0, etapes.findIndex((e) => e.id === eid))),
    reinitialiser: () => {
      localStorage.removeItem(cle);
      setD(initial);
      allerIndex(0);
    },
  };

  async function continuer() {
    const e = etape.valider?.(d) ?? {};
    if (Object.keys(e).length) {
      setErreurs(e);
      requestAnimationFrame(() => {
        const premier = document.querySelector<HTMLElement>(`[data-champ="${Object.keys(e)[0]}"]`);
        premier?.scrollIntoView({ block: "center" });
        premier?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
      });
      return;
    }
    if (etape.avant) {
      setOccupe(true);
      const ok = await etape.avant(d, outils);
      setOccupe(false);
      if (!ok) return;
    }
    outils.suivant();
  }

  const valeurPrix = prix && !etape.sansPrix ? prix(d) : null;
  const prixRendu = rendrePrix && !etape.sansPrix ? rendrePrix(d) : null;
  const titre = typeof etape.titre === "function" ? etape.titre(d) : etape.titre;
  const sousTitre = typeof etape.sousTitre === "function" ? etape.sousTitre(d) : etape.sousTitre;
  const cta = typeof etape.cta === "function" ? etape.cta(d) : etape.cta ?? "Continuer";

  return (
    <Ctx.Provider value={outils as unknown as OutilsParcours<Donnees>}>
      <div className="flex min-h-dvh flex-col">
        <header className="no-print sticky top-0 z-30 border-t-[3px] border-bleu-logo border-b border-b-filet bg-carte">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-center gap-1">
              {posVisible > 0 && etape.pied !== "aucun" ? (
                <button type="button" onClick={outils.precedent} className="-ml-2 flex size-11 items-center justify-center rounded-full hover:bg-fond" aria-label="Écran précédent">
                  <ArrowLeft className="size-5" />
                </button>
              ) : null}
              <Logo hauteur={40} />
            </div>
            <BoutonAide />
          </div>
          <ol className="mx-auto flex max-w-2xl gap-1.5 px-4 pb-3" aria-label="Avancement">
            {phases.map((p, i) => {
              const etat = i < etape.phase ? "fait" : i === etape.phase ? "encours" : "avenir";
              return (
                <li key={p} className="min-w-0 flex-1" aria-current={etat === "encours" ? "step" : undefined}>
                  <span className="mb-1 block h-1 overflow-hidden rounded-full bg-filet">
                    <span
                      className="block h-full rounded-full bg-bleu-logo transition-[width] duration-300"
                      style={{ width: etat === "fait" ? "100%" : etat === "encours" ? `${(rangDansPhase / Math.max(1, dansPhase.length)) * 100}%` : "0%" }}
                    />
                  </span>
                  <span className={`flex min-w-0 items-center gap-1 text-[13px] sm:text-sm ${etat === "encours" ? "font-bold text-encre" : "text-texte-2 max-sm:sr-only"}`}>
                    {etat === "fait" && <Check className="size-3.5 text-bleu-action" aria-hidden="true" />}
                    <span className="truncate">{p}</span>
                    <span className="sr-only">{etat === "fait" ? " (terminé)" : etat === "encours" ? " (en cours)" : " (à venir)"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8 pt-6">
          {charge && (
            <div key={etape.id} className="anim-entree">
              {index === 0 && (
                <p className="mb-3 text-[15px] text-texte-2">
                  {nom}, environ {dureeAnnoncee}, sans compte ni connexion.
                </p>
              )}
              {etape.pied !== "aucun" && (
                <p className="mb-1 text-[15px] text-texte-2">
                  {phases[etape.phase]}, {rangDansPhase} sur {dansPhase.length}
                </p>
              )}
              <h1 ref={titreRef} tabIndex={-1} className="text-[26px] leading-tight outline-none sm:text-[28px]">
                {titre}
              </h1>
              {sousTitre && <p className="mt-1.5 text-texte-2">{sousTitre}</p>}
              <div className="mt-6">{etape.contenu()}</div>
            </div>
          )}
        </main>

        {charge && etape.pied !== "aucun" && (
          <div className="no-print sticky bottom-0 z-20 border-t border-filet bg-carte/97 backdrop-blur">
            <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-baseline justify-between gap-3 sm:block sm:flex-1">
                <span className="flex items-center gap-1.5 text-[14px] text-succes">
                  <Check className="size-4" aria-hidden="true" /> Enregistré automatiquement
                </span>
                {(prixRendu != null || valeurPrix != null) && (
                  <span className="sm:mt-0.5 sm:block" aria-live="polite">
                    <span className="mr-2 text-[15px] text-texte-2 max-sm:hidden">Estimation</span>
                    <span className="text-[22px]">{prixRendu ?? <span className="prix">{fc(valeurPrix ?? 0)}</span>}</span>{" "}
                    <span className="text-[15px] text-texte-2">{prixSuffixe}</span>
                  </span>
                )}
              </div>
              <Bouton onClick={continuer} chargement={occupe} className="sm:min-w-56" bloc>
                {occupe ? "Un instant…" : cta}
              </Bouton>
            </div>
          </div>
        )}
        {charge && (
          <p className="no-print pb-4 text-center text-[14px] text-texte-2">
            <button type="button" onClick={outils.reinitialiser} className="underline underline-offset-4 hover:text-encre">
              Recommencer
            </button>
            {" · "}
            <Link href="/" className="underline underline-offset-4 hover:text-encre">
              Quitter (votre saisie est gardée)
            </Link>
          </p>
        )}
      </div>
    </Ctx.Provider>
  );
}
