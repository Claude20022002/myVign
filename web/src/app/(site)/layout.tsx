import { Entete } from "@/components/site/entete";
import { Pied } from "@/components/site/pied";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Entete />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Pied />
    </>
  );
}
