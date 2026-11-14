import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegales() {
  return (
    <article className="mx-auto max-w-[70ch] px-4 py-10">
      <h1 className="text-[32px]">Mentions légales</h1>
      <p className="mt-4 text-texte-2">Démonstration réalisée pour présenter la plateforme myVign à la SONAS. Aucun contrat réel n’est conclu.</p>
      <h2 className="mt-8 text-xl">Assureur</h2>
      <p className="mt-2">
        SONAS SA, Société nationale d’assurances. Agrément ARCA n° 12007. Siège : Immeuble Sankuru, 6664 boulevard du 30 Juin, Gombe, Kinshasa.
      </p>
      <h2 id="conditions" className="mt-8 scroll-mt-24 text-xl">
        Conditions générales
      </h2>
      <p className="mt-2">
        Les conditions générales et la notice d’information sont remises avant le paiement (Code des assurances, art. 7 et 9). Dans cette démonstration,
        elles ne sont pas encore fournies par la SONAS.
      </p>
      <p className="mt-2 font-semibold">
        Toute fausse déclaration intentionnelle entraîne la nullité du contrat (art. 14). La couverture prend effet à la confirmation du paiement de la prime
        (art. 16).
      </p>
      <h2 className="mt-8 text-xl">Cartographie</h2>
      <p className="mt-2">Contours des provinces : geoBoundaries, données © contributeurs OpenStreetMap, licence ODbL.</p>
    </article>
  );
}
