import Image from "next/image";
import Link from "next/link";

export function Logo({ hauteur = 44 }: { hauteur?: number }) {
  return (
    <Link href="/" className="inline-flex items-center rounded-md" aria-label="SONAS, retour à l'accueil">
      <Image src="/logo-sonas.png" alt="" width={Math.round(hauteur * 1.44)} height={hauteur} priority />
    </Link>
  );
}
