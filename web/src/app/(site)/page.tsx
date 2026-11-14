import { AGENCY_SEED, agencyCountByProvince } from "@myvign/geo";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  ClipboardList,
  Flame,
  GraduationCap,
  House,
  MapPin,
  Plane,
  QrCode,
  Ship,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { IlluAttestation, IlluDevis, IlluPaiement } from "@/components/illustrations/illustrations";
import { CarteProvincesApercu } from "@/components/site/carte-provinces-apercu";
import { classesBouton } from "@/components/ui/bouton";
import { BasculeDevise, Prix } from "@/components/ui/devise";
import { PRODUITS } from "@/lib/produits";

const ICONES: Record<string, ReactNode> = {
  auto: <Car className="size-6" />,
  habitation: <House className="size-6" />,
  incendie: <Flame className="size-6" />,
  voyage: <Plane className="size-6" />,
  scolaire: <GraduationCap className="size-6" />,
  transport: <Ship className="size-6" />,
  entreprise: <Building2 className="size-6" />,
};

const NB_PROVINCES = Object.keys(agencyCountByProvince()).length;
const AUTO = PRODUITS[0];

export default function Accueil() {
  return (
    <>
      {/* Accroche : une seule action principale (jaune) */}
      <section className="border-b border-filet bg-carte">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.15fr_1fr] md:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-bleu-teinte px-3 py-1 text-[14px] font-semibold text-bleu-action">
              <ShieldCheck className="size-4" aria-hidden="true" /> Assureur national, agréé ARCA n° 12007
            </p>
            <h1 className="text-[34px] leading-[1.1] sm:text-[44px]">
              Votre assurance auto en 5 minutes, payée en mobile money
            </h1>
            <p className="mt-4 max-w-xl text-lg text-texte-2">
              Votre plaque suffit pour connaître votre prix. Payez avec M-Pesa, Orange Money, Airtel Money ou Afrimoney, et
              recevez votre certificat avec QR code tout de suite.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/souscrire/auto" className={classesBouton("principal", false, "px-7 text-lg")}>
                Obtenir mon tarif <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              {AUTO?.aPartirDe && (
                <p className="text-texte-2">
                  à partir de <Prix montant={AUTO.aPartirDe} className="text-xl text-encre" /> / an
                </p>
              )}
            </div>
            <div className="mt-4">
              <BasculeDevise />
            </div>
            <p className="mt-5 text-[15px] text-texte-2">Sans compte ni connexion. Tarif indicatif de démonstration.</p>
          </div>

          {/* Que souhaitez-vous faire ? (écran P1 de la maquette) */}
          <nav aria-labelledby="titre-actions" className="rounded-carte border border-filet bg-fond p-4 sm:p-5">
            <h2 id="titre-actions" className="text-xl">
              Que souhaitez-vous faire ?
            </h2>
            <ul className="mt-4 grid gap-2.5">
              <Raccourci href="/sinistre" icone={<TriangleAlert className="size-5" />} titre="Déclarer un sinistre" sous="Accident, vol, bris de glace, incendie…" />
              <Raccourci href="/suivi" icone={<ClipboardList className="size-5" />} titre="Suivre un dossier" sous="Avec votre n° de sinistre et votre téléphone" />
              <Raccourci href="/verifier" icone={<QrCode className="size-5" />} titre="Vérifier une attestation" sous="Contrôle routier, achat d’un véhicule" />
              <Raccourci href="/agences" icone={<MapPin className="size-5" />} titre="Trouver une agence" sous={`${AGENCY_SEED.length} agences dans ${NB_PROVINCES} provinces`} />
            </ul>
          </nav>
        </div>
      </section>

      {/* Nos assurances */}
      <section id="assurances" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14" aria-labelledby="titre-assurances">
        <h2 id="titre-assurances" className="text-[28px]">
          Nos assurances
        </h2>
        <p className="mt-1 text-texte-2">L’auto se souscrit en ligne dès aujourd’hui. Les autres branches arrivent.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUITS.map((p) => (
            <li key={p.code} className="flex flex-col rounded-carte border border-filet bg-carte p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-11 items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action" aria-hidden="true">
                  {ICONES[p.code]}
                </span>
                {p.obligatoire && (
                  <span className="rounded-full border border-filet px-2 py-0.5 text-[13px] text-texte-2">Obligatoire</span>
                )}
              </div>
              <h3 className="mt-3 text-lg">{p.nom}</h3>
              <p className="mt-1 flex-1 text-[15px] text-texte-2">{p.accroche}</p>
              {p.mode === "en_ligne" && p.lien ? (
                <Link href={p.lien} className="lien mt-4 inline-flex items-center gap-1">
                  Souscrire en ligne <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <p className="mt-4 text-[15px] text-texte-2">
                  {p.mode === "bientot" ? "Bientôt en ligne · " : "Devis sur rappel · "}
                  <Link href="/agences" className="lien">
                    en agence
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Comment ça marche */}
      <section className="border-y border-filet bg-carte" aria-labelledby="titre-etapes">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="titre-etapes" className="text-[28px]">
            Comment ça marche
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            <Etape n={1} illu={<IlluDevis />} titre="Votre prix en 3 questions" texte="Votre plaque, l’usage du véhicule et votre permis. Le prix s’affiche avant toute question personnelle." />
            <Etape n={2} illu={<IlluPaiement />} titre="Payez sur votre téléphone" texte="Une demande arrive sur votre téléphone : validez-la avec votre code PIN. Ou payez par carte ou en agence." />
            <Etape n={3} illu={<IlluAttestation />} titre="Certificat immédiat" texte="Votre certificat provisoire avec QR code est prêt tout de suite. La police peut le vérifier en le scannant." />
          </ol>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Moyens de paiement acceptés">
            {["M-Pesa", "Orange Money", "Airtel Money", "Afrimoney", "Carte bancaire", "En agence"].map((m) => (
              <li key={m} className="inline-flex items-center gap-1.5 rounded-full border border-filet bg-fond px-3 py-1.5 text-[15px] font-semibold">
                <Smartphone className="size-4 text-bleu-action" aria-hidden="true" /> {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Réseau d'agences */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2" aria-labelledby="titre-reseau">
        <div>
          <h2 id="titre-reseau" className="text-[28px]">
            Une agence près de chez vous
          </h2>
          <p className="mt-3 text-lg text-texte-2">
            {AGENCY_SEED.length} agences dans {NB_PROVINCES} provinces sur 26. Prenez rendez-vous en ligne, ou passez payer votre
            prime au guichet avec votre référence.
          </p>
          <ul className="mt-5 space-y-2 text-[17px]">
            <li className="flex gap-2">
              <BadgeCheck className="mt-1 size-5 flex-none text-bleu-action" aria-hidden="true" /> Plus de 60 ans au service de la RDC
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-1 size-5 flex-none text-bleu-action" aria-hidden="true" /> Certificat vérifiable par QR code
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-1 size-5 flex-none text-bleu-action" aria-hidden="true" /> Suivi de votre sinistre étape par étape
            </li>
          </ul>
          <Link href="/agences" className={classesBouton("secondaire", false, "mt-6")}>
            <MapPin className="size-5" aria-hidden="true" /> Trouver une agence
          </Link>
        </div>
        <Link href="/agences" className="block rounded-carte border border-filet bg-carte p-4" aria-label="Voir la carte des agences">
          <CarteProvincesApercu />
        </Link>
      </section>
    </>
  );
}

function Raccourci({ href, icone, titre, sous }: { href: string; icone: ReactNode; titre: string; sous: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 rounded-carte border border-filet bg-carte px-3.5 py-3 hover:border-bleu-action">
        <span className="flex size-10 flex-none items-center justify-center rounded-bouton bg-bleu-teinte text-bleu-action" aria-hidden="true">
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{titre}</span>
          <span className="block text-[15px] leading-snug text-texte-2">{sous}</span>
        </span>
        <ArrowRight className="size-4 flex-none text-texte-2" aria-hidden="true" />
      </Link>
    </li>
  );
}

function Etape({ n, illu, titre, texte }: { n: number; illu: ReactNode; titre: string; texte: string }) {
  return (
    <li>
      {illu}
      <p className="mt-3 text-[15px] font-bold text-bleu-action">Étape {n}</p>
      <h3 className="text-xl">{titre}</h3>
      <p className="mt-1 text-texte-2">{texte}</p>
    </li>
  );
}
