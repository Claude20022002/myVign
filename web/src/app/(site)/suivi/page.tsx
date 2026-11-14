import type { Metadata } from "next";
import { RechercheDossier } from "@/components/suivi/suivi";

export const metadata: Metadata = { title: "Suivre un dossier" };

export default function PageSuivi() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-[32px]">Suivre un dossier</h1>
      <p className="mb-6 mt-2 text-lg text-texte-2">Votre numéro de sinistre figure dans le SMS reçu après votre déclaration.</p>
      <RechercheDossier />
    </div>
  );
}
