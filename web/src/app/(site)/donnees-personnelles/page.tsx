import type { Metadata } from "next";

export const metadata: Metadata = { title: "Protection de vos données" };

export default function DonneesPersonnelles() {
  return (
    <article className="mx-auto max-w-[70ch] px-4 py-10">
      <h1 className="text-[32px]">Protection de vos données</h1>
      <p className="mt-4">
        Vos données servent uniquement à établir et gérer votre contrat ou votre sinistre. Votre accord est demandé par une case non précochée (Code du
        numérique, art. 2).
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li>Données demandées : le strict nécessaire (identité, téléphone, adresse, véhicule). La pièce d’identité n’est demandée qu’après le paiement.</li>
        <li>Conservation des brouillons : 60 jours, pour vous permettre de reprendre votre demande.</li>
        <li>Vérification d’attestation : le nom de l’assuré y est masqué.</li>
        <li>Vous pouvez demander l’accès, la rectification ou la suppression de vos données auprès de la SONAS (sonas@sonas.cd).</li>
      </ul>
      <p className="mt-6 text-texte-2">Démonstration : aucune donnée n’est transmise à la SONAS ; le serveur de démonstration efface tout à son redémarrage.</p>
    </article>
  );
}
