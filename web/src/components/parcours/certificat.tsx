"use client";

/*
 * Certificat provisoire renvoyé par l'API (mentions obligatoires CA 121-122).
 * Le QR code pointe vers la page publique /verifier/{code} (contrôle routier).
 */

import type { Certificate, Policy } from "@myvign/contracts";
import { Download, QrCode } from "lucide-react";
import Link from "next/link";
import { useQr } from "@/components/parcours/attestation";
import { Bouton } from "@/components/ui/bouton";
import { formaterMontant } from "@/components/ui/devise";
import { Encadre } from "@/components/ui/encadre";
import { dateLongue } from "@/lib/format";

export function CertificatCarte({ certificat, contrat }: { certificat: Certificate; contrat?: Policy }) {
  const qr = useQr(certificat.verifyUrl);
  return (
    <article className="overflow-hidden rounded-carte border border-filet bg-carte shadow-carte" aria-label="Certificat d'assurance">
      <div className="flex items-center justify-between gap-3 border-b border-filet bg-bleu-teinte px-4 py-3">
        <div>
          <p className="font-titre text-lg font-semibold">
            {certificat.kind === "provisoire" ? "Certificat provisoire d’assurance" : "Certificat d’assurance"}
          </p>
          <p className="text-[14px] text-texte-2">
            {certificat.kind === "provisoire" ? "Valable 1 mois, le certificat définitif suit sous 10 jours" : `N° SNECA ${certificat.snecaNumber}`}
          </p>
        </div>
        <span className="rounded-full bg-succes-teinte px-2.5 py-1 text-[13px] font-bold text-succes">Valide</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
          <dt className="text-texte-2">Code de vérification</dt>
          <dd className="font-bold tabular-nums tracking-wide">{certificat.code}</dd>
          <dt className="text-texte-2">N° de contrat</dt>
          <dd className="tabular-nums">{certificat.policyNumber}</dd>
          <dt className="text-texte-2">Assuré</dt>
          <dd>
            {certificat.holderName}, {certificat.holderProfession.toLowerCase()}
          </dd>
          <dt className="text-texte-2">Adresse</dt>
          <dd>{certificat.holderAddress}</dd>
          <dt className="text-texte-2">Véhicule</dt>
          <dd>{certificat.insuredObject}</dd>
          {contrat && (
            <>
              <dt className="text-texte-2">Garantie</dt>
              <dd>{contrat.formulaName}</dd>
            </>
          )}
          <dt className="text-texte-2">Période</dt>
          <dd>
            du {dateLongue(certificat.validFrom)} au {dateLongue(certificat.validTo)}
          </dd>
          <dt className="text-texte-2">Pays couverts</dt>
          <dd>{certificat.coveredCountries.join(", ")}</dd>
          {contrat && (
            <>
              <dt className="text-texte-2">Prime annuelle</dt>
              <dd>{formaterMontant(contrat.annualPremium)}</dd>
            </>
          )}
          <dt className="text-texte-2">Assureur</dt>
          <dd>
            {certificat.insurer.name}, agrément ARCA n° {certificat.insurer.arcaAgreement}
          </dd>
        </dl>
        <div className="flex flex-col items-center gap-1.5 sm:w-36">
          {qr ? (
            // biome-ignore lint/performance/noImgElement: image générée localement (data URL), next/image inutile.
            <img src={qr} alt={`QR code de vérification du certificat ${certificat.code}`} width={136} height={136} className="rounded-md border border-filet" />
          ) : (
            <div className="size-[136px] rounded-md bg-fond" />
          )}
          <p className="text-center text-[13px] text-texte-2">Scannez pour vérifier</p>
        </div>
      </div>
    </article>
  );
}

export function ConfirmationApi({ certificat, contrat, telephone }: { certificat: Certificate; contrat: Policy; telephone: string }) {
  return (
    <div>
      <Encadre ton="succes" titre="Paiement confirmé, vous êtes assuré" className="mb-5">
        Couverture active du {dateLongue(contrat.startDate)} au {dateLongue(contrat.endDate)}. Un SMS de confirmation a été envoyé au {telephone}.
      </Encadre>
      <CertificatCarte certificat={certificat} contrat={contrat} />
      <div className="no-print mt-5 grid gap-2.5 sm:grid-cols-2">
        <Bouton onClick={() => window.print()}>
          <Download className="size-5" aria-hidden="true" /> Télécharger le certificat
        </Bouton>
        <Link href={`/verifier/${certificat.code}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-bouton border-[1.5px] border-bleu-action bg-carte px-5 font-bold text-bleu-action hover:bg-bleu-teinte">
          <QrCode className="size-5" aria-hidden="true" /> Tester la vérification
        </Link>
      </div>
      <div className="no-print mt-6 rounded-carte border border-filet bg-carte p-4">
        <p className="font-semibold">Et ensuite ?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-texte-2">
          <li>Envoyez votre pièce d’identité par le lien reçu par SMS : elle est nécessaire au certificat définitif.</li>
          <li>Le certificat définitif, enregistré auprès de l’ARCA (SNECA), suit sous 10 jours.</li>
          <li>Nous vous rappelons 30 jours avant l’échéance pour le renouvellement.</li>
        </ul>
      </div>
    </div>
  );
}
