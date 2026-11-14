import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Ton = "info" | "succes" | "vigilance" | "urgence";

const styles: Record<Ton, { boite: string; Icone: typeof Info }> = {
  info: { boite: "bg-bleu-teinte text-encre", Icone: Info },
  succes: { boite: "bg-succes-teinte text-succes", Icone: CircleCheck },
  vigilance: { boite: "bg-vigilance-teinte text-vigilance", Icone: TriangleAlert },
  urgence: { boite: "bg-rouge-teinte text-rouge-texte", Icone: CircleAlert },
};

export function Encadre({ ton = "info", titre, children, className = "" }: { ton?: Ton; titre?: ReactNode; children?: ReactNode; className?: string }) {
  const { boite, Icone } = styles[ton];
  return (
    <div className={`flex gap-2.5 rounded-bouton px-3.5 py-3 text-[15px] leading-snug ${boite} ${className}`}>
      <Icone className={`mt-0.5 size-[18px] flex-none ${ton === "info" ? "text-bleu-action" : ""}`} aria-hidden="true" />
      <div className="min-w-0">
        {titre && <p className="font-bold">{titre}</p>}
        {children}
      </div>
    </div>
  );
}
