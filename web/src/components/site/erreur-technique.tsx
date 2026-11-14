"use client";

/*
 * Cas E6 « erreur technique » (gabarit inspiré du parcours Macif, en charte SONAS) :
 * message rassurant, action principale « Prendre rendez-vous », rappel, numéro du centre de contact.
 */

import { CalendarDays, Clock, Phone, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAide } from "@/components/aide/aide";
import { Bouton, classesBouton } from "@/components/ui/bouton";
import { SONAS } from "@/lib/referentiels";

export function ErreurTechnique({ reessayer }: { reessayer?: () => void }) {
  const { ouvrir } = useAide();
  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <section className="rounded-carte border border-filet bg-carte p-6 shadow-carte sm:p-10" aria-labelledby="titre-panne">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-bleu-teinte text-bleu-action">
          <RefreshCw className="size-7" aria-hidden="true" />
        </div>
        <h1 id="titre-panne" className="text-[28px]">
          Une erreur technique est survenue
        </h1>
        <p className="mt-3 max-w-prose text-texte-2">
          Votre demande en ligne n’a pas pu aboutir. <strong className="text-encre">Vos réponses sont enregistrées</strong> : vous
          pourrez reprendre plus tard, ou prendre rendez-vous avec un conseiller.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/agences" className={classesBouton("principal")}>
            <CalendarDays className="size-5" aria-hidden="true" /> Prendre rendez-vous
          </Link>
          {reessayer && (
            <Bouton variante="secondaire" onClick={reessayer}>
              Réessayer
            </Bouton>
          )}
        </div>
      </section>
      <aside className="grid content-start gap-4">
        <div className="rounded-carte border border-filet bg-carte p-5">
          <p className="flex items-center gap-2 font-titre text-lg font-semibold">
            <Clock className="size-5 text-bleu-action" aria-hidden="true" /> Faites-vous rappeler
          </p>
          <p className="mt-1 text-[15px] text-texte-2">Gratuit, au créneau de votre choix. Votre dossier est transmis.</p>
          <Bouton variante="secondaire" bloc className="mt-3" onClick={() => ouvrir("rappel")}>
            Rappelez-moi
          </Bouton>
        </div>
        <div className="rounded-carte border border-filet bg-carte p-5 text-center">
          <p className="font-titre text-lg font-semibold">Contactez nos conseillers</p>
          <a href={`tel:${SONAS.telInfo.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-bleu-action">
            <Phone className="size-5" aria-hidden="true" /> {SONAS.telInfo}
          </a>
          <p className="mt-1 text-[15px] text-texte-2">Prix d’un appel local · lun–ven, 7 h 30–16 h</p>
        </div>
      </aside>
    </div>
  );
}
