import { ArrowRight, Car, ClipboardList, House, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { classesBouton } from "@/components/ui/bouton";
import { SONAS } from "@/lib/referentiels";

export const metadata: Metadata = { title: "Déclarer un sinistre" };

export default function PageSinistre() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-[32px]">Déclarer un sinistre</h1>
      <p className="mt-2 text-lg text-texte-2">Sans compte, en 4 minutes. Votre déclaration est acceptée même en retard.</p>

      {/* Urgence : le seul contexte où le rouge est permis (DESIGN.md §3). */}
      <section className="mt-6 rounded-carte bg-rouge-teinte p-5" aria-labelledby="urgence">
        <h2 id="urgence" className="text-xl text-rouge-texte">
          Blessés ou danger immédiat ?
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="tel:112" className={classesBouton("urgence")}>
            <Phone className="size-5" aria-hidden="true" /> Appeler le 112
          </a>
          <a href={`tel:${SONAS.telSinistre.replace(/\s/g, "")}`} className={classesBouton("secondaire")}>
            Assistance 24 h/24 : {SONAS.telSinistre}
          </a>
        </div>
      </section>

      <ul className="mt-8 grid gap-3">
        <li>
          <Link href="/sinistre/auto" className="flex min-h-20 items-center gap-4 rounded-carte border border-filet bg-carte p-4 hover:border-bleu-action">
            <span className="flex size-12 flex-none items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action">
              <Car className="size-6" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-titre text-xl font-semibold">Sinistre auto</span>
              <span className="block text-texte-2">Accident, vol, vandalisme, bris de glace, incendie, panne</span>
            </span>
            <ArrowRight className="size-5 text-texte-2" aria-hidden="true" />
          </Link>
        </li>
        <li className="flex min-h-20 items-center gap-4 rounded-carte border border-filet bg-carte p-4">
          <span className="flex size-12 flex-none items-center justify-center rounded-bouton bg-fond text-texte-2">
            <House className="size-6" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block font-titre text-xl font-semibold">Sinistre habitation</span>
            <span className="block text-texte-2">Bientôt en ligne. En attendant : {SONAS.telSinistre} ou en agence.</span>
          </span>
        </li>
      </ul>

      <p className="mt-8 flex items-center gap-2 text-texte-2">
        <ClipboardList className="size-5" aria-hidden="true" /> Déjà déclaré ?{" "}
        <Link href="/suivi" className="lien">
          Suivre mon dossier
        </Link>
      </p>
    </div>
  );
}
