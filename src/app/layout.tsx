import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionBootstrap } from "@/components/session-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "RADICI | Welfare Aziendale Territoriale",
  description:
    "Piattaforma di welfare territoriale che riconverte i premi aziendali in soggiorni, cultura e gusto locale a KM 0.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-cream text-forest antialiased min-h-screen selection:bg-gold/30">
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
