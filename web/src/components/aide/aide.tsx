"use client";

import { ChevronLeft, ChevronRight, Clock, MessageCircle, Phone, Truck, X, CircleHelp, Send } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Bouton, classesBouton } from "@/components/ui/bouton";
import { ChampTexte, Segmente } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/encadre";
import { SONAS } from "@/lib/referentiels";
import { telAffiche, telNational } from "@/lib/format";
import { demanderRappel } from "@/server/actions";

export type QuestionAide = { q: string; r: string };
export type ContexteAide = { lieu: string; mode: "souscription" | "sinistre" | "general"; faq?: QuestionAide[] };

type Ctx = { ouvrir: (vue?: Vue) => void; definirContexte: (c: ContexteAide | null) => void };
type Vue = "menu" | "rappel" | "chat" | { faq: number };

const AideCtx = createContext<Ctx | null>(null);

export function useAide() {
  const c = useContext(AideCtx);
  if (!c) throw new Error("useAide hors AideProvider");
  return c;
}

const FAQ_GENERALE: QuestionAide[] = [
  { q: "L'assurance auto est-elle obligatoire ?", r: "Oui. La responsabilité civile automobile est obligatoire pour faire circuler un véhicule en RDC (Code des assurances, art. 108). Sans elle, vous risquez une amende et l'immobilisation du véhicule." },
  { q: "Comment payer ?", r: "Par M-Pesa, Orange Money, Airtel Money, Afrimoney, carte bancaire ou en agence. Votre couverture démarre dès que le paiement est confirmé." },
  { q: "Quand reçois-je mon attestation ?", r: "Un certificat provisoire est disponible tout de suite après le paiement, avec un QR code vérifiable. Le certificat définitif suit sous 10 jours." },
];

export function AideProvider({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const [vue, setVue] = useState<Vue>("menu");
  const [contexte, setContexte] = useState<ContexteAide | null>(null);

  const ouvrir = useCallback((v: Vue = "menu") => {
    setVue(v);
    setOuvert(true);
  }, []);
  const definirContexte = useCallback((c: ContexteAide | null) => setContexte(c), []);

  return (
    <AideCtx.Provider value={{ ouvrir, definirContexte }}>
      {children}
      {ouvert && <FeuilleAide vue={vue} setVue={setVue} contexte={contexte} fermer={() => setOuvert(false)} />}
    </AideCtx.Provider>
  );
}

export function BoutonAide() {
  const { ouvrir } = useAide();
  return (
    <button
      type="button"
      onClick={() => ouvrir()}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-bouton border border-filet bg-carte px-3.5 font-semibold text-bleu-action hover:bg-bleu-teinte"
    >
      <CircleHelp className="size-[18px]" aria-hidden="true" />
      Aide
    </button>
  );
}

function FeuilleAide({ vue, setVue, contexte, fermer }: { vue: Vue; setVue: (v: Vue) => void; contexte: ContexteAide | null; fermer: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const sinistre = contexte?.mode === "sinistre";
  const faq = contexte?.faq?.length ? contexte.faq : FAQ_GENERALE;

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      precedent?.focus();
    };
  }, [fermer]);

  const titre =
    vue === "rappel" ? "Être rappelé gratuitement" : vue === "chat" ? (sinistre ? "Un gestionnaire sinistre" : "Discuter avec un conseiller") : typeof vue === "object" ? faq[vue.faq]?.q : "Besoin d'aide ?";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end" role="presentation">
      <button type="button" aria-label="Fermer l'aide" className="absolute inset-0 bg-encre/40" onClick={fermer} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-aide"
        tabIndex={-1}
        className="anim-feuille relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-carte outline-none md:max-h-none md:w-[440px] md:rounded-none"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="flex items-start gap-2 border-b border-filet px-4 py-3">
          {vue !== "menu" && (
            <button type="button" onClick={() => setVue("menu")} aria-label="Retour" className="-ml-1 flex size-11 items-center justify-center rounded-full hover:bg-fond">
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1 py-1.5">
            <h2 id="titre-aide" className="text-xl">
              {titre}
            </h2>
            {vue === "menu" && contexte?.lieu && <p className="text-[15px] text-texte-2">{contexte.lieu}</p>}
          </div>
          <button type="button" onClick={fermer} aria-label="Fermer" className="flex size-11 items-center justify-center rounded-full hover:bg-fond">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {vue === "menu" && (
            <>
              {sinistre && (
                <div className="mb-4 rounded-carte bg-rouge-teinte p-3.5">
                  <p className="mb-2.5 font-bold text-rouge-texte">Blessés ou danger immédiat</p>
                  <a href="tel:112" className={classesBouton("urgence", true)}>
                    Appeler le 112
                  </a>
                </div>
              )}
              <ul className="grid gap-2.5">
                {sinistre && (
                  <LigneAide href="tel:+243816415515" icone={<Truck className="size-5" />} titre="Assistance 24 h/24" sous={`Dépannage, remorquage : ${SONAS.telSinistre}`} />
                )}
                <LigneAide
                  onClick={() => setVue("chat")}
                  icone={<MessageCircle className="size-5" />}
                  titre={sinistre ? "Un gestionnaire sinistre" : "Discuter avec un conseiller"}
                  sous={sinistre ? "Réponse en moins de 5 min" : "Réponse en moins de 2 min"}
                  badge="En ligne"
                />
                <LigneAide onClick={() => setVue("rappel")} icone={<Clock className="size-5" />} titre="Être rappelé gratuitement" sous="Choisissez votre créneau" />
                {!sinistre && <LigneAide href="tel:+243840393642" icone={<Phone className="size-5" />} titre={`Appeler le ${SONAS.telInfo}`} sous="Lun–sam, 7 h 30–16 h, prix d'un appel local" />}
              </ul>
              <h3 className="mb-2 mt-6 text-base">{contexte ? "Sur cette étape" : "Questions fréquentes"}</h3>
              <ul className="divide-y divide-filet rounded-carte border border-filet">
                {faq.map((f, i) => (
                  <li key={f.q}>
                    <button type="button" onClick={() => setVue({ faq: i })} className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-fond">
                      <span>{f.q}</span>
                      <ChevronRight className="size-4 flex-none text-texte-2" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {contexte && <p className="mt-4 text-[15px] text-succes">✓ Votre progression est enregistrée.</p>}
            </>
          )}
          {typeof vue === "object" && <p className="text-[17px] leading-relaxed">{faq[vue.faq]?.r}</p>}
          {vue === "rappel" && <FormRappel sujet={contexte?.lieu ?? "Question générale"} />}
          {vue === "chat" && <ChatDemo sinistre={sinistre} />}
        </div>
      </div>
    </div>
  );
}

function LigneAide({ icone, titre, sous, badge, onClick, href }: { icone: ReactNode; titre: string; sous: string; badge?: string; onClick?: () => void; href?: string }) {
  const contenu = (
    <>
      <span className="flex size-10 flex-none items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action">{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{titre}</span>
        <span className="block text-[15px] leading-snug text-texte-2">{sous}</span>
      </span>
      {badge ? (
        <span className="rounded-full bg-succes-teinte px-2 py-0.5 text-[13px] font-bold text-succes">{badge}</span>
      ) : (
        <ChevronRight className="size-4 flex-none text-texte-2" aria-hidden="true" />
      )}
    </>
  );
  const cls = "flex min-h-16 w-full items-center gap-3 rounded-carte border border-filet px-3 py-2.5 text-left hover:border-bleu-action";
  return <li>{href ? <a href={href} className={cls}>{contenu}</a> : <button type="button" onClick={onClick} className={cls}>{contenu}</button>}</li>;
}

function FormRappel({ sujet }: { sujet: string }) {
  const [tel, setTel] = useState("");
  const [quand, setQuand] = useState("asap");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);
  if (envoye)
    return (
      <Encadre ton="succes" titre="Demande de rappel enregistrée">
        Un conseiller vous appelle au {telAffiche(tel)} {quand === "asap" ? "dans les 15 minutes environ" : quand === "aprem" ? "aujourd'hui entre 14 h et 16 h" : "demain entre 9 h et 11 h"}. Votre dossier lui est transmis : inutile de tout répéter.
      </Encadre>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (telNational(tel).length !== 9) return setErreur("Entrez les 9 chiffres après +243, par exemple 81 234 5678.");
        setOccupe(true);
        const creneau = { asap: "asap", aprem: "today_14_16", demain: "tomorrow_9_11" }[quand] ?? "asap";
        const r = await demanderRappel({ telephone: `+243${telNational(tel)}`, creneau, sujet });
        setOccupe(false);
        if (!r.ok) return setErreur("La demande n’a pas pu être envoyée. Appelez-nous directement au " + SONAS.telInfo + ".");
        setEnvoye(true);
      }}
      noValidate
    >
      <p className="mb-4 text-texte-2">Un conseiller vous appelle au créneau choisi.</p>
      <ChampTexte label="Numéro de téléphone" type="tel" inputMode="tel" autoComplete="tel" prefixe="+243" placeholder="81 234 5678" valeur={tel} onChange={(v) => { setTel(v); setErreur(undefined); }} erreur={erreur} />
      <Segmente legende="Quand ?" valeur={quand} onChange={setQuand} options={[{ value: "asap", label: "Au plus vite" }, { value: "aprem", label: "14 h–16 h" }, { value: "demain", label: "Demain" }]} />
      <p className="mb-1.5 text-base font-semibold">Sujet</p>
      <p className="mb-4 rounded-champ border border-filet bg-fond px-3.5 py-3">{sujet}</p>
      <Encadre className="mb-4">Votre dossier est transmis au conseiller : inutile de tout répéter.</Encadre>
      <Bouton type="submit" bloc chargement={occupe}>
        Demander le rappel
      </Bouton>
    </form>
  );
}

function ChatDemo({ sinistre }: { sinistre: boolean }) {
  const [messages, setMessages] = useState<{ de: "moi" | "sonas"; texte: string }[]>([
    { de: "sonas", texte: sinistre ? "Bonjour, je suis Grâce, gestionnaire sinistre. Tout le monde va bien ?" : "Bonjour, je suis Patrick, conseiller SONAS. Comment puis-je vous aider ?" },
  ]);
  const [saisie, setSaisie] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  useEffect(() => fin.current?.scrollIntoView({ block: "end" }), [messages]);
  return (
    <div className="flex h-full flex-col">
      <Encadre className="mb-3">Démonstration : les réponses sont simulées.</Encadre>
      <div className="flex-1 space-y-2.5" aria-live="polite">
        {messages.map((m, i) => (
          <p key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.de === "moi" ? "ml-auto bg-bleu-action text-white" : "bg-fond"}`}>
            {m.texte}
          </p>
        ))}
        <div ref={fin} />
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!saisie.trim()) return;
          setMessages((m) => [...m, { de: "moi", texte: saisie }]);
          setSaisie("");
          setTimeout(() => setMessages((m) => [...m, { de: "sonas", texte: "Merci, je regarde votre dossier. Je vous réponds dans un instant." }]), 900);
        }}
      >
        <label htmlFor="chat" className="sr-only">Votre message</label>
        <input id="chat" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Votre message…" className="h-12 min-w-0 flex-1 rounded-champ border border-filet-champ px-3.5 outline-none focus:border-2 focus:border-bleu-action" />
        <button type="submit" aria-label="Envoyer" className="flex size-12 flex-none items-center justify-center rounded-bouton bg-bleu-action text-white hover:bg-bleu-survol">
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
}
