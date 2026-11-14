import type { Metadata } from "next";
import { Gestion } from "@/components/gestion/gestion";

export const metadata: Metadata = { title: "Espace gestionnaire (démo)", robots: { index: false } };

export default function PageGestion() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-[32px]">Espace gestionnaire</h1>
      <p className="mb-6 text-lg text-texte-2">Traitez les sinistres déclarés en ligne : chaque étape est visible par le client.</p>
      <Gestion />
    </div>
  );
}
