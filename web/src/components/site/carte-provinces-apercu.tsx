import { agencyCountByProvince, PROVINCE_CODES } from "@myvign/geo";
import { PROVINCE_MAP_VIEWBOX, PROVINCE_SHAPES } from "@myvign/geo/map";

const COMPTES = agencyCountByProvince();

/** Carte statique (composant serveur) : aucun JavaScript envoyé au navigateur. */
export function CarteProvincesApercu() {
  return (
    <svg viewBox={PROVINCE_MAP_VIEWBOX} className="h-auto w-full" aria-hidden="true">
      {PROVINCE_CODES.map((code) => (
        <path
          key={code}
          d={PROVINCE_SHAPES[code].path}
          className={`stroke-white [stroke-width:1.5] ${(COMPTES[code] ?? 0) > 0 ? "fill-bleu-clair" : "fill-filet"}`}
        />
      ))}
    </svg>
  );
}
