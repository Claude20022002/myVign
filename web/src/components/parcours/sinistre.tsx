"use client";

/*
 * Déclaration de sinistre auto, sans compte (contrat : AutoClaimSteps).
 * La sécurité d'abord (112), puis le strict nécessaire ; les pièces ne bloquent jamais (CA 19).
 */

import {
  AutoClaimStepCircumstances,
  AutoClaimStepContact,
  AutoClaimStepWhenWhere,
  type Claim,
  CLAIM_STATUS_LABELS,
} from "@myvign/contracts";
import { KINSHASA_COMMUNES, PROVINCES, type ProvinceCode } from "@myvign/geo";
import { CircleCheck, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useAide } from "@/components/aide/aide";
import { SchemaChocs } from "@/components/illustrations/illustrations";
import { PROVINCES_TRIEES } from "@/components/site/carte-provinces";
import { ErreurTechnique } from "@/components/site/erreur-technique";
import { Bouton, classesBouton } from "@/components/ui/bouton";
import { CartesChoix, Champ, ChampSelect, ChampTexte, Segmente } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/encadre";
import { telNational } from "@/lib/format";
import { SONAS } from "@/lib/referentiels";
import { enregistrerBloc, envoyerDeclaration } from "@/server/actions";
import { type Blocs, erreursApi, useChamp, validerChamps } from "./blocs";
import { type Etape, type OutilsParcours, Parcours, useParcours } from "./parcours";

type DSinistre = {
  contact?: Record<string, unknown>;
  type?: Record<string, unknown>;
  whenWhere?: Record<string, unknown>;
  circumstances?: Record<string, unknown>;
  damage?: Record<string, unknown>;
  people?: Record<string, unknown>;
  liability?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  parContrat?: boolean;
  envoye?: Claim;
};

const BLOCS = ["contact", "type", "whenWhere", "circumstances", "damage", "people", "liability", "documents"] as const;
const PHASES = ["Vous", "Le sinistre", "Les dégâts", "Envoi"];

const TYPES = [
  { value: "accident", label: "Accident", sous: "Collision, sortie de route" },
  { value: "vol", label: "Vol", sous: "Du véhicule ou d’éléments" },
  { value: "vandalisme", label: "Vandalisme" },
  { value: "bris_de_glace", label: "Bris de glace", sous: "Pare-brise, vitres, optiques" },
  { value: "incendie", label: "Incendie" },
  { value: "evenement_climatique", label: "Événement climatique", sous: "Inondation, grêle, chute d’arbre" },
  { value: "panne", label: "Panne", sous: "Besoin d’une dépanneuse" },
];

const SITUATIONS = [
  { value: "en_circulation", label: "Il roulait" },
  { value: "stationnement_voie_publique", label: "Garé dans la rue" },
  { value: "parking_garage", label: "Dans un parking ou un garage" },
  { value: "ne_sais_pas", label: "Je ne sais pas" },
];

/** Identifiants du schéma illustré → zones du contrat. */
const ZONES: Record<string, string> = {
  "av-g": "avant_gauche",
  av: "avant",
  "av-d": "avant_droit",
  g: "cote_gauche",
  toit: "toit",
  d: "cote_droit",
  "ar-g": "arriere_gauche",
  ar: "arriere",
  "ar-d": "arriere_droit",
};

const bloc = (d: DSinistre, nom: (typeof BLOCS)[number]) => d[nom] ?? {};
const dejaSaisis = (d: DSinistre): Blocs => Object.fromEntries(BLOCS.filter((b) => d[b]).map((b) => [b, d[b] as Record<string, unknown>]));

export function ParcoursSinistre() {
  const [panne, setPanne] = useState(false);
  const [tentative, setTentative] = useState(0);

  const etapes = useMemo<Etape<DSinistre>[]>(() => {
    const sauver = async (o: OutilsParcours<DSinistre>, nom: (typeof BLOCS)[number], valeurs?: Record<string, unknown>) => {
      const r = await enregistrerBloc("sinistre", nom, valeurs ?? bloc(o.d, nom), dejaSaisis(o.d));
      if (r.ok) return true;
      if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") setPanne(true);
      else o.setErreurs({ ...erreursApi(nom, r.champs), ...(r.champs ? {} : { [`${nom}._`]: r.message }) });
      return false;
    };
    const avecTel = (v: Record<string, unknown>) => {
      const t = telNational(String(v.phone ?? ""));
      return { ...v, phone: t ? `+243${t}` : "" };
    };
    const lieu = (d: DSinistre) => ({ province: "kinshasa", ...bloc(d, "whenWhere") });

    return [
      {
        id: "securite",
        phase: 0,
        titre: "Tout le monde va bien ?",
        sousTitre: "Votre sécurité passe avant la déclaration.",
        contenu: () => <EcranSecurite />,
        valider: (d): Record<string, string> => (typeof bloc(d, "people").injured === "boolean" ? {} : { "people.injured": "Répondez à cette question." }),
        avant: (d, o) => sauver(o, "people", { injured: bloc(d, "people").injured }),
        sansPrix: true,
      },
      {
        id: "contact",
        phase: 0,
        titre: "Vos coordonnées",
        sousTitre: "Pour retrouver votre contrat et vous rappeler.",
        contenu: () => <EcranContact />,
        valider: (d) => validerChamps(AutoClaimStepContact, "contact", avecTel(bloc(d, "contact")), ["lastName", "firstName", "phone", "plate", "policyNumber"]),
        avant: (d, o) => sauver(o, "contact", avecTel(bloc(d, "contact"))),
      },
      {
        id: "type",
        phase: 1,
        titre: "Que s’est-il passé ?",
        contenu: () => <EcranType />,
        valider: (d): Record<string, string> => (bloc(d, "type").type ? {} : { "type.type": "Choisissez le type de sinistre." }),
        avant: (_, o) => sauver(o, "type"),
      },
      {
        id: "quand",
        phase: 1,
        titre: "Quand et où ?",
        sousTitre: "Même en retard, votre déclaration est toujours acceptée.",
        contenu: () => <EcranQuand />,
        valider: (d) => validerChamps(AutoClaimStepWhenWhere, "whenWhere", lieu(d), ["date", "time", "province", "commune"]),
        avant: (d, o) => sauver(o, "whenWhere", lieu(d)),
      },
      {
        id: "circonstances",
        phase: 1,
        titre: "Racontez-nous en quelques mots",
        contenu: () => <EcranCirconstances />,
        valider: (d) => validerChamps(AutoClaimStepCircumstances, "circumstances", { vehicleSituation: "en_circulation", ...bloc(d, "circumstances") }, ["vehicleSituation", "description"]),
        avant: (d, o) => sauver(o, "circumstances", { vehicleSituation: "en_circulation", ...bloc(d, "circumstances") }),
      },
      {
        id: "degats",
        phase: 2,
        titre: "Où est touché le véhicule ?",
        sousTitre: "Touchez les zones abîmées. Facultatif.",
        contenu: () => <EcranDegats />,
        avant: (_, o) => sauver(o, "damage"),
      },
      {
        id: "tiers",
        phase: 2,
        titre: "Un autre véhicule est-il en cause ?",
        contenu: () => <EcranTiers />,
        valider: (d): Record<string, string> => {
          const l = bloc(d, "liability");
          if (typeof l.thirdPartyInvolved !== "boolean") return { "liability.thirdPartyInvolved": "Répondez à cette question." };
          const t = (l.thirdParty as Record<string, unknown> | null) ?? null;
          if (l.thirdPartyInvolved && !String(t?.lastName ?? "").trim()) return { "liability.thirdParty.lastName": "Indiquez au moins le nom de l’autre conducteur." };
          return {};
        },
        avant: async (d, o) => {
          const l = bloc(d, "liability");
          const valeurs = { ...l, thirdParty: l.thirdPartyInvolved ? (l.thirdParty ?? null) : null };
          return (await sauver(o, "liability", valeurs)) && sauver(o, "documents", {});
        },
      },
      {
        id: "recap",
        phase: 3,
        titre: "Vérifiez et envoyez",
        contenu: () => <EcranRecap />,
        cta: "Envoyer ma déclaration",
        avant: async (_, o) => {
          const r = await envoyerDeclaration();
          if (!r.ok) {
            if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") setPanne(true);
            else o.setErreurs({ "recap._": r.message });
            return false;
          }
          o.maj({ envoye: r.data });
          return true;
        },
      },
      {
        id: "envoye",
        phase: 3,
        titre: "Déclaration envoyée",
        pied: "aucun",
        contenu: () => <EcranEnvoye />,
      },
    ];
  }, []);

  if (panne)
    return (
      <ErreurTechnique
        reessayer={() => {
          setPanne(false);
          setTentative((t) => t + 1);
        }}
      />
    );

  return <Parcours<DSinistre> key={tentative} id="sinistre-auto-v2" nom="Déclaration de sinistre auto" phases={PHASES} etapes={etapes} initial={{}} mode="sinistre" dureeAnnoncee="4 minutes" />;
}

/* ---------- Écrans ---------- */

function EcranSecurite() {
  const [blesse, setBlesse, e] = useChamp<boolean | undefined>("people", "injured");
  return (
    <>
      <CartesChoix
        legende="Y a-t-il des blessés ?"
        legendeCachee
        cle="people.injured"
        valeur={blesse === undefined ? undefined : blesse ? "oui" : "non"}
        onChange={(v) => setBlesse(v === "oui")}
        erreur={e}
        options={[
          { value: "non", label: "Oui, personne n’est blessé" },
          { value: "oui", label: "Non, il y a des blessés" },
        ]}
      />
      <div className={`rounded-carte p-4 ${blesse ? "bg-rouge-teinte" : "border border-filet bg-carte"}`}>
        <p className={`mb-3 font-bold ${blesse ? "text-rouge-texte" : ""}`}>Blessés ou danger immédiat</p>
        <a href="tel:112" className={classesBouton("urgence", true)}>
          <Phone className="size-5" aria-hidden="true" /> Appeler le 112
        </a>
        <p className="mt-3 text-[15px] text-texte-2">
          Dépannage et assistance 24 h/24 : <a className="lien" href={`tel:${SONAS.telSinistre.replace(/\s/g, "")}`}>{SONAS.telSinistre}</a>
        </p>
      </div>
    </>
  );
}

function EcranContact() {
  const { d, maj } = useParcours<DSinistre>();
  const [nom, setNom, eNom] = useChamp<string>("contact", "lastName", "");
  const [prenom, setPrenom, ePrenom] = useChamp<string>("contact", "firstName", "");
  const [tel, setTel, eTel] = useChamp<string>("contact", "phone", "");
  const [plaque, setPlaque, ePlaque] = useChamp<string | null>("contact", "plate", "");
  const [contrat, setContrat, eContrat] = useChamp<string | null>("contact", "policyNumber", "");
  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <ChampTexte label="Prénom" cle="contact.firstName" autoComplete="given-name" valeur={prenom ?? ""} onChange={setPrenom} erreur={ePrenom} />
        <ChampTexte label="Nom" cle="contact.lastName" autoComplete="family-name" valeur={nom ?? ""} onChange={setNom} erreur={eNom} />
      </div>
      <ChampTexte label="Téléphone" type="tel" inputMode="tel" prefixe="+243" cle="contact.phone" valeur={tel ?? ""} onChange={(v) => setTel(telNational(v))} placeholder="81 234 5678" aide="Un gestionnaire vous rappelle sur ce numéro." erreur={eTel ? "Entrez les 9 chiffres après +243." : undefined} />
      {d.parContrat ? (
        <ChampTexte label="Numéro de contrat" cle="contact.policyNumber" valeur={contrat ?? ""} onChange={(v) => { setContrat(v || null); setPlaque(null); }} majuscules placeholder="AUTO-2026-000123" erreur={eContrat} />
      ) : (
        <ChampTexte label="Plaque du véhicule assuré" cle="contact.plate" valeur={plaque ?? ""} onChange={(v) => { setPlaque(v || null); setContrat(null); }} majuscules placeholder="4521AB 01" erreur={ePlaque ? "Format attendu : 4521AB 01." : eContrat} />
      )}
      <Bouton variante="discret" className="-ml-2" onClick={() => maj({ parContrat: !d.parContrat })}>
        {d.parContrat ? "Indiquer plutôt la plaque" : "Indiquer plutôt le numéro de contrat"}
      </Bouton>
    </>
  );
}

function EcranType() {
  const [type, setType, e] = useChamp<string>("type", "type");
  return <CartesChoix legende="Type de sinistre" legendeCachee cle="type.type" valeur={type} onChange={setType} options={TYPES} colonnes={2} erreur={e} />;
}

function EcranQuand() {
  const [date, setDate, eDate] = useChamp<string>("whenWhere", "date", "");
  const [heure, setHeure, eHeure] = useChamp<string>("whenWhere", "time", "");
  const [province, setProvince] = useChamp<string>("whenWhere", "province", "kinshasa");
  const [commune, setCommune, eCommune] = useChamp<string>("whenWhere", "commune", "");
  return (
    <>
      <div className="grid grid-cols-2 gap-x-3">
        <ChampTexte label="Date" type="date" cle="whenWhere.date" valeur={date ?? ""} onChange={setDate} erreur={eDate} />
        <ChampTexte label="Heure" type="text" inputMode="numeric" placeholder="18:30" cle="whenWhere.time" valeur={heure ?? ""} onChange={(v) => setHeure(v.replace(/[^\d:]/g, "").slice(0, 5))} erreur={eHeure ? "Format HH:MM, par exemple 18:30." : undefined} />
      </div>
      <ChampSelect label="Province" valeur={province ?? "kinshasa"} onChange={(v) => { setProvince(v); setCommune(""); }} options={PROVINCES_TRIEES.map((c) => ({ value: c, label: PROVINCES[c].name }))} />
      {(province ?? "kinshasa") === "kinshasa" ? (
        <ChampSelect label="Commune" cle="whenWhere.commune" valeur={commune ?? ""} onChange={setCommune} options={[...KINSHASA_COMMUNES]} erreur={eCommune ? "Choisissez la commune." : undefined} />
      ) : (
        <ChampTexte label="Ville et commune" cle="whenWhere.commune" valeur={commune ?? ""} onChange={setCommune} placeholder={PROVINCES[(province as ProvinceCode) ?? "kinshasa"]?.capital} erreur={eCommune ? "Indiquez le lieu." : undefined} />
      )}
    </>
  );
}

function EcranCirconstances() {
  const [situation, setSituation] = useChamp<string>("circumstances", "vehicleSituation", "en_circulation");
  const [recit, setRecit, e] = useChamp<string>("circumstances", "description", "");
  return (
    <>
      <Segmente legende="Le véhicule…" valeur={situation} onChange={setSituation} options={SITUATIONS.slice(0, 2)} />
      <ZoneTexte label="Ce qui s’est passé" cle="circumstances.description" valeur={recit ?? ""} onChange={setRecit} erreur={e ? "Décrivez en quelques mots (10 caractères au moins)." : undefined} aide="Exemple : « À l’arrêt au feu rouge, un véhicule m’a percuté par l’arrière. »" max={500} />
    </>
  );
}

function ZoneTexte({ label, cle, valeur, onChange, erreur, aide, max }: { label: string; cle: string; valeur: string; onChange: (v: string) => void; erreur?: string; aide?: string; max: number }) {
  const idCompteur = useId();
  return (
    <Champ label={label} cle={cle} erreur={erreur} aide={aide}>
      {({ id, descr, invalide }) => (
        <>
          <textarea
            id={id}
            value={valeur}
            maxLength={max}
            rows={5}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalide || undefined}
            aria-describedby={[descr, idCompteur].filter(Boolean).join(" ")}
            className={`w-full rounded-champ border bg-carte px-3.5 py-3 text-lg outline-none ${invalide ? "border-2 border-rouge-texte" : "border-filet-champ focus:border-2 focus:border-bleu-action"}`}
          />
          <p id={idCompteur} className="mt-1 text-right text-[14px] text-texte-2">
            {valeur.length} / {max}
          </p>
        </>
      )}
    </Champ>
  );
}

function EcranDegats() {
  const [zones, setZones] = useChamp<string[]>("damage", "zones", []);
  const [roule, setRoule] = useChamp<boolean>("damage", "vehicleDrivable", true);
  const inverse = Object.fromEntries(Object.entries(ZONES).map(([k, v]) => [v, k]));
  const selection = (zones ?? []).map((z) => inverse[z] ?? z);
  return (
    <>
      <SchemaChocs
        selection={selection}
        basculer={(id) => {
          const z = ZONES[id] ?? id;
          setZones((zones ?? []).includes(z) ? (zones ?? []).filter((x) => x !== z) : [...(zones ?? []), z]);
        }}
      />
      <div className="mt-5">
        <Segmente legende="Le véhicule peut-il rouler ?" valeur={roule === false ? "non" : "oui"} onChange={(v) => setRoule(v === "oui")} options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} />
      </div>
    </>
  );
}

function EcranTiers() {
  const { d, maj } = useParcours<DSinistre>();
  const l = bloc(d, "liability");
  const t = (l.thirdParty as Record<string, unknown> | null) ?? {};
  const [implique, setImplique, e] = useChamp<boolean | undefined>("liability", "thirdPartyInvolved");
  const { erreurs } = useParcours<DSinistre>();
  const setTiers = (patch: Record<string, unknown>) => maj({ liability: { ...l, thirdParty: { ...t, ...patch } } });
  return (
    <>
      <Segmente legende="Un autre véhicule ou une autre personne ?" cle="liability.thirdPartyInvolved" valeur={implique === undefined ? undefined : implique ? "oui" : "non"} onChange={(v) => setImplique(v === "oui")} erreur={e} options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} />
      {implique && (
        <>
          <ChampTexte label="Nom de l’autre conducteur" cle="liability.thirdParty.lastName" valeur={String(t.lastName ?? "")} onChange={(v) => setTiers({ lastName: v })} erreur={erreurs["liability.thirdParty.lastName"]} />
          <div className="grid gap-x-3 sm:grid-cols-2">
            <ChampTexte label="Sa plaque" facultatif valeur={String(t.plate ?? "")} onChange={(v) => setTiers({ plate: v || null })} majuscules placeholder="7810KC 01" />
            <ChampTexte label="Son assureur" facultatif valeur={String(t.insurerName ?? "")} onChange={(v) => setTiers({ insurerName: v || null })} placeholder="SONAS, Rawsur, Activa…" />
          </div>
        </>
      )}
    </>
  );
}

function EcranRecap() {
  const { d, allerA, erreurs } = useParcours<DSinistre>();
  const c = bloc(d, "contact");
  const w = bloc(d, "whenWhere");
  const type = TYPES.find((x) => x.value === bloc(d, "type").type)?.label;
  const l = bloc(d, "liability");
  return (
    <>
      <dl className="divide-y divide-filet rounded-carte border border-filet bg-carte">
        <Ligne t="Déclarant" v={`${String(c.firstName)} ${String(c.lastName)}`} modifier={() => allerA("contact")} />
        <Ligne t="Sinistre" v={`${type ?? ""}, le ${String(w.date ?? "").split("-").reverse().join("/")} à ${String(w.time ?? "")}`} modifier={() => allerA("type")} />
        <Ligne t="Lieu" v={`${String(w.commune ?? "")}, ${PROVINCES[(w.province as ProvinceCode) ?? "kinshasa"]?.name ?? ""}`} modifier={() => allerA("quand")} />
        <Ligne t="Récit" v={String(bloc(d, "circumstances").description ?? "")} modifier={() => allerA("circonstances")} />
        <Ligne t="Tiers" v={l.thirdPartyInvolved ? String((l.thirdParty as Record<string, unknown>)?.lastName ?? "Oui") : "Aucun"} modifier={() => allerA("tiers")} />
      </dl>
      <Encadre className="mt-5">Photos et documents ne sont jamais obligatoires maintenant : vous pourrez les ajouter depuis le suivi de votre dossier.</Encadre>
      {erreurs["recap._"] && <Encadre ton="urgence" className="mt-3">{erreurs["recap._"]}</Encadre>}
    </>
  );
}

function Ligne({ t, v, modifier }: { t: string; v: string; modifier: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <dt className="w-24 flex-none text-[15px] text-texte-2">{t}</dt>
      <dd className="min-w-0 flex-1">{v}</dd>
      <button type="button" onClick={modifier} className="lien text-[15px]">
        Modifier
      </button>
    </div>
  );
}

function EcranEnvoye() {
  const { d, reinitialiser } = useParcours<DSinistre>();
  const { ouvrir } = useAide();
  const s = d.envoye;
  if (!s) return <Encadre ton="vigilance">Aucune déclaration à afficher.</Encadre>;
  return (
    <>
      <Encadre ton="succes" titre={CLAIM_STATUS_LABELS[s.status]}>
        Votre numéro de sinistre : <strong className="tabular-nums">{s.number}</strong>. Un gestionnaire vous rappelle sous 24 h ouvrées. Un SMS récapitulatif vous a été envoyé.
      </Encadre>
      <section className="mt-5 rounded-carte border border-filet bg-carte p-4">
        <h2 className="text-lg">Pièces à préparer</h2>
        <p className="text-[15px] text-texte-2">Vous pourrez les envoyer depuis le suivi. Elles accélèrent votre indemnisation.</p>
        <ul className="mt-3 grid gap-2">
          {s.requiredDocuments.map((doc) => (
            <li key={doc.code} className="flex gap-2.5">
              {doc.status === "received" ? <CircleCheck className="mt-0.5 size-5 flex-none text-succes" aria-hidden="true" /> : <FileText className="mt-0.5 size-5 flex-none text-bleu-action" aria-hidden="true" />}
              <span>
                <span className="font-semibold">{doc.label}</span>
                {!doc.mandatory && <span className="text-texte-2"> (si vous l’avez)</span>}
                {doc.hint && <span className="block text-[15px] text-texte-2">{doc.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <Link href={`/suivi/${s.id}`} className={classesBouton("principal", true)}>
          Suivre mon dossier
        </Link>
        <Bouton variante="secondaire" bloc onClick={() => ouvrir("rappel")}>
          Être rappelé maintenant
        </Bouton>
      </div>
      <p className="mt-5 text-center">
        <button type="button" className="lien" onClick={reinitialiser}>
          Déclarer un autre sinistre
        </button>
      </p>
    </>
  );
}
