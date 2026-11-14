"use client";

import { Building2, Clock, CreditCard, RefreshCw, Smartphone, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { CartesChoix, ChampTexte } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/encadre";
import { TelephoneValidation } from "@/components/illustrations/illustrations";
import { fc, telAffiche, telMasque, telNational } from "@/lib/format";
import { OPERATEURS, operateurDepuisTel } from "@/lib/referentiels";

export type Moyen = keyof typeof OPERATEURS | "carte" | "agence";
type Etat = "choix" | "attente" | "refus" | "expire" | "verification" | "carte-3ds" | "agence";

type Props = {
  montant: number;
  libelle: string;
  telDefaut: string;
  onSucces: (moyen: string, telPaiement: string) => void;
  onAgence: (reference: string) => void;
};

export function Paiement({ montant, libelle, telDefaut, onSucces, onAgence }: Props) {
  const suggestion = operateurDepuisTel(telNational(telDefaut));
  const [moyen, setMoyen] = useState<Moyen>(suggestion ?? "mpesa");
  const [tel, setTel] = useState(telNational(telDefaut));
  const [etat, setEtat] = useState<Etat>("choix");
  const [erreur, setErreur] = useState<string>();
  const [carte, setCarte] = useState({ numero: "", exp: "", cvv: "", nom: "" });
  const [erreursCarte, setErreursCarte] = useState<Record<string, string>>({});
  const [code3ds, setCode3ds] = useState("");
  const mobile = moyen !== "carte" && moyen !== "agence";
  const nomMoyen = mobile ? OPERATEURS[moyen].nom : moyen === "carte" ? "Carte bancaire" : "En agence";

  function payer() {
    if (mobile) {
      if (telNational(tel).length !== 9) return setErreur("Entrez les 9 chiffres après +243.");
      setEtat("attente");
    } else if (moyen === "carte") {
      const e: Record<string, string> = {};
      if (carte.numero.replace(/\D/g, "").length < 16) e.numero = "Le numéro de carte comporte 16 chiffres.";
      if (!/^\d{2}\/\d{2}$/.test(carte.exp)) e.exp = "Format MM/AA, par exemple 08/28.";
      if (carte.cvv.length < 3) e.cvv = "Les 3 chiffres au dos de la carte.";
      if (!carte.nom.trim()) e.nom = "Le nom tel qu'il apparaît sur la carte.";
      setErreursCarte(e);
      if (!Object.keys(e).length) setEtat("carte-3ds");
    } else {
      setEtat("agence");
    }
  }

  const recap = (
    <div className="mb-5 flex items-start justify-between gap-3 rounded-carte border border-filet bg-carte p-4">
      <div>
        <p className="font-semibold">{libelle}</p>
        <p className="text-[15px] text-texte-2">Paiement annuel, en une fois</p>
      </div>
      <p className="prix text-right text-2xl">{fc(montant)}</p>
    </div>
  );

  if (etat === "attente") return <Attente operateur={nomMoyen} tel={tel} montant={montant} issue={setEtat} onSucces={() => onSucces(nomMoyen, tel)} />;

  if (etat === "refus" || etat === "expire" || etat === "verification") {
    const contenu = {
      refus: { titre: "Le paiement n'a pas abouti", texte: `${nomMoyen} a refusé le paiement (solde insuffisant ou code incorrect). Aucun montant n'a été débité.`, icone: <TriangleAlert className="size-7" /> },
      expire: { titre: "Demande de paiement expirée", texte: `Vous n'avez pas validé la demande sur votre téléphone (${telMasque(tel)}) dans les 2 minutes. Aucun montant n'a été débité.`, icone: <Clock className="size-7" /> },
      verification: { titre: "Paiement en cours de vérification", texte: `Nous attendons la confirmation de ${nomMoyen}. Ne payez pas une deuxième fois : vous recevrez un SMS dès que c'est validé.`, icone: <RefreshCw className="size-7" /> },
    }[etat];
    return (
      <div className="text-center">
        <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${etat === "refus" ? "bg-rouge-teinte text-rouge-texte" : "bg-bleu-teinte text-bleu-action"}`}>{contenu.icone}</div>
        <h2 className="text-2xl">{contenu.titre}</h2>
        <p className="mx-auto mt-2 max-w-md text-texte-2">{contenu.texte}</p>
        {etat === "verification" && (
          <Encadre className="mx-auto mt-4 max-w-md text-left">Sans confirmation sous 24 h, le montant éventuellement débité vous est remboursé automatiquement.</Encadre>
        )}
        <div className="mx-auto mt-6 grid max-w-md gap-2.5">
          {etat === "verification" ? (
            <Bouton bloc onClick={() => onSucces(nomMoyen, tel)}>Actualiser</Bouton>
          ) : (
            <Bouton bloc onClick={() => setEtat(etat === "expire" ? "attente" : "choix")}>{etat === "expire" ? "Renvoyer la demande" : "Réessayer"}</Bouton>
          )}
          <Bouton bloc variante="secondaire" onClick={() => setEtat("choix")}>Choisir un autre moyen</Bouton>
        </div>
        <p className="mt-4 text-[14px] text-succes">✓ Votre devis et vos réponses sont enregistrés.</p>
      </div>
    );
  }

  if (etat === "carte-3ds")
    return (
      <div>
        {recap}
        <h2 className="text-xl">Confirmation de votre banque</h2>
        <p className="mt-1 text-texte-2">Votre banque vous a envoyé un code par SMS (3-D Secure). En démo, saisissez n'importe quel code à 6 chiffres.</p>
        <div className="mt-4">
          <ChampTexte label="Code reçu par SMS" inputMode="numeric" autoComplete="one-time-code" valeur={code3ds} onChange={(v) => setCode3ds(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
        </div>
        <Bouton bloc disabled={code3ds.length !== 6} onClick={() => onSucces("Carte bancaire", tel)}>
          Confirmer le paiement
        </Bouton>
        <Bouton bloc variante="discret" className="mt-2" onClick={() => setEtat("choix")}>Annuler</Bouton>
      </div>
    );

  if (etat === "agence") {
    const ref = `PA-${String(montant).slice(0, 3)}${Math.floor(1000 + Math.random() * 8999)}`;
    return (
      <div>
        {recap}
        <Encadre ton="vigilance" titre="Votre couverture démarre au paiement">
          Présentez la référence ci-dessous dans n'importe quelle agence SONAS sous 72 h. Votre devis est gardé 30 jours.
        </Encadre>
        <div className="my-5 rounded-carte border-2 border-dashed border-bleu-action bg-bleu-teinte p-5 text-center">
          <p className="text-[15px] text-texte-2">Référence de paiement</p>
          <p className="prix mt-1 text-3xl tracking-wider">{ref}</p>
        </div>
        <Bouton bloc onClick={() => onAgence(ref)}>Recevoir la référence par SMS</Bouton>
        <Bouton bloc variante="discret" className="mt-2" onClick={() => setEtat("choix")}>Choisir un autre moyen</Bouton>
      </div>
    );
  }

  return (
    <div>
      {recap}
      <CartesChoix
        legende="Moyen de paiement"
        valeur={moyen}
        onChange={(v) => setMoyen(v as Moyen)}
        options={[
          ...(Object.keys(OPERATEURS) as (keyof typeof OPERATEURS)[]).map((k) => ({
            value: k,
            label: OPERATEURS[k].nom,
            sous: k === suggestion ? `${OPERATEURS[k].sous}. Suggéré d'après votre numéro.` : OPERATEURS[k].sous,
            icone: <Smartphone className="size-5" aria-hidden="true" />,
          })),
          { value: "carte", label: "Carte bancaire", sous: "Visa ou Mastercard, confirmation 3-D Secure", icone: <CreditCard className="size-5" aria-hidden="true" /> },
          { value: "agence", label: "Payer en agence", sous: "Avec une référence, sous 72 h", icone: <Building2 className="size-5" aria-hidden="true" /> },
        ]}
      />
      {mobile && (
        <ChampTexte
          label={`Numéro ${OPERATEURS[moyen].nom}`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          prefixe="+243"
          valeur={tel}
          onChange={(v) => {
            setTel(telNational(v));
            setErreur(undefined);
          }}
          aide="Une demande de paiement arrivera sur ce numéro : validez-la avec votre code PIN."
          erreur={erreur}
        />
      )}
      {moyen === "carte" && (
        <div>
          <ChampTexte label="Numéro de carte" inputMode="numeric" autoComplete="cc-number" valeur={carte.numero} onChange={(v) => setCarte({ ...carte, numero: v.replace(/[^\d ]/g, "").slice(0, 19) })} placeholder="4970 1234 5678 9012" erreur={erreursCarte.numero} />
          <div className="grid grid-cols-2 gap-3">
            <ChampTexte label="Expiration" inputMode="numeric" autoComplete="cc-exp" valeur={carte.exp} onChange={(v) => setCarte({ ...carte, exp: v.replace(/[^\d/]/g, "").slice(0, 5) })} placeholder="08/28" erreur={erreursCarte.exp} />
            <ChampTexte label="Cryptogramme" inputMode="numeric" autoComplete="cc-csc" valeur={carte.cvv} onChange={(v) => setCarte({ ...carte, cvv: v.replace(/\D/g, "").slice(0, 3) })} placeholder="123" erreur={erreursCarte.cvv} />
          </div>
          <ChampTexte label="Titulaire de la carte" autoComplete="cc-name" valeur={carte.nom} onChange={(v) => setCarte({ ...carte, nom: v })} erreur={erreursCarte.nom} />
          <Encadre className="mb-5">Saisie sécurisée : vos données de carte ne sont pas conservées.</Encadre>
        </div>
      )}
      <Bouton bloc onClick={payer}>{moyen === "agence" ? "Obtenir ma référence de paiement" : `Payer ${fc(montant)}`}</Bouton>
      <p className="mt-3 text-center text-[14px] text-texte-2">Votre couverture démarre dès la confirmation du paiement.</p>
    </div>
  );
}

function Attente({ operateur, tel, montant, issue, onSucces }: { operateur: string; tel: string; montant: number; issue: (e: Etat) => void; onSucces: () => void }) {
  const [reste, setReste] = useState(120);
  useEffect(() => {
    const t = setInterval(() => setReste((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (reste === 0) issue("expire");
  }, [reste, issue]);
  const mm = `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, "0")}`;
  return (
    <div className="text-center">
      <TelephoneValidation operateur={operateur} montant={fc(montant)} />
      <h2 className="mt-4 text-2xl">Validez le paiement sur votre téléphone</h2>
      <p className="mx-auto mt-2 max-w-md text-texte-2">
        Une demande {operateur} de {fc(montant)} a été envoyée au {telAffiche(tel)}.
      </p>
      <ol className="mx-auto mt-4 max-w-md list-decimal space-y-1 rounded-carte border border-filet bg-carte py-3 pl-9 pr-4 text-left">
        <li>Une fenêtre {operateur} s'ouvre sur votre téléphone.</li>
        <li>Saisissez votre code PIN.</li>
        <li>Revenez ici : la page se met à jour seule.</li>
      </ol>
      <p className="mt-3 text-[15px] text-texte-2" aria-live="polite">
        Demande valable encore <span className="font-bold tabular-nums text-encre">{mm}</span>
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-carte border border-dashed border-filet-champ bg-fond p-4 text-left">
        <p className="text-[15px] font-bold">Démo : simuler la réponse de l'opérateur</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Bouton onClick={onSucces}>Code PIN validé</Bouton>
          <Bouton variante="secondaire" onClick={() => issue("refus")}>Paiement refusé</Bouton>
          <Bouton variante="secondaire" onClick={() => issue("expire")}>Laisser expirer</Bouton>
          <Bouton variante="secondaire" onClick={() => issue("verification")}>Réseau lent</Bouton>
        </div>
      </div>
      <Bouton variante="discret" className="mt-4" onClick={() => issue("choix")}>
        Choisir un autre moyen
      </Bouton>
    </div>
  );
}
