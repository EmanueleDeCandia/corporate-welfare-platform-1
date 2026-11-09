"use client";

import { useState, useId } from "react";
import Image from "next/image";
import {
  Award,
  Sparkles,
  Share2,
  MessageCircle,
  Copy,
  ExternalLink,
  Download,
  Check,
  X,
  Palette,
  QrCode,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
} from "lucide-react";
import type { TrailerWithStats } from "@/lib/tournament";

export type TournamentTicketStyle = "liberty" | "futurism" | "bauhaus" | "vintage50" | "watercolor" | "majolica";

interface StyleDef {
  id: TournamentTicketStyle;
  name: string;
  era: string;
  cardClasses: string;
  headerClasses: string;
  titleClasses: string;
  badgeClasses: string;
  borderClasses: string;
  accentColor: string;
}

const STYLES: StyleDef[] = [
  {
    id: "liberty",
    name: "Liberty Floreale",
    era: "Art Nouveau · Inizio '900",
    cardClasses: "bg-gradient-to-br from-[#faf6ee] via-[#f5edd9] to-[#ebdcc0] text-[#2c2214]",
    headerClasses: "border-b border-[#c29b38]/40 bg-[#c29b38]/10 text-[#7a5c17]",
    titleClasses: "font-serif text-[#1C3A2E] tracking-tight",
    badgeClasses: "bg-[#c29b38]/20 text-[#63480d] border border-[#c29b38]/40",
    borderClasses: "border-2 border-[#c29b38]/50 shadow-xl",
    accentColor: "#c29b38",
  },
  {
    id: "futurism",
    name: "Futurismo Marchigiano",
    era: "Avanguardia · Anni '20",
    cardClasses: "bg-gradient-to-br from-[#1f1917] via-[#1a2e22] to-[#0f1f18] text-[#fbf7f0]",
    headerClasses: "border-b border-[#c2410c]/50 bg-[#c2410c]/20 text-[#fca5a5]",
    titleClasses: "font-sans font-black uppercase tracking-wider text-white",
    badgeClasses: "bg-[#c2410c]/30 text-[#fed7aa] border border-[#c2410c]/60",
    borderClasses: "border-2 border-[#c2410c]/60 shadow-xl",
    accentColor: "#c2410c",
  },
  {
    id: "bauhaus",
    name: "Bauhaus Razionalista",
    era: "Design Strutturale · Weimar",
    cardClasses: "bg-[#f4f2ec] text-[#141414]",
    headerClasses: "border-b-2 border-black bg-black text-white",
    titleClasses: "font-sans font-bold uppercase tracking-tight text-black",
    badgeClasses: "bg-black text-white font-mono border border-black",
    borderClasses: "border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    accentColor: "#141414",
  },
  {
    id: "vintage50",
    name: "Manifesto Anni '50",
    era: "Botteghino Storico · Dopoguerra",
    cardClasses: "bg-gradient-to-b from-[#f7f0e4] to-[#e8d7bf] text-[#291e13]",
    headerClasses: "border-b-2 border-dashed border-[#7c2d12]/40 bg-[#7c2d12]/10 text-[#7c2d12]",
    titleClasses: "font-serif italic font-bold text-[#7c2d12]",
    badgeClasses: "bg-[#7c2d12]/15 text-[#7c2d12] border border-[#7c2d12]/30",
    borderClasses: "border-2 border-[#7c2d12]/40 shadow-xl",
    accentColor: "#7c2d12",
  },
  {
    id: "watercolor",
    name: "Acquerello dei Borghi",
    era: "Pittura En Plein Air",
    cardClasses: "bg-gradient-to-br from-[#f2f7f4] via-[#e5f0ea] to-[#d6e7de] text-[#183126]",
    headerClasses: "border-b border-[#2d6a4f]/30 bg-[#2d6a4f]/10 text-[#1b4332]",
    titleClasses: "font-serif text-[#1C3A2E] tracking-tight",
    badgeClasses: "bg-[#2d6a4f]/15 text-[#1b4332] border border-[#2d6a4f]/30",
    borderClasses: "border-2 border-[#2d6a4f]/30 shadow-xl",
    accentColor: "#2d6a4f",
  },
  {
    id: "majolica",
    name: "Ceramica Marchigiana",
    era: "Casteldurante & Pesaro",
    cardClasses: "bg-gradient-to-br from-[#f8fafc] via-[#f0f6ff] to-[#dfeaff] text-[#112347]",
    headerClasses: "border-b-2 border-[#1d4ed8]/40 bg-[#1d4ed8]/10 text-[#1e40af]",
    titleClasses: "font-serif text-[#1e3a8a] tracking-tight",
    badgeClasses: "bg-[#1d4ed8]/15 text-[#1e40af] border border-[#1d4ed8]/30",
    borderClasses: "border-2 border-[#1d4ed8]/40 shadow-xl",
    accentColor: "#1d4ed8",
  },
];

interface Props {
  trailer: TrailerWithStats;
  currentUser: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    companyName?: string | null;
    referralCode?: string | null;
  };
  onClose: () => void;
}

export function TournamentTicketModal({ trailer, currentUser, onClose }: Props) {
  const [selectedStyle, setSelectedStyle] = useState<TournamentTicketStyle>("liberty");
  const [copiedLink, setCopiedLink] = useState(false);

  const style = STYLES.find((s) => s.id === selectedStyle) || STYLES[0];

  // Gestione entità committente con fallback chiaro per Chiara Valenti / Promotori
  const sponsorName =
    currentUser.role === "promoter"
      ? "Startup Promotrice RADICI"
      : currentUser.companyName || "Impresa CSR Partner";

  // Link di referral con parametro dedicato al torneo e allo spettacolo
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const refCode = currentUser.referralCode || `ref-${currentUser.id}`;
  const shareUrl = `${origin}/torneo?ref=${encodeURIComponent(refCode)}&trailer=${trailer.id}`;

  const shareText =
    `🎭 Ho votato "${trailer.title}" nel Torneo dei Trailer RADICI!\n\n` +
    `Teatro: ${trailer.theaterName} (${trailer.city})\n` +
    `Compagnia: ${trailer.performingCompany} (Regia di ${trailer.director})\n` +
    `Sponsor CSR: ${sponsorName}\n\n` +
    `Vota anche tu per sostenere lo spettacolo dal vivo e far vincere i 10 Biglietti Omaggio alla nostra squadra:\n${shareUrl}`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt("Copia il link per votare:", shareUrl);
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Vota "${trailer.title}" · Torneo RADICI`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Ignora chiusura del dialog
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-4xl rounded-[32px] border border-forest/10 bg-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-forest/10 bg-forest px-6 py-4 text-cream">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <Award size={18} />
            </span>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight">
                Attestato d&apos;Autore &amp; Invito al Voto
              </h3>
              <p className="text-[11px] text-sand/80">
                Spettacolo in gara nel Torneo dei Trailer di Performing Art
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-cream/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo Modale */}
        <div className="p-6 max-h-[78vh] overflow-y-auto bg-cream/30 space-y-6">
          {/* Selettore di Stile Artistico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Palette size={14} className="text-gold" /> Scegli lo Stile Artistico del Biglietto
              </label>
              <span className="font-mono text-[11px] text-olive font-semibold">{style.era}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    selectedStyle === s.id
                      ? "bg-forest text-white shadow-sm"
                      : "bg-white text-olive border border-forest/15 hover:border-forest/40"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* ANTEPRIMA BIGLIETTO D'AUTORE */}
          <div className="flex justify-center">
            <div
              className={`relative w-full max-w-xl rounded-3xl overflow-hidden p-6 sm:p-8 ${style.cardClasses} ${style.borderClasses}`}
            >
              {/* Header Biglietto */}
              <div className="flex items-start justify-between border-b border-black/10 pb-4">
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold ${style.badgeClasses}`}>
                    <Sparkles size={12} /> Torneo delle Compagnie · Edizione 2026
                  </span>
                  <p className="font-mono text-[10px] text-olive/80 uppercase tracking-widest mt-1">
                    RADICI · Welfare &amp; Territorio Marche
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-black text-forest">VOTO #{trailer.id}</span>
                  <p className="text-[10px] text-olive">Attestato Ufficiale</p>
                </div>
              </div>

              {/* Contenuto Spettacolo & Teatro */}
              <div className="py-6 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-olive">
                    Spettacolo Selezionato
                  </span>
                  <h2 className={`text-2xl sm:text-3xl ${style.titleClasses}`}>
                    {trailer.title}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-mono text-[10px] uppercase text-olive">Compagnia &amp; Regia</p>
                    <p className="font-semibold text-forest">{trailer.performingCompany}</p>
                    <p className="text-[11px] text-olive/80">Regia di {trailer.director}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-mono text-[10px] uppercase text-olive">Teatro &amp; Borgo Storico</p>
                    <p className="font-semibold text-forest flex items-center gap-1">
                      <MapPin size={12} className="text-terracotta shrink-0" />
                      {trailer.theaterName}
                    </p>
                    <p className="text-[11px] text-olive/80">{trailer.city}</p>
                  </div>
                </div>

                {/* Sezione Product Placement CSR */}
                <div className="mt-4 rounded-2xl bg-white/70 p-3.5 border border-black/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-forest flex items-center gap-1.5">
                      <Building size={13} className="text-gold" /> Product Placement &amp; Welfare CSR:
                    </span>
                    <span className="font-mono font-semibold text-terracotta">{sponsorName}</span>
                  </div>
                  <p className="text-[10px] text-olive leading-relaxed">
                    Sostenuto dalla filiera corta RADICI. Votando questo trailer partecipi all&apos;assegnazione di 10 Biglietti Omaggio per la comunità aziendale.
                  </p>
                </div>
              </div>

              {/* Footer Biglietto con QR Invito */}
              <div className="flex items-center justify-between border-t border-black/10 pt-4">
                <div className="space-y-1 text-left">
                  <p className="text-[11px] font-bold text-forest">
                    Invitato da: {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-[10px] font-mono text-olive">
                    Codice Referral: {refCode}
                  </p>
                  <p className="text-[9px] text-olive/70">
                    Valido per la classifica del Torneo di Performing Art
                  </p>
                </div>

                <div className="h-16 w-16 rounded-xl bg-white p-1 shadow-sm border border-black/10 flex items-center justify-center">
                  <Image
                    src={`/api/qr/${encodeURIComponent(refCode)}?kind=invite`}
                    alt="QR Code Invito"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CANALI DI DIFFUSIONE IMMEDIATA */}
          <div className="rounded-3xl border border-forest/10 bg-white p-5 shadow-xs space-y-3">
            <h4 className="font-serif text-sm font-bold text-forest">
              Invia l&apos;Invito ai Tuoi Colleghi e Amici:
            </h4>
            <div className="grid sm:grid-cols-3 gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#20ba59] transition cursor-pointer"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-2xl bg-forest px-4 py-2.5 text-xs font-bold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer"
              >
                <Share2 size={15} /> Condividi sui Social
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-forest/20 bg-cream/50 px-4 py-2.5 text-xs font-bold text-forest hover:bg-cream transition cursor-pointer"
              >
                {copiedLink ? <Check size={15} className="text-emerald-700" /> : <Copy size={15} />}
                <span>{copiedLink ? "Link Copiato!" : "Copia Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="flex items-center justify-between border-t border-forest/10 bg-white px-6 py-3.5 text-xs text-olive">
          <span className="font-mono text-[11px]">Circuito RADICI · Torneo dei Borghi &amp; Spettacoli Teatrali</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-cream hover:bg-forest/90 transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
