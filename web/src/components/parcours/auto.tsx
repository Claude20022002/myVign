"use client";

/*
 * Souscription auto, PRIX D'ABORD (demande de l'utilisateur + contrat @myvign/contracts 1.4) :
 * Véhicule (plaque → pré-remplissage) → Usage → Conducteur → TARIF → Coordonnées → Validation → Paiement.
 * Chaque bloc est validé avec le schéma du contrat puis enregistré côté serveur (brouillon 60 jours).
 */

import {
  AutoStepDeclaration,
  AutoStepDriver,
  AutoStepFormula,
  AutoStepHolder,
  AutoStepUsage,
  AutoStepVehicle,
  type Certificate,
  ChassisNumber,
  type Money,
  type Policy,
  PlateCD,
  type QuoteOffer,
} from "@myvign/contracts";
import { KINSHASA_COMMUNES, PROVINCES, type ProvinceCode } from "@myvign/geo";
import { PROVINCE_SHAPES } from "@myvign/geo/map";
import { Car, Check, MapPin, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { PlaqueExemple } from "@/components/illustrations/illustrations";
import { CarteProvinces, PROVINCES_TRIEES } from "@/components/site/carte-provinces";
import { ErreurTechnique } from "@/components/site/erreur-technique";
import { Bouton } from "@/components/ui/bouton";
import { CaseACocher, CartesChoix, ChampSelect, ChampTexte, Interrupteur, Segmente } from "@/components/ui/champs";
import { BasculeDevise, formaterMontant, Prix } from "@/components/ui/devise";
import { Encadre } from "@/components/ui/encadre";
import { telAffiche, telNational } from "@/lib/format";
import { PROFESSIONS } from "@/lib/referentiels";
import { calculerDevis, enregistrerBloc, obtenirContrat, rechercherVehicule } from "@/server/actions";
import { type Blocs, erreursApi, majBloc, useChamp, validerChamps } from "./blocs";
import { ConfirmationApi } from "./certificat";
import { PaiementApi } from "./paiement-api";
import { type Etape, type OutilsParcours, Parcours, useParcours } from "./parcours";

type DAuto = {
  vehicle?: Record<string, unknown>;
  usage?: Record<string, unknown>;
  driver?: Record<string, unknown>;
  formula?: Record<string, unknown>;
  holder?: Record<string, unknown>;
  declaration?: Record<string, unknown>;
  // État d'interface (non envoyé)
  sansPlaque?: boolean;
  vehiculeTrouve?: "oui" | "non";
  modifierVehicule?: boolean;
  offres?: QuoteOffer[];
  estimation?: Money | null;
  resultat?: { contrat: Policy; certificat: Certificate };
};

const BLOCS = ["vehicle", "usage", "driver", "formula", "holder", "declaration"] as const;
const PHASES = ["Véhicule", "Conducteur", "Tarif", "Coordonnées", "Paiement"];

const CATEGORIES = [
  { value: "particulier", label: "Voiture particulière" },
  { value: "4x4_suv_pickup", label: "4×4, SUV ou pick-up" },
  { value: "utilitaire_leger", label: "Utilitaire léger" },
  { value: "minibus", label: "Minibus ou bus" },
  { value: "camion", label: "Camion" },
  { value: "moto", label: "Moto ou tricycle" },
  { value: "autre", label: "Autre" },
];

const USAGES = [
  { value: "prive", label: "Privé", sous: "Loisirs, famille" },
  { value: "domicile_travail", label: "Privé et trajet travail", sous: "Le plus courant" },
  { value: "professionnel", label: "Professionnel", sous: "Déplacements pour le travail" },
  { value: "taxi", label: "Taxi" },
  { value: "moto_taxi", label: "Moto-taxi" },
  { value: "transport_public", label: "Transport public", sous: "Bus, taxi-bus" },
  { value: "location", label: "Location de véhicule" },
];

const STATIONNEMENTS = [
  { value: "voie_publique", label: "Dans la rue" },
  { value: "cour_parcelle", label: "Dans la cour de la parcelle" },
  { value: "parking_ferme", label: "Parking fermé" },
  { value: "garage_ferme", label: "Garage fermé" },
];

const GARANTIES: Record<string, string[]> = {
  tiers: ["Responsabilité civile (obligatoire)", "Défense et recours"],
  tiers_etendu: ["Responsabilité civile", "Défense et recours", "Vol et incendie", "Bris de glace"],
  tous_risques: ["Responsabilité civile", "Vol et incendie", "Bris de glace", "Dommages tous accidents", "Assistance 24 h/24"],
};

/** Données de démonstration proposées sous le champ plaque. */
const PLAQUES_DEMO = [
  { plaque: "4521AB 01", note: "Peugeot 208 (trouvée)" },
  { plaque: "0000AA00", note: "introuvable (cas E2)" },
];

const bloc = (d: DAuto, nom: (typeof BLOCS)[number]) => d[nom] ?? {};
const dejaSaisis = (d: DAuto): Blocs => Object.fromEntries(BLOCS.filter((b) => d[b]).map((b) => [b, d[b] as Record<string, unknown>]));

export function ParcoursAuto() {
  const [panne, setPanne] = useState(false);
  const [tentative, setTentative] = useState(0);

  const etapes = useMemo<Etape<DAuto>[]>(() => {
    /** Enregistre un bloc ; renvoie false (on reste sur l'écran) en cas d'erreur. */
    const sauver = async (o: OutilsParcours<DAuto>, nom: (typeof BLOCS)[number], valeurs?: Record<string, unknown>) => {
      const r = await enregistrerBloc("souscription", nom, valeurs ?? bloc(o.d, nom), dejaSaisis(o.d));
      if (r.ok) {
        if (r.data.estimate) o.maj({ estimation: r.data.estimate.annual });
        return true;
      }
      if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") setPanne(true);
      else o.setErreurs({ ...erreursApi(nom, r.champs), ...(r.champs ? {} : { [`${nom}._`]: r.message }) });
      return false;
    };

    return [
      {
        id: "plaque",
        phase: 0,
        titre: (d) => (d.sansPlaque ? "Quel est le numéro de châssis ?" : "Quelle est la plaque de votre véhicule ?"),
        sousTitre: (d) => (d.sansPlaque ? "Il figure sur la facture ou le certificat de dédouanement." : "On retrouve votre véhicule pour vous."),
        contenu: () => <EcranPlaque />,
        valider: (d): Record<string, string> => {
          const v = bloc(d, "vehicle");
          const r = d.sansPlaque ? ChassisNumber.safeParse(v.chassisNumber ?? "") : PlateCD.safeParse(v.plate ?? "");
          if (r.success) return {};
          return d.sansPlaque
            ? { "vehicle.chassisNumber": "Entre 6 et 20 lettres ou chiffres, sans espace." }
            : { "vehicle.plate": "Format attendu : 4 chiffres, 2 lettres, 2 chiffres (ex. 4521AB 01)." };
        },
        avant: async (d, o) => {
          if (d.sansPlaque) {
            o.maj({ vehiculeTrouve: "non", vehicle: { ...bloc(d, "vehicle"), plate: null } });
            return true;
          }
          const r = await rechercherVehicule(String(bloc(d, "vehicle").plate ?? ""));
          if (r.ok) {
            const v = r.data;
            majBloc(d, o.maj, "vehicle", {
              plate: v.plate,
              chassisNumber: null,
              make: v.make,
              model: v.model,
              energy: v.energy ?? "essence",
              category: v.category,
              fiscalHorsepower: v.fiscalHorsepower ?? undefined,
              seats: v.seats ?? undefined,
              manufactureYear: v.manufactureYear ?? undefined,
            });
            o.maj({ vehiculeTrouve: "oui", modifierVehicule: false });
            return true;
          }
          if (r.code === "VEHICLE_NOT_FOUND") {
            o.maj({ vehiculeTrouve: "non" });
            return true;
          }
          if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") {
            setPanne(true);
            return false;
          }
          o.setErreurs({ "vehicle.plate": r.champs?.plate ?? r.message });
          return false;
        },
        faq: [
          { q: "Où trouver ma plaque ?", r: "Sur la carte rose (certificat d’immatriculation) ou à l’arrière du véhicule. Saisissez-la sans vous soucier des espaces." },
          { q: "Mon véhicule est neuf, sans plaque", r: "Indiquez le numéro de châssis : il figure sur la facture d’achat ou le certificat de dédouanement." },
        ],
      },
      {
        id: "vehicule",
        phase: 0,
        titre: (d) => (d.vehiculeTrouve === "oui" && !d.modifierVehicule ? "Est-ce bien votre véhicule ?" : "Décrivez votre véhicule"),
        sousTitre: (d) =>
          d.vehiculeTrouve === "oui" ? "Vérifiez les informations retrouvées." : "Nous ne l’avons pas retrouvé : ces informations figurent sur la carte rose.",
        contenu: () => <EcranVehicule />,
        valider: (d) =>
          validerChamps(AutoStepVehicle, "vehicle", bloc(d, "vehicle"), ["category", "make", "model", "energy", "fiscalHorsepower", "seats", "manufactureYear"]),
        avant: (_, o) => sauver(o, "vehicle"),
        cta: (d) => (d.vehiculeTrouve === "oui" && !d.modifierVehicule ? "Oui, c’est mon véhicule" : "Continuer"),
      },
      {
        id: "usage",
        phase: 0,
        titre: "Comment utilisez-vous ce véhicule ?",
        contenu: () => <EcranUsage />,
        valider: (d) => validerChamps(AutoStepUsage, "usage", bloc(d, "usage"), ["usage", "nightParking"]),
        avant: (_, o) => sauver(o, "usage"),
      },
      {
        id: "conducteur",
        phase: 1,
        titre: "Parlons du conducteur principal",
        sousTitre: "Ces trois réponses suffisent pour calculer votre prix.",
        contenu: () => <EcranConducteur />,
        valider: (d) => {
          const v: Record<string, unknown> = { claimsLast36Months: "0", licenseSuspended: false, ...bloc(d, "driver") };
          const e = validerChamps(AutoStepDriver, "driver", v, ["birthDate", "licenseDate", "claimsLast36Months"]);
          if (!e["driver.birthDate"] && v.birthDate && ageEnAnnees(String(v.birthDate)) < 18) e["driver.birthDate"] = "Le conducteur principal doit avoir 18 ans au moins.";
          return e;
        },
        avant: async (d, o) => {
          const valeurs = { claimsLast36Months: "0", licenseSuspended: false, ...bloc(d, "driver") };
          o.maj({ driver: valeurs });
          if (!(await sauver(o, "driver", valeurs))) return false;
          const devis = await calculerDevis();
          if (!devis.ok) {
            if (devis.code === "INTERNAL_ERROR" || devis.code === "SERVICE_UNAVAILABLE") setPanne(true);
            else o.setErreurs({ "driver._": devis.message });
            return false;
          }
          const recommandee = devis.data.offers.find((x) => x.recommended) ?? devis.data.offers[0];
          o.maj({
            offres: devis.data.offers,
            formula: { formulaCode: recommandee?.formulaCode, ...bloc(d, "formula") },
          });
          return true;
        },
        cta: "Voir mon tarif",
      },
      {
        id: "tarif",
        phase: 2,
        titre: "Votre tarif",
        sousTitre: "Choisissez votre formule. Vous pourrez l’ajuster plus tard.",
        contenu: () => <EcranTarif />,
        valider: (d) => {
          const f = bloc(d, "formula");
          const e = validerChamps(AutoStepFormula, "formula", f, ["formulaCode"]);
          const valeur = bloc(d, "vehicle").marketValue as Money | null | undefined;
          if (f.formulaCode && f.formulaCode !== "tiers" && !(valeur && valeur.amount > 0)) {
            e["vehicle.marketValue"] = "Indiquez la valeur actuelle du véhicule, en dollars.";
          }
          return e;
        },
        avant: async (d, o) => {
          if (!(await sauver(o, "formula"))) return false;
          return sauver(o, "vehicle");
        },
        cta: "Choisir cette formule",
      },
      {
        id: "identite",
        phase: 3,
        titre: "Qui souscrit le contrat ?",
        sousTitre: "Ces informations figureront sur votre certificat.",
        contenu: () => <EcranIdentite />,
        valider: (d) => validerChamps(AutoStepHolder, "holder", avecTelephone(bloc(d, "holder")), ["firstName", "lastName", "phone", "profession"]),
      },
      {
        id: "adresse",
        phase: 3,
        titre: "Où habitez-vous ?",
        contenu: () => <EcranAdresse />,
        valider: (d) => validerChamps(AutoStepHolder, "holder", avecTelephone(adresseParDefaut(bloc(d, "holder"))), ["address"]),
        avant: async (d, o) => {
          const valeurs = avecTelephone(adresseParDefaut(bloc(d, "holder")));
          return sauver(o, "holder", valeurs);
        },
      },
      {
        id: "validation",
        phase: 4,
        titre: "Vérifiez et validez",
        contenu: () => <EcranValidation />,
        valider: (d) => validerChamps(AutoStepDeclaration, "declaration", bloc(d, "declaration"), ["certifiesAccuracyAndTerms", "consentsToDataProcessing"]),
        avant: (_, o) => sauver(o, "declaration"),
        cta: "Passer au paiement",
      },
      {
        id: "paiement",
        phase: 4,
        titre: "Paiement",
        pied: "aucun",
        sansPrix: true,
        contenu: () => <EcranPaiement onPanne={() => setPanne(true)} />,
      },
      {
        id: "confirmation",
        phase: 4,
        titre: "Vous êtes assuré",
        pied: "aucun",
        sansPrix: true,
        contenu: () => <EcranConfirmation />,
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

  return (
    <Parcours<DAuto>
      key={tentative}
      id="auto-v2"
      nom="Assurance auto"
      phases={PHASES}
      etapes={etapes}
      initial={{}}
      mode="souscription"
      dureeAnnoncee="5 minutes"
      rendrePrix={(d) => {
        const choisie = d.offres?.find((o) => o.formulaCode === bloc(d, "formula").formulaCode);
        const montant = choisie?.annualPremium ?? d.estimation;
        return montant ? <Prix montant={montant} /> : null;
      }}
    />
  );
}

/* ---------- Utilitaires ---------- */

function ageEnAnnees(iso: string): number {
  const n = new Date(iso);
  const a = new Date();
  return a.getFullYear() - n.getFullYear() - (a < new Date(a.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
}

/** Le champ téléphone saisit 9 chiffres ; le contrat attend +243XXXXXXXXX. */
function avecTelephone(h: Record<string, unknown>) {
  const tel = telNational(String(h.phone ?? ""));
  return { ...h, phone: tel ? `+243${tel}` : "" };
}

function adresseParDefaut(h: Record<string, unknown>) {
  const a = (h.address as Record<string, unknown> | undefined) ?? {};
  return { ...h, address: { province: "kinshasa", ...a } };
}

/* ---------- Écrans ---------- */

function EcranPlaque() {
  const { d, maj } = useParcours<DAuto>();
  const [plaque, setPlaque, erreurPlaque] = useChamp<string>("vehicle", "plate", "");
  const [chassis, setChassis, erreurChassis] = useChamp<string>("vehicle", "chassisNumber", "");
  if (d.sansPlaque)
    return (
      <>
        <ChampTexte label="Numéro de châssis (VIN)" cle="vehicle.chassisNumber" valeur={chassis ?? ""} onChange={setChassis} majuscules erreur={erreurChassis} placeholder="VF3CC8HP0KW123456" />
        <Bouton variante="discret" className="-ml-2" onClick={() => maj({ sansPlaque: false })}>
          J’ai une plaque d’immatriculation
        </Bouton>
      </>
    );
  return (
    <>
      <div className="mb-4">
        <PlaqueExemple />
      </div>
      <ChampTexte label="Immatriculation" cle="vehicle.plate" valeur={plaque ?? ""} onChange={setPlaque} majuscules placeholder="4521AB 01" erreur={erreurPlaque} />
      <Bouton variante="discret" className="-ml-2" onClick={() => maj({ sansPlaque: true })}>
        Mon véhicule n’a pas encore de plaque
      </Bouton>
      <div className="mt-6 rounded-carte border border-dashed border-filet-champ bg-fond p-3.5 text-[15px]">
        <p className="font-bold">Démo : plaques d’essai</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLAQUES_DEMO.map((p) => (
            <button key={p.plaque} type="button" onClick={() => setPlaque(p.plaque)} className="rounded-full border border-filet bg-carte px-3 py-1.5 hover:border-bleu-action">
              <span className="font-bold tracking-wide">{p.plaque}</span> <span className="text-texte-2">· {p.note}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function EcranVehicule() {
  const { d, maj } = useParcours<DAuto>();
  const v = bloc(d, "vehicle");
  const [categorie, setCategorie, eCat] = useChamp<string>("vehicle", "category", "particulier");
  const [marque, setMarque, eMarque] = useChamp<string>("vehicle", "make", "");
  const [modele, setModele, eModele] = useChamp<string>("vehicle", "model", "");
  const [energie, setEnergie, eEnergie] = useChamp<string>("vehicle", "energy");
  const [cv, setCv, eCv] = useChamp<number | undefined>("vehicle", "fiscalHorsepower");
  const [places, setPlaces, ePlaces] = useChamp<number | undefined>("vehicle", "seats");
  const [annee, setAnnee, eAnnee] = useChamp<number | undefined>("vehicle", "manufactureYear");
  const nombre = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/\D/g, "")));

  if (d.vehiculeTrouve === "oui" && !d.modifierVehicule)
    return (
      <div className="rounded-carte border border-filet bg-carte p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action">
            <Car className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-titre text-xl font-semibold">
              {String(v.make)} {String(v.model)}
            </p>
            <p className="text-[15px] text-texte-2">Plaque {String(v.plate)}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-4">
          <Info t="Catégorie" v={CATEGORIES.find((c) => c.value === v.category)?.label ?? "—"} />
          <Info t="Énergie" v={String(v.energy ?? "—")} />
          <Info t="Puissance" v={v.fiscalHorsepower ? `${v.fiscalHorsepower} CV` : "—"} />
          <Info t="Places · année" v={`${v.seats ?? "—"} · ${v.manufactureYear ?? "—"}`} />
        </dl>
        <Bouton variante="discret" className="-ml-2 mt-3" onClick={() => maj({ modifierVehicule: true })}>
          <Pencil className="size-4" aria-hidden="true" /> Corriger ces informations
        </Bouton>
      </div>
    );

  return (
    <>
      <ChampSelect label="Type de véhicule" cle="vehicle.category" valeur={categorie ?? ""} onChange={setCategorie} options={CATEGORIES} erreur={eCat} />
      <div className="grid gap-x-3 sm:grid-cols-2">
        <ChampTexte label="Marque" cle="vehicle.make" valeur={marque ?? ""} onChange={setMarque} placeholder="Toyota" erreur={eMarque} />
        <ChampTexte label="Modèle" cle="vehicle.model" valeur={modele ?? ""} onChange={setModele} placeholder="Corolla" erreur={eModele} />
      </div>
      <Segmente
        legende="Énergie"
        cle="vehicle.energy"
        valeur={energie}
        onChange={setEnergie}
        erreur={eEnergie}
        options={[
          { value: "essence", label: "Essence" },
          { value: "diesel", label: "Diesel" },
          { value: "hybride", label: "Hybride" },
          { value: "electrique", label: "Électrique" },
        ]}
      />
      <div className="grid grid-cols-3 gap-x-3">
        <ChampTexte label="Puissance" suffixe="CV" inputMode="numeric" cle="vehicle.fiscalHorsepower" valeur={cv?.toString() ?? ""} onChange={(s) => setCv(nombre(s))} erreur={eCv} />
        <ChampTexte label="Places" inputMode="numeric" cle="vehicle.seats" valeur={places?.toString() ?? ""} onChange={(s) => setPlaces(nombre(s))} erreur={ePlaces} />
        <ChampTexte label="Année" inputMode="numeric" cle="vehicle.manufactureYear" valeur={annee?.toString() ?? ""} onChange={(s) => setAnnee(nombre(s))} placeholder="2018" erreur={eAnnee} />
      </div>
    </>
  );
}

function Info({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <dt className="text-texte-2">{t}</dt>
      <dd className="font-semibold capitalize">{v}</dd>
    </div>
  );
}

function EcranUsage() {
  const [usage, setUsage, eUsage] = useChamp<string>("usage", "usage");
  const [parking, setParking, eParking] = useChamp<string>("usage", "nightParking");
  return (
    <>
      <CartesChoix legende="Usage du véhicule" legendeCachee cle="usage.usage" valeur={usage} onChange={setUsage} options={USAGES} colonnes={2} erreur={eUsage} />
      <CartesChoix legende="Où dort-il la nuit ?" cle="usage.nightParking" valeur={parking} onChange={setParking} options={STATIONNEMENTS} colonnes={2} erreur={eParking} />
    </>
  );
}

function EcranConducteur() {
  const { erreurs } = useParcours<DAuto>();
  const [naissance, setNaissance, eNaissance] = useChamp<string>("driver", "birthDate", "");
  const [permis, setPermis, ePermis] = useChamp<string>("driver", "licenseDate", "");
  const [sinistres, setSinistres] = useChamp<string>("driver", "claimsLast36Months", "0");
  const [suspendu, setSuspendu] = useChamp<boolean>("driver", "licenseSuspended", false);
  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <ChampTexte label="Date de naissance" type="date" cle="driver.birthDate" valeur={naissance ?? ""} onChange={setNaissance} erreur={eNaissance} />
        <ChampTexte label="Date d’obtention du permis" type="date" cle="driver.licenseDate" valeur={permis ?? ""} onChange={setPermis} erreur={ePermis} />
      </div>
      <Segmente
        legende="Sinistres sur les 3 dernières années"
        valeur={sinistres}
        onChange={setSinistres}
        options={[
          { value: "0", label: "Aucun" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3+", label: "3 ou plus" },
        ]}
      />
      <Interrupteur actif={Boolean(suspendu)} onChange={setSuspendu} titre="Permis suspendu ou annulé ces 3 dernières années" />
      {erreurs["driver._"] && <Encadre ton="urgence">{erreurs["driver._"]}</Encadre>}
    </>
  );
}

function EcranTarif() {
  const { d } = useParcours<DAuto>();
  const [formule, setFormule, eFormule] = useChamp<string>("formula", "formulaCode");
  const [valeur, setValeur, eValeur] = useChamp<Money | null>("vehicle", "marketValue", null);
  const [options, setOptions] = useChamp<{ occupantCover?: boolean; yellowCard?: boolean }>("formula", "options", {});
  const offres = d.offres ?? [];
  return (
    <>
      <div className="mb-4">
        <BasculeDevise />
      </div>
      <fieldset className="mb-5" data-champ="formula.formulaCode">
        <legend className="sr-only">Formule</legend>
        <div className="grid gap-3">
          {offres.map((o) => {
            const choisie = formule === o.formulaCode;
            return (
              <label
                key={o.formulaCode}
                className={`relative block cursor-pointer rounded-carte border p-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-bleu-action ${
                  choisie ? "border-2 border-bleu-action p-[15px]" : "border-filet hover:border-bleu-action"
                } ${o.recommended ? "bg-jaune-teinte" : "bg-carte"}`}
              >
                <input type="radio" name="formule" className="sr-only" checked={choisie} onChange={() => setFormule(o.formulaCode)} />
                {o.recommended && <span className="mb-2 inline-block rounded-full bg-carte px-2.5 py-0.5 text-[13px] font-bold text-vigilance">Recommandée</span>}
                <span className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className={`size-5 flex-none rounded-full border-[1.5px] ${choisie ? "border-[6px] border-bleu-action" : "border-filet-champ bg-carte"}`} />
                    <span className="font-titre text-xl font-semibold">{o.formulaName}</span>
                  </span>
                  <span className="text-right">
                    <Prix montant={o.annualPremium} className="block text-[22px]" />
                    <span className="text-[14px] text-texte-2">par an</span>
                  </span>
                </span>
                <ul className="mt-3 grid gap-1 text-[15px] sm:grid-cols-2">
                  {(GARANTIES[o.formulaCode] ?? []).map((g) => (
                    <li key={g} className="flex gap-1.5">
                      <Check className="mt-0.5 size-4 flex-none text-bleu-action" aria-hidden="true" /> {g}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
        {eFormule && <p className="mt-2 text-rouge-texte">{eFormule}</p>}
      </fieldset>
      {formule && formule !== "tiers" && (
        <ChampTexte
          label="Valeur actuelle du véhicule"
          cle="vehicle.marketValue"
          inputMode="numeric"
          suffixe="$"
          valeur={valeur ? String(valeur.amount / 100) : ""}
          onChange={(s) => {
            const dollars = Number(s.replace(/\D/g, ""));
            setValeur(dollars > 0 ? { amount: dollars * 100, currency: "USD" } : null);
          }}
          aide="Sert à vous indemniser en cas de vol ou de destruction. Une estimation suffit."
          erreur={eValeur}
        />
      )}
      <details className="rounded-carte border border-filet bg-carte p-4">
        <summary className="cursor-pointer font-semibold">Personnaliser (options)</summary>
        <div className="mt-3">
          <Interrupteur actif={Boolean(options?.occupantCover)} onChange={(v) => setOptions({ ...options, occupantCover: v })} titre="Individuelle occupant" sous="Vos passagers indemnisés en cas de blessure" />
          <Interrupteur actif={Boolean(options?.yellowCard)} onChange={(v) => setOptions({ ...options, yellowCard: v })} titre="Carte jaune (SADC, COMESA)" sous="Pour rouler dans les pays voisins" />
        </div>
      </details>
      <p className="mt-4 text-[14px] text-texte-2">Tarif indicatif de démonstration, en attente du barème SONAS.</p>
    </>
  );
}

function EcranIdentite() {
  const [prenom, setPrenom, ePrenom] = useChamp<string>("holder", "firstName", "");
  const [nom, setNom, eNom] = useChamp<string>("holder", "lastName", "");
  const [tel, setTel, eTel] = useChamp<string>("holder", "phone", "");
  const [profession, setProfession, eProfession] = useChamp<string>("holder", "profession", "");
  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <ChampTexte label="Prénom" cle="holder.firstName" autoComplete="given-name" valeur={prenom ?? ""} onChange={setPrenom} erreur={ePrenom} />
        <ChampTexte label="Nom" cle="holder.lastName" autoComplete="family-name" valeur={nom ?? ""} onChange={setNom} erreur={eNom} />
      </div>
      <ChampTexte
        label="Téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        prefixe="+243"
        cle="holder.phone"
        valeur={tel ?? ""}
        onChange={(v) => setTel(telNational(v))}
        placeholder="81 234 5678"
        aide="Pour le paiement et l’envoi de votre certificat par SMS."
        erreur={eTel ? "Entrez les 9 chiffres après +243." : undefined}
      />
      <ChampSelect label="Profession" cle="holder.profession" valeur={profession ?? ""} onChange={setProfession} options={PROFESSIONS} aide="Elle figure obligatoirement sur le certificat." erreur={eProfession} />
    </>
  );
}

function EcranAdresse() {
  const { d, maj } = useParcours<DAuto>();
  const holder = bloc(d, "holder");
  const adresse: Record<string, unknown> = { province: "kinshasa", ...((holder.address as Record<string, unknown>) ?? {}) };
  const [carte, setCarte] = useState(false);
  const [repere, setRepere] = useState(Boolean(adresse.landmark));
  const { erreurs } = useParcours<DAuto>();
  const set = (patch: Record<string, unknown>) => maj({ holder: { ...holder, address: { ...adresse, ...patch } } });
  const province = adresse.province as ProvinceCode;
  const kin = province === "kinshasa";

  async function localiser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      // Approximation : la province dont la capitale est la plus proche.
      const { latitude, longitude } = p.coords;
      const plusProche = PROVINCES_TRIEES.map((code) => ({ code, d: Math.hypot(latitude - CENTRES[code][0], longitude - CENTRES[code][1]) })).sort((a, b) => a.d - b.d)[0];
      if (plusProche) set({ province: plusProche.code, commune: "" });
    });
  }

  return (
    <>
      <ChampSelect
        label="Province"
        cle="holder.address.province"
        valeur={province}
        onChange={(v) => set({ province: v, commune: "" })}
        options={PROVINCES_TRIEES.map((c) => ({ value: c, label: PROVINCES[c].name }))}
        erreur={erreurs["holder.address.province"]}
      />
      <div className="-mt-2 mb-4 flex flex-wrap gap-x-4">
        <Bouton variante="discret" className="-ml-2" onClick={() => setCarte((c) => !c)}>
          {carte ? "Masquer la carte" : "Choisir sur la carte"}
        </Bouton>
        <Bouton variante="discret" onClick={localiser}>
          <MapPin className="size-4" aria-hidden="true" /> Utiliser ma position
        </Bouton>
      </div>
      {carte && (
        <div className="mb-5">
          <CarteProvinces selection={province} choisir={(c) => set({ province: c, commune: "" })} legende="Choisissez votre province sur la carte" />
        </div>
      )}
      {kin ? (
        <ChampSelect label="Commune" cle="holder.address.commune" valeur={String(adresse.commune ?? "")} onChange={(v) => set({ commune: v })} options={[...KINSHASA_COMMUNES]} erreur={erreurs["holder.address.commune"] ? "Choisissez votre commune." : undefined} />
      ) : (
        <ChampTexte label="Ville et commune" cle="holder.address.commune" valeur={String(adresse.commune ?? "")} onChange={(v) => set({ commune: v })} placeholder={`Ex. ${PROVINCES[province]?.capital ?? ""}`} erreur={erreurs["holder.address.commune"] ? "Indiquez votre commune." : undefined} />
      )}
      <ChampTexte label="Avenue et numéro" cle="holder.address.street" valeur={String(adresse.street ?? "")} onChange={(v) => set({ street: v })} placeholder="24, avenue Colonel Mondjiba" erreur={erreurs["holder.address.street"] ? "Indiquez l’avenue et le numéro." : undefined} />
      {repere ? (
        <ChampTexte label="Point de repère" facultatif valeur={String(adresse.landmark ?? "")} onChange={(v) => set({ landmark: v || null })} placeholder="En face de la paroisse Saint-Joseph" />
      ) : (
        <Bouton variante="discret" className="-ml-2" onClick={() => setRepere(true)}>
          Ajouter un point de repère
        </Bouton>
      )}
    </>
  );
}

/** Centre géographique approximatif d'une province [latitude, longitude]. */
const CENTRES = Object.fromEntries(PROVINCES_TRIEES.map((c) => [c, PROVINCE_SHAPES[c].center])) as Record<ProvinceCode, readonly [number, number]>;

function EcranValidation() {
  const { d, allerA, erreurs } = useParcours<DAuto>();
  const [exact, setExact] = useChamp<boolean>("declaration", "certifiesAccuracyAndTerms", false);
  const [donnees, setDonnees] = useChamp<boolean>("declaration", "consentsToDataProcessing", false);
  const v = bloc(d, "vehicle");
  const u = bloc(d, "usage");
  const c = bloc(d, "driver");
  const h = bloc(d, "holder");
  const a = (h.address as Record<string, unknown>) ?? {};
  const offre = d.offres?.find((o) => o.formulaCode === bloc(d, "formula").formulaCode);
  return (
    <>
      <div className="grid gap-3">
        <Recap titre="Véhicule" modifier={() => allerA("vehicule")}>
          {String(v.make)} {String(v.model)} · {v.plate ? `plaque ${String(v.plate)}` : `châssis ${String(v.chassisNumber)}`}
          <br />
          {USAGES.find((x) => x.value === u.usage)?.label} · {STATIONNEMENTS.find((x) => x.value === u.nightParking)?.label.toLowerCase()}
        </Recap>
        <Recap titre="Conducteur" modifier={() => allerA("conducteur")}>
          Né(e) le {String(c.birthDate).split("-").reverse().join("/")} · permis depuis {String(c.licenseDate).slice(0, 4)} ·{" "}
          {c.claimsLast36Months === "0" ? "aucun sinistre" : `${String(c.claimsLast36Months)} sinistre(s)`}
        </Recap>
        <Recap titre="Formule" modifier={() => allerA("tarif")}>
          {offre?.formulaName} · {offre ? <Prix montant={offre.annualPremium} /> : null} par an
        </Recap>
        <Recap titre="Souscripteur" modifier={() => allerA("identite")}>
          {String(h.firstName)} {String(h.lastName)}, {String(h.profession).toLowerCase()} · {telAffiche(String(h.phone ?? ""))}
          <br />
          {String(a.street ?? "")}, {String(a.commune ?? "")}, {PROVINCES[(a.province as ProvinceCode) ?? "kinshasa"]?.name}
        </Recap>
      </div>
      <Encadre ton="vigilance" className="my-5" titre="Répondez exactement">
        Une fausse déclaration intentionnelle rend le contrat nul (Code des assurances, art. 14). La couverture démarre à la confirmation du paiement.
      </Encadre>
      <CaseACocher coche={Boolean(exact)} onChange={setExact} cle="declaration.certifiesAccuracyAndTerms" erreur={erreurs["declaration.certifiesAccuracyAndTerms"] ? "Cochez cette case pour continuer." : undefined}>
        Je certifie l’exactitude de mes réponses et j’accepte les{" "}
        <a className="lien" href="/mentions-legales#conditions" target="_blank" rel="noreferrer">
          conditions générales
        </a>
        .
      </CaseACocher>
      <CaseACocher coche={Boolean(donnees)} onChange={setDonnees} cle="declaration.consentsToDataProcessing" erreur={erreurs["declaration.consentsToDataProcessing"] ? "Votre accord est nécessaire pour traiter votre dossier." : undefined}>
        J’accepte que la SONAS traite mes données pour gérer mon contrat (
        <a className="lien" href="/donnees-personnelles" target="_blank" rel="noreferrer">
          en savoir plus
        </a>
        ).
      </CaseACocher>
      {erreurs["declaration._"] && <Encadre ton="urgence">{erreurs["declaration._"]}</Encadre>}
    </>
  );
}

function Recap({ titre, modifier, children }: { titre: string; modifier: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-carte border border-filet bg-carte p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg">{titre}</h2>
        <button type="button" onClick={modifier} className="lien inline-flex min-h-11 items-center gap-1 text-[15px]">
          <Pencil className="size-4" aria-hidden="true" /> Modifier
        </button>
      </div>
      <p className="mt-1 text-[15px] text-texte-2">{children}</p>
    </section>
  );
}

function EcranPaiement({ onPanne }: { onPanne: () => void }) {
  const { d, maj, allerA } = useParcours<DAuto>();
  const offre = d.offres?.find((o) => o.formulaCode === bloc(d, "formula").formulaCode);
  const [chargement, setChargement] = useState(false);
  if (!offre) return <Encadre ton="vigilance">Le tarif doit être recalculé : revenez à l’écran « Votre tarif ».</Encadre>;
  if (chargement) return <p className="text-texte-2">Émission de votre certificat…</p>;
  return (
    <PaiementApi
      montant={offre.annualPremium}
      libelle={`Assurance auto · ${offre.formulaName}`}
      telDefaut={String(bloc(d, "holder").phone ?? "")}
      onPanne={onPanne}
      onSucces={async (policyId) => {
        setChargement(true);
        const r = await obtenirContrat(policyId);
        setChargement(false);
        if (!r.ok) return onPanne();
        maj({ resultat: r.data });
        allerA("confirmation");
      }}
    />
  );
}

function EcranConfirmation() {
  const { d, reinitialiser } = useParcours<DAuto>();
  if (!d.resultat) return <Encadre ton="vigilance">Aucun contrat à afficher.</Encadre>;
  return (
    <>
      <ConfirmationApi certificat={d.resultat.certificat} contrat={d.resultat.contrat} telephone={telAffiche(String(bloc(d, "holder").phone ?? ""))} />
      <p className="no-print mt-5 text-center">
        <button type="button" className="lien" onClick={reinitialiser}>
          Assurer un autre véhicule
        </button>
        <span className="mx-2 text-texte-2">·</span>
        <span className="text-[15px] text-texte-2">Prime annuelle : {formaterMontant(d.resultat.contrat.annualPremium)}</span>
      </p>
    </>
  );
}

