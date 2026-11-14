"use client";

/*
 * Mini back-office de DÉMONSTRATION : un gestionnaire fait avancer un sinistre,
 * le client voit le changement dans son suivi. Seules les transitions autorisées
 * (CLAIM_TRANSITIONS, partagées avec l'API) sont proposées ; un refus est toujours motivé.
 */

import { type Claim, CLAIM_STATUS_LABELS, CLAIM_TRANSITIONS, type ClaimStatus } from "@myvign/contracts";
import { ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Encadre } from "@/components/ui/encadre";
import { faireAvancerSinistre, listerSinistresGestion, sinistreParId } from "@/server/actions";

type Ligne = {
  id: string;
  number: string;
  type: string;
  status: ClaimStatus;
  holderName: string;
  maskedPhone: string;
  plate: string | null;
  missingDocuments: number;
  createdAt: string;
};

const TYPES: Record<string, string> = {
  accident: "Accident",
  vol: "Vol",
  vandalisme: "Vandalisme",
  bris_de_glace: "Bris de glace",
  incendie: "Incendie",
  evenement_climatique: "Événement climatique",
  panne: "Panne",
};

/** Libellé de l'action qui mène à chaque statut. */
const ACTIONS: Record<ClaimStatus, string> = {
  declared: "Déclarer",
  received: "Accuser réception",
  under_review: "Ouvrir l’instruction",
  expertise: "Missionner un expert",
  offer_made: "Envoyer l’offre",
  accepted: "Offre acceptée par le client",
  paid: "Verser l’indemnité",
  rejected: "Refuser (motivé)",
  closed: "Clôturer",
};

const A_TRAITER: ClaimStatus[] = ["declared", "received"];
const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Gestion() {
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string>();

  const charger = useCallback(async () => {
    const r = await listerSinistresGestion();
    if (r.ok) {
      setLignes(r.data.items);
      setErreur(undefined);
    } else setErreur(r.message);
  }, []);

  useEffect(() => {
    let actif = true;
    const tirer = () =>
      listerSinistresGestion().then((r) => {
        if (!actif) return;
        if (r.ok) {
          setLignes(r.data.items);
          setErreur(undefined);
        } else setErreur(r.message);
      });
    tirer();
    const t = setInterval(tirer, 8000);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, []);

  const compte = (f: (l: Ligne) => boolean) => lignes?.filter(f).length ?? 0;

  return (
    <>
      <Encadre ton="vigilance" titre="Démonstration : accès non protégé" className="mb-6">
        En production, l’espace gestionnaire est une application séparée : connexion avec double authentification, rôles (agent, gestionnaire sinistre,
        superviseur de province) et journal d’audit de chaque action.
      </Encadre>
      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi t="Dossiers" v={lignes?.length ?? 0} />
        <Kpi t="À traiter" v={compte((l) => A_TRAITER.includes(l.status))} />
        <Kpi t="En cours" v={compte((l) => ["under_review", "expertise", "offer_made", "accepted"].includes(l.status))} />
        <Kpi t="Pièces manquantes" v={compte((l) => l.missingDocuments > 0)} />
      </dl>
      {erreur && <Encadre ton="urgence" className="mb-4">{erreur}</Encadre>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="file" className="rounded-carte border border-filet bg-carte">
          <div className="flex items-center justify-between border-b border-filet px-4 py-3">
            <h2 id="file" className="text-lg">
              File des sinistres
            </h2>
            <button type="button" onClick={charger} className="inline-flex min-h-11 items-center gap-1.5 rounded-bouton px-3 font-semibold text-bleu-action hover:bg-bleu-teinte">
              <RefreshCw className="size-4" aria-hidden="true" /> Actualiser
            </button>
          </div>
          {lignes === null ? (
            <p className="p-4 text-texte-2">Chargement…</p>
          ) : lignes.length === 0 ? (
            <p className="p-4 text-texte-2">
              Aucun sinistre pour l’instant. Déclarez-en un depuis <a className="lien" href="/sinistre/auto" target="_blank" rel="noreferrer">le parcours client</a>.
            </p>
          ) : (
            <ul className="divide-y divide-filet">
              {lignes.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setChoisi(l.id)}
                    aria-current={choisi === l.id || undefined}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-fond ${choisi === l.id ? "bg-bleu-teinte" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold tabular-nums">{l.number}</span>
                      <span className="block text-[15px] text-texte-2">
                        {l.holderName} · {TYPES[l.type] ?? l.type}
                        {l.plate ? ` · ${l.plate}` : ""}
                      </span>
                      <span className="block text-[14px] text-texte-2">Déclaré le {date.format(new Date(l.createdAt))}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Pastille statut={l.status} />
                      {l.missingDocuments > 0 && <span className="text-[13px] text-vigilance">{l.missingDocuments} pièce(s) manquante(s)</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div>{choisi ? <Fiche key={choisi} id={choisi} apresAction={charger} /> : <p className="rounded-carte border border-dashed border-filet-champ p-6 text-center text-texte-2">Sélectionnez un dossier.</p>}</div>
      </div>
    </>
  );
}

function Kpi({ t, v }: { t: string; v: number }) {
  return (
    <div className="rounded-carte border border-filet bg-carte p-4">
      <dt className="text-[15px] text-texte-2">{t}</dt>
      <dd className="prix text-[28px]">{v}</dd>
    </div>
  );
}

function Pastille({ statut }: { statut: ClaimStatus }) {
  const ton =
    statut === "paid" || statut === "closed"
      ? "bg-succes-teinte text-succes"
      : statut === "rejected"
        ? "bg-rouge-teinte text-rouge-texte"
        : A_TRAITER.includes(statut)
          ? "bg-vigilance-teinte text-vigilance"
          : "bg-bleu-teinte text-bleu-action";
  return <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${ton}`}>{CLAIM_STATUS_LABELS[statut]}</span>;
}

function Fiche({ id, apresAction }: { id: string; apresAction: () => void }) {
  const [dossier, setDossier] = useState<Claim | null>(null);
  const [message, setMessage] = useState("");
  const [refus, setRefus] = useState(false);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);

  // La fiche est remontée à chaque dossier (key) : son état repart de zéro sans effet.
  useEffect(() => {
    let actif = true;
    sinistreParId(id).then((r) => {
      if (actif && r.ok) setDossier(r.data);
    });
    return () => {
      actif = false;
    };
  }, [id]);

  async function agir(statut: ClaimStatus) {
    if (statut === "rejected" && !refus) return setRefus(true);
    setOccupe(true);
    const r = await faireAvancerSinistre({ id, statut, message: message || undefined, motif: statut === "rejected" ? motif : undefined });
    setOccupe(false);
    if (!r.ok) return setErreur(r.champs?.reason ?? r.message);
    setDossier(r.data);
    setMessage("");
    setRefus(false);
    setErreur(undefined);
    apresAction();
  }

  if (!dossier) return <p className="text-texte-2">Chargement du dossier…</p>;
  const possibles = CLAIM_TRANSITIONS[dossier.status];

  return (
    <section className="rounded-carte border border-filet bg-carte p-5" aria-labelledby="fiche">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="fiche" className="text-xl tabular-nums">
            {dossier.number}
          </h2>
          <p className="text-[15px] text-texte-2">{TYPES[dossier.type] ?? dossier.type}</p>
        </div>
        <Pastille statut={dossier.status} />
      </div>
      <a href={`/suivi/${dossier.id}`} target="_blank" rel="noreferrer" className="lien mt-2 inline-flex items-center gap-1 text-[15px]">
        Voir ce que voit le client <ExternalLink className="size-4" aria-hidden="true" />
      </a>

      <h3 className="mt-5 text-base">Chronologie</h3>
      <ol className="mt-2 space-y-1.5 text-[15px]">
        {dossier.timeline.map((ev) => (
          <li key={`${ev.status}-${ev.at}`}>
            <span className="font-semibold">{CLAIM_STATUS_LABELS[ev.status]}</span> <span className="text-texte-2">· {date.format(new Date(ev.at))}</span>
          </li>
        ))}
      </ol>

      <h3 className="mt-5 text-base">Pièces</h3>
      <ul className="mt-2 space-y-1 text-[15px]">
        {dossier.requiredDocuments.map((d) => (
          <li key={d.code}>
            {d.status === "missing" ? "○" : "●"} {d.label}
            {d.mandatory ? "" : " (facultatif)"}
          </li>
        ))}
      </ul>

      {possibles.length > 0 ? (
        <div className="mt-6 border-t border-filet pt-5">
          <label htmlFor="msg" className="mb-1.5 block font-semibold">
            Message au client <span className="font-normal text-texte-2">(facultatif)</span>
          </label>
          <textarea id="msg" rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-champ border border-filet-champ px-3 py-2 outline-none focus:border-2 focus:border-bleu-action" placeholder="Sinon, un message standard est affiché." />
          {refus && (
            <div className="mt-3">
              <label htmlFor="motif" className="mb-1.5 block font-semibold">
                Motif du refus (visible par le client)
              </label>
              <textarea id="motif" rows={2} maxLength={300} value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full rounded-champ border border-filet-champ px-3 py-2 outline-none focus:border-2 focus:border-bleu-action" />
            </div>
          )}
          {erreur && (
            <p className="mt-2 flex items-center gap-1.5 text-rouge-texte" role="alert">
              <ShieldAlert className="size-4" aria-hidden="true" /> {erreur}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            {possibles.map((s, i) => (
              <Bouton key={s} variante={s === "rejected" ? "secondaire" : i === 0 ? "principal" : "secondaire"} chargement={occupe} onClick={() => agir(s)}>
                {refus && s === "rejected" ? "Confirmer le refus" : ACTIONS[s]}
              </Bouton>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-texte-2">Dossier terminé : aucune action possible.</p>
      )}
    </section>
  );
}
