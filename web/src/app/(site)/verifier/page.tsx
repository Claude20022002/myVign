import { QrCode } from "lucide-react";
import type { Metadata } from "next";
import { FormulaireVerification } from "@/components/verifier/formulaire";

export const metadata: Metadata = { title: "Vérifier une attestation" };

export default function PageVerifier() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <span className="mb-4 flex size-12 items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action">
        <QrCode className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-[32px]">Vérifier une attestation</h1>
      <p className="mb-6 mt-2 text-lg text-texte-2">
        Contrôle routier, achat d’un véhicule d’occasion : scannez le QR code du certificat, ou saisissez son code.
      </p>
      <FormulaireVerification />
    </div>
  );
}
