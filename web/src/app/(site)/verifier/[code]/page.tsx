import { CircleAlert, CircleCheck, CircleHelp, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "@/server/api";

export const metadata: Metadata = { title: "Résultat de vérification", robots: { index: false } };

const dateFr = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

async function Resultat({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await api.call("verifyCertificate", { params: { code: decodeURIComponent(code).slice(0, 32) } });
  if (!r.ok) {
    return (
      <p className="rounded-carte border border-filet bg-carte p-5 text-texte-2">
        La vérification est momentanément indisponible. Réessayez dans un instant ou appelez la SONAS.
      </p>
    );
  }
  const v = r.data;
  const etats = {
    valid: { titre: "Attestation valide", ton: "bg-succes-teinte text-succes", Icone: CircleCheck },
    expired: { titre: "Attestation expirée", ton: "bg-vigilance-teinte text-vigilance", Icone: Clock },
    revoked: { titre: "Attestation annulée", ton: "bg-rouge-teinte text-rouge-texte", Icone: CircleAlert },
    unknown: { titre: "Code inconnu", ton: "bg-rouge-teinte text-rouge-texte", Icone: CircleHelp },
  } as const;
  const e = etats[v.status];
  return (
    <article className="overflow-hidden rounded-carte border border-filet bg-carte shadow-carte">
      <div className={`flex items-center gap-3 px-5 py-4 ${e.ton}`}>
        <e.Icone className="size-8 flex-none" aria-hidden="true" />
        <div>
          <h2 className="text-2xl">{e.titre}</h2>
          <p className="text-[15px]">Code {v.code}</p>
        </div>
      </div>
      {v.status === "unknown" ? (
        <p className="p-5 text-texte-2">
          Aucun certificat SONAS ne correspond à ce code. Vérifiez la saisie ; en cas de doute, le véhicule doit être considéré comme non assuré.
        </p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-5">
          <dt className="text-texte-2">Assuré</dt>
          <dd className="font-semibold">{v.maskedHolderName}</dd>
          <dt className="text-texte-2">Véhicule</dt>
          <dd>{v.insuredObject}</dd>
          <dt className="text-texte-2">Valable du</dt>
          <dd>
            {dateFr(v.validFrom)} au {dateFr(v.validTo)}
          </dd>
          <dt className="text-texte-2">Assureur</dt>
          <dd>{v.insurer}, agrément ARCA n° 12007</dd>
        </dl>
      )}
      <p className="border-t border-filet px-5 py-3 text-[14px] text-texte-2">
        Vérifié le {new Date(v.checkedAt).toLocaleString("fr-FR")}. Le nom est masqué pour protéger l’assuré.
      </p>
    </article>
  );
}

export default function PageResultat({ params }: { params: Promise<{ code: string }> }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-5 text-[28px]">Vérification d’attestation</h1>
      <Suspense fallback={<p className="text-texte-2">Vérification en cours…</p>}>
        <Resultat params={params} />
      </Suspense>
      <p className="mt-6">
        <Link href="/verifier" className="lien">
          Vérifier un autre code
        </Link>
      </p>
    </div>
  );
}
