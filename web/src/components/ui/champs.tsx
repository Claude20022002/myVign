"use client";

import { CircleAlert, Check } from "lucide-react";
import { useId, type ReactNode } from "react";

/* ---------- Enveloppe commune : libellé, aide, erreur ---------- */

type EnveloppeProps = {
  label: ReactNode;
  aide?: ReactNode;
  erreur?: string;
  cle?: string;
  facultatif?: boolean;
  children: (ids: { id: string; descr?: string; invalide: boolean }) => ReactNode;
};

export function Champ({ label, aide, erreur, cle, facultatif, children }: EnveloppeProps) {
  const id = useId();
  const idAide = aide ? `${id}-aide` : undefined;
  const idErr = erreur ? `${id}-err` : undefined;
  const descr = [idAide, idErr].filter(Boolean).join(" ") || undefined;
  return (
    <div className="mb-5" data-champ={cle}>
      <label htmlFor={id} className="mb-1.5 block text-base font-semibold">
        {label}
        {facultatif && <span className="font-normal text-texte-2"> (facultatif)</span>}
      </label>
      {children({ id, descr, invalide: Boolean(erreur) })}
      {aide && !erreur && (
        <p id={idAide} className="mt-1.5 text-[15px] leading-snug text-texte-2">
          {aide}
        </p>
      )}
      {erreur && <MessageErreur id={idErr}>{erreur}</MessageErreur>}
    </div>
  );
}

export function MessageErreur({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex gap-1.5 text-[15px] leading-snug text-rouge-texte" role="alert">
      <CircleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

const classeInput = (invalide: boolean) =>
  `h-12 w-full rounded-champ border bg-carte px-3.5 text-lg text-encre placeholder:text-texte-3 outline-none transition-[border-color] ${
    invalide
      ? "border-2 border-rouge-texte px-[13px]"
      : "border-filet-champ focus:border-2 focus:border-bleu-action focus:px-[13px]"
  }`;

/* ---------- Texte, nombre, date, téléphone ---------- */

type TexteProps = {
  label: ReactNode;
  valeur: string;
  onChange: (v: string) => void;
  cle?: string;
  aide?: ReactNode;
  erreur?: string;
  facultatif?: boolean;
  type?: "text" | "email" | "tel" | "date" | "month" | "number";
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal";
  autoComplete?: string;
  placeholder?: string;
  prefixe?: string;
  suffixe?: string;
  max?: string;
  min?: string;
  spellCheck?: boolean;
  majuscules?: boolean;
};

export function ChampTexte(p: TexteProps) {
  return (
    <Champ label={p.label} aide={p.aide} erreur={p.erreur} cle={p.cle} facultatif={p.facultatif}>
      {({ id, descr, invalide }) => (
        <div className="relative flex items-center">
          {p.prefixe && (
            <span className="pointer-events-none absolute left-3.5 text-lg text-texte-2" aria-hidden="true">
              {p.prefixe}
            </span>
          )}
          <input
            id={id}
            name={p.cle}
            type={p.type ?? "text"}
            inputMode={p.inputMode}
            autoComplete={p.autoComplete ?? "off"}
            spellCheck={p.spellCheck ?? false}
            placeholder={p.placeholder}
            value={p.valeur}
            max={p.max}
            min={p.min}
            onChange={(e) => p.onChange(p.majuscules ? e.target.value.toUpperCase() : e.target.value)}
            aria-invalid={invalide || undefined}
            aria-describedby={descr}
            className={`${classeInput(invalide)} ${p.prefixe ? "pl-16!" : ""} ${p.suffixe ? "pr-16" : ""}`}
          />
          {p.suffixe && (
            <span className="pointer-events-none absolute right-3.5 text-base text-texte-2" aria-hidden="true">
              {p.suffixe}
            </span>
          )}
        </div>
      )}
    </Champ>
  );
}

/* ---------- Liste déroulante (au-delà de 7 options) ---------- */

type SelectProps = {
  label: ReactNode;
  valeur: string;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  cle?: string;
  aide?: ReactNode;
  erreur?: string;
  facultatif?: boolean;
  placeholder?: string;
};

export function ChampSelect(p: SelectProps) {
  return (
    <Champ label={p.label} aide={p.aide} erreur={p.erreur} cle={p.cle} facultatif={p.facultatif}>
      {({ id, descr, invalide }) => (
        <select
          id={id}
          name={p.cle}
          value={p.valeur}
          onChange={(e) => p.onChange(e.target.value)}
          aria-invalid={invalide || undefined}
          aria-describedby={descr}
          className={`${classeInput(invalide)} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%234E5D6C' stroke-width='2'%3E%3Cpath d='m5 8 5 5 5-5'/%3E%3C/svg%3E")] bg-[right_12px_center] bg-no-repeat pr-10`}
        >
          <option value="">{p.placeholder ?? "Choisir…"}</option>
          {p.options.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      )}
    </Champ>
  );
}

/* ---------- Cartes de choix (radio visibles, 2 à 7 options) ---------- */

export type OptionCarte = { value: string; label: string; sous?: string; icone?: ReactNode; extra?: ReactNode };

type CartesProps = {
  legende: ReactNode;
  valeur: string | undefined;
  onChange: (v: string) => void;
  options: OptionCarte[];
  cle?: string;
  erreur?: string;
  colonnes?: 1 | 2;
  legendeCachee?: boolean;
};

export function CartesChoix({ legende, valeur, onChange, options, cle, erreur, colonnes = 1, legendeCachee }: CartesProps) {
  const nom = useId();
  return (
    <fieldset className="mb-5" data-champ={cle} aria-invalid={erreur ? true : undefined}>
      <legend className={legendeCachee ? "sr-only" : "mb-2 text-base font-semibold"}>{legende}</legend>
      <div className={`grid gap-2.5 ${colonnes === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((o) => {
          const coche = valeur === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-carte border bg-carte px-3.5 py-3 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-bleu-action ${
                coche ? "border-2 border-bleu-action bg-bleu-teinte px-[13px] py-[11px]" : "border-filet hover:border-bleu-action"
              }`}
            >
              <input
                type="radio"
                name={nom}
                value={o.value}
                checked={coche}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`size-5 flex-none rounded-full border-[1.5px] ${coche ? "border-[6px] border-bleu-action" : "border-filet-champ"}`}
              />
              {o.icone && <span className="flex-none text-bleu-action">{o.icone}</span>}
              <span className="min-w-0 flex-1">
                <span className="block leading-snug">{o.label}</span>
                {o.sous && <span className="block text-[15px] leading-snug text-texte-2">{o.sous}</span>}
              </span>
              {o.extra}
            </label>
          );
        })}
      </div>
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
    </fieldset>
  );
}

/* ---------- Choix segmenté (2 à 4 options courtes) ---------- */

type SegmenteProps = {
  legende: ReactNode;
  valeur: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  cle?: string;
  erreur?: string;
  aide?: ReactNode;
};

export function Segmente({ legende, valeur, onChange, options, cle, erreur, aide }: SegmenteProps) {
  const nom = useId();
  return (
    <fieldset className="mb-5" data-champ={cle}>
      <legend className="mb-2 text-base font-semibold">{legende}</legend>
      <div
        className={`grid gap-1 rounded-bouton border bg-fond p-1 ${erreur ? "border-2 border-rouge-texte" : "border-filet"}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const coche = valeur === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-champ px-2 text-center font-semibold has-focus-visible:outline-3 has-focus-visible:outline-bleu-action ${
                coche ? "bg-carte text-bleu-action shadow-[0_1px_2px_rgb(10_64_92/0.15)]" : "text-texte-2 hover:text-encre"
              }`}
            >
              <input type="radio" name={nom} value={o.value} checked={coche} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      {aide && !erreur && <p className="mt-1.5 text-[15px] text-texte-2">{aide}</p>}
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
    </fieldset>
  );
}

/* ---------- Case à cocher et interrupteur ---------- */

export function CaseACocher({
  coche,
  onChange,
  children,
  cle,
  erreur,
}: {
  coche: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  cle?: string;
  erreur?: string;
}) {
  return (
    <div className="mb-4" data-champ={cle}>
      <label className="flex cursor-pointer gap-3 has-focus-visible:outline-3 has-focus-visible:outline-bleu-action">
        <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden="true"
          className={`mt-0.5 flex size-6 flex-none items-center justify-center rounded-md border-[1.5px] ${
            coche ? "border-bleu-action bg-bleu-action text-white" : erreur ? "border-2 border-rouge-texte bg-carte" : "border-filet-champ bg-carte"
          }`}
        >
          {coche && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span className="text-base leading-snug">{children}</span>
      </label>
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
    </div>
  );
}

export function Interrupteur({
  actif,
  onChange,
  titre,
  sous,
  droite,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  titre: string;
  sous?: string;
  droite?: ReactNode;
}) {
  return (
    <label className="mb-2.5 flex min-h-14 cursor-pointer items-center gap-3 rounded-carte border border-filet bg-carte px-3.5 py-3 has-focus-visible:outline-3 has-focus-visible:outline-bleu-action">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{titre}</span>
        {sous && <span className="block text-[15px] leading-snug text-texte-2">{sous}</span>}
      </span>
      {droite && <span className="text-[15px] text-texte-2">{droite}</span>}
      <input type="checkbox" role="switch" checked={actif} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden="true" className={`relative h-7 w-12 flex-none rounded-full transition-colors ${actif ? "bg-bleu-action" : "bg-filet-champ"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white transition-[left] ${actif ? "left-6" : "left-1"}`} />
      </span>
    </label>
  );
}
