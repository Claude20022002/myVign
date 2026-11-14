import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SuiviDossier } from "@/components/suivi/suivi";

export const metadata: Metadata = { title: "Mon dossier sinistre" };

// Cache Components : les paramètres de route sont lus dans un <Suspense> (Next 16).
async function Contenu({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SuiviDossier id={id} />;
}

export default function PageDossier({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="mb-2 text-[15px]">
        <Link href="/suivi" className="lien">
          Suivre un autre dossier
        </Link>
      </p>
      <h1 className="mb-6 text-[32px]">Votre dossier sinistre</h1>
      <Suspense fallback={<p className="text-texte-2">Chargement du dossier…</p>}>
        <Contenu params={params} />
      </Suspense>
    </div>
  );
}
