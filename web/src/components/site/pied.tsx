import Link from "next/link";
import { SONAS } from "@/lib/referentiels";

export function Pied() {
  return (
    <footer className="no-print mt-20 bg-bleu-nuit text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-titre text-xl font-semibold">SONAS SA</p>
          <p className="mt-2 text-[15px] text-bleu-clair">Société nationale d'assurances, plus de 60 ans au service de la RDC.</p>
          <p className="mt-3 text-[15px] text-bleu-clair">Agrément ARCA n° {SONAS.agrement}</p>
        </div>
        <div>
          <p className="font-semibold">Souscrire</p>
          <ul className="mt-2 space-y-1.5 text-[15px] text-bleu-clair">
            <li><Link className="hover:text-white hover:underline" href="/souscrire/auto">Assurance auto</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/#assurances">Toutes nos assurances</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Services</p>
          <ul className="mt-2 space-y-1.5 text-[15px] text-bleu-clair">
            <li><Link className="hover:text-white hover:underline" href="/sinistre">Déclarer un sinistre</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/suivi">Suivre un dossier</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/verifier">Vérifier une attestation</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/agences">Trouver une agence</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Nous joindre</p>
          <ul className="mt-2 space-y-1.5 text-[15px] text-bleu-clair">
            <li>Sinistre 24 h/24 : <a className="font-bold text-jaune-logo hover:underline" href="tel:+243816415515">{SONAS.telSinistre}</a></li>
            <li>Information : <a className="hover:text-white hover:underline" href="tel:+243840393642">{SONAS.telInfo}</a></li>
            <li>{SONAS.adresse}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-4 text-[14px] text-bleu-clair">
          <span>Démonstration myVign, novembre 2026</span>
          <Link className="hover:text-white hover:underline" href="/mentions-legales">Mentions légales</Link>
          <Link className="hover:text-white hover:underline" href="/donnees-personnelles">Protection de vos données</Link>
          <Link className="hover:text-white hover:underline" href="/gestion">Espace gestionnaire (démo)</Link>
        </div>
      </div>
    </footer>
  );
}
