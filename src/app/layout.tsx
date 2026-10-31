import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import { SessionBootstrap } from "@/components/session-bootstrap";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RADICI | Welfare Aziendale Territoriale",
  description:
    "Piattaforma di welfare territoriale che riconverte i premi aziendali in soggiorni, cultura e gusto locale a KM 0.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="bg-cream text-forest antialiased min-h-screen" suppressHydrationWarning>
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
