import Link from "next/link";
import { classesBouton } from "@/components/ui/bouton";

export default function PageIntrouvable() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-[32px]">Page introuvable</h1>
      <p className="mt-2 text-texte-2">Le lien est peut-être incomplet. Vos démarches en cours sont enregistrées.</p>
      <Link href="/" className={classesBouton("principal", false, "mt-6")}>
        Retour à l’accueil
      </Link>
    </div>
  );
}
