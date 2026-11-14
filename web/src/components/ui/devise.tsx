"use client";

/*
 * Bascule FC / $ au taux du jour (demande de l'utilisateur, CLAUDE.md règle 8).
 * Les montants de l'API sont en unités mineures ; la conversion passe par convertMoney()
 * du contrat : le même calcul que l'API, au centime près.
 */

import { convertMoney, type Currency, type ExchangeRate, type Money } from "@myvign/contracts";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { tauxDuJour } from "@/server/actions";

type Ctx = {
  devise: Currency;
  choisir: (d: Currency) => void;
  taux: ExchangeRate | null;
  convertir: (m: Money) => Money;
};

const DeviseCtx = createContext<Ctx | null>(null);
const CLE = "myvign.devise";

/* Préférence de devise : petit magasin externe (localStorage), lu sans setState dans un effet. */
const abonnes = new Set<() => void>();
function lireDevise(): Currency {
  try {
    return localStorage.getItem(CLE) === "USD" ? "USD" : "CDF";
  } catch {
    return "CDF";
  }
}
function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

export function DeviseProvider({ children }: { children: ReactNode }) {
  const devise = useSyncExternalStore<Currency>(abonner, lireDevise, () => "CDF");
  const [taux, setTaux] = useState<ExchangeRate | null>(null);

  useEffect(() => {
    tauxDuJour().then((r) => {
      if (r.ok) setTaux(r.data);
    });
  }, []);

  const choisir = useCallback((d: Currency) => {
    try {
      localStorage.setItem(CLE, d);
    } catch {}
    for (const a of abonnes) a();
  }, []);

  const convertir = useCallback(
    (m: Money) => (taux && m.currency !== devise ? convertMoney(m, devise, taux.rate) : m),
    [devise, taux],
  );

  return <DeviseCtx.Provider value={{ devise, choisir, taux, convertir }}>{children}</DeviseCtx.Provider>;
}

export function useDevise() {
  const c = useContext(DeviseCtx);
  if (!c) throw new Error("useDevise hors DeviseProvider");
  return c;
}

const fcFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const usdFormat = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 129000000 CDF → « 1 290 000 FC » ; 45263 USD → « 452,63 $ ». */
export function formaterMontant(m: Money): string {
  return m.currency === "CDF" ? `${fcFormat.format(m.amount / 100)} FC` : `${usdFormat.format(m.amount / 100)} $`;
}

/** Montant affiché dans la devise choisie par le client. */
export function Prix({ montant, className = "" }: { montant: Money; className?: string }) {
  const { convertir } = useDevise();
  return <span className={`prix ${className}`}>{formaterMontant(convertir(montant))}</span>;
}

export function BasculeDevise({ compact = false }: { compact?: boolean }) {
  const { devise, choisir, taux } = useDevise();
  return (
    <div className="inline-flex items-center gap-2">
      <div role="group" aria-label="Devise d'affichage" className="inline-flex rounded-bouton border border-filet bg-fond p-0.5">
        {(["CDF", "USD"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={devise === d}
            disabled={d === "USD" && !taux}
            onClick={() => choisir(d)}
            className={`min-h-9 min-w-11 rounded-champ px-2.5 text-[15px] font-bold disabled:opacity-50 ${
              devise === d ? "bg-carte text-bleu-action shadow-[0_1px_2px_rgb(10_64_92/0.15)]" : "text-texte-2 hover:text-encre"
            }`}
          >
            {d === "CDF" ? "FC" : "$"}
          </button>
        ))}
      </div>
      {!compact && taux && (
        <span className="text-[14px] text-texte-2">
          1 $ = {fcFormat.format(taux.rate)} FC
          <span className="max-sm:hidden"> · taux {taux.source === "bcc" ? "BCC" : "indicatif"} du {taux.effectiveDate.split("-").reverse().join("/")}</span>
        </span>
      )}
    </div>
  );
}
