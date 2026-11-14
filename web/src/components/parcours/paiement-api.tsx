"use client";

/*
 * Paiement relié à l'API (le serveur décide de l'issue, comme un vrai agrégateur mobile money).
 * États : choix → attente (demande sur le téléphone) → succès | refus (E3) | expiré (E4) | vérification (E5).
 * La couverture ne démarre qu'au succès confirmé (CA 16) ; en vérification, aucun second paiement.
 */

import { convertMoney, type Currency, type Money, type Payment, type PaymentMethod } from "@myvign/contracts";
import { Building2, Clock, CreditCard, RefreshCw, Smartphone, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TelephoneValidation } from "@/components/illustrations/illustrations";
import { Bouton } from "@/components/ui/bouton";
import { CartesChoix, ChampTexte, Segmente } from "@/components/ui/champs";
import { formaterMontant, useDevise } from "@/components/ui/devise";
import { Encadre } from "@/components/ui/encadre";
import { telAffiche, telNational } from "@/lib/format";
import { operateurDepuisTel } from "@/lib/referentiels";
import { lancerPaiement, suivrePaiement } from "@/server/actions";

const MOYENS: Record<Exclude<PaymentMethod, "card" | "agency">, { nom: string; sous: string }> = {
  mpesa: { nom: "M-Pesa", sous: "Vodacom, validation par code PIN" },
  orange_money: { nom: "Orange Money", sous: "Validation par code PIN" },
  airtel_money: { nom: "Airtel Money", sous: "Validation par code PIN" },
  afrimoney: { nom: "Afrimoney", sous: "Africell, validation par code PIN" },
};

const DEPUIS_PREFIXE = { mpesa: "mpesa", orange: "orange_money", airtel: "airtel_money", afrimoney: "afrimoney" } as const;

type Etat = "choix" | "attente" | "refus" | "expire" | "verification" | "agence";

type Props = {
  montant: Money;
  libelle: string;
  telDefaut: string;
  onSucces: (policyId: string) => void;
  onPanne: () => void;
};

export function PaiementApi({ montant, libelle, telDefaut, onSucces, onPanne }: Props) {
  const { devise, taux } = useDevise();
  const suggestion = operateurDepuisTel(telNational(telDefaut));
  const [moyen, setMoyen] = useState<PaymentMethod>(suggestion ? DEPUIS_PREFIXE[suggestion] : "mpesa");
  const [devisePaiement, setDevisePaiement] = useState<Currency>(devise);
  const [tel, setTel] = useState(telNational(telDefaut));
  const [etat, setEtat] = useState<Etat>("choix");
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);
  const [paiement, setPaiement] = useState<Payment | null>(null);
  const mobile = moyen !== "card" && moyen !== "agency";
  const nomMoyen = mobile ? MOYENS[moyen].nom : moyen === "card" ? "Carte bancaire" : "Paiement en agence";

  const aPayer = taux && devisePaiement !== montant.currency ? convertMoney(montant, devisePaiement, taux.rate) : montant;

  async function payer() {
    if (mobile && telNational(tel).length !== 9) return setErreur("Entrez les 9 chiffres après +243.");
    setOccupe(true);
    const r = await lancerPaiement({ methode: moyen, telephone: `+243${telNational(tel)}`, devise: devisePaiement });
    setOccupe(false);
    if (!r.ok) {
      if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") return onPanne();
      return setErreur(r.message);
    }
    setPaiement(r.data);
    setEtat(moyen === "agency" ? "agence" : "attente");
  }

  const terminer = useCallback(
    (p: Payment) => {
      setPaiement(p);
      if (p.status === "succeeded" && p.policyId) onSucces(p.policyId);
      else if (p.status === "failed") setEtat("refus");
      else if (p.status === "expired") setEtat("expire");
      else if (p.status === "verifying") setEtat("verification");
    },
    [onSucces],
  );

  if (etat === "attente" && paiement) return <Attente paiement={paiement} nomMoyen={nomMoyen} tel={tel} onFin={terminer} onPanne={onPanne} annuler={() => setEtat("choix")} />;

  if (etat === "agence" && paiement)
    return (
      <div>
        <Encadre ton="vigilance" titre="Votre couverture démarre au paiement">
          Présentez cette référence dans n’importe quelle agence SONAS sous 72 h. Votre devis est gardé 30 jours.
        </Encadre>
        <div className="my-5 rounded-carte border-2 border-dashed border-bleu-action bg-bleu-teinte p-5 text-center">
          <p className="text-[15px] text-texte-2">Référence de paiement</p>
          <p className="prix mt-1 text-3xl tracking-wider">{paiement.agencyReference}</p>
          <p className="mt-2 text-[15px]">Montant : {formaterMontant(paiement.amount)}</p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-[15px] text-texte-2">
          {paiement.instructions.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <Bouton bloc variante="secondaire" className="mt-5" onClick={() => setEtat("choix")}>
          Choisir un autre moyen
        </Bouton>
      </div>
    );

  if (etat === "refus" || etat === "expire" || etat === "verification") {
    const c = {
      refus: { titre: "Le paiement n’a pas abouti", texte: `${nomMoyen} a refusé le paiement (solde insuffisant ou code incorrect). Aucun montant n’a été débité.`, icone: <TriangleAlert className="size-7" /> },
      expire: { titre: "Demande de paiement expirée", texte: "La demande n’a pas été validée sur votre téléphone dans les 2 minutes. Aucun montant n’a été débité.", icone: <Clock className="size-7" /> },
      verification: { titre: "Paiement en cours de vérification", texte: `Nous attendons la confirmation de ${nomMoyen}. Ne payez pas une deuxième fois : vous recevrez un SMS dès que c’est validé.`, icone: <RefreshCw className="size-7" /> },
    }[etat];
    return (
      <div className="text-center">
        <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${etat === "refus" ? "bg-rouge-teinte text-rouge-texte" : "bg-bleu-teinte text-bleu-action"}`}>{c.icone}</div>
        <h2 className="text-2xl">{c.titre}</h2>
        <p className="mx-auto mt-2 max-w-md text-texte-2">{c.texte}</p>
        {etat === "verification" ? (
          <Encadre className="mx-auto mt-4 max-w-md text-left">Aucune couverture tant que le paiement n’est pas confirmé. Sans confirmation sous 24 h, le montant éventuellement débité est remboursé.</Encadre>
        ) : (
          <div className="mx-auto mt-6 grid max-w-md gap-2.5">
            <Bouton bloc onClick={() => setEtat("choix")}>
              Réessayer
            </Bouton>
          </div>
        )}
        <p className="mt-4 text-[14px] text-succes">✓ Votre devis et vos réponses sont enregistrés.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3 rounded-carte border border-filet bg-carte p-4">
        <div>
          <p className="font-semibold">{libelle}</p>
          <p className="text-[15px] text-texte-2">Paiement annuel, en une fois</p>
        </div>
        <p className="prix text-right text-2xl">{formaterMontant(aPayer)}</p>
      </div>
      <Segmente
        legende="Payer en"
        valeur={devisePaiement}
        onChange={(v) => setDevisePaiement(v as Currency)}
        options={[
          { value: "CDF", label: "Francs congolais (FC)" },
          { value: "USD", label: "Dollars ($)" },
        ]}
        aide={taux ? `Taux du jour : 1 $ = ${new Intl.NumberFormat("fr-FR").format(taux.rate)} FC. Il est figé au moment du paiement.` : undefined}
      />
      <CartesChoix
        legende="Moyen de paiement"
        valeur={moyen}
        onChange={(v) => {
          setMoyen(v as PaymentMethod);
          setErreur(undefined);
        }}
        options={[
          ...(Object.keys(MOYENS) as (keyof typeof MOYENS)[]).map((k) => ({
            value: k,
            label: MOYENS[k].nom,
            sous: suggestion && DEPUIS_PREFIXE[suggestion] === k ? `${MOYENS[k].sous}. Suggéré d’après votre numéro.` : MOYENS[k].sous,
            icone: <Smartphone className="size-5" aria-hidden="true" />,
          })),
          { value: "card", label: "Carte bancaire", sous: "Visa ou Mastercard, confirmation 3-D Secure", icone: <CreditCard className="size-5" aria-hidden="true" /> },
          { value: "agency", label: "Payer en agence", sous: "Avec une référence, sous 72 h", icone: <Building2 className="size-5" aria-hidden="true" /> },
        ]}
      />
      {mobile && (
        <ChampTexte
          label={`Numéro ${MOYENS[moyen].nom}`}
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
      {!mobile && erreur && <Encadre ton="urgence" className="mb-4">{erreur}</Encadre>}
      <Bouton bloc chargement={occupe} onClick={payer}>
        {moyen === "agency" ? "Obtenir ma référence de paiement" : `Payer ${formaterMontant(aPayer)}`}
      </Bouton>
      <p className="mt-3 text-center text-[14px] text-texte-2">Votre couverture démarre dès la confirmation du paiement.</p>
      <details className="mt-5 rounded-carte border border-dashed border-filet-champ bg-fond p-4 text-[15px]">
        <summary className="cursor-pointer font-bold">Démo : simuler les réponses de l’opérateur</summary>
        <p className="mt-2 text-texte-2">Le serveur de démonstration répond selon les 4 derniers chiffres du numéro :</p>
        <ul className="mt-1 list-disc pl-5 text-texte-2">
          <li>…0001 : paiement refusé</li>
          <li>…0002 : demande expirée</li>
          <li>…0003 : réseau lent, paiement en vérification</li>
          <li>tout autre numéro : paiement validé après quelques secondes</li>
        </ul>
      </details>
    </div>
  );
}

function Attente({ paiement, nomMoyen, tel, onFin, onPanne, annuler }: { paiement: Payment; nomMoyen: string; tel: string; onFin: (p: Payment) => void; onPanne: () => void; annuler: () => void }) {
  const fin = new Date(paiement.expiresAt).getTime();
  const [reste, setReste] = useState(() => Math.max(0, Math.round((fin - Date.now()) / 1000)));
  const actif = useRef(true);

  useEffect(() => {
    actif.current = true;
    const minuteur = setInterval(() => setReste(Math.max(0, Math.round((fin - Date.now()) / 1000))), 1000);
    // Interrogation du statut toutes les 2,5 s (le serveur reçoit la confirmation de l'opérateur).
    const sonde = setInterval(async () => {
      const r = await suivrePaiement(paiement.id);
      if (!actif.current) return;
      if (!r.ok) {
        if (r.code === "INTERNAL_ERROR" || r.code === "SERVICE_UNAVAILABLE") onPanne();
        return;
      }
      if (r.data.status !== "pending" && r.data.status !== "initiated") {
        actif.current = false;
        onFin(r.data);
      }
    }, 2500);
    return () => {
      actif.current = false;
      clearInterval(minuteur);
      clearInterval(sonde);
    };
  }, [paiement.id, fin, onFin, onPanne]);

  const carte = paiement.method === "card";
  const mm = `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, "0")}`;
  return (
    <div className="text-center">
      {carte ? null : <TelephoneValidation operateur={nomMoyen} montant={formaterMontant(paiement.amount)} />}
      <h2 className="mt-4 text-2xl">{carte ? "Confirmation par votre banque" : "Validez le paiement sur votre téléphone"}</h2>
      <p className="mx-auto mt-2 max-w-md text-texte-2">
        {carte
          ? "Votre banque vérifie le paiement (3-D Secure). Cette page se met à jour toute seule."
          : `Une demande ${nomMoyen} de ${formaterMontant(paiement.amount)} a été envoyée au ${telAffiche(tel)}.`}
      </p>
      {!carte && (
        <ol className="mx-auto mt-4 max-w-md list-decimal space-y-1 rounded-carte border border-filet bg-carte py-3 pl-9 pr-4 text-left">
          {paiement.instructions.map((i) => (
            <li key={i}>{i}</li>
          ))}
          <li>Revenez ici : la page se met à jour seule.</li>
        </ol>
      )}
      <p className="mt-3 text-[15px] text-texte-2" aria-live="polite">
        Demande valable encore <span className="font-bold tabular-nums text-encre">{mm}</span>
      </p>
      {paiement.exchange && (
        <p className="mt-1 text-[14px] text-texte-2">
          Soit {formaterMontant(paiement.exchange.tariffAmount)} au taux figé de 1 $ = {new Intl.NumberFormat("fr-FR").format(paiement.exchange.rateCdfPerUsd)} FC
        </p>
      )}
      <Bouton variante="discret" className="mt-4" onClick={annuler}>
        Choisir un autre moyen
      </Bouton>
    </div>
  );
}
