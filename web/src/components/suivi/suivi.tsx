"use client";

/*
 * Suivi d'un sinistre par statuts (réponse à la plainte n°1 : l'opacité).
 * Chaque statut est horodaté et expliqué ; le dossier se rafraîchit seul.
 */

import { type Claim, CLAIM_STATUS_LABELS, type ClaimStatus } from "@myvign/contracts";
import { CircleCheck, Circle, FileText, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAide } from "@/components/aide/aide";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/encadre";
import { telNational } from "@/lib/format";
import { rechercherSinistre, sinistreParId } from "@/server/actions";

/** Parcours type d'un dossier, pour montrer au client ce qui l'attend. */
const PARCOURS_TYPE: ClaimStatus[] = ["declared", "received", "under_review", "expertise", "offer_made", "accepted", "paid"];

const horodatage = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function RechercheDossier() {
  const router = useRouter();
  const [numero, setNumero] = useState("");
  const [tel, setTel] = useState("");
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (numero.trim().length < 5) return setErreur("Indiquez votre numéro de sinistre, par exemple SIN-2026-000001.");
        if (telNational(tel).length !== 9) return setErreur("Entrez les 9 chiffres de votre téléphone après +243.");
        setOccupe(true);
        const r = await rechercherSinistre(numero, `+243${telNational(tel)}`);
        setOccupe(false);
        if (!r.ok) return setErreur(r.code === "NOT_FOUND" ? "Aucun dossier ne correspond à ce numéro et ce téléphone." : r.message);
        router.push(`/suivi/${r.data.id}`);
      }}
      className="rounded-carte border border-filet bg-carte p-5"
    >
      <ChampTexte label="Numéro de sinistre" valeur={numero} onChange={(v) => { setNumero(v); setErreur(undefined); }} majuscules placeholder="SIN-2026-000001" />
      <ChampTexte label="Téléphone de la déclaration" type="tel" inputMode="tel" prefixe="+243" valeur={tel} onChange={(v) => { setTel(telNational(v)); setErreur(undefined); }} placeholder="81 234 5678" />
      {erreur && <Encadre ton="urgence" className="mb-4">{erreur}</Encadre>}
      <Bouton type="submit" bloc chargement={occupe}>
        Voir mon dossier
      </Bouton>
    </form>
  );
}

export function SuiviDossier({ id }: { id: string }) {
  const [dossier, setDossier] = useState<Claim | null>(null);
  const [erreur, setErreur] = useState<string>();
  const { ouvrir } = useAide();

  const charger = useCallback(async () => {
    const r = await sinistreParId(id);
    if (r.ok) setDossier(r.data);
    else setErreur(r.code === "NOT_FOUND" ? "Ce dossier est introuvable (le serveur de démonstration a pu redémarrer)." : r.message);
  }, [id]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 8000);
    return () => clearInterval(t);
  }, [charger]);

  if (erreur) return <Encadre ton="vigilance">{erreur}</Encadre>;
  if (!dossier) return <p className="text-texte-2">Chargement du dossier…</p>;

  const atteints = new Map(dossier.timeline.map((ev) => [ev.status, ev]));
  const refuse = dossier.status === "rejected";
  const etapes = refuse ? [...dossier.timeline.map((ev) => ev.status)] : PARCOURS_TYPE;
  const manquantes = dossier.requiredDocuments.filter((d) => d.status === "missing");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-carte border border-filet bg-carte p-5" aria-labelledby="statut">
        <p className="text-[15px] text-texte-2">Dossier {dossier.number}</p>
        <h2 id="statut" className="text-2xl">
          {CLAIM_STATUS_LABELS[dossier.status]}
        </h2>
        {refuse && dossier.statusReason && (
          <Encadre ton="vigilance" titre="Motif" className="mt-3">
            {dossier.statusReason}
          </Encadre>
        )}
        <ol className="mt-6">
          {etapes.map((statut, i) => {
            const ev = atteints.get(statut);
            const fait = Boolean(ev);
            const enCours = statut === dossier.status;
            return (
              <li key={statut} className="relative flex gap-3 pb-5 last:pb-0">
                {i < etapes.length - 1 && <span aria-hidden="true" className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${fait ? "bg-bleu-logo" : "bg-filet"}`} />}
                {fait ? (
                  <CircleCheck className={`size-6 flex-none ${enCours ? "text-bleu-action" : "text-bleu-logo"}`} aria-hidden="true" />
                ) : (
                  <Circle className="size-6 flex-none text-filet-champ" aria-hidden="true" />
                )}
                <div>
                  <p className={fait ? "font-semibold" : "text-texte-2"}>
                    {CLAIM_STATUS_LABELS[statut]}
                    <span className="sr-only">{fait ? " (fait)" : " (à venir)"}</span>
                  </p>
                  {ev && (
                    <p className="text-[15px] text-texte-2">
                      {horodatage.format(new Date(ev.at))} · {ev.message}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex items-center gap-1.5 text-[14px] text-texte-2">
          <RefreshCw className="size-4" aria-hidden="true" /> Mis à jour automatiquement
        </p>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-carte border border-filet bg-carte p-5" aria-labelledby="pieces">
          <h2 id="pieces" className="text-lg">
            Pièces du dossier
          </h2>
          {manquantes.length === 0 ? (
            <p className="mt-1 text-[15px] text-succes">Rien ne manque pour le moment.</p>
          ) : (
            <p className="mt-1 text-[15px] text-texte-2">À envoyer quand vous les avez : elles accélèrent l’indemnisation.</p>
          )}
          <ul className="mt-3 grid gap-2 text-[15px]">
            {dossier.requiredDocuments.map((d) => (
              <li key={d.code} className="flex gap-2">
                {d.status === "missing" ? <FileText className="mt-0.5 size-4 flex-none text-vigilance" aria-hidden="true" /> : <CircleCheck className="mt-0.5 size-4 flex-none text-succes" aria-hidden="true" />}
                <span>
                  {d.label}
                  {!d.mandatory && <span className="text-texte-2"> (facultatif)</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-carte border border-filet bg-carte p-5">
          <p className="font-titre text-lg font-semibold">Une question sur votre dossier ?</p>
          <p className="mt-1 text-[15px] text-texte-2">Votre gestionnaire vous rappelle, votre dossier sous les yeux.</p>
          <Bouton variante="secondaire" bloc className="mt-3" onClick={() => ouvrir("rappel")}>
            Être rappelé
          </Bouton>
        </section>
      </aside>
    </div>
  );
}
