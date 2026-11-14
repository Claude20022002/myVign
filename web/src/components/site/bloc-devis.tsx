import { ArrowRight, Car, Flame, GraduationCap, House, Plane } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const TUILES: { titre: string; href: string | null; icone: ReactNode }[] = [
  { titre: "Assurance auto", href: "/souscrire/auto", icone: <Car className="size-6" /> },
  { titre: "Assurance habitation", href: null, icone: <House className="size-6" /> },
  { titre: "Assurance incendie", href: null, icone: <Flame className="size-6" /> },
  { titre: "Assurance voyage", href: null, icone: <Plane className="size-6" /> },
  { titre: "Assurance scolaire", href: null, icone: <GraduationCap className="size-6" /> },
];

/** Bloc « Réalisez votre devis en ligne » (gabarit des pages agences). Fond bleu nuit (DESIGN.md §3). */
export function BlocDevis() {
  return (
    <section className="mt-12 rounded-carte bg-bleu-nuit p-6 text-white sm:p-8" aria-labelledby="titre-devis">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="titre-devis" className="text-2xl">
            Réalisez votre devis en ligne
          </h2>
          <p className="mt-2 text-bleu-clair">Sans compte, payé en mobile money, certificat immédiat.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TUILES.map((t) => (
            <li key={t.titre}>
              {t.href ? (
                <Link href={t.href} className="flex h-full min-h-32 flex-col justify-between rounded-bouton bg-carte p-3.5 text-encre hover:outline-3 hover:outline-jaune-logo">
                  <span className="text-bleu-action" aria-hidden="true">
                    {t.icone}
                  </span>
                  <span className="font-bold leading-tight">{t.titre}</span>
                  <ArrowRight className="size-5 self-end text-bleu-action" aria-hidden="true" />
                </Link>
              ) : (
                <div className="flex h-full min-h-32 flex-col justify-between rounded-bouton bg-white/90 p-3.5 text-encre">
                  <span className="text-texte-2" aria-hidden="true">
                    {t.icone}
                  </span>
                  <span className="font-bold leading-tight">{t.titre}</span>
                  <span className="text-[13px] text-texte-2">Bientôt en ligne</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
