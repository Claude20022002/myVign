"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BoutonAide } from "@/components/aide/aide";
import { Logo } from "./logo";

const LIENS = [
  { href: "/#assurances", label: "Nos assurances" },
  { href: "/sinistre", label: "Déclarer un sinistre" },
  { href: "/suivi", label: "Suivre un dossier" },
  { href: "/agences", label: "Agences" },
  { href: "/verifier", label: "Vérifier une attestation" },
];

export function BandeauDemo() {
  return (
    <div className="no-print bg-encre px-4 py-1.5 text-center text-[14px] text-white">
      Démonstration myVign : aucune donnée n'est transmise à la SONAS, les paiements sont simulés.
    </div>
  );
}

export function Entete() {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  return (
    <header className="no-print sticky top-0 z-40 border-t-[3px] border-bleu-logo border-b border-b-filet bg-carte/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        <Logo />
        <nav aria-label="Principale" className="ml-4 hidden flex-1 lg:block">
          <ul className="flex gap-1">
            {LIENS.map((l) => {
              const actif = l.href !== "/#assurances" && chemin.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={actif ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-bouton px-3 font-semibold hover:bg-fond ${actif ? "text-bleu-action shadow-[inset_0_-3px_0_var(--color-bleu-logo)]" : "text-encre"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <BoutonAide />
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-bouton border border-filet lg:hidden"
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOuvert((o) => !o)}
          >
            {ouvert ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {ouvert && (
        <nav id="menu-mobile" aria-label="Menu mobile" className="border-t border-filet lg:hidden">
          <ul className="mx-auto max-w-6xl px-2 py-2">
            {LIENS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOuvert(false)} className="flex min-h-12 items-center rounded-bouton px-3 font-semibold hover:bg-fond">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
