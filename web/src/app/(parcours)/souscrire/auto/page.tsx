import type { Metadata } from "next";
import { ParcoursAuto } from "@/components/parcours/auto";

export const metadata: Metadata = {
  title: "Assurance auto en ligne",
  description: "Votre tarif d’assurance auto en 3 questions, paiement mobile money et certificat immédiat.",
};

export default function PageSouscriptionAuto() {
  return <ParcoursAuto />;
}
