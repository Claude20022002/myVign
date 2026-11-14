import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Saira } from "next/font/google";
import { AideProvider } from "@/components/aide/aide";
import { BandeauDemo } from "@/components/site/entete";
import { DeviseProvider } from "@/components/ui/devise";
import "./globals.css";

// Polices de la charte (DESIGN.md §5), auto-hébergées par next/font, sous-ensemble latin.
const saira = Saira({ variable: "--font-saira", subsets: ["latin"], display: "swap" });
const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "SONAS · Assurance en ligne", template: "%s · SONAS" },
  description:
    "Souscrivez votre assurance SONAS en ligne, payez en mobile money et recevez votre attestation tout de suite. Déclarez et suivez vos sinistres.",
};

export const viewport: Viewport = { themeColor: "#0A405C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${saira.variable} ${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <BandeauDemo />
        <DeviseProvider>
          <AideProvider>{children}</AideProvider>
        </DeviseProvider>
      </body>
    </html>
  );
}
