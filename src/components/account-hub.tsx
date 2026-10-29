"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Copy,
  Download,
  FileText,
  Leaf,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import type {
  certificates,
  companies,
  invites,
  shares,
  transactions,
  venues,
  vouchers,
} from "@/db/schema";
import {
  badgeForPoints,
  formatDate,
  formatDateTime,
  formatEuro,
  matchesVoucher,
  venueTypeLabel,
  voucherTypeLabel,
} from "@/lib/utils";

type VenueLite = typeof venues.$inferSelect;
type TxRow = { transaction: typeof transactions.$inferSelect; venue: VenueLite };

type Props = {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    impactPoints: number;
    badgeLevel: string;
    referralCode: string;
  };
  company: typeof companies.$inferSelect | null;
  vouchers: Array<typeof vouchers.$inferSelect>;
  venues: VenueLite[];
  invites: Array<typeof invites.$inferSelect>;
  transactions: TxRow[];
  shares: Array<typeof shares.$inferSelect>;
  certificates: Array<typeof certificates.$inferSelect>;
};

type Tab = "wallet" | "kit" | "friends";

export function AccountHub(props: Props) {
  const [tab, setTab] = useState<Tab>(props.user.role === "friend" ? "friends" : "wallet");

  return (
    <div>
      <div className="tab-shadow flex gap-2 overflow-x-auto pb-3">
        {(
          [
            { id: "wallet", label: "Portafoglio", icon: Wallet },
            { id: "kit", label: "Kit e certificati", icon: Share2 },
            { id: "friends", label: "Hub amici", icon: Users },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
              tab === item.id ? "bg-forest text-cream" : "bg-white text-forest"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "wallet" ? <WalletTab {...props} /> : null}
        {tab === "kit" ? <KitTab {...props} /> : null}
        {tab === "friends" ? <FriendsTab {...props} /> : null}
      </div>
    </div>
  );
}

function WalletTab({ user, company, vouchers, venues, transactions }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const groups = {
    hotel: vouchers.filter((item) => item.type === "hotel"),
    aperitivo: vouchers.filter((item) => item.type === "aperitivo"),
    theater: vouchers.filter((item) => item.type === "theater"),
  };

  async function redeem(voucherId: number, venueId: number, theaterVenueId?: number) {
    setPendingId(`${voucherId}-${venueId}`);
    setMessage("");
    const response = await fetch("/api/vouchers/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId, venueId, theaterVenueId }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPendingId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Riscatto non riuscito.");
      return;
    }
    setMessage(data.message ?? "Voucher riscattato.");
    router.refresh();
  }

  const [resetting, setResetting] = useState(false);
  async function resetDemo() {
    if (!confirm("Vuoi ripristinare i voucher per provare la selezione del Teatro e della Struttura da zero?")) {
      return;
    }
    setResetting(true);
    setMessage("");
    try {
      const response = await fetch("/api/vouchers/reset-demo", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Errore nel reset demo.");
      } else {
        setMessage(data.message ?? "Dati demo ripristinati con successo.");
        router.refresh();
      }
    } finally {
      setResetting(false);
    }
  }

  if (user.role !== "employee") {
    return (
      <section className="rounded-[28px] bg-white p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Account amico / consumer</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Nessun cassetto welfare</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/75">
          Questo profilo non possiede voucher aziendali. Puoi pagare nei locali del circuito con
          micro-sconto community e far crescere i Punti Impatto di chi ti ha invitato.
        </p>
        <div className="mt-6 grid gap-3">
          {transactions.map(({ transaction, venue }) => (
            <div key={transaction.id} className="rounded-2xl border border-mist px-4 py-3">
              <p className="font-medium text-forest">{venue.name}</p>
              <p className="text-sm text-olive">
                {transaction.serviceLabel} · {formatEuro(transaction.amountCents)} ·{" "}
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest text-cream p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Cassetti fiscali</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="mt-2 font-serif text-3xl">Portafoglio welfare e omaggi</h2>
          <button
            type="button"
            disabled={resetting}
            onClick={resetDemo}
            className="rounded-full border border-gold/40 bg-cream/10 px-4 py-2 text-xs font-medium text-cream hover:bg-cream/20 disabled:opacity-50 transition"
            title="Ripristina i voucher disponibili per testare la selezione di struttura e teatro da zero"
          >
            {resetting ? "Ripristino in corso..." : "↺ Ripristina dati demo per test"}
          </button>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/75">
          I voucher restano nel tuo account finché non li usi sul posto. Al riscatto il buono si
          azzera e la struttura riceve i dati di fatturazione diretta di {company?.name ?? "la tua impresa"}.
        </p>
        {company ? (
          <p className="mt-4 text-sm text-gold">
            Intestatario fiscale: {company.name} · P.IVA {company.vatNumber}
          </p>
        ) : null}
      </section>

      <HotelDrawer
        title="Sezione Welfare · Pernottamento"
        subtitle="1 Voucher Pernottamento (50€) + Matching Grant Omaggio Promotori per 2 Persone (25€ + 25€)"
        items={groups.hotel}
        venues={venues}
        pendingId={pendingId}
        onRedeem={redeem}
      />
      <Drawer
        title="Sezione Welfare · Cena & Aperitivo KM 0"
        subtitle="1 Voucher Degustazione (25€) · filiera agricola del territorio"
        items={groups.aperitivo}
        venues={venues}
        pendingId={pendingId}
        onRedeem={redeem}
      />

      {message ? (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-forest">{message}</p>
      ) : null}

      <section className="rounded-[28px] bg-white p-6">
        <h3 className="font-serif text-2xl text-forest">Movimenti recenti</h3>
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-olive">Nessun movimento. Il primo riscatto apparirà qui.</p>
          ) : (
            transactions.map(({ transaction, venue }) => (
              <div key={transaction.id} className="flex items-center justify-between gap-4 border-b border-mist pb-3">
                <div>
                  <p className="font-medium text-forest">{venue.name}</p>
                  <p className="text-sm text-olive">
                    {transaction.serviceLabel} · {formatDateTime(transaction.createdAt)}
                  </p>
                </div>
                <p className="text-sm">{formatEuro(transaction.amountCents)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}


function HotelDrawer({
  title,
  subtitle,
  items,
  venues,
  pendingId,
  onRedeem,
}: {
  title: string;
  subtitle: string;
  items: Array<typeof vouchers.$inferSelect>;
  venues: VenueLite[];
  pendingId: string | null;
  onRedeem: (voucherId: number, venueId: number, theaterVenueId?: number) => void;
}) {
  const available = items.find((item) => item.status === "available");
  const used = items.filter((item) => item.status === "redeemed").length;

  // Filtra hotel/agriturismi
  const hotelVenues = venues.filter((v) => matchesVoucher(v.type, "hotel"));
  // Filtra i teatri convenzionati con i Promotori
  const theaterVenues = venues.filter((v) => v.type === "theater");

  // Step 1: struttura ricettiva selezionata
  const [selectedHotelVenue, setSelectedHotelVenue] = useState<VenueLite | null>(null);
  // Step 2: teatro scelto per il Matching Grant (preimpostato sul primo teatro convenzionato)
  const [selectedTheaterId, setSelectedTheaterId] = useState<number>(theaterVenues[0]?.id ?? 0);

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">
            Matching Grant Attivo (2 Persone · 25€ + 25€)
          </span>
          <h3 className="mt-2 font-serif text-2xl text-forest">{title}</h3>
          <p className="text-sm text-olive">{subtitle}</p>
        </div>
        <p className="text-sm font-medium text-forest">
          {items.length - used}/{items.length} disponibili
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`h-16 flex-1 rounded-2xl border px-3 py-2 text-xs ${
              item.status === "available"
                ? "border-gold/40 bg-cream text-forest"
                : "border-mist bg-mist/40 text-olive line-through"
            }`}
          >
            <p>Slot {item.slotIndex} {item.status === "redeemed" ? "· Riscattato" : ""}</p>
            <p className="mt-1 font-medium">{formatEuro(item.amountCents)}</p>
          </div>
        ))}
      </div>

      {/* DETTAGLIO SOGGIORNO PRENOTATO E TEATRO ASSEGNATO */}
      {!available && items[0]?.status === "redeemed" ? (
        (() => {
          const bookedHotel = venues.find((v) => v.id === items[0].venueId);
          const bookedTheater = venues.find((v) => v.id === items[0].theaterVenueId) || theaterVenues[0];
          return (
            <div className="mt-5 rounded-2xl border border-forest/20 bg-forest/5 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
                  Pernottamento Confermato & Fiscale B2B Assegnato
                </span>
                <span className="text-xs text-olive">
                  Prenotato il: {items[0].redeemedAt ? formatDateTime(items[0].redeemedAt) : "—"}
                </span>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-mist bg-white p-3.5">
                  <span className="text-[11px] uppercase tracking-wider text-olive block">Struttura Ospitante</span>
                  <strong className="text-base font-serif text-forest block mt-0.5">{bookedHotel?.name ?? "Struttura Convenzionata"}</strong>
                  <p className="text-xs text-olive mt-0.5">{bookedHotel?.city} · Voucher Welfare 50€</p>
                </div>
                <div className="rounded-xl border border-gold/40 bg-cream p-3.5">
                  <span className="text-[11px] uppercase tracking-wider text-terracotta block">Matching Grant Promotori (Attivo)</span>
                  <strong className="text-base font-serif text-forest block mt-0.5">{bookedTheater?.name ?? "Teatro Lauro Rossi"}</strong>
                  <p className="text-xs text-forest mt-0.5">{bookedTheater?.city} · Biglietto 2 Persone (25€ + 25€) + Incontro Artisti</p>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}

      {/* FLUSSO DI SELEZIONE: STEP 1 (STRUTTURA) -> STEP 2 (TEATRO) */}
      {available ? (
        <div className="mt-5 space-y-4">
          {/* STEP 1: Scelta Struttura Ricettiva */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] font-semibold text-forest">
                1. Seleziona la struttura per il pernottamento
              </p>
              {selectedHotelVenue ? (
                <button
                  type="button"
                  onClick={() => setSelectedHotelVenue(null)}
                  className="text-xs text-terracotta hover:underline"
                >
                  Cambia struttura
                </button>
              ) : null}
            </div>

            {selectedHotelVenue ? (
              <div className="mt-2 flex items-center justify-between rounded-2xl border-2 border-forest bg-forest/5 px-4 py-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-forest block">Struttura Selezionata</span>
                  <strong className="text-base font-serif text-forest">{selectedHotelVenue.name}</strong>
                  <p className="text-xs text-olive">{selectedHotelVenue.city} · Voucher Welfare 50€</p>
                </div>
                <span className="rounded-full bg-forest text-cream text-xs px-3 py-1 font-medium">
                  ✓ Selezionato
                </span>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {hotelVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="flex flex-col gap-3 rounded-2xl border border-mist px-4 py-3 md:flex-row md:items-center md:justify-between hover:bg-sand/20 transition"
                  >
                    <div>
                      <p className="font-medium text-forest">{venue.name}</p>
                      <p className="text-xs text-olive">
                        {venue.city} · {venueTypeLabel(venue.type)} · Voucher Pernottamento (50€)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHotelVenue(venue)}
                      className="rounded-full border border-forest bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest hover:bg-forest hover:text-cream transition"
                    >
                      Seleziona Pernottamento
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Scelta del Teatro Convenzionato (sbloccata una volta selezionato l'hotel) */}
          {selectedHotelVenue ? (
            <div className="rounded-2xl border border-gold/40 bg-cream p-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                  Passo 2 di 2
                </span>
                <p className="text-xs uppercase tracking-[0.14em] font-semibold text-terracotta">
                  Scegli il Teatro per il Matching Grant dei Promotori
                </p>
              </div>
              <p className="mt-2 text-xs text-olive leading-relaxed">
                Avendo selezionato il pernottamento presso <strong>{selectedHotelVenue.name}</strong>, i Promotori coprono il Matching Grant per 2 persone (25€ + 25€). Scegli a quale teatro assistere allo spettacolo:
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {theaterVenues.map((th) => (
                  <label
                    key={th.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-xs transition ${
                      selectedTheaterId === th.id
                        ? "border-forest bg-white font-medium text-forest shadow-sm"
                        : "border-mist bg-white/70 text-ink/75 hover:border-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedTheater"
                      value={th.id}
                      checked={selectedTheaterId === th.id}
                      onChange={() => setSelectedTheaterId(th.id)}
                      className="mt-0.5 accent-forest"
                    />
                    <div>
                      <strong className="block text-forest text-sm font-serif">{th.name}</strong>
                      <span className="text-[11px] text-olive">{th.city} ({th.region}) · Omaggio 2 Persone (50€)</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* CONFERMA E RISCATTO DEFINITIVO */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gold/20 pt-4">
                <div>
                  <p className="text-xs text-olive">
                    Riepilogo: <strong>{selectedHotelVenue.name}</strong> + <strong>{theaterVenues.find(t => t.id === selectedTheaterId)?.name ?? "Teatro"}</strong>
                  </p>
                  <p className="text-[11px] text-terracotta mt-0.5">
                    Alla conferma il voucher viene riscattato ai fini fiscali.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pendingId === `${available.id}-${selectedHotelVenue.id}`}
                  onClick={() => onRedeem(available.id, selectedHotelVenue.id, selectedTheaterId)}
                  className="rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream hover:bg-forest/90 disabled:opacity-50 transition shadow-sm"
                >
                  {pendingId === `${available.id}-${selectedHotelVenue.id}`
                    ? "Registrazione in corso..."
                    : "Conferma Prenotazione & Riscatta"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Drawer({
  title,
  subtitle,
  items,
  venues,
  pendingId,
  onRedeem,
}: {
  title: string;
  subtitle: string;
  items: Array<typeof vouchers.$inferSelect>;
  venues: VenueLite[];
  pendingId: string | null;
  onRedeem: (voucherId: number, venueId: number) => void;
}) {
  const available = items.find((item) => item.status === "available");
  const used = items.filter((item) => item.status === "redeemed").length;

  return (
    <section className="rounded-[28px] bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-forest">{title}</h3>
          <p className="text-sm text-olive">{subtitle}</p>
        </div>
        <p className="text-sm text-forest">
          {items.length - used}/{items.length} disponibili
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`h-16 flex-1 rounded-2xl border px-3 py-2 text-xs ${
              item.status === "available"
                ? "border-gold/40 bg-cream text-forest"
                : "border-mist bg-mist/40 text-olive line-through"
            }`}
          >
            <p>Slot {item.slotIndex}</p>
            <p className="mt-1 font-medium">{formatEuro(item.amountCents)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-olive">
          Sei sul posto? Clicca la struttura e premi RISCATTA
        </p>
        {venues
          .filter((venue) => items[0] && matchesVoucher(venue.type, items[0].type))
          .map((venue) => (
            <div
              key={venue.id}
              className="flex flex-col gap-3 rounded-2xl border border-mist px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-forest">{venue.name}</p>
                <p className="text-xs text-olive">
                  {venue.city} · {venueTypeLabel(venue.type)} · {voucherTypeLabel(items[0]?.type ?? "hotel")}
                </p>
              </div>
              <button
                type="button"
                disabled={!available || pendingId === `${available?.id}-${venue.id}`}
                onClick={() => available && onRedeem(available.id, venue.id)}
                className="rounded-full bg-terracotta px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cream disabled:bg-mist disabled:text-olive"
              >
                {available ? "Riscatta" : "Esaurito"}
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

function KitTab({ user, company, venues, shares, certificates }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? 0);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const venue = venues.find((item) => item.id === venueId) ?? venues[0];

  const caption = useMemo(() => {
    const place = venue?.name ?? "Agriturismo La Valle";
    const companyName = company?.name ?? "ACME S.p.A.";
    const companyTag = companyName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    return `Questo soggiorno da ${place} è stato sostenuto da ${companyName} per valorizzare l'economia locale — Certificato da RADICI.\n\n#${companyTag} #RadiciWelfare #ImpattoSociale #EconomiaLocale #KM0 #${(venue?.region ?? "Marche").replace(/\s+/g, "")}`;
  }, [venue, company]);

  async function onFile(file: File) {
    const image = await loadImage(URL.createObjectURL(file));
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(width / image.width, height / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
    ctx.fillStyle = "rgba(16,36,28,0.38)";
    ctx.fillRect(0, height - 280, width, 280);
    const badge = await loadImage("/images/badge-impatto.png");
    ctx.drawImage(badge, 48, height - 250, 180, 180);
    ctx.fillStyle = "#FBF7F0";
    ctx.font = "600 34px Georgia";
    ctx.fillText("Impatto sociale certificato", 250, height - 170);
    ctx.font = "22px Georgia";
    const line = `Questo soggiorno ha sostenuto l'economia agricola locale del ${venue?.localSupportPercent ?? 15}%`;
    ctx.fillText(line, 250, height - 128);
    ctx.font = "18px Georgia";
    ctx.fillStyle = "#B8954A";
    ctx.fillText("Certificato da RADICI", 250, height - 92);
    setPreview(canvas.toDataURL("image/jpeg", 0.92));
  }

  async function confirmShare() {
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: venue?.id, caption }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setMessage(data.message ?? data.error ?? "");
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] bg-white p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Punti Impatto 1 · social share</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Generatore di post pronti</h2>
        <p className="mt-3 text-sm leading-6 text-ink/75">
          Carica una foto del soggiorno. RADICI applica il badge ufficiale e prepara testo e hashtag
          già approvati per Instagram, Facebook o LinkedIn.
        </p>
        <label className="mt-4 block text-sm text-olive">
          Struttura da certificare
          <select
            value={venueId}
            onChange={(event) => setVenueId(Number(event.target.value))}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          >
            {venues.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-4 rounded-2xl border border-dashed border-forest/20 px-4 py-8 text-sm text-olive"
        >
          Scegli una foto dalla galleria del telefono
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {preview ? (
          <img src={preview} alt="Anteprima post certificato" className="mt-4 rounded-3xl" />
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {preview ? (
            <a
              href={preview}
              download="radici-impatto.jpg"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-cream"
            >
              <Download size={16} /> Scarica immagine
            </a>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(caption);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-forest/15 px-4 py-2 text-sm"
          >
            <Copy size={16} /> {copied ? "Testo copiato" : "Copia testo e hashtag"}
          </button>
          <button
            type="button"
            onClick={confirmShare}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm text-cream"
          >
            <BadgeCheck size={16} /> Ho condiviso
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream p-4 text-sm leading-6 text-forest">
          {caption}
        </pre>
        {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
      </section>

      <div className="space-y-6">
        <section className="rounded-[28px] bg-forest p-6 text-cream">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Livello cittadinanza attiva</p>
          <h3 className="mt-2 font-serif text-3xl">{user.badgeLevel}</h3>
          <p className="mt-2 text-sm text-cream/75">{badgeForPoints(user.impactPoints).hint}</p>
          <p className="mt-6 font-serif text-5xl">{user.impactPoints}</p>
          <p className="text-sm text-gold">Punti Impatto Sociale</p>
        </section>
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                <ShieldCheck size={15} /> Registro Ufficiale ESG
              </div>
              <h3 className="mt-1 font-serif text-2xl text-forest">Certificati di Impatto</h3>
              <p className="mt-1 text-xs text-olive">
                Attestati ufficiali firmati digitalmente su CO₂ evitata e valore economico rigenerato.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative overflow-hidden rounded-[24px] border-2 border-gold/40 bg-gradient-to-br from-[#FFFDF9] to-[#F7F2E7] p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* Background decorative watermark */}
                <div className="pointer-events-none absolute -right-6 -bottom-6 text-gold/10">
                  <Award size={160} />
                </div>

                <div className="relative z-10 flex flex-col justify-between">
                  {/* Top Seal & Protocol */}
                  <div className="flex items-center justify-between border-b border-gold/25 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-gold shadow-sm">
                        {cert.type === "co2" ? <Leaf size={14} /> : <ShieldCheck size={14} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                          CIRCUITO RADICI · ESG
                        </p>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-olive">
                          {cert.type === "co2" ? "Impatto Ambientale" : "Impatto Territoriale"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-forest border border-gold/30">
                      PROT. RD-00{cert.id}-2026
                    </span>
                  </div>

                  {/* Certificate Title & Description */}
                  <div className="mt-4">
                    <h4 className="font-serif text-lg font-medium text-forest">{cert.title}</h4>
                    <p className="mt-1 text-xs text-olive leading-relaxed">{cert.description}</p>
                  </div>

                  {/* Impact Metric Hero Box */}
                  <div className="my-4 rounded-2xl bg-forest/5 border border-forest/10 p-3.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-olive">
                      Valore Certificato Ufficiale
                    </p>
                    <p className="mt-0.5 font-serif text-3xl font-bold text-terracotta">
                      {cert.type === "economic" ? `€ ${cert.impactValue}` : cert.impactValue}
                    </p>
                    <p className="text-xs font-medium text-forest">{cert.unitLabel}</p>
                  </div>

                  {/* Footer & Download Button */}
                  <div className="border-t border-gold/20 pt-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-olive">Intestatario</p>
                      <p className="text-xs font-semibold text-forest">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>

                    <a
                      href={`/api/certificates/${cert.id}`}
                      download={`certificato-radici-${cert.id}.pdf`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-medium text-cream shadow-sm hover:bg-forest/90 transition-all"
                    >
                      <Download size={13} /> Scarica PDF Ufficiale A4
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {certificates.length === 0 ? (
              <p className="text-sm text-olive">
                I certificati si sbloccano dopo i primi riscatti e le condivisioni.
              </p>
            ) : null}
          </div>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="font-serif text-2xl text-forest">Archivio condivisioni</h3>
          <div className="mt-3 space-y-3 text-sm text-olive">
            {shares.map((share) => (
              <p key={share.id} className="rounded-2xl bg-cream px-4 py-3">
                {formatDate(share.createdAt)} · certificata
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FriendsTab({ user, invites }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [created, setCreated] = useState<(typeof invites)[number] | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function createInvite() {
    setPending(true);
    setError("");
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { error?: string; invite?: (typeof invites)[number] };
    setPending(false);
    if (!response.ok || !data.invite) {
      setError(data.error ?? "Invito non creato.");
      return;
    }
    setCreated(data.invite);
    setForm({ firstName: "", lastName: "", email: "" });
    router.refresh();
  }

  const selected = created ?? invites[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] bg-white p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Punti Impatto 2 · pay-local</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Invita un amico</h2>
        <p className="mt-3 text-sm leading-6 text-ink/75">
          L&apos;amico non usa voucher aziendali: paga con la propria carta, ottiene un micro-sconto e
          al saldo tu ricevi +1 Punto Impatto Sociale.
        </p>
        <div className="mt-5 space-y-3">
          <input
            placeholder="Nome"
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          />
          <input
            placeholder="Cognome"
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          />
          {error ? <p className="text-sm text-wine">{error}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={createInvite}
            className="w-full rounded-2xl bg-forest py-3 text-sm text-cream"
          >
            {pending ? "Generazione QR…" : "Genera QR-code referral"}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-cream p-6">
        <div className="flex items-center gap-2 text-forest">
          <QrCode size={18} />
          <h3 className="font-serif text-2xl">QR unico del legame</h3>
        </div>
        {selected ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
            <img
              src={`/api/qr/${selected.code}?kind=invite`}
              alt={`QR referral ${selected.firstName}`}
              className="rounded-3xl border border-gold/30 bg-paper"
            />
            <div>
              <p className="font-medium text-forest">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-sm text-olive">{selected.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-terracotta">{selected.status}</p>
              <p className="mt-3 text-sm leading-6 text-ink/75">
                L&apos;amico inquadra il QR della struttura oppure apre questo invito. Il sistema lo
                riconosce e crea l&apos;account consumer collegato a {user.firstName}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Ciao ${selected.firstName}! Ti ho inviato questo invito personale su RADICI con lo sconto del 10% sul tuo prossimo soggiorno o cena nei borghi marchigiani: ${typeof window !== "undefined" ? window.location.origin : ""}/r/${selected.code}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  Condividi su WhatsApp
                </a>
                <a
                  href={`/r/${selected.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-xs font-semibold text-terracotta hover:bg-terracotta/20 transition"
                >
                  Vedi Convenzione & Cassa →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-olive">Genera il primo invito per vedere il QR-code.</p>
        )}

        <div className="mt-6 space-y-2">
          {invites.map((invite) => (
            <button
              key={invite.id}
              type="button"
              onClick={() => setCreated(invite)}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left"
            >
              <span>
                <span className="block font-medium text-forest">
                  {invite.firstName} {invite.lastName}
                </span>
                <span className="text-xs text-olive">{invite.email}</span>
              </span>
              <span className="text-xs uppercase tracking-[0.12em] text-olive">{invite.status}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}