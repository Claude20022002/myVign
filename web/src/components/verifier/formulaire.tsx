"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champs";

export function FormulaireVerification({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const [erreur, setErreur] = useState<string>();
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const net = code.replace(/[\s-]/g, "").toUpperCase();
        if (net.length < 6) return setErreur("Le code comporte au moins 6 caractères ; il est imprimé sous le QR code.");
        router.push(`/verifier/${encodeURIComponent(net)}`);
      }}
      className="rounded-carte border border-filet bg-carte p-5"
    >
      <ChampTexte label="Code de vérification" valeur={code} onChange={(v) => { setCode(v); setErreur(undefined); }} majuscules placeholder="385FFD6C85" aide="Imprimé sous le QR code du certificat." erreur={erreur} />
      <Bouton type="submit" bloc>
        Vérifier
      </Bouton>
    </form>
  );
}
