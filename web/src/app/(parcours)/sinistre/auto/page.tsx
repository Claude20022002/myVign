import type { Metadata } from "next";
import { ParcoursSinistre } from "@/components/parcours/sinistre";

export const metadata: Metadata = { title: "Déclarer un sinistre auto" };

export default function PageSinistreAuto() {
  return <ParcoursSinistre />;
}
