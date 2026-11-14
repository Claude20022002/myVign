"use client";

import { Download, MessageSquareText } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Encadre } from "@/components/ui/encadre";
import { dateLongue, fc, telAffiche } from "@/lib/format";
import { SONAS } from "@/lib/referentiels";
import type { Attestation } from "@/lib/stockage";

export function useQr(texte: string) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    QRCode.toDataURL(texte, { margin: 1, width: 240, color: { dark: "#1B2733", light: "#FFFFFF" } }).then(setSrc);
  }, [texte]);
  return src;
}

/** Certificat provisoire : mentions obligatoires de l'art. 121-122 du Code des assurances. */
export function CarteAttestation({ a }: { a: Attestation }) {
  const [origine, setOrigine] = useState("");
  useEffect(() => setOrigine(window.location.origin), []);
  const qr = useQr(`${origine}/verifier?n=${a.numero}`);
  return (
    <article className="overflow-hidden rounded-carte border border-filet bg-carte shadow-carte" aria-label="Certificat provisoire d'assurance">
      <div className="flex items-center justify-between gap-3 border-b border-filet bg-bleu-teinte px-4 py-3">
        <div>
          <p className="font-titre text-lg font-semibold">Certificat provisoire d'assurance</p>
          <p className="text-[14px] text-texte-2">Valable 1 mois, le certificat définitif suit sous 10 jours</p>
        </div>
        <span className="rounded-full bg-succes-teinte px-2.5 py-1 text-[13px] font-bold text-succes">Valide</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
          <dt className="text-texte-2">N° de certificat</dt>
          <dd className="font-bold tabular-nums">{a.numero}</dd>
          <dt className="text-texte-2">N° de contrat</dt>
          <dd className="tabular-nums">{a.contrat}</dd>
          <dt className="text-texte-2">Assuré</dt>
          <dd>
            {a.souscripteur}
            {a.profession ? `, ${a.profession.toLowerCase()}` : ""}
          </dd>
          <dt className="text-texte-2">Adresse</dt>
          <dd>{a.adresse}</dd>
          <dt className="text-texte-2">{a.produit === "auto" ? "Véhicule" : "Logement"}</dt>
          <dd>{a.objet}</dd>
          <dt className="text-texte-2">Garantie</dt>
          <dd>{a.formule}</dd>
          <dt className="text-texte-2">Période</dt>
          <dd>
            du {dateLongue(a.debut)} au {dateLongue(a.fin)}
          </dd>
          <dt className="text-texte-2">Prime payée</dt>
          <dd>
            {fc(a.montant)} par {a.moyen}
          </dd>
          <dt className="text-texte-2">Assureur</dt>
          <dd>
            {SONAS.nom}, agrément ARCA n° {SONAS.agrement}
          </dd>
        </dl>
        <div className="flex flex-col items-center gap-1.5 sm:w-36">
          {qr ? <img src={qr} alt={`QR code de vérification du certificat ${a.numero}`} width={136} height={136} className="rounded-md border border-filet" /> : <div className="size-[136px] rounded-md bg-fond" />}
          <p className="text-center text-[13px] text-texte-2">Scannez pour vérifier</p>
        </div>
      </div>
    </article>
  );
}

export function ConfirmationSouscription({ a, recommencer }: { a: Attestation; recommencer: () => void }) {
  const [sms, setSms] = useState(false);
  return (
    <div>
      <Encadre ton="succes" titre="Paiement confirmé, vous êtes assuré" className="mb-5">
        Couverture active dès aujourd'hui. Un SMS de confirmation a été envoyé au {telAffiche(a.telephone)}.
      </Encadre>
      <CarteAttestation a={a} />
      <div className="no-print mt-5 grid gap-2.5 sm:grid-cols-2">
        <Bouton onClick={() => window.print()}>
          <Download className="size-5" aria-hidden="true" /> Télécharger le certificat
        </Bouton>
        <Bouton variante="secondaire" onClick={() => setSms(true)}>
          <MessageSquareText className="size-5" aria-hidden="true" /> Recevoir par SMS
        </Bouton>
      </div>
      {sms && (
        <Encadre ton="succes" className="no-print mt-3">
          Lien envoyé au {telAffiche(a.telephone)} (simulation).
        </Encadre>
      )}
      <div className="no-print mt-6 rounded-carte border border-filet bg-carte p-4">
        <p className="font-semibold">Et ensuite ?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-texte-2">
          <li>Votre contrat, la notice et vos réponses vous sont envoyés par e-mail ou SMS.</li>
          <li>Le certificat définitif, enregistré auprès de l'ARCA, suit sous 10 jours.</li>
          <li>Nous vous rappelons 30 jours avant l'échéance pour le renouvellement.</li>
        </ul>
      </div>
      <p className="no-print mt-5 text-center">
        <a className="lien" href={`/verifier?n=${a.numero}`}>Tester la vérification du certificat</a>
        <span className="mx-3 text-filet-champ" aria-hidden="true">|</span>
        <button type="button" className="lien" onClick={recommencer}>
          Nouvelle souscription
        </button>
      </p>
    </div>
  );
}
