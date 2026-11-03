"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Ticket,
  Sparkles,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Download,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  ExternalLink,
  Palette,
  Heart,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export type TicketStyleId =
  | "liberty"
  | "futurism"
  | "bauhaus"
  | "vintage50"
  | "watercolor"
  | "majolica";

export type TicketStyle = {
  id: TicketStyleId;
  name: string;
  tagline: string;
  era: string;
  cardClasses: string;
  headerClasses: string;
  titleClasses: string;
  badgeClasses: string;
  borderClasses: string;
  accentColor: string;
  previewBg: string;
};

export const TICKET_STYLES: TicketStyle[] = [
  {
    id: "liberty",
    name: "Liberty Floreale",
    tagline: "Eleganza Botanica & Oro",
    era: "Art Nouveau · Inizio '900",
    cardClasses: "bg-gradient-to-br from-[#faf6ee] via-[#f5edd9] to-[#ebdcc0] text-[#2c2214]",
    headerClasses: "border-b border-[#c29b38]/40 bg-[#c29b38]/10 text-[#7a5c17]",
    titleClasses: "font-serif text-[#1C3A2E] tracking-tight",
    badgeClasses: "bg-[#c29b38]/20 text-[#63480d] border border-[#c29b38]/40",
    borderClasses: "border-2 border-[#c29b38]/50 shadow-[0_12px_36px_rgba(194,155,56,0.18)]",
    accentColor: "#c29b38",
    previewBg: "from-[#f5edd9] to-[#ebdcc0]",
  },
  {
    id: "futurism",
    name: "Futurismo Marchigiano",
    tagline: "Dinamismo & Contrasti Decisi",
    era: "Avanguardia · Anni '20",
    cardClasses: "bg-gradient-to-br from-[#1f1917] via-[#1a2e22] to-[#0f1f18] text-[#fbf7f0]",
    headerClasses: "border-b border-[#c2410c]/50 bg-[#c2410c]/20 text-[#fca5a5]",
    titleClasses: "font-sans font-black uppercase tracking-wider text-white",
    badgeClasses: "bg-[#c2410c]/30 text-[#fed7aa] border border-[#c2410c]/60",
    borderClasses: "border-2 border-[#c2410c]/60 shadow-[0_12px_36px_rgba(194,65,12,0.25)]",
    accentColor: "#c2410c",
    previewBg: "from-[#1f1917] to-[#1a2e22]",
  },
  {
    id: "bauhaus",
    name: "Bauhaus Razionalista",
    tagline: "Griglia Asimmetrica & Rigore",
    era: "Design Strutturale · Weimar",
    cardClasses: "bg-[#f4f2ec] text-[#141414]",
    headerClasses: "border-b-2 border-black bg-black text-white",
    titleClasses: "font-sans font-bold uppercase tracking-tight text-black",
    badgeClasses: "bg-black text-white font-mono border border-black",
    borderClasses: "border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    accentColor: "#141414",
    previewBg: "from-[#e5e3db] to-[#f4f2ec]",
  },
  {
    id: "vintage50",
    name: "Manifesto Anni '50",
    tagline: "Serigrafia & Tipografia Teatrale",
    era: "Botteghino Storico · Dopoguerra",
    cardClasses: "bg-gradient-to-b from-[#f7f0e4] to-[#e8d7bf] text-[#291e13]",
    headerClasses: "border-b-2 border-dashed border-[#7c2d12]/40 bg-[#7c2d12]/10 text-[#7c2d12]",
    titleClasses: "font-serif italic font-bold text-[#7c2d12]",
    badgeClasses: "bg-[#7c2d12]/15 text-[#7c2d12] border border-[#7c2d12]/30",
    borderClasses: "border-2 border-[#7c2d12]/40 shadow-[0_12px_30px_rgba(124,45,18,0.15)]",
    accentColor: "#7c2d12",
    previewBg: "from-[#f7f0e4] to-[#e8d7bf]",
  },
  {
    id: "watercolor",
    name: "Acquerello dei Borghi",
    tagline: "Pietra Serena & Orizzonti Collinari",
    era: "Pittura En Plein Air",
    cardClasses: "bg-gradient-to-br from-[#f2f7f4] via-[#e5f0ea] to-[#d6e7de] text-[#183126]",
    headerClasses: "border-b border-[#2d6a4f]/30 bg-[#2d6a4f]/10 text-[#1b4332]",
    titleClasses: "font-serif text-[#1C3A2E] tracking-tight",
    badgeClasses: "bg-[#2d6a4f]/15 text-[#1b4332] border border-[#2d6a4f]/30",
    borderClasses: "border-2 border-[#2d6a4f]/30 shadow-[0_12px_30px_rgba(45,106,79,0.15)]",
    accentColor: "#2d6a4f",
    previewBg: "from-[#e5f0ea] to-[#d6e7de]",
  },
  {
    id: "majolica",
    name: "Ceramica Marchigiana",
    tagline: "Maiolica Rinascimentale & Cobalto",
    era: "Casteldurante & Pesaro",
    cardClasses: "bg-gradient-to-br from-[#f8fafc] via-[#f0f6ff] to-[#dfeaff] text-[#112347]",
    headerClasses: "border-b-2 border-[#1d4ed8]/40 bg-[#1d4ed8]/10 text-[#1e40af]",
    titleClasses: "font-serif text-[#1e3a8a] tracking-tight",
    badgeClasses: "bg-[#1d4ed8]/15 text-[#1e40af] border border-[#1d4ed8]/30",
    borderClasses: "border-2 border-[#1d4ed8]/40 shadow-[0_12px_32px_rgba(29,78,216,0.18)]",
    accentColor: "#1d4ed8",
    previewBg: "from-[#f0f6ff] to-[#dfeaff]",
  },
];

type Props = {
  events: Array<{
    id: number;
    title: string;
    venueName: string;
    city: string;
    region: string;
    description: string;
    startsAt?: Date | string | null;
  }>;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    referralCode: string;
    role: string;
    company?: {
      name: string;
      entityType?: string;
    } | null;
  };
  className?: string;
};

export function TicketStudio({ events, user, className = "" }: Props) {
  // Evento selezionato (fallback sul primo o default evocativo)
  const [selectedEventId, setSelectedEventId] = useState<number>(events[0]?.id || 1);
  const [selectedStyleId, setSelectedStyleId] = useState<TicketStyleId>("liberty");
  const [personalMessage, setPersonalMessage] = useState<string>(
    "Vieni con me al borgo: la cultura unisce la comunità e rigenera le nostre terre."
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ||
    events[0] || {
      id: 1,
      title: "Concerto Sinfonico sotto le Stelle nei Borghi Antichi",
      venueName: "Teatro Lauro Rossi",
      city: "Macerata",
      region: "Marche",
      description: "Serata culturale d'eccellenza con incontro esclusivo con gli artisti al termine.",
      startsAt: new Date("2026-05-16T21:00:00Z"),
    };

  const selectedStyle =
    TICKET_STYLES.find((s) => s.id === selectedStyleId) || TICKET_STYLES[0];

  const entityName = user.company?.name || "Università di Camerino";
  const isPublicEntity = user.company?.entityType === "public" || entityName.toLowerCase().includes("università") || entityName.toLowerCase().includes("comune");

  // Referral URL
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://welfare-impact-898481966164.europe-west1.run.app";
  const referralUrl = `${baseUrl}/r/${user.referralCode}`;

  // Condivisione WhatsApp
  const waShareText = encodeURIComponent(
    `🎟️ Ti invito a uno spettacolo speciale nei borghi con RADICI!\n\n` +
      `🎭 "${selectedEvent.title}"\n` +
      `📍 ${selectedEvent.venueName} · ${selectedEvent.city}\n` +
      `🏛️ Sostenuto dal welfare territoriale di ${entityName}\n\n` +
      `✨ "${personalMessage}"\n\n` +
      `Usa il mio invito con il 10% di sconto riservato alla community:\n${referralUrl}`
  );
  const waLink = `https://wa.me/?text=${waShareText}`;

  // Condivisione Email (mailto)
  const mailSubject = encodeURIComponent(
    `Invito Culturale: ${selectedEvent.title} a ${selectedEvent.city} · Circuito RADICI`
  );
  const mailBody = encodeURIComponent(
    `Ciao,\n\nti condivido questo invito speciale creato tramite il welfare territoriale di ${entityName}.\n\n` +
      `Spettacolo: ${selectedEvent.title}\n` +
      `Luogo: ${selectedEvent.venueName} (${selectedEvent.city}, ${selectedEvent.region})\n` +
      `Messaggio: "${personalMessage}"\n\n` +
      `Grazie all'iniziativa di coesione territoriale promossa da RADICI, puoi unirti all'esperienza con il 10% di tariffa agevolata per gli amici della community:\n` +
      `${referralUrl}\n\nA presto,\n${user.firstName}`
  );
  const mailtoLink = `mailto:?subject=${mailSubject}&body=${mailBody}`;

  // Web Share API
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invito: ${selectedEvent.title}`,
          text: `Ti invito a teatro nei borghi con ${entityName}! ${personalMessage}`,
          url: referralUrl,
        });
      } catch (err) {
        // Ignora annullamento utente
      }
    } else {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handlePrintTicket() {
    window.print();
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Intestazione del Componente */}
      <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 font-mono text-xs font-semibold text-forest">
                <Ticket size={14} className="text-forest" /> Ticket Studio d&apos;Autore
              </span>
              {isPublicEntity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-bold text-terracotta border border-gold/40">
                  <Building size={12} /> Strumento Speciale Enti Pubblici
                </span>
              )}
            </div>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-forest">
              Crea e Diffondi il Biglietto d&apos;Autore
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-olive max-w-2xl leading-relaxed">
              Personalizza il manifesto d&apos;invito per lo spettacolo con stili artistici storici, dettagli di valorizzazione locale e il tuo link referral per la community.
              {isPublicEntity &&
                " Per gli enti pubblici che non possono effettuare sponsorizzazioni dirette, il Ticket Studio trasforma ogni dipendente in un ambasciatore spontaneo del patrimonio culturale del borgo."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintTicket}
              className="inline-flex items-center gap-1.5 rounded-xl border border-forest/20 px-3.5 py-2 text-xs font-semibold text-forest hover:bg-forest/5 transition cursor-pointer"
            >
              <Download size={14} /> Stampa / Salva PDF
            </button>
          </div>
        </div>

        {/* 1. SELETTORE STILE ARTISTICO (6 STILI) */}
        <div className="mt-6 border-t border-mist pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest mb-3 flex items-center gap-1.5">
            <Palette size={14} /> 1. Scegli lo Stile Artistico del Biglietto
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {TICKET_STYLES.map((style) => {
              const active = style.id === selectedStyleId;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`rounded-2xl border p-3 text-left transition cursor-pointer relative overflow-hidden ${
                    active
                      ? "border-forest bg-forest/5 shadow-md ring-2 ring-forest/30"
                      : "border-forest/15 hover:border-forest/40 bg-white"
                  }`}
                >
                  <div
                    className={`h-2.5 w-full rounded-full bg-gradient-to-r ${style.previewBg} mb-2 border border-black/10`}
                  />
                  <p className="font-serif text-xs font-bold text-forest leading-snug">{style.name}</p>
                  <p className="text-[10px] text-olive mt-0.5 line-clamp-1">{style.era}</p>
                  {active && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-cream">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SELETTORE EVENTO & MESSAGGIO PERSONALIZZATO */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-mist pt-6">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1.5">
              2. Seleziona l&apos;Evento di Performing Art
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="w-full rounded-xl border border-forest/20 px-3.5 py-2.5 text-xs text-forest focus:border-forest focus:outline-none bg-white"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.venueName} · {ev.city})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-olive">
              Ogni spettacolo è vincolato al Matching Grant culturale e valorizza il borgo ospitante.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest mb-1.5">
              3. Messaggio Personale di Invito (appare sul manifesto)
            </label>
            <input
              type="text"
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Scrivi una breve frase di invito..."
              className="w-full rounded-xl border border-forest/20 px-3.5 py-2.5 text-xs text-forest focus:border-forest focus:outline-none bg-white"
            />
            <p className="mt-1 text-[10px] text-olive">
              Massimo impatto di coinvolgimento emotivo verso colleghi, amici e familiari.
            </p>
          </div>
        </div>
      </div>

      {/* 3. ANTEPRIMA BIGLIETTO D'AUTORE & BOTTONI DI DIFFUSIONE */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
        {/* LA CARD / MANIFESTO ARTISTICO */}
        <div
          ref={ticketRef}
          className={`rounded-[32px] p-6 sm:p-8 transition-all relative overflow-hidden ${selectedStyle.cardClasses} ${selectedStyle.borderClasses}`}
        >
          {/* Filigrana o cornice artistica */}
          <div className="flex items-center justify-between pb-4 border-b border-current/15 gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${selectedStyle.badgeClasses}`}>
                Circuito RADICI · {selectedStyle.name}
              </span>
              <span className="text-[10px] opacity-75 font-mono">
                MATR. {user.referralCode.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-semibold opacity-80 uppercase tracking-widest">
              Biglietto d&apos;Autore
            </span>
          </div>

          {/* Intestazione Ente / Impresa */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold opacity-75">
                {isPublicEntity ? "Ente Pubblico Promotore di Coesione" : "Impresa CSR Aderente"}
              </p>
              <h4 className="font-serif text-lg font-bold mt-0.5">{entityName}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest opacity-75 font-semibold">Invitato da</p>
              <p className="text-xs font-semibold">{user.firstName} {user.lastName}</p>
            </div>
          </div>

          {/* Titolo Principale Evento */}
          <div className="mt-6 pt-5 border-t border-current/15 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 inline-flex items-center gap-1">
              <Sparkles size={11} /> Spettacolo Culturale Convenzionato
            </span>
            <h3 className={`text-2xl sm:text-3xl leading-snug ${selectedStyle.titleClasses}`}>
              {selectedEvent.title}
            </h3>
            <p className="text-xs opacity-85 leading-relaxed line-clamp-2">
              {selectedEvent.description}
            </p>
          </div>

          {/* Dettagli Spettacolo: Data, Luogo, Borgo */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-black/5 p-4 border border-current/10 text-xs">
            <div className="flex items-start gap-2">
              <Calendar size={14} className="mt-0.5 shrink-0 opacity-75" />
              <div>
                <p className="text-[10px] uppercase opacity-75 font-semibold">Data & Orario</p>
                <p className="font-semibold">
                  {selectedEvent.startsAt
                    ? formatDateTime(new Date(selectedEvent.startsAt))
                    : "Maggio 2026 · Ore 21:00"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 opacity-75" />
              <div>
                <p className="text-[10px] uppercase opacity-75 font-semibold">Teatro Storico & Borgo</p>
                <p className="font-semibold truncate">
                  {selectedEvent.venueName} · {selectedEvent.city}
                </p>
              </div>
            </div>
          </div>

          {/* Valori di Sostenibilità & Coesione Locale */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] pt-4 border-t border-current/15">
            <div className="rounded-xl bg-black/5 p-2 border border-current/10">
              <p className="font-bold text-xs">50 €</p>
              <p className="opacity-75 leading-tight mt-0.5">Matching Grant Promotori</p>
            </div>
            <div className="rounded-xl bg-black/5 p-2 border border-current/10">
              <p className="font-bold text-xs">KM 0</p>
              <p className="opacity-75 leading-tight mt-0.5">Filiera Corta Certificata</p>
            </div>
            <div className="rounded-xl bg-black/5 p-2 border border-current/10">
              <p className="font-bold text-xs">-10%</p>
              <p className="opacity-75 leading-tight mt-0.5">Tariffa Amici Community</p>
            </div>
          </div>

          {/* Dedica Personale */}
          {personalMessage && (
            <div className="mt-5 rounded-2xl bg-white/40 backdrop-blur-sm p-3.5 border border-current/10 text-xs italic">
              &quot;{personalMessage}&quot;
            </div>
          )}

          {/* Footer del Manifesto: QR Code Reale e Sigillo */}
          <div className="mt-6 pt-5 border-t-2 border-current/20 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 flex items-center gap-1">
                <ShieldCheck size={12} /> Biglietto Validato dal Circuito
              </p>
              <p className="text-[11px] opacity-85 font-mono">
                radici.it/r/{user.referralCode}
              </p>
              <p className="text-[10px] opacity-75">
                Inquadra il QR con la fotocamera per confermare l&apos;adesione
              </p>
            </div>

            <div className="h-20 w-20 shrink-0 rounded-2xl bg-white p-1.5 shadow-md border border-black/10">
              <Image
                src={`/api/qr/${user.referralCode}?kind=invite`}
                alt="QR Code Invito"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* CANALI DI DIFFUSIONE IMMEDIATA */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-sm space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 font-mono text-xs font-semibold text-terracotta">
                <Share2 size={13} /> Diffusione Istantanea
              </span>
              <h3 className="mt-2 font-serif text-xl font-bold text-forest">
                Inoltra il Tuo Biglietto d&apos;Autore
              </h3>
              <p className="text-xs text-olive leading-relaxed mt-1">
                Nessuna configurazione complessa o server di posta: invia direttamente tramite le app del tuo dispositivo con il tuo link referral associato.
              </p>
            </div>

            {/* Pulsante 1: WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#20ba59] transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={18} /> Invia agli Amici su WhatsApp
              </span>
              <ExternalLink size={14} className="opacity-80" />
            </a>

            {/* Pulsante 2: Email (mailto) */}
            <a
              href={mailtoLink}
              className="flex items-center justify-between gap-3 rounded-2xl bg-forest px-4 py-3 text-xs font-bold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Mail size={18} /> Inoltra via Email (App Predefinita)
              </span>
              <ExternalLink size={14} className="opacity-80" />
            </a>

            {/* Pulsante 3: Web Share API (Social) */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-forest/20 bg-cream/60 px-4 py-3 text-xs font-bold text-forest hover:bg-cream transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Share2 size={18} /> Condividi sui Social / Altre App
              </span>
              <span className="text-[10px] text-olive font-normal">Nativo</span>
            </button>

            {/* Pulsante 4: Copia Link Referral Diretto */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-forest/15 px-4 py-3 text-xs font-medium text-forest hover:bg-forest/5 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Copy size={16} className="text-olive shrink-0" />
                <span className="font-mono text-[11px] truncate">{referralUrl}</span>
              </span>
              <span className="text-[11px] font-bold text-terracotta shrink-0">
                {copiedLink ? "✓ Copiato!" : "Copia link"}
              </span>
            </button>
          </div>

          {/* Vantaggi della Diffusione per l'Ente e per l'Addetto */}
          <div className="rounded-3xl border border-gold/30 bg-gold/10 p-5 text-xs text-forest space-y-2.5">
            <p className="font-serif font-bold text-sm text-terracotta flex items-center gap-1.5">
              <Sparkles size={15} /> Come Funziona il Riconoscimento dei Voti & Punti
            </p>
            <ul className="space-y-1.5 text-[11px] text-ink/80 leading-relaxed list-disc list-inside">
              <li>
                <strong>Amici Conteggiati all&apos;Ente:</strong> Tutti gli amici che aprono il tuo link e si registrano vengono attribuiti direttamente alla tua impresa o ente pubblico ({entityName}).
              </li>
              <li>
                <strong>Torneo dei Trailer:</strong> I voti degli amici registrati valgono per far vincere i 10 Biglietti Omaggio alla tua organizzazione!
              </li>
              <li>
                <strong>Punti Impatto:</strong> Ogni soggiorno o cena consumata dagli amici nel circuito accredita punti impatto sul tuo profilo.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
