"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Copy,
  Download,
  Leaf,
  QrCode,
  Share2,
  ShieldCheck,
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
  VenueOffering,
} from "@/db/schema";
import {
  badgeForPoints,
  formatDate,
  formatDateTime,
  formatEuro,
  grantStatusLabel,
  venueTypeLabel,
  voucherStatusLabel,
  voucherTypeLabel,
} from "@/lib/utils";

type VenueRow = {
  venue: typeof venues.$inferSelect;
  offerings: VenueOffering[];
  flags: { offersOvernight: boolean; offersDinner: boolean; offersBoth: boolean; fromPriceCents: number };
};

type GrantEventRow = {
  id: number;
  title: string;
  category: string;
  venue_id: number;
  description: string;
  starts_at: number;
  venue_name: string;
  venue_city: string;
  seats_free: number;
  capacity: number;
  artist_meetup_included: number;
};

type SelectionRow = {
  id: number;
  voucher_id: number;
  venue_id: number;
  offering_id: number;
  service_date: string;
  selected_at: number;
  attendance_status: string;
  qr_token: string;
  venue_name: string;
  venue_city: string;
  offering_name: string;
};

type GrantRow = {
  id: number;
  voucher_id: number;
  event_id: number;
  seats_requested: number;
  status: string;
  qr_token: string;
  assigned_at: number;
  event_title: string;
  starts_at: number;
  category: string;
  theater_name: string;
  theater_city: string;
  confirmation_token: string | null;
  confirmation_response: string | null;
  respond_by: number | null;
};

type TxRow = { transaction: typeof transactions.$inferSelect; venue: typeof venues.$inferSelect };

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
  selections: SelectionRow[];
  grants: GrantRow[];
  venues: VenueRow[];
  grantEvents: GrantEventRow[];
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

function WalletTab(props: Props) {
  const { user, company, vouchers, selections, grants, venues, grantEvents, transactions } = props;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [offerFilter, setOfferFilter] = useState<"all" | "overnight" | "dinner">("all");

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
                {transaction.serviceLabel} · {formatEuro(transaction.amountCents)} · {formatDateTime(transaction.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const overnight = vouchers.filter((item) => item.benefitType === "overnight");
  const dinner = vouchers.filter((item) => item.benefitType === "dinner");

  async function selectVoucher(voucherId: number, venueId: number, offeringId: number, serviceDate: string) {
    setPendingId(`${voucherId}-${offeringId}`);
    setMessage("");
    const response = await fetch("/api/vouchers/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId, venueId, offeringId, serviceDate }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPendingId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Selezione non riuscita.");
      return;
    }
    setMessage(data.message ?? "Voucher selezionato.");
    router.refresh();
  }

  async function claimGrant(payload: {
    voucherId: number;
    eventId: number;
    seatsRequested: number;
    companionName?: string;
    companionEmail?: string;
  }) {
    setPendingId(`grant-${payload.voucherId}`);
    setMessage("");
    const response = await fetch("/api/grants/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPendingId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Prenotazione grant non riuscita.");
      return;
    }
    setMessage(data.message ?? "Grant prenotato.");
    router.refresh();
  }

  async function confirmGrant(token: string, responseValue: "confirmed" | "declined") {
    setPendingId(`cnf-${token}`);
    const response = await fetch(`/api/grants/confirm/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseValue }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPendingId(null);
    setMessage(data.message ?? data.error ?? "");
    if (response.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Piano welfare</p>
        <h2 className="mt-2 font-serif text-3xl">Portafoglio: selezione e presenza</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/75">
          La selezione è l&apos;atto fiscale: da quel momento {company?.name ?? "la tua impresa"} paga il
          fornitore, anche se non ti presenti. Il Matching Grant si sceglie dopo il pernottamento e
          occupa posti a teatro solo se confermi la presenza.
        </p>
        {company ? (
          <p className="mt-4 text-sm text-gold">
            Intestatario fiscale: {company.name} · P.IVA {company.vatNumber}
          </p>
        ) : null}
      </section>

      <BenefitDrawer
        title="Pernottamento"
        subtitle="1 voucher base da 50 €. La selezione addebita l'impresa e sblocca il Matching Grant (secondo passo)."
        items={overnight}
        selections={selections}
        grants={grants}
        venues={venues}
        offerFilter={offerFilter}
        onFilter={setOfferFilter}
        pendingId={pendingId}
        onSelect={selectVoucher}
        grantEvents={grantEvents}
        onClaimGrant={claimGrant}
        onConfirmGrant={confirmGrant}
      />
      <BenefitDrawer
        title="Cena KM 0"
        subtitle="1 voucher base da 25 €. Nessun Matching Grant: solo selezione struttura, data e presenza."
        items={dinner}
        selections={selections}
        grants={grants}
        venues={venues}
        offerFilter={offerFilter}
        onFilter={setOfferFilter}
        pendingId={pendingId}
        onSelect={selectVoucher}
      />

      {message ? <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-forest">{message}</p> : null}

      <section className="rounded-[28px] bg-white p-6">
        <h3 className="font-serif text-2xl text-forest">Movimenti</h3>
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-olive">Nessun movimento. La prima selezione apparirà qui.</p>
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

function BenefitDrawer({
  title,
  subtitle,
  items,
  selections,
  grants,
  venues,
  offerFilter,
  onFilter,
  pendingId,
  onSelect,
  grantEvents = [],
  onClaimGrant,
  onConfirmGrant,
}: {
  title: string;
  subtitle: string;
  items: Array<typeof vouchers.$inferSelect>;
  selections: SelectionRow[];
  grants: GrantRow[];
  venues: VenueRow[];
  offerFilter: "all" | "overnight" | "dinner";
  onFilter: (value: "all" | "overnight" | "dinner") => void;
  pendingId: string | null;
  onSelect: (voucherId: number, venueId: number, offeringId: number, serviceDate: string) => void;
  grantEvents?: GrantEventRow[];
  onClaimGrant?: (payload: {
    voucherId: number;
    eventId: number;
    seatsRequested: number;
    companionName?: string;
    companionEmail?: string;
  }) => void;
  onConfirmGrant?: (token: string, response: "confirmed" | "declined") => void;
}) {
  const assigned = items.find((item) => item.status === "assigned");
  const benefitType = items[0]?.benefitType ?? "overnight";
  const [venueId, setVenueId] = useState<number | "">("");
  const [offeringId, setOfferingId] = useState<number | "">("");
  const [serviceDate, setServiceDate] = useState("");
  const [eventId, setEventId] = useState<number | "">("");
  const [seats, setSeats] = useState<1 | 2>(2);
  const [companionName, setCompanionName] = useState("");
  const [companionEmail, setCompanionEmail] = useState("");

  const filteredVenues = venues.filter((row) => {
    const matchType = row.offerings.some(
      (offering) => offering.active && offering.acceptsWelfare && offering.benefitType === benefitType,
    );
    if (!matchType) return false;
    if (offerFilter === "all") return true;
    if (offerFilter === "overnight") return row.flags.offersOvernight && !row.flags.offersDinner;
    return row.flags.offersDinner && !row.flags.offersOvernight;
  });
  const bothVenues = venues.filter(
    (row) =>
      row.flags.offersBoth &&
      row.offerings.some((offering) => offering.active && offering.acceptsWelfare && offering.benefitType === benefitType),
  );
  const visibleVenues = offerFilter === "all" ? [...bothVenues, ...filteredVenues.filter((row) => !row.flags.offersBoth)] : filteredVenues;
  const selectedVenue = visibleVenues.find((row) => row.venue.id === venueId);
  const offerings = (selectedVenue?.offerings ?? []).filter(
    (offering) => offering.active && offering.acceptsWelfare && offering.benefitType === benefitType,
  );

  return (
    <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {benefitType === "overnight" ? (
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">
              Matching Grant dopo la selezione (2 posti)
            </span>
          ) : null}
          <h3 className="mt-2 font-serif text-2xl text-forest">{title}</h3>
          <p className="text-sm text-olive">{subtitle}</p>
        </div>
        <p className="text-sm font-medium text-forest">
          {items.filter((item) => item.status === "assigned").length}/{items.length} da selezionare
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`min-w-[140px] flex-1 rounded-2xl border px-3 py-2 text-xs ${
              item.status === "assigned"
                ? "border-gold/40 bg-cream text-forest"
                : "border-mist bg-mist/40 text-olive"
            }`}
          >
            <p>
              {item.origin === "extra" ? "Extra" : "Base"} · {voucherStatusLabel(item.status)}
            </p>
            <p className="mt-1 font-medium text-forest">{formatEuro(item.amountCents)}</p>
          </div>
        ))}
      </div>

      {items
        .filter((item) => item.status !== "assigned")
        .map((item) => {
          const selection = selections.find((row) => row.voucher_id === item.id);
          const grant = grants.find((row) => row.voucher_id === item.id);
          return (
            <div key={`sel-${item.id}`} className="mt-5 rounded-2xl border border-forest/15 bg-forest/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
                  {voucherTypeLabel(item.benefitType)} · {voucherStatusLabel(item.status)}
                </span>
                {selection ? (
                  <span className="text-xs text-olive">
                    Data servizio {selection.service_date} · presenza {selection.attendance_status}
                  </span>
                ) : null}
              </div>
              {selection ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <strong className="font-serif text-lg text-forest">{selection.venue_name}</strong>
                    <p className="text-xs text-olive">
                      {selection.venue_city} · {selection.offering_name}
                    </p>
                    <p className="mt-2 text-xs text-forest">
                      Addebito già generato. Il no-show non lo annulla.
                    </p>
                  </div>
                  <img
                    src={`/api/qr/${selection.qr_token}`}
                    alt="QR selezione"
                    className="h-28 w-28 rounded-2xl border border-gold/30 bg-white"
                  />
                </div>
              ) : null}

              {item.benefitType === "overnight" && grant ? (
                <div className="mt-4 rounded-xl border border-gold/40 bg-cream p-4">
                  <p className="text-[11px] uppercase tracking-wider text-terracotta">Matching Grant · {grantStatusLabel(grant.status)}</p>
                  <strong className="mt-1 block font-serif text-forest">{grant.event_title}</strong>
                  <p className="text-xs text-olive">
                    {grant.theater_name} ({grant.theater_city}) · {grant.seats_requested} posti ·{" "}
                    {formatDateTime(new Date(grant.starts_at * 1000))}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <img src={`/api/qr/${grant.qr_token}`} alt="QR grant" className="h-24 w-24 rounded-xl bg-white p-1" />
                    {grant.confirmation_token && ["assigned", "confirmation_sent"].includes(grant.status) && onConfirmGrant ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pendingId === `cnf-${grant.confirmation_token}`}
                          onClick={() => onConfirmGrant(grant.confirmation_token!, "confirmed")}
                          className="rounded-full bg-forest px-4 py-2 text-xs text-cream"
                        >
                          Confermo presenza
                        </button>
                        <button
                          type="button"
                          disabled={pendingId === `cnf-${grant.confirmation_token}`}
                          onClick={() => onConfirmGrant(grant.confirmation_token!, "declined")}
                          className="rounded-full border border-forest/20 px-4 py-2 text-xs"
                        >
                          Rinuncio (libero i posti)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {item.benefitType === "overnight" && !grant && ["selected", "attended", "no_show"].includes(item.status) && onClaimGrant ? (
                <div className="mt-4 rounded-xl border border-gold/40 bg-white p-4">
                  <p className="text-sm font-medium text-forest">Secondo passo: scegli l&apos;evento culturale</p>
                  <p className="mt-1 text-xs text-olive">
                    I posti si occupano solo ora. Se non scegli, nessun grant e nessuna capienza impegnata.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <select
                      value={eventId}
                      onChange={(event) => setEventId(Number(event.target.value))}
                      className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                    >
                      <option value="">Seleziona evento</option>
                      {grantEvents
                        .filter((event) => event.seats_free > 0)
                        .map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title} · {event.venue_city} · {event.seats_free} posti liberi
                          </option>
                        ))}
                    </select>
                    <select
                      value={seats}
                      onChange={(event) => setSeats(Number(event.target.value) === 1 ? 1 : 2)}
                      className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                    >
                      <option value={2}>2 posti (dipendente + accompagnatore)</option>
                      <option value={1}>1 posto (solo dipendente)</option>
                    </select>
                    {seats === 2 ? (
                      <>
                        <input
                          placeholder="Nome accompagnatore"
                          value={companionName}
                          onChange={(event) => setCompanionName(event.target.value)}
                          className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                        />
                        <input
                          placeholder="Email accompagnatore (facoltativa)"
                          value={companionEmail}
                          onChange={(event) => setCompanionEmail(event.target.value)}
                          className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                        />
                      </>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={!eventId || pendingId === `grant-${item.id}`}
                    onClick={() =>
                      eventId &&
                      onClaimGrant({
                        voucherId: item.id,
                        eventId: Number(eventId),
                        seatsRequested: seats,
                        companionName,
                        companionEmail,
                      })
                    }
                    className="mt-3 rounded-full bg-terracotta px-5 py-2 text-xs font-semibold uppercase tracking-wider text-cream disabled:bg-mist disabled:text-olive"
                  >
                    Prenota i posti grant
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}

      {assigned ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tutte le strutture"],
                ["overnight", "Solo pernottamento"],
                ["dinner", "Solo cena"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onFilter(id)}
                className={`rounded-full px-3 py-1 text-xs ${
                  offerFilter === id ? "bg-forest text-cream" : "bg-cream text-forest"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={venueId}
            onChange={(event) => {
              setVenueId(event.target.value ? Number(event.target.value) : "");
              setOfferingId("");
            }}
            className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 text-sm"
          >
            <option value="">1. Scegli la struttura</option>
            {visibleVenues.map((row) => (
              <option key={row.venue.id} value={row.venue.id}>
                {row.venue.name} · {row.venue.city} · {venueTypeLabel(row.venue.type)}
              </option>
            ))}
          </select>
          <select
            value={offeringId}
            onChange={(event) => setOfferingId(event.target.value ? Number(event.target.value) : "")}
            className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 text-sm"
            disabled={!selectedVenue}
          >
            <option value="">2. Scegli l&apos;offerta</option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.name} · listino {formatEuro(offering.listPriceCents)}
              </option>
            ))}
          </select>
          <label className="block text-sm text-olive">
            3. Data del servizio (obbligatoria)
            <input
              type="date"
              value={serviceDate}
              onChange={(event) => setServiceDate(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 text-forest"
            />
          </label>
          <button
            type="button"
            disabled={!venueId || !offeringId || !serviceDate || pendingId === `${assigned.id}-${offeringId}`}
            onClick={() =>
              venueId && offeringId && serviceDate && onSelect(assigned.id, Number(venueId), Number(offeringId), serviceDate)
            }
            className="rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream disabled:bg-mist disabled:text-olive"
          >
            Conferma selezione (addebito impresa)
          </button>
        </div>
      ) : null}
    </section>
  );
}

function KitTab({ user, company, venues, shares, certificates }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [venueId, setVenueId] = useState(venues[0]?.venue.id ?? 0);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const venue = venues.find((item) => item.venue.id === venueId)?.venue ?? venues[0]?.venue;

  const caption = useMemo(() => {
    const place = venue?.name ?? "una struttura RADICI";
    const companyName = company?.name ?? "la tua impresa";
    const companyTag = companyName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    return `Questo soggiorno da ${place} è stato sostenuto da ${companyName} per valorizzare l'economia locale — Certificato da RADICI.\n\n#${companyTag} #RadiciWelfare #ImpattoSociale #EconomiaLocale #KM0`;
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
    ctx.fillText(`Questo soggiorno ha sostenuto l'economia agricola locale del ${venue?.localSupportPercent ?? 15}%`, 250, height - 128);
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
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Punti Impatto · social share</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Generatore di post pronti</h2>
        <label className="mt-4 block text-sm text-olive">
          Struttura da certificare
          <select
            value={venueId}
            onChange={(event) => setVenueId(Number(event.target.value))}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          >
            {venues.map((item) => (
              <option key={item.venue.id} value={item.venue.id}>
                {item.venue.name}
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
        {preview ? <img src={preview} alt="Anteprima post certificato" className="mt-4 rounded-3xl" /> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {preview ? (
            <a href={preview} download="radici-impatto.jpg" className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-cream">
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
          <button type="button" onClick={confirmShare} className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm text-cream">
            <BadgeCheck size={16} /> Ho condiviso
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream p-4 text-sm leading-6 text-forest">{caption}</pre>
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
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="font-serif text-2xl text-forest">Certificati di Impatto</h3>
          <div className="mt-6 space-y-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="rounded-[24px] border-2 border-gold/40 bg-gradient-to-br from-[#FFFDF9] to-[#F7F2E7] p-6">
                <div className="flex items-center justify-between border-b border-gold/25 pb-3">
                  <div className="flex items-center gap-2">
                    {cert.type === "co2" ? <Leaf size={14} /> : <ShieldCheck size={14} />}
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">CIRCUITO RADICI · ESG</p>
                  </div>
                  <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-forest">
                    {cert.protocolNumber}
                  </span>
                </div>
                <h4 className="mt-4 font-serif text-lg text-forest">{cert.title}</h4>
                <p className="mt-1 text-xs text-olive">{cert.description}</p>
                <div className="my-4 rounded-2xl bg-forest/5 p-3.5 text-center">
                  <p className="font-serif text-3xl font-bold text-terracotta">
                    {cert.type === "economic" ? `€ ${cert.impactValue}` : cert.impactValue}
                  </p>
                  <p className="text-xs font-medium text-forest">{cert.unitLabel}</p>
                </div>
                <a
                  href={`/api/certificates/${cert.id}`}
                  download={`certificato-radici-${cert.id}.pdf`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs text-cream"
                >
                  <Download size={13} /> Scarica PDF
                </a>
              </div>
            ))}
            {certificates.length === 0 ? <p className="text-sm text-olive">I certificati si sbloccano dopo le prime selezioni.</p> : null}
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
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Punti Impatto · pay-local</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Invita un amico</h2>
        <p className="mt-3 text-sm leading-6 text-ink/75">
          L&apos;amico non usa voucher aziendali: paga con la propria carta, ottiene uno sconto e al saldo tu ricevi +1 Punto Impatto.
        </p>
        <div className="mt-5 space-y-3">
          <input placeholder="Nome" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
          <input placeholder="Cognome" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
          <input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
          {error ? <p className="text-sm text-wine">{error}</p> : null}
          <button type="button" disabled={pending} onClick={createInvite} className="w-full rounded-2xl bg-forest py-3 text-sm text-cream">
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
            <img src={`/api/qr/${selected.code}?kind=invite`} alt={`QR referral ${selected.firstName}`} className="rounded-3xl border border-gold/30 bg-paper" />
            <div>
              <p className="font-medium text-forest">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-sm text-olive">{selected.email}</p>
              <a href={`/r/${selected.code}`} className="mt-3 inline-flex rounded-full border border-terracotta/30 px-4 py-2 text-xs font-semibold text-terracotta">
                Vedi convenzione
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-olive">Genera il primo invito per vedere il QR-code.</p>
        )}
        <div className="mt-6 space-y-2">
          {invites.map((invite) => (
            <button key={invite.id} type="button" onClick={() => setCreated(invite)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left">
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
