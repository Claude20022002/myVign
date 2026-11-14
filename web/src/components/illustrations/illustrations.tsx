/*
 * Illustrations au trait, dans les couleurs de la charte (neutres + bleu du logo).
 * Elles expliquent quelque chose de concret ; aucune n'est purement décorative.
 */

const TRAIT = "#1B2733";
const DOUX = "#4E5D6C";
const BLEU = "#1790CD";
const TEINTE = "#E8F4FB";
const FOND = "#F5F7F9";

/** Carte rose : où trouver puissance fiscale, places, date de mise en circulation. */
export function CarteRose({ surligne = "cv" }: { surligne?: "cv" | "places" | "date" | "titulaire" }) {
  const zones = {
    titulaire: { y: 52, label: "Nom du titulaire" },
    date: { y: 84, label: "1re mise en circulation" },
    cv: { y: 116, label: "Puissance fiscale (CV)" },
    places: { y: 148, label: "Nombre de places" },
  } as const;
  return (
    <figure className="m-0">
      <svg viewBox="0 0 320 196" className="h-auto w-full" role="img" aria-labelledby="cr-t">
        <title id="cr-t">Carte rose : la ligne « {zones[surligne].label} » est mise en évidence</title>
        <rect x="6" y="6" width="308" height="184" rx="12" fill="#FDF0F3" stroke={DOUX} strokeWidth="1.5" />
        <text x="22" y="32" fontSize="13" fontWeight="700" fill={TRAIT} fontFamily="inherit">CERTIFICAT D'IMMATRICULATION</text>
        <text x="236" y="32" fontSize="12" fill={DOUX} fontFamily="inherit">RD Congo</text>
        {(Object.keys(zones) as (keyof typeof zones)[]).map((k) => {
          const z = zones[k];
          const actif = k === surligne;
          return (
            <g key={k}>
              {actif && <rect x="14" y={z.y - 15} width="292" height="26" rx="6" fill={TEINTE} stroke={BLEU} strokeWidth="2" />}
              <text x="24" y={z.y + 3} fontSize="12" fill={actif ? TRAIT : DOUX} fontWeight={actif ? 700 : 400} fontFamily="inherit">
                {z.label}
              </text>
              <rect x="190" y={z.y - 6} width={actif ? 96 : 80} height="9" rx="4.5" fill={actif ? BLEU : "#E3C9D0"} />
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1.5 text-[15px] text-texte-2">Ces informations figurent sur votre carte rose.</figcaption>
    </figure>
  );
}

/** Plaque d'immatriculation au format attendu. */
export function PlaqueExemple({ texte = "4521AB 01" }: { texte?: string }) {
  return (
    <svg viewBox="0 0 220 56" className="h-12 w-auto" role="img" aria-label={`Exemple de plaque : ${texte}`}>
      <rect x="1.5" y="1.5" width="217" height="53" rx="7" fill="#fff" stroke={TRAIT} strokeWidth="2" />
      <rect x="1.5" y="1.5" width="34" height="53" rx="7" fill={BLEU} />
      <rect x="20" y="1.5" width="16" height="53" fill={BLEU} />
      <path d="M8 40 L28 14" stroke="#F5C800" strokeWidth="5" />
      <path d="M8 40 L28 14" stroke="#CA0920" strokeWidth="2" />
      <text x="18" y="50" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700" fontFamily="inherit">COD</text>
      <text x="128" y="37" fontSize="24" fontWeight="700" fill={TRAIT} textAnchor="middle" letterSpacing="2" fontFamily="inherit">{texte}</text>
    </svg>
  );
}

/** Zones de choc cliquables (vue de dessus). */
export const ZONES_CHOC = [
  { id: "av-g", label: "Avant gauche", x: 70, y: 18, w: 52, h: 46 },
  { id: "av", label: "Avant", x: 122, y: 10, w: 56, h: 54 },
  { id: "av-d", label: "Avant droit", x: 178, y: 18, w: 52, h: 46 },
  { id: "g", label: "Côté gauche", x: 62, y: 64, w: 60, h: 112 },
  { id: "toit", label: "Toit, vitres", x: 122, y: 64, w: 56, h: 112 },
  { id: "d", label: "Côté droit", x: 178, y: 64, w: 60, h: 112 },
  { id: "ar-g", label: "Arrière gauche", x: 70, y: 176, w: 52, h: 46 },
  { id: "ar", label: "Arrière", x: 122, y: 176, w: 56, h: 54 },
  { id: "ar-d", label: "Arrière droit", x: 178, y: 176, w: 52, h: 46 },
] as const;

export function SchemaChocs({ selection, basculer }: { selection: string[]; basculer: (id: string) => void }) {
  return (
    <div className="rounded-carte border border-filet bg-carte p-3">
      <svg viewBox="0 0 300 240" className="mx-auto h-auto w-full max-w-[340px]" aria-hidden="true">
        <path
          d="M110 16 Q150 2 190 16 L222 40 Q236 60 236 90 L236 160 Q236 192 222 204 L190 228 Q150 240 110 228 L78 204 Q64 192 64 160 L64 90 Q64 60 78 40 Z"
          fill={FOND}
          stroke={TRAIT}
          strokeWidth="2"
        />
        <rect x="100" y="62" width="100" height="40" rx="10" fill="#fff" stroke={DOUX} strokeWidth="1.5" />
        <rect x="104" y="150" width="92" height="34" rx="10" fill="#fff" stroke={DOUX} strokeWidth="1.5" />
        <text x="150" y="8" fontSize="10" textAnchor="middle" fill={DOUX} fontFamily="inherit">AVANT</text>
        {ZONES_CHOC.map((z) =>
          selection.includes(z.id) ? <rect key={z.id} x={z.x + 3} y={z.y + 3} width={z.w - 6} height={z.h - 6} rx="8" fill={BLEU} fillOpacity=".28" stroke={BLEU} strokeWidth="2.5" /> : null,
        )}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Zones touchées">
        {ZONES_CHOC.map((z) => {
          const on = selection.includes(z.id);
          return (
            <button
              key={z.id}
              type="button"
              aria-pressed={on}
              onClick={() => basculer(z.id)}
              className={`min-h-11 rounded-champ border px-1.5 text-[14px] font-semibold leading-tight ${on ? "border-2 border-bleu-action bg-bleu-teinte text-bleu-action" : "border-filet text-encre hover:border-bleu-action"}`}
            >
              {z.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Téléphone affichant la demande de validation mobile money. */
export function TelephoneValidation({ operateur, montant }: { operateur: string; montant: string }) {
  return (
    <svg viewBox="0 0 180 260" className="mx-auto h-56 w-auto" role="img" aria-label={`Votre téléphone affiche une demande ${operateur} de ${montant} à valider avec votre code PIN`}>
      <rect x="30" y="6" width="120" height="248" rx="20" fill="#fff" stroke={TRAIT} strokeWidth="2.5" />
      <rect x="72" y="14" width="36" height="6" rx="3" fill={DOUX} />
      <rect x="40" y="70" width="100" height="112" rx="10" fill={FOND} stroke={DOUX} strokeWidth="1.5" />
      <text x="90" y="92" fontSize="10" fontWeight="700" textAnchor="middle" fill={TRAIT} fontFamily="inherit">{operateur}</text>
      <text x="90" y="110" fontSize="8.5" textAnchor="middle" fill={DOUX} fontFamily="inherit">Payer SONAS SA</text>
      <text x="90" y="124" fontSize="9.5" fontWeight="700" textAnchor="middle" fill={TRAIT} fontFamily="inherit">{montant}</text>
      <rect x="52" y="134" width="76" height="18" rx="4" fill="#fff" stroke={BLEU} strokeWidth="1.5" />
      <text x="90" y="147" fontSize="9" textAnchor="middle" fill={DOUX} fontFamily="inherit">Code PIN : ••••</text>
      <rect x="62" y="158" width="56" height="16" rx="5" fill={BLEU} />
      <text x="90" y="169.5" fontSize="8.5" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="inherit">Valider</text>
      <circle cx="90" cy="232" r="9" fill="none" stroke={DOUX} strokeWidth="1.5" />
    </svg>
  );
}

/* Trois vignettes « Comment ça marche ». */

export function IlluDevis() {
  return (
    <svg viewBox="0 0 120 90" className="h-20 w-auto" aria-hidden="true">
      <rect x="34" y="4" width="52" height="82" rx="9" fill="#fff" stroke={TRAIT} strokeWidth="2" />
      <rect x="42" y="18" width="36" height="6" rx="3" fill={DOUX} opacity=".5" />
      <rect x="42" y="30" width="36" height="10" rx="3" fill={TEINTE} stroke={BLEU} strokeWidth="1.5" />
      <rect x="42" y="45" width="36" height="10" rx="3" fill="#fff" stroke={DOUX} strokeWidth="1.2" />
      <rect x="42" y="66" width="36" height="10" rx="3" fill="#F5C800" />
    </svg>
  );
}

export function IlluPaiement() {
  return (
    <svg viewBox="0 0 120 90" className="h-20 w-auto" aria-hidden="true">
      <rect x="22" y="4" width="46" height="82" rx="9" fill="#fff" stroke={TRAIT} strokeWidth="2" />
      <rect x="30" y="26" width="30" height="30" rx="5" fill={TEINTE} />
      <text x="45" y="45" fontSize="11" fontWeight="700" textAnchor="middle" fill={BLEU} fontFamily="inherit">PIN</text>
      <path d="M74 44 h22 m-7 -7 l7 7 l-7 7" fill="none" stroke={BLEU} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="104" cy="44" r="10" fill={TEINTE} stroke={BLEU} strokeWidth="2" />
      <path d="M99 44 l3.5 3.5 l6.5 -7" fill="none" stroke={BLEU} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IlluAttestation() {
  return (
    <svg viewBox="0 0 120 90" className="h-20 w-auto" aria-hidden="true">
      <rect x="26" y="6" width="68" height="80" rx="6" fill="#fff" stroke={TRAIT} strokeWidth="2" />
      <rect x="36" y="16" width="34" height="5" rx="2.5" fill={TRAIT} />
      <rect x="36" y="27" width="48" height="4" rx="2" fill={DOUX} opacity=".45" />
      <rect x="36" y="35" width="40" height="4" rx="2" fill={DOUX} opacity=".45" />
      <g transform="translate(58 50)">
        <rect width="26" height="26" rx="3" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
        <rect x="4" y="4" width="7" height="7" fill={TRAIT} />
        <rect x="15" y="4" width="7" height="7" fill={TRAIT} />
        <rect x="4" y="15" width="7" height="7" fill={TRAIT} />
        <rect x="15" y="15" width="3" height="3" fill={TRAIT} />
        <rect x="19" y="19" width="3" height="3" fill={TRAIT} />
      </g>
      <circle cx="42" cy="66" r="9" fill={TEINTE} stroke={BLEU} strokeWidth="2" />
      <path d="M38 66 l3 3 l5 -6" fill="none" stroke={BLEU} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mains qui reçoivent un dossier : confirmation d'envoi au gestionnaire. */
export function IlluRappel() {
  return (
    <svg viewBox="0 0 120 100" className="mx-auto h-24 w-auto" aria-hidden="true">
      <circle cx="60" cy="50" r="40" fill={TEINTE} />
      <path
        d="M44 34c0-2 2-4 4-4h6l4 10-5 4c3 6 7 10 13 13l4-5 10 4v6c0 2-2 4-4 4-18 0-32-14-32-32z"
        fill="#fff"
        stroke={BLEU}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
