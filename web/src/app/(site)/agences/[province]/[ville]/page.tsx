import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgencesVille } from "@/components/agences/agences";
import { BlocDevis } from "@/components/site/bloc-devis";
import { nomProvince, VILLES } from "@/lib/villes";

type Params = { province: string; ville: string };

/** Une page par ville ayant une agence (gabarit « Assurance Parisot » de Macif, adapté). */
export function generateStaticParams(): Params[] {
  return VILLES.map((v) => ({ province: v.province, ville: v.slug }));
}

const trouver = (p: Params) => VILLES.find((v) => v.province === p.province && v.slug === p.ville);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const v = trouver(await params);
  return v ? { title: `Assurance ${v.ville} · agences SONAS`, description: `Les agences SONAS à ${v.ville} (${nomProvince(v.province)}) : adresses, horaires, rendez-vous en ligne.` } : {};
}

export default async function PageVille({ params }: { params: Promise<Params> }) {
  const v = trouver(await params);
  if (!v) notFound();
  const proches = VILLES.filter((x) => x.province === v.province && x.slug !== v.slug);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Fil d’Ariane" className="mb-4 text-[14px] text-texte-2">
        <Link href="/" className="underline underline-offset-2">
          Accueil
        </Link>
        <ChevronRight className="mx-1 inline size-3.5" aria-hidden="true" />
        <Link href="/agences" className="underline underline-offset-2">
          Trouver une agence
        </Link>
        <ChevronRight className="mx-1 inline size-3.5" aria-hidden="true" />
        {nomProvince(v.province)}
        <ChevronRight className="mx-1 inline size-3.5" aria-hidden="true" />
        {v.ville}
      </nav>
      <h1 className="text-center text-[32px]">
        Assurance {v.ville} · {nomProvince(v.province)}
      </h1>
      <p className="mb-6 mt-2 text-center text-lg text-texte-2">
        {v.agences.length} agence{v.agences.length > 1 ? "s" : ""} SONAS à {v.ville}
      </p>
      <AgencesVille slugs={v.agences.map((a) => a.slug)} />
      <BlocDevis />
      {proches.length > 0 && (
        <section className="mt-10" aria-labelledby="proches">
          <h2 id="proches" className="text-xl">
            Agences SONAS dans les villes à proximité
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {proches.map((p) => (
              <li key={p.slug}>
                <Link href={`/agences/${p.province}/${p.slug}`} className="lien">
                  {p.ville}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-center">
        <Link href="/agences" className="lien">
          Voir toutes nos agences
        </Link>
      </p>
    </div>
  );
}
