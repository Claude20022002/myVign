import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Localisateur } from "@/components/agences/agences";
import { BlocDevis } from "@/components/site/bloc-devis";
import { VILLES } from "@/lib/villes";

export const metadata: Metadata = {
  title: "Trouver une agence SONAS",
  description: "Les 59 agences SONAS en RDC : adresse, horaires, prise de rendez-vous en ligne.",
};

export default function PageAgences() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Fil d’Ariane" className="mb-4 text-[14px] text-texte-2">
        <Link href="/" className="underline underline-offset-2">
          Accueil
        </Link>
        <ChevronRight className="mx-1 inline size-3.5" aria-hidden="true" />
        Trouver une agence
      </nav>
      <h1 className="mb-6 text-center text-[32px]">Trouver une agence SONAS</h1>
      <Localisateur />
      <BlocDevis />
      <section className="mt-12" aria-labelledby="villes">
        <h2 id="villes" className="text-center text-2xl">
          Les agences SONAS par ville
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
          {VILLES.map((v) => (
            <li key={`${v.province}/${v.slug}`}>
              <Link href={`/agences/${v.province}/${v.slug}`} className="text-[15px] underline-offset-2 hover:text-bleu-action hover:underline">
                Assurance {v.ville}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
