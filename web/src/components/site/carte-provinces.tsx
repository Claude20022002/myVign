"use client";

/*
 * Carte interactive des 26 provinces (demande de l'utilisateur).
 * SVG inline sans bibliothèque (≈ 10 Ko compressés), provinces focusables au clavier.
 * Jamais seule : une liste l'accompagne toujours (Kinshasa est minuscule à cette échelle).
 */

import { agencyCountByProvince, PROVINCE_CODES, PROVINCES, type ProvinceCode } from "@myvign/geo";
import { PROVINCE_MAP_VIEWBOX, PROVINCE_SHAPES } from "@myvign/geo/map";
import { useMemo, useState } from "react";

const COMPTES = agencyCountByProvince();

/** Provinces triées par nom, pour la liste qui accompagne la carte. */
export const PROVINCES_TRIEES = [...PROVINCE_CODES].sort((a, b) =>
  PROVINCES[a].name.localeCompare(PROVINCES[b].name, "fr"),
);

export function CarteProvinces({
  selection,
  choisir,
  legende = "Carte des provinces de la RDC",
}: {
  selection: ProvinceCode | null;
  choisir: (code: ProvinceCode) => void;
  legende?: string;
}) {
  const [survol, setSurvol] = useState<ProvinceCode | null>(null);
  const actif = survol ?? selection;
  const info = actif ? PROVINCES[actif] : null;

  const formes = useMemo(() => PROVINCE_CODES.map((code) => ({ code, ...PROVINCE_SHAPES[code] })), []);

  return (
    <figure className="m-0">
      <div className="relative rounded-carte border border-filet bg-carte p-2">
        <svg viewBox={PROVINCE_MAP_VIEWBOX} className="h-auto w-full" role="group" aria-label={legende}>
          {formes.map(({ code, path }) => {
            const couverte = (COMPTES[code] ?? 0) > 0;
            const choisie = code === selection;
            return (
              // biome-ignore lint/a11y/useSemanticElements: une forme SVG ne peut pas être un <button>.
              <path
                key={code}
                d={path}
                role="button"
                tabIndex={0}
                aria-pressed={choisie}
                aria-label={`${PROVINCES[code].name}, ${couverte ? `${COMPTES[code]} agence${COMPTES[code] > 1 ? "s" : ""}` : "pas encore d'agence"}`}
                onClick={() => choisir(code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choisir(code);
                  }
                }}
                onMouseEnter={() => setSurvol(code)}
                onMouseLeave={() => setSurvol(null)}
                onFocus={() => setSurvol(code)}
                onBlur={() => setSurvol(null)}
                className={`cursor-pointer stroke-white outline-none transition-[fill] duration-150 [stroke-width:1.5] focus-visible:[stroke-width:4] focus-visible:stroke-encre ${
                  choisie ? "fill-bleu-action" : code === survol ? "fill-bleu-logo" : couverte ? "fill-bleu-clair" : "fill-filet"
                }`}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-bouton bg-carte/95 px-3 py-2 shadow-carte" aria-live="polite">
          {info && actif ? (
            <>
              <p className="font-semibold leading-tight">{info.name}</p>
              <p className="text-[14px] text-texte-2">
                {(COMPTES[actif] ?? 0) > 0
                  ? `${COMPTES[actif]} agence${(COMPTES[actif] ?? 0) > 1 ? "s" : ""} SONAS`
                  : "Pas encore d'agence : tout se fait en ligne"}
              </p>
            </>
          ) : (
            <p className="text-[14px] text-texte-2">Touchez une province</p>
          )}
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-texte-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-bleu-clair" aria-hidden="true" /> Avec agence SONAS
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-filet" aria-hidden="true" /> Sans agence
        </span>
        <span className="ml-auto">© contributeurs OpenStreetMap</span>
      </figcaption>
    </figure>
  );
}
