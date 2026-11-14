"use client";

/*
 * Localisateur d'agences (gabarit inspiré de agences.macif.fr, en charte SONAS) :
 * liste numérotée + carte synchronisées, zoom sur la province, statut ouvert/fermé à l'heure
 * locale de l'agence, prise de rendez-vous reliée à l'API. Aucun avis inventé.
 */

import type { AppointmentSlotList } from "@myvign/contracts";
import { AGENCY_SEED, type AgencySeed, PROVINCE_CODES, PROVINCES, type ProvinceCode } from "@myvign/geo";
import { PROVINCE_MAP_VIEWBOX, PROVINCE_SHAPES, projeter } from "@myvign/geo/map";
import { CalendarDays, Clock, LocateFixed, MapPin, Navigation, Phone, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/encadre";
import { telNational } from "@/lib/format";
import { creneauxRendezVous, prendreRendezVous } from "@/server/actions";

/* ---------- Données ---------- */

/** Horaires INDICATIFS de la démo (à confirmer par la SONAS). */
export function horaires(a: AgencySeed) {
  return { ouvre: a.isHeadOffice ? "07:30" : "08:00", ferme: "16:00", jours: [1, 2, 3, 4, 5] };
}

export function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[\s-]+/g, " ").trim();
}

export function slugVille(ville: string) {
  return fold(ville).replace(/\s+/g, "-");
}

const distanceKm = (a: readonly [number, number], b: readonly [number, number]) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

/** Statut d'ouverture à l'heure locale de l'agence (la RDC a deux fuseaux). */
function statut(a: AgencySeed, maintenant: Date) {
  const tz = PROVINCES[a.province].timeZone;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(maintenant);
  const jour = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
  const hhmm = `${parts.find((p) => p.type === "hour")?.value}:${parts.find((p) => p.type === "minute")?.value}`;
  const h = horaires(a);
  const ouvert = h.jours.includes(jour) && hhmm >= h.ouvre && hhmm < h.ferme;
  return { ouvert, texte: ouvert ? `Ouvert · ferme à ${h.ferme.replace(":", " h ")}` : "Fermé actuellement" };
}

/** Boîte englobante d'une province dans le repère de la carte (zoom). */
function boite(code: ProvinceCode) {
  const nombres = PROVINCE_SHAPES[code].path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const xs = nombres.filter((_, i) => i % 2 === 0);
  const ys = nombres.filter((_, i) => i % 2 === 1);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const marge = Math.max(x1 - x0, y1 - y0) * 0.12;
  return { x: x0 - marge, y: y0 - marge, l: x1 - x0 + 2 * marge, h: y1 - y0 + 2 * marge };
}

/* ---------- Localisateur ---------- */

export function Localisateur() {
  const [recherche, setRecherche] = useState("");
  const [province, setProvince] = useState<ProvinceCode | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [actif, setActif] = useState<string | null>(null);
  const [carteMobile, setCarteMobile] = useState(false);
  const [rdv, setRdv] = useState<AgencySeed | null>(null);
  const [maintenant, setMaintenant] = useState<Date | null>(null);
  const refs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    setMaintenant(new Date());
    const t = setInterval(() => setMaintenant(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const liste = useMemo(() => {
    const q = fold(recherche);
    let l = AGENCY_SEED.filter((a) => (!province || a.province === province) && (!q || fold(`${a.name} ${a.city} ${a.commune ?? ""} ${a.address ?? ""} ${PROVINCES[a.province].name}`).includes(q)));
    if (position) l = [...l].sort((a, b) => distanceKm(position, a.location) - distanceKm(position, b.location));
    return l;
  }, [recherche, province, position]);

  const localiser = () =>
    navigator.geolocation?.getCurrentPosition((p) => {
      setPosition([p.coords.latitude, p.coords.longitude]);
      setProvince(null);
      setRecherche("");
    });

  const choisirAgence = (slug: string) => {
    setActif(slug);
    refs.current.get(slug)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const lieu = province ? `en ${PROVINCES[province].name}` : position ? "près de vous" : "en RDC";

  return (
    <>
      <div className="rounded-carte border border-filet bg-carte p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-64">
            <span className="sr-only">Ville, commune ou nom d’agence</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-texte-2" aria-hidden="true" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Ville, commune ou nom d’agence"
              className="h-12 w-full rounded-champ border border-filet-champ bg-carte pl-11 pr-3.5 text-lg outline-none focus:border-2 focus:border-bleu-action"
            />
          </label>
          <select
            aria-label="Province"
            value={province ?? ""}
            onChange={(e) => setProvince((e.target.value || null) as ProvinceCode | null)}
            className="h-12 rounded-champ border border-filet-champ bg-carte px-3 text-[17px]"
          >
            <option value="">Toutes les provinces</option>
            {[...PROVINCE_CODES].sort((a, b) => PROVINCES[a].name.localeCompare(PROVINCES[b].name, "fr")).map((c) => (
              <option key={c} value={c}>
                {PROVINCES[c].name}
              </option>
            ))}
          </select>
          <Bouton variante="secondaire" onClick={localiser}>
            <LocateFixed className="size-5" aria-hidden="true" /> Utiliser ma position
          </Bouton>
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-center text-[26px]" aria-live="polite">
        {liste.length} agence{liste.length > 1 ? "s" : ""} SONAS {lieu}
      </h2>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <Bouton variante="secondaire" bloc className="mb-3 lg:hidden" onClick={() => setCarteMobile((v) => !v)}>
            <MapPin className="size-5" aria-hidden="true" /> {carteMobile ? "Masquer la carte" : "Voir sur la carte"}
          </Bouton>
          {carteMobile && (
            <div className="mb-4 lg:hidden">
              <CarteAgences liste={liste} province={province} actif={actif} survoler={setActif} choisirProvince={setProvince} choisirAgence={choisirAgence} />
            </div>
          )}
          {liste.length === 0 ? (
            <Encadre>
              Aucune agence ici. Dans les provinces sans agence, tout se fait en ligne : souscription, paiement mobile money, déclaration de sinistre.
            </Encadre>
          ) : (
            <ol className="grid max-h-[760px] gap-3 overflow-y-auto pr-1 max-lg:max-h-none">
              {liste.map((a, i) => (
                <li
                  key={a.slug}
                  ref={(el) => {
                    if (el) refs.current.set(a.slug, el);
                  }}
                  onMouseEnter={() => setActif(a.slug)}
                  onFocus={() => setActif(a.slug)}
                >
                  <FicheAgence agence={a} numero={i + 1} actif={actif === a.slug} maintenant={maintenant} distance={position ? distanceKm(position, a.location) : null} prendreRdv={() => setRdv(a)} />
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="max-lg:hidden">
          <div className="sticky top-24">
            <CarteAgences liste={liste} province={province} actif={actif} survoler={setActif} choisirProvince={setProvince} choisirAgence={choisirAgence} />
          </div>
        </div>
      </div>
      {rdv && <ModaleRdv agence={rdv} fermer={() => setRdv(null)} />}
    </>
  );
}

/* ---------- Carte : provinces + marqueurs numérotés synchronisés ---------- */

function CarteAgences({
  liste,
  province,
  actif,
  survoler,
  choisirProvince,
  choisirAgence,
}: {
  liste: readonly AgencySeed[];
  province: ProvinceCode | null;
  actif: string | null;
  survoler: (slug: string | null) => void;
  choisirProvince: (p: ProvinceCode) => void;
  choisirAgence: (slug: string) => void;
}) {
  const vue = province ? boite(province) : null;
  const viewBox = vue ? `${vue.x} ${vue.y} ${vue.l} ${vue.h}` : PROVINCE_MAP_VIEWBOX;
  const echelle = vue ? vue.l / 1000 : 1;
  const r = 13 * echelle;
  return (
    <figure className="m-0 rounded-carte border border-filet bg-carte p-2">
      <svg viewBox={viewBox} className="h-auto max-h-[680px] w-full transition-all" role="group" aria-label="Carte des agences">
        {PROVINCE_CODES.map((code) => (
          <path
            key={code}
            d={PROVINCE_SHAPES[code].path}
            onClick={() => choisirProvince(code)}
            className={`cursor-pointer stroke-white ${code === province ? "fill-bleu-teinte" : "fill-fond hover:fill-bleu-teinte"}`}
            style={{ strokeWidth: 1.5 * echelle }}
          >
            <title>{PROVINCES[code].name}</title>
          </path>
        ))}
        {liste.map((a, i) => {
          const [x, y] = projeter(a.location[0], a.location[1]);
          const surligne = a.slug === actif;
          return (
            // biome-ignore lint/a11y/useSemanticElements: marqueur SVG, pas de <button> possible ; la liste reste l'accès principal.
            <g
              key={a.slug}
              role="button"
              tabIndex={0}
              aria-label={`${i + 1}. ${a.name}`}
              onClick={() => choisirAgence(a.slug)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choisirAgence(a.slug)}
              onMouseEnter={() => survoler(a.slug)}
              onMouseLeave={() => survoler(null)}
              className="cursor-pointer outline-none"
            >
              <circle cx={x} cy={y} r={surligne ? r * 1.35 : r} className={surligne ? "fill-bleu-action" : "fill-bleu-nuit"} stroke="#fff" strokeWidth={2 * echelle} />
              <text x={x} y={y} dy="0.35em" textAnchor="middle" fill="#fff" fontSize={(surligne ? 15 : 12) * echelle} fontWeight="700" fontFamily="inherit">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between gap-2 px-1 text-[13px] text-texte-2">
        <span>Position approximative (centre de la commune ou de la ville)</span>
        <span>© contributeurs OpenStreetMap</span>
      </figcaption>
    </figure>
  );
}

/* ---------- Fiche agence ---------- */

export function FicheAgence({
  agence: a,
  numero,
  actif = false,
  maintenant,
  distance,
  prendreRdv,
}: {
  agence: AgencySeed;
  numero?: number;
  actif?: boolean;
  maintenant: Date | null;
  distance?: number | null;
  prendreRdv: () => void;
}) {
  const s = maintenant ? statut(a, maintenant) : null;
  return (
    <article className={`flex gap-3 rounded-carte border bg-carte p-4 transition-colors ${actif ? "border-bleu-action" : "border-filet"}`}>
      {numero !== undefined && (
        <div className="flex w-12 flex-none flex-col items-center">
          <span className={`flex size-9 items-center justify-center rounded-full font-bold text-white ${actif ? "bg-bleu-action" : "bg-bleu-nuit"}`} aria-hidden="true">
            {numero}
          </span>
          {distance != null && <span className="mt-1 text-center text-[13px] text-texte-2">{distance < 10 ? distance.toFixed(1) : Math.round(distance)} km</span>}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-lg uppercase tracking-wide">{a.name}</h3>
        <p className="text-[15px]">{a.address ?? "Adresse communiquée par téléphone"}</p>
        <p className="text-[15px] text-texte-2">
          {[a.commune, a.city].filter((x, i, t) => x && t.indexOf(x) === i).join(", ")} · {PROVINCES[a.province].name}
        </p>
        {s && (
          <p className={`mt-1.5 flex items-center gap-1.5 text-[15px] font-semibold ${s.ouvert ? "text-succes" : "text-rouge-texte"}`}>
            <Clock className="size-4" aria-hidden="true" /> {s.texte}
            <span className="font-normal text-texte-2">(horaires indicatifs)</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={prendreRdv} className="min-h-11 px-4">
            <CalendarDays className="size-5" aria-hidden="true" /> Prendre RDV
          </Bouton>
          {a.phone && (
            <a href={`tel:${a.phone}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-bouton px-3 font-semibold text-bleu-action hover:bg-bleu-teinte">
              <Phone className="size-4" aria-hidden="true" /> Appeler
            </a>
          )}
          <a
            href={`https://www.openstreetmap.org/directions?to=${a.location[0]}%2C${a.location[1]}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-bouton px-3 font-semibold text-bleu-action hover:bg-bleu-teinte"
          >
            <Navigation className="size-4" aria-hidden="true" /> Itinéraire
          </a>
        </div>
      </div>
    </article>
  );
}

/* ---------- Prise de rendez-vous ---------- */

const jourFr = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function ModaleRdv({ agence, fermer }: { agence: AgencySeed; fermer: () => void }) {
  const [creneaux, setCreneaux] = useState<AppointmentSlotList | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [form, setForm] = useState({ prenom: "", nom: "", tel: "" });
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);
  const [confirme, setConfirme] = useState<{ reference: string; quand: string } | null>(null);
  const fenetre = useRef<HTMLDivElement>(null);
  // Référence stable : le parent recrée `fermer` à chaque rendu, il ne doit pas relancer le chargement.
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;

  useEffect(() => {
    creneauxRendezVous(agence.slug).then((r) => (r.ok ? setCreneaux(r.data) : setErreur(r.message)));
    fenetre.current?.focus();
    const echap = (e: KeyboardEvent) => e.key === "Escape" && fermerRef.current();
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [agence.slug]);

  const heure = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: creneaux?.timeZone }).format(new Date(iso));
  const jours = useMemo(() => {
    const m = new Map<string, { id: string; start: string }[]>();
    for (const c of creneaux?.items ?? []) {
      const j = jourFr.format(new Date(c.start));
      m.set(j, [...(m.get(j) ?? []), c]);
    }
    return [...m.entries()].slice(0, 5);
  }, [creneaux]);

  async function valider() {
    if (!choix) return setErreur("Choisissez un créneau.");
    if (!form.prenom.trim() || !form.nom.trim()) return setErreur("Indiquez votre prénom et votre nom.");
    if (telNational(form.tel).length !== 9) return setErreur("Entrez les 9 chiffres de votre téléphone après +243.");
    setOccupe(true);
    const r = await prendreRendezVous({ agence: agence.slug, creneau: choix, prenom: form.prenom, nom: form.nom, telephone: `+243${telNational(form.tel)}` });
    setOccupe(false);
    if (!r.ok) return setErreur(r.message);
    setConfirme({ reference: r.data.reference, quand: `${jourFr.format(new Date(r.data.start))} à ${heure(r.data.start)}` });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-encre/40" onClick={fermer} />
      <div ref={fenetre} role="dialog" aria-modal="true" aria-labelledby="titre-rdv" tabIndex={-1} className="anim-feuille relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[20px] bg-carte p-5 outline-none sm:rounded-carte">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="titre-rdv" className="text-xl">
              Prendre rendez-vous
            </h2>
            <p className="text-[15px] text-texte-2">{agence.name}</p>
          </div>
          <button type="button" onClick={fermer} aria-label="Fermer" className="flex size-11 items-center justify-center rounded-full hover:bg-fond">
            <X className="size-5" />
          </button>
        </div>
        {confirme ? (
          <Encadre ton="succes" titre="Rendez-vous confirmé">
            {confirme.quand}, {agence.name}. Référence {confirme.reference}. Un SMS de confirmation vous a été envoyé.
          </Encadre>
        ) : (
          <>
            {!creneaux && !erreur && <p className="text-texte-2">Recherche des créneaux…</p>}
            {jours.map(([jour, liste]) => (
              <fieldset key={jour} className="mb-4">
                <legend className="mb-2 font-semibold capitalize">{jour}</legend>
                <div className="flex flex-wrap gap-2">
                  {liste.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={choix === c.id}
                      onClick={() => {
                        setChoix(c.id);
                        setErreur(undefined);
                      }}
                      className={`min-h-11 rounded-champ border px-3.5 font-semibold tabular-nums ${choix === c.id ? "border-2 border-bleu-action bg-bleu-teinte text-bleu-action" : "border-filet hover:border-bleu-action"}`}
                    >
                      {heure(c.start)}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            {creneaux && (
              <>
                <div className="grid gap-x-3 sm:grid-cols-2">
                  <ChampTexte label="Prénom" valeur={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
                  <ChampTexte label="Nom" valeur={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
                </div>
                <ChampTexte label="Téléphone" type="tel" inputMode="tel" prefixe="+243" valeur={form.tel} onChange={(v) => setForm({ ...form, tel: telNational(v) })} placeholder="81 234 5678" />
              </>
            )}
            {erreur && <Encadre ton="urgence" className="mb-4">{erreur}</Encadre>}
            {creneaux && (
              <Bouton bloc chargement={occupe} onClick={valider}>
                Confirmer le rendez-vous
              </Bouton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Liste d'agences d'une page ville (fiches + rendez-vous). */
export function AgencesVille({ slugs }: { slugs: string[] }) {
  const [rdv, setRdv] = useState<AgencySeed | null>(null);
  const [maintenant, setMaintenant] = useState<Date | null>(null);
  useEffect(() => setMaintenant(new Date()), []);
  const agences = AGENCY_SEED.filter((a) => slugs.includes(a.slug));
  return (
    <>
      <ol className="grid gap-3">
        {agences.map((a, i) => (
          <li key={a.slug}>
            <FicheAgence agence={a} numero={i + 1} maintenant={maintenant} prendreRdv={() => setRdv(a)} />
          </li>
        ))}
      </ol>
      {rdv && <ModaleRdv agence={rdv} fermer={() => setRdv(null)} />}
    </>
  );
}
