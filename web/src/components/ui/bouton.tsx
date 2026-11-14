import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "principal" | "secondaire" | "urgence" | "discret";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-bouton px-5 text-[17px] font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-filet disabled:text-texte-3 disabled:border-filet";

const variantes: Record<Variante, string> = {
  // Le SEUL élément jaune d'un écran (DESIGN.md §3).
  principal: "bg-jaune-logo text-encre hover:bg-jaune-survol",
  secondaire: "border-[1.5px] border-bleu-action bg-carte text-bleu-action hover:bg-bleu-teinte",
  urgence: "bg-rouge-logo text-white hover:bg-rouge-texte",
  discret: "text-bleu-action underline underline-offset-4 hover:text-bleu-survol px-2",
};

export function classesBouton(variante: Variante = "principal", bloc = false, extra = "") {
  return `${base} ${variantes[variante]} ${bloc ? "w-full" : ""} ${extra}`;
}

type BoutonProps = ComponentProps<"button"> & { variante?: Variante; bloc?: boolean; chargement?: boolean };

export function Bouton({ variante = "principal", bloc, chargement, className = "", children, disabled, ...rest }: BoutonProps) {
  return (
    <button
      type="button"
      className={classesBouton(variante, bloc, className)}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      {...rest}
    >
      {chargement && <Spinner />}
      {children}
    </button>
  );
}

type LienBoutonProps = ComponentProps<typeof Link> & { variante?: Variante; bloc?: boolean; children: ReactNode };

export function LienBouton({ variante = "principal", bloc, className = "", ...rest }: LienBoutonProps) {
  return <Link className={classesBouton(variante, bloc, className)} {...rest} />;
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin motion-reduce:animate-none`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
