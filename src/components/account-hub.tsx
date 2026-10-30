"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Leaf,
  Plus,
  QrCode,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type {
  certificates,
  companies,
  invites,
  shares,
  transactions,
  venues,
  vouchers,
  grantEvents,
  grantConfirmations,
  matchingGrants,
  bookings,
  venueOfferings,
} from "@/db/schema";
import type { UserBookingRow } from "@/lib/data";
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
type GrantEventLite = typeof grantEvents.$inferSelect;
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
  grantEvents?: GrantEventLite[];
  invites: Array<typeof invites.$inferSelect>;
  transactions: TxRow[];
  shares: Array<typeof shares.$inferSelect>;
  certificates: Array<typeof certificates.$inferSelect>;
  bookings?: UserBookingRow[];
  matchingGrantsList?: Array<{
    grant: typeof matchingGrants.$inferSelect;
    voucher: typeof vouchers.$inferSelect;
    event: GrantEventLite;
    confirmation: typeof grantConfirmations.$inferSelect | null;
  }>;
};

type Tab = "wallet" | "bookings" | "kit" | "friends";

export function AccountHub(props: Props) {
  const [tab, setTab] = useState<Tab>(props.user.role === "friend" ? "bookings" : "wallet");

  const availableTabs = [
    ...(props.user.role === "employee"
      ? [{ id: "wallet" as const, label: "Portafoglio Welfare", icon: Wallet }]
      : []),
    { id: "bookings" as const, label: "Prenotazioni & Sconti", icon: CalendarCheck },
    { id: "friends" as const, label: "Hub Amici & Referral", icon: Users },
    { id: "kit" as const, label: "Kit & Certificati", icon: Share2 },
  ];

  return (
    <div>
      <div className="tab-shadow flex gap-2 overflow-x-auto pb-3">
        {availableTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === item.id ? "bg-forest text-cream shadow-sm" : "bg-white text-forest hover:bg-cream"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "wallet" ? <WalletTab {...props} grantEvents={props.grantEvents ?? []} /> : null}
        {tab === "bookings" ? <BookingsTab {...props} /> : null}
        {tab === "kit" ? <KitTab {...props} /> : null}
        {tab === "friends" ? <FriendsTab {...props} /> : null}
      </div>
    </div>
  );
}

function WalletTab(props: Props & { grantEvents?: GrantEventLite[] }) {
  const { user, company, vouchers, venues, grantEvents = [], transactions, matchingGrantsList = [] } = props;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const groups = {
    hotel: vouchers.filter((item) => item.type === "hotel"),
    aperitivo: vouchers.filter((item) => item.type === "aperitivo"),
    theater: vouchers.filter((item) => item.type === "theater"),
  };

  async function redeem(voucherId: number, venueId: number, grantEventId?: number) {
    setPendingId(`${voucherId}-${venueId}`);
    setMessage("");
    const response = await fetch("/api/vouchers/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId, venueId, grantEventId }),
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
          Questo profilo non possiede voucher aziendali. Puoi prenotare nelle strutture convenzionate, acquistare
          cesti della filiera corta con il 10% di sconto garantito e far crescere i Punti Impatto di chi ti ha invitato.
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
        subtitle="1 Voucher Pernottamento (50€) + Matching Grant Promotori per 2 Persone (25€ + 25€)"
        items={groups.hotel}
        venues={venues}
        grantEvents={grantEvents}
        matchingGrantsList={matchingGrantsList}
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
  grantEvents = [],
  matchingGrantsList = [],
  pendingId,
  onRedeem,
}: {
  title: string;
  subtitle: string;
  items: Array<typeof vouchers.$inferSelect>;
  venues: VenueLite[];
  grantEvents: GrantEventLite[];
  matchingGrantsList?: Array<{
    grant: typeof matchingGrants.$inferSelect;
    voucher: typeof vouchers.$inferSelect;
    event: GrantEventLite;
    confirmation: typeof grantConfirmations.$inferSelect | null;
  }>;
  pendingId: string | null;
  onRedeem: (voucherId: number, venueId: number, grantEventId?: number) => void;
}) {
  const router = useRouter();
  const available = items.find((item) => item.status === "available");
  const selectedVoucher = items.find((item) => item.status === "selected" || item.status === "redeemed");
  const used = items.filter((item) => item.status === "redeemed" || item.status === "selected").length;

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [grantActionPending, setGrantActionPending] = useState(false);

  // Filtra strutture per il pernottamento (hotel e agriturismi)
  const hotelVenues = venues.filter((v) => matchesVoucher(v.type, "hotel"));

  // Eventi del Matching Grant disponibili
  const events = grantEvents.length > 0 ? grantEvents : [
    {
      id: 1,
      title: "Stagione di Prosa e Visita Esclusiva nel Ridotto",
      category: "teatro" as const,
      venueId: null,
      venueName: "Teatro Lauro Rossi",
      city: "Macerata",
      region: "Marche",
      description: "Posti riservati per 2 persone con incontro con gli attori a fine spettacolo.",
      grantAmountCents: 5000,
      artistMeetupIncluded: true,
      active: true,
      createdAt: new Date(),
    }
  ];

  // Passo 1: Struttura ricettiva selezionata
  const [selectedHotelVenue, setSelectedHotelVenue] = useState<VenueLite | null>(null);
  // Passo 2: Evento Matching Grant selezionato
  const [selectedEventId, setSelectedEventId] = useState<number>(events[0]?.id ?? 1);

  async function cancelVoucherSelection(voucherId: number) {
    if (!confirm("Vuoi davvero annullare la selezione di questa struttura? Il voucher tornerà disponibile e potrai sceglierne un'altra. Gli eventuali posti a teatro verranno liberati per evitare overbooking.")) {
      return;
    }
    setCancellingId(voucherId);
    try {
      const res = await fetch("/api/vouchers/cancel-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante l'annullamento.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Errore di connessione.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleGrantResponse(voucherId: number, action: "confirmed" | "declined") {
    setGrantActionPending(true);
    try {
      const res = await fetch("/api/grants/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante l'aggiornamento.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Errore di connessione.");
    } finally {
      setGrantActionPending(false);
    }
  }

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
            <p>
              Slot {item.slotIndex}{" "}
              {item.status === "selected" ? "· Selezionato" : item.status === "redeemed" ? "· Riscattato" : ""}
            </p>
            <p className="mt-1 font-medium">{formatEuro(item.amountCents)}</p>
          </div>
        ))}
      </div>

      {/* DETTAGLIO SOGGIORNO PRENOTATO E EVENTO MATCHING GRANT ASSEGNATO */}
      {selectedVoucher ? (
        (() => {
          const bookedHotel = venues.find((v) => v.id === selectedVoucher.venueId);
          const bookedEvent = events.find((e) => e.id === selectedVoucher.grantEventId) || events[0];
          const userGrant = matchingGrantsList?.find((mg) => mg.voucher.id === selectedVoucher.id);
          const grantStatus = userGrant?.grant.status || "assigned";

          return (
            <div className="mt-5 rounded-2xl border border-forest/20 bg-forest/5 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
                  Pernottamento Selezionato & Obbligo Fiscale B2B Assegnato
                </span>
                <span className="text-xs text-olive">
                  Selezionato il: {selectedVoucher.redeemedAt ? formatDateTime(selectedVoucher.redeemedAt) : "Oggi"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-mist bg-white p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-olive block">Struttura Ospitante</span>
                    <strong className="text-base font-serif text-forest block mt-0.5">{bookedHotel?.name ?? "Struttura Convenzionata"}</strong>
                    <p className="text-xs text-olive mt-0.5">{bookedHotel?.city} · Voucher Welfare 50€ (Finanziato da Impresa)</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-mist/80">
                    <button
                      type="button"
                      disabled={cancellingId === selectedVoucher.id}
                      onClick={() => cancelVoucherSelection(selectedVoucher.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-terracotta/40 bg-white px-3 py-2 text-xs font-semibold text-terracotta hover:bg-terracotta hover:text-cream transition disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      {cancellingId === selectedVoucher.id ? "Annullamento in corso..." : "Modifica / Annulla Selezione Struttura"}
                    </button>
                    <p className="text-[10px] text-olive/80 text-center mt-1">
                      Ripristina il voucher per scegliere un altro agriturismo o hotel.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gold/40 bg-cream p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-terracotta block font-semibold">
                        Matching Grant Promotori ({bookedEvent?.category.toUpperCase()})
                      </span>
                      {grantStatus === "confirmed" ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">
                          ✓ Presenza Confermata
                        </span>
                      ) : grantStatus === "declined" ? (
                        <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 font-bold">
                          Rinunciato (Capienza Liberata)
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 font-bold">
                          Assegnato (2 Posti)
                        </span>
                      )}
                    </div>
                    <strong className="text-base font-serif text-forest block mt-1">{bookedEvent?.title}</strong>
                    <p className="text-xs text-forest mt-0.5 font-medium">{bookedEvent?.venueName} ({bookedEvent?.city})</p>
                    <p className="text-[11px] text-olive mt-0.5">Omaggio 2 Persone (25€ + 25€) · Incontro con gli artisti incluso</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gold/30 flex flex-wrap gap-2">
                    {grantStatus !== "confirmed" ? (
                      <button
                        type="button"
                        disabled={grantActionPending}
                        onClick={() => handleGrantResponse(selectedVoucher.id, "confirmed")}
                        className="flex-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-emerald-800 transition disabled:opacity-50"
                      >
                        ✓ Conferma Presenza a Teatro
                      </button>
                    ) : null}

                    {grantStatus !== "declined" ? (
                      <button
                        type="button"
                        disabled={grantActionPending}
                        onClick={() => handleGrantResponse(selectedVoucher.id, "declined")}
                        className="rounded-full border border-terracotta/40 bg-white px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/10 transition disabled:opacity-50"
                        title="Libera la capienza per evitare overbooking se sai di non poter andare a teatro"
                      >
                        Rinuncia ai Posti (Anti-overbooking)
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}

      {/* FLUSSO DI SELEZIONE: PASSO 1 (PERNOTTAMENTO) -> PASSO 2 (EVENTO MATCHING GRANT) */}
      {available ? (
        <div className="mt-5 space-y-4">
          {/* PASSO 1: Scelta Struttura Ricettiva */}
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

          {/* PASSO 2: Scelta dell'Evento / Spettacolo del Matching Grant (sbloccata una volta selezionato il soggiorno) */}
          {selectedHotelVenue ? (
            <div className="rounded-2xl border border-gold/40 bg-cream p-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                  Passo 2 di 2
                </span>
                <p className="text-xs uppercase tracking-[0.14em] font-semibold text-terracotta">
                  Scegli l'Esperienza / Evento del Matching Grant Promotori
                </p>
              </div>
              <p className="mt-2 text-xs text-olive leading-relaxed">
                Avendo selezionato il soggiorno presso <strong>{selectedHotelVenue.name}</strong>, i Promotori attivano il Matching Grant di 50€ (25€ per te + 25€ per il tuo accompagnatore). Scegli a quale evento territoriale partecipare:
              </p>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {events.map((ev) => (
                  <label
                    key={ev.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-xs transition ${
                      selectedEventId === ev.id
                        ? "border-forest bg-white font-medium text-forest shadow-sm"
                        : "border-mist bg-white/70 text-ink/75 hover:border-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedEvent"
                      value={ev.id}
                      checked={selectedEventId === ev.id}
                      onChange={() => setSelectedEventId(ev.id)}
                      className="mt-0.5 accent-forest"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sand px-1.5 py-0.5 text-[10px] uppercase font-semibold text-forest">
                          {ev.category}
                        </span>
                        <span className="text-[11px] text-olive">{ev.venueName} · {ev.city}</span>
                      </div>
                      <strong className="block text-forest text-sm font-serif">{ev.title}</strong>
                      <p className="text-[11px] text-olive leading-relaxed">{ev.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* CONFERMA E RISCATTO DEFINITIVO */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gold/20 pt-4">
                <div>
                  <p className="text-xs text-olive">
                    Riepilogo: <strong>{selectedHotelVenue.name}</strong> + <strong>{events.find(e => e.id === selectedEventId)?.venueName ?? "Evento Territoriale"}</strong>
                  </p>
                  <p className="text-[11px] text-terracotta mt-0.5">
                    Fattura B2B intestata all'azienda per la struttura · Quota Evento 50€ (2 persone) coperta dai Promotori.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pendingId === `${available.id}-${selectedHotelVenue.id}`}
                  onClick={() => onRedeem(available.id, selectedHotelVenue.id, selectedEventId)}
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
  const router = useRouter();
  const available = items.find((item) => item.status === "available");
  const selectedVoucher = items.find((item) => item.status === "selected" || item.status === "redeemed");
  const used = items.filter((item) => item.status === "redeemed" || item.status === "selected").length;
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function cancelVoucherSelection(voucherId: number) {
    if (!confirm("Vuoi davvero annullare la selezione di questo locale? Il voucher tornerà disponibile e potrai sceglierne un altro.")) {
      return;
    }
    setCancellingId(voucherId);
    try {
      const res = await fetch("/api/vouchers/cancel-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante l'annullamento.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Errore di connessione.");
    } finally {
      setCancellingId(null);
    }
  }

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
            <p>
              Slot {item.slotIndex}{" "}
              {item.status === "selected" ? "· Selezionato" : item.status === "redeemed" ? "· Riscattato" : ""}
            </p>
            <p className="mt-1 font-medium">{formatEuro(item.amountCents)}</p>
          </div>
        ))}
      </div>

      {/* DETTAGLIO CENA SELEZIONATA */}
      {selectedVoucher ? (
        (() => {
          const bookedVenue = venues.find((v) => v.id === selectedVoucher.venueId);
          return (
            <div className="mt-5 rounded-2xl border border-forest/20 bg-forest/5 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
                  Cena / Degustazione Selezionata
                </span>
                <span className="text-xs text-olive">
                  Selezionato il: {selectedVoucher.redeemedAt ? formatDateTime(selectedVoucher.redeemedAt) : "Oggi"}
                </span>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-mist bg-white p-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-olive block">Ristorante / Osteria Tipica</span>
                  <strong className="text-base font-serif text-forest block mt-0.5">{bookedVenue?.name ?? "Locale Convenzionato"}</strong>
                  <p className="text-xs text-olive mt-0.5">{bookedVenue?.city} · Voucher Welfare 25€ (Finanziato da Impresa)</p>
                </div>
                <button
                  type="button"
                  disabled={cancellingId === selectedVoucher.id}
                  onClick={() => cancelVoucherSelection(selectedVoucher.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-terracotta/40 bg-white px-4 py-2 text-xs font-semibold text-terracotta hover:bg-terracotta hover:text-cream transition disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  {cancellingId === selectedVoucher.id ? "Annullamento in corso..." : "Modifica / Annulla Selezione Locale"}
                </button>
              </div>
            </div>
          );
        })()
      ) : null}

      {available ? (
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
      ) : null}
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

function BookingsTab({ user, venues, grantEvents = [], bookings = [] }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const isFriend = user.role === "friend";
  const producerVenues = venues.filter((v) => v.type === "producer");
  const hospitalityVenues = venues.filter((v) => v.type !== "producer");

  const [targetKind, setTargetKind] = useState<"producer" | "venue" | "event">(
    producerVenues.length > 0 ? "producer" : "venue"
  );
  const [selectedProducerId, setSelectedProducerId] = useState<number>(producerVenues[0]?.id || 12);
  const [selectedVenueId, setSelectedVenueId] = useState<number>(hospitalityVenues[0]?.id || 1);
  const [selectedEventId, setSelectedEventId] = useState<number>(grantEvents[0]?.id || 1);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>("20:00");
  const [partySize, setPartySize] = useState<number>(1);
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);

  // Calcolo prezzi live
  const activeProducer = producerVenues.find((p) => p.id === selectedProducerId) || producerVenues[0];
  const activeVenue = hospitalityVenues.find((v) => v.id === selectedVenueId) || hospitalityVenues[0];
  const activeEvent = grantEvents.find((e) => e.id === selectedEventId) || grantEvents[0];

  let unitListPriceCents = 0;
  if (targetKind === "producer" && activeProducer) {
    unitListPriceCents = activeProducer.priceBasketCents || 3800;
  } else if (targetKind === "event" && activeEvent) {
    unitListPriceCents = 2500;
  } else if (activeVenue) {
    unitListPriceCents =
      activeVenue.type === "hotel" || activeVenue.type === "agriturismo"
        ? activeVenue.priceHotelCents || 6000
        : activeVenue.priceAperitivoCents || 3000;
  }

  // Regola fondamentale: Sconti SOLO per Amici invitati da referral. Dipendenti: 0% sconto.
  const discountPercent = isFriend ? 10 : 0;
  const totalListCents = unitListPriceCents * partySize;
  const discountCents = Math.round((totalListCents * discountPercent) / 100);
  const finalPriceCents = totalListCents - discountCents;

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let targetVenueId = selectedVenueId;
      let bookingType: "local_basket" | "hospitality" | "dinner" | "theater_event" = "hospitality";
      let grantEventId: number | null = null;

      if (targetKind === "producer") {
        targetVenueId = selectedProducerId;
        bookingType = "local_basket";
      } else if (targetKind === "event") {
        targetVenueId = activeEvent?.venueId || selectedVenueId;
        bookingType = "theater_event";
        grantEventId = selectedEventId;
      } else {
        targetVenueId = selectedVenueId;
        bookingType = activeVenue?.type === "restaurant" ? "dinner" : "hospitality";
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: targetVenueId,
          grantEventId,
          bookingType,
          bookingDate,
          timeSlot: targetKind === "producer" ? "Consegna / Ritiro" : timeSlot,
          partySize,
          guestPhone,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Errore durante la creazione della prenotazione o dell'ordine.");
      } else {
        setSuccessMsg(data.message || (targetKind === "producer" ? "Ordine cesto registrato con successo!" : "Prenotazione registrata con successo!"));
        setShowForm(false);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: number, newStatus: "presence_confirmed" | "cancelled") {
    setActionPendingId(bookingId);
    setErrorMsg("");
    try {
      const res = await fetch("/api/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante l'aggiornamento.");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert("Errore di connessione.");
    } finally {
      setActionPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Intestazione Sezione */}
      <div className="rounded-[28px] bg-gradient-to-br from-forest to-[#0d221a] p-6 text-cream shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
              <CalendarCheck size={14} /> {isFriend ? "Circuito Convenzioni & Sconti Community" : "Prenotazioni & Cesti KM 0"}
            </div>
            <h2 className="mt-2 font-serif text-3xl font-normal text-cream md:text-4xl">
              {isFriend ? "Prenotazioni & Spettacoli nei Borghi" : "Prenotazioni, Spettacoli & Filiera Corta"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/80">
              {isFriend ? (
                <>
                  Come membro della community RADICI hai accesso a uno sconto garantito del <strong>10%</strong> su
                  tutte le strutture, i cesti di eccellenze gastronomiche e gli eventi convenzionati. Prenota in anticipo
                  e conferma la tua presenza per permettere ai borghi di gestire i posti senza rischio di overbooking.
                </>
              ) : (
                <>
                  Prenota in anticipo e conferma la tua presenza per permettere ai borghi di gestire i posti senza rischio di overbooking.
                  Puoi inoltre acquistare i cesti di eccellenze gastronomiche direttamente dai produttori della filiera corta marchigiana.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-forest shadow-md transition hover:bg-gold/90"
          >
            {showForm ? <XCircle size={18} /> : <Plus size={18} />}
            {showForm ? "Chiudi Modulo" : isFriend ? "Nuova Prenotazione" : "Ordina Cesto KM 0 / Prenota"}
          </button>
        </div>
      </div>

      {/* Messaggi di Alert */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-xs text-emerald-700 underline">
            Chiudi
          </button>
        </div>
      )}

      {/* Modulo Nuova Prenotazione o Acquisto Cesto (a comparsa) */}
      {showForm && (
        <form onSubmit={handleCreateBooking} className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between border-b border-forest/10 pb-4">
            <div>
              <h3 className="font-serif text-2xl text-forest">
                {targetKind === "producer" ? "Ordina Cesto Prodotti Locali KM 0" : "Effettua una Nuova Prenotazione"}
              </h3>
              <p className="mt-1 text-xs text-olive">
                {targetKind === "producer"
                  ? "Eccellenze agroalimentari marchigiane fornite direttamente dai produttori di filiera corta."
                  : isFriend
                  ? "Sconto 10% applicato automaticamente al saldo presso la struttura."
                  : "Prenotazione con conferma anticipata per evitare overbooking."}
              </p>
            </div>
            {isFriend ? (
              <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest">
                Sconto 10% Community
              </span>
            ) : (
              <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest">
                Acquisto Diretto
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-forest">
                Cosa desideri acquistare o prenotare?
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetKind("producer")}
                  className={`rounded-2xl py-3 px-2 text-xs md:text-sm font-medium transition text-center ${
                    targetKind === "producer"
                      ? "bg-forest text-cream shadow-sm"
                      : "border border-forest/10 bg-cream text-forest hover:bg-forest/5"
                  }`}
                >
                  <ShoppingBag className="mx-auto mb-1" size={16} />
                  Cesto KM 0
                </button>
                <button
                  type="button"
                  onClick={() => setTargetKind("venue")}
                  className={`rounded-2xl py-3 px-2 text-xs md:text-sm font-medium transition text-center ${
                    targetKind === "venue"
                      ? "bg-forest text-cream shadow-sm"
                      : "border border-forest/10 bg-cream text-forest hover:bg-forest/5"
                  }`}
                >
                  <Calendar className="mx-auto mb-1" size={16} />
                  Struttura
                </button>
                <button
                  type="button"
                  onClick={() => setTargetKind("event")}
                  className={`rounded-2xl py-3 px-2 text-xs md:text-sm font-medium transition text-center ${
                    targetKind === "event"
                      ? "bg-forest text-cream shadow-sm"
                      : "border border-forest/10 bg-cream text-forest hover:bg-forest/5"
                  }`}
                >
                  <Ticket className="mx-auto mb-1" size={16} />
                  Spettacolo
                </button>
              </div>

              {targetKind === "producer" ? (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-forest">Seleziona il Produttore della Filiera Corta</label>
                  <select
                    value={selectedProducerId}
                    onChange={(e) => setSelectedProducerId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-3 text-sm text-forest"
                  >
                    {producerVenues.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city}) — {p.basketName} ({formatEuro(p.priceBasketCents)})
                      </option>
                    ))}
                  </select>
                  {activeProducer && (
                    <div className="mt-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-xs text-forest">
                      <span className="font-semibold text-terracotta uppercase tracking-wider text-[11px] block">
                        Eccellenza Gastronomica Marchigiana
                      </span>
                      <strong className="text-sm font-serif text-forest block mt-0.5">{activeProducer.basketName}</strong>
                      <p className="mt-1 text-ink/80 leading-relaxed">{activeProducer.basketDescription}</p>
                      <p className="mt-2 text-olive font-medium">
                        Prezzo unitario cesto: {formatEuro(activeProducer.priceBasketCents)}
                      </p>
                    </div>
                  )}
                </div>
              ) : targetKind === "venue" ? (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-forest">Seleziona la Struttura Convenzionata</label>
                  <select
                    value={selectedVenueId}
                    onChange={(e) => setSelectedVenueId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-3 text-sm text-forest"
                  >
                    {hospitalityVenues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({venueTypeLabel(v.type)}) · {v.city} ({v.province})
                      </option>
                    ))}
                  </select>
                  {activeVenue && (
                    <p className="mt-1.5 text-xs text-olive">
                      {activeVenue.description.slice(0, 100)}...
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-forest">Seleziona lo Spettacolo Culturale</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-3 text-sm text-forest"
                  >
                    {grantEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} @ {ev.venueName} · {ev.city} (Capienza: {ev.capacity} posti)
                      </option>
                    ))}
                  </select>
                  {activeEvent && (
                    <div className="mt-2 rounded-2xl bg-gold/10 p-3 text-xs text-forest">
                      <p className="font-semibold text-gold-darker">{activeEvent.title}</p>
                      <p className="mt-1 text-ink/80">{activeEvent.description}</p>
                      <p className="mt-1 text-olive">
                        {activeEvent.startsAt ? `Data: ${formatDate(activeEvent.startsAt)} · ` : ""}
                        Capienza massima: {activeEvent.capacity} posti
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest">
                    {targetKind === "producer" ? "Data Desiderata Ritiro/Spedizione" : "Data Prenotazione"}
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest">
                    {targetKind === "producer" ? "Modalità / Note Consegna" : "Orario / Fascia"}
                  </label>
                  <input
                    type="text"
                    placeholder={targetKind === "producer" ? "es. Ritiro in azienda o Spedizione" : "es. 20:30 o Check-in"}
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest">
                    {targetKind === "producer" ? "Numero di Cesti" : "Numero Ospiti / Posti"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-2.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest">Telefono Contatto</label>
                  <input
                    type="tel"
                    placeholder="+39 340 0000000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-forest">
                  {targetKind === "producer" ? "Indirizzo di Spedizione o Note per il Produttore" : "Note o Richieste Speciali"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    targetKind === "producer"
                      ? "Es. Via Roma 10, Sirolo (AN) - citofono Rossi, oppure 'ritiro di persona sabato mattina'..."
                      : "Es. arrivo in tarda serata, intolleranze alimentari, preferenze camera..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-forest/15 bg-cream px-4 py-2.5 text-sm"
                />
              </div>

              {/* Box Riepilogo Costi & Sconto Community */}
              <div className="mt-4 rounded-2xl bg-cream/70 p-4 border border-forest/10">
                <p className="text-xs font-bold uppercase tracking-wider text-forest">Riepilogo Importo</p>
                <div className="mt-2 space-y-1.5 text-xs text-ink/80">
                  <div className="flex justify-between">
                    <span>
                      Listino ({partySize} {targetKind === "producer" ? (partySize === 1 ? "cesto" : "cesti") : (partySize === 1 ? "persona" : "persone")}):
                    </span>
                    <span className={`font-medium ${isFriend ? "line-through text-olive" : "text-forest"}`}>
                      {formatEuro(totalListCents)}
                    </span>
                  </div>
                  {isFriend ? (
                    <div className="flex justify-between text-terracotta">
                      <span>Sconto Esclusivo Community RADICI (-10%):</span>
                      <span className="font-semibold">-{formatEuro(discountCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-forest/10 pt-2 text-sm font-bold text-forest">
                    <span>{targetKind === "producer" ? "Totale Ordine Cesto:" : "Importo da corrispondere:"}</span>
                    <span className="text-base text-forest">{formatEuro(finalPriceCents)}</span>
                  </div>
                  {!isFriend ? (
                    <p className="mt-1 text-[11px] text-olive leading-normal">
                      Tariffa da listino produttore. I voucher welfare aziendali per soggiorni e cene sono disponibili nella scheda &quot;Portafoglio Welfare&quot;.
                    </p>
                  ) : null}
                </div>
              </div>

              {errorMsg && <p className="mt-3 text-xs font-medium text-wine">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-full bg-forest py-3.5 text-sm font-semibold text-cream shadow-md transition hover:bg-forest/90 disabled:opacity-50"
              >
                {loading
                  ? "Registrazione in corso..."
                  : targetKind === "producer"
                  ? isFriend
                    ? `Ordina Cesto KM 0 (-10% Sconto Community · ${formatEuro(finalPriceCents)})`
                    : `Ordina Cesto KM 0 (${formatEuro(finalPriceCents)})`
                  : isFriend
                  ? `Invia Prenotazione con Sconto 10% (${formatEuro(finalPriceCents)})`
                  : `Invia Prenotazione (${formatEuro(finalPriceCents)})`}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Elenco Prenotazioni dell'Utente */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-forest">Le Tue Prenotazioni & Ordini</h3>
          <span className="text-xs font-semibold text-olive">
            {bookings.length} {bookings.length === 1 ? "registrazione trovata" : "registrazioni trovate"}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-[28px] border-2 border-dashed border-forest/15 bg-white p-10 text-center">
            <Calendar className="mx-auto text-forest/30" size={48} />
            <h4 className="mt-3 font-serif text-xl text-forest">Nessun ordine o prenotazione attiva</h4>
            <p className="mt-1 text-sm text-olive max-w-md mx-auto">
              Non hai ancora effettuato ordini di cesti KM 0 o prenotato soggiorni e spettacoli nei borghi.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream"
            >
              Effettua un Ordine o Prenotazione
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bookings.map(({ booking: b, venue: v, grantEvent: ge }) => {
              const isPending = b.status === "pending";
              const isConfirmed = b.status === "confirmed";
              const isPresenceConfirmed = b.status === "presence_confirmed";
              const isAttended = b.status === "attended";
              const isCancelled = b.status === "cancelled" || b.status === "rejected";
              const isBasket = b.bookingType === "local_basket";

              return (
                <div
                  key={b.id}
                  className={`relative flex flex-col justify-between rounded-[26px] border p-6 transition-all ${
                    isPresenceConfirmed
                      ? "border-emerald-300 bg-emerald-50/40 shadow-sm"
                      : isConfirmed
                      ? "border-blue-200 bg-blue-50/30 shadow-sm"
                      : isCancelled
                      ? "border-forest/10 bg-cream/30 opacity-70"
                      : "border-forest/10 bg-white shadow-sm"
                  }`}
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isBasket ? "bg-amber-100 text-amber-900" : "bg-forest/5 text-forest"
                        }`}>
                          {isBasket
                            ? "Cesto Filiera Corta KM 0"
                            : b.bookingType === "theater_event"
                            ? "Spettacolo Teatrale"
                            : b.bookingType === "dinner"
                            ? "Cena & Sapori"
                            : "Pernottamento"}
                        </span>
                        <h4 className="mt-1 font-serif text-xl font-bold text-forest">{v.name}</h4>
                        <p className="text-xs text-olive">
                          {v.city} ({v.province}) · {v.region}
                        </p>
                      </div>

                      {/* Badge di Stato */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            <Clock size={12} /> {isBasket ? "Ordine in Elaborazione" : "In Attesa di Accettazione"}
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            <CheckCircle2 size={12} /> {isBasket ? "Cesto Confermato dal Produttore" : "Confermata dal Gestore"}
                          </span>
                        )}
                        {isPresenceConfirmed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 size={12} /> {isBasket ? "Ritiro / Ricezione Confermata ✓" : "Presenza Riconfermata ✓"}
                          </span>
                        )}
                        {isAttended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                            <Sparkles size={12} /> {isBasket ? "Consegnato ✓" : "Completata (Check-in effettuato)"}
                          </span>
                        )}
                        {b.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                            <XCircle size={12} /> Non Disponibile
                          </span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <XCircle size={12} /> Annullata
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dettagli Cesto o Evento */}
                    {isBasket && v.basketName && (
                      <div className="mt-3 rounded-2xl bg-amber-50/70 p-3 text-xs text-forest border border-amber-200/60">
                        <p className="font-bold text-terracotta">{v.basketName}</p>
                        <p className="mt-0.5 text-ink/80 text-[11px] leading-relaxed">{v.basketDescription}</p>
                      </div>
                    )}

                    {ge && (
                      <div className="mt-3 rounded-2xl bg-gold/10 p-3 text-xs text-forest border border-gold/20">
                        <p className="font-bold text-forest">Spettacolo: {ge.title}</p>
                        <p className="text-olive">
                          Posti riservati all&apos;evento per {b.partySize} persone
                        </p>
                      </div>
                    )}

                    {/* Dettagli Prenotazione */}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-cream/60 p-3 text-xs">
                      <div>
                        <span className="block text-olive font-medium">
                          {isBasket ? "Data Desiderata:" : "Data di Arrivo:"}
                        </span>
                        <span className="font-bold text-forest">{formatDate(b.bookingDate)}</span>
                      </div>
                      <div>
                        <span className="block text-olive font-medium">
                          {isBasket ? "Modalità:" : "Orario / Fascia:"}
                        </span>
                        <span className="font-bold text-forest">{b.timeSlot || "Standard"}</span>
                      </div>
                      <div>
                        <span className="block text-olive font-medium">
                          {isBasket ? "Quantità Cesti:" : "Numero Ospiti:"}
                        </span>
                        <span className="font-bold text-forest">
                          {b.partySize} {isBasket ? (b.partySize === 1 ? "cesto" : "cesti") : (b.partySize === 1 ? "persona" : "persone")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-olive font-medium">Prezzo Totale:</span>
                        <span className="font-bold text-forest">
                          {formatEuro(b.finalPriceCents)} {b.discountCents > 0 ? "(-10%)" : ""}
                        </span>
                      </div>
                    </div>

                    {b.notes && (
                      <p className="mt-2 text-xs text-olive italic">
                        Note: &ldquo;{b.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Azioni Interattive per l'Ospite */}
                  {(isPending || isConfirmed) && (
                    <div className="mt-5 border-t border-forest/10 pt-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {!isPresenceConfirmed ? (
                          <button
                            type="button"
                            disabled={actionPendingId === b.id}
                            onClick={() => updateBookingStatus(b.id, "presence_confirmed")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-emerald-800 transition disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> {isBasket ? "Conferma Ricezione / Ritiro" : "Conferma la tua Presenza"}
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-800 font-semibold">
                            ✓ {isBasket ? "Hai confermato il ritiro/ricezione" : "Hai confermato l'arrivo"}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={actionPendingId === b.id}
                        onClick={() => {
                          if (confirm(isBasket ? "Vuoi davvero annullare questo ordine?" : "Vuoi davvero annullare questa prenotazione? I posti verranno liberati.")) {
                            updateBookingStatus(b.id, "cancelled");
                          }
                        }}
                        className="rounded-full border border-forest/20 px-3.5 py-2 text-xs font-medium text-forest hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition disabled:opacity-50"
                      >
                        {isBasket ? "Annulla Ordine" : "Annulla Prenotazione"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}