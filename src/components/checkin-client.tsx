"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { vouchers as vouchersTable } from "@/db/schema";
import { formatEuro, FRIEND_DISCOUNT_RATE, servicePrice, voucherTypeLabel } from "@/lib/utils";
import { Ticket, ArrowRight, CheckCircle2 } from "lucide-react";

type Service = "hotel" | "aperitivo" | "theater";
type VoucherLite = typeof vouchersTable.$inferSelect;

export function CheckinClient({
  venue,
  loggedIn,
  role,
  inviteCode,
  userVouchers = [],
}: {
  venue: {
    id: number;
    name: string;
    type: string;
    checkinCode: string;
    priceHotelCents: number;
    priceAperitivoCents: number;
    priceShowCents: number;
  };
  loggedIn: boolean;
  role?: string;
  inviteCode?: string;
  userVouchers?: VoucherLite[];
}) {
  const router = useRouter();
  const options = (
    [
      venue.priceHotelCents > 0 ? "hotel" : null,
      venue.priceAperitivoCents > 0 ? "aperitivo" : null,
      venue.priceShowCents > 0 ? "theater" : null,
    ] as Array<Service | null>
  ).filter((item): item is Service => Boolean(item));

  const [service, setService] = useState<Service>(options[0] ?? "hotel");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const isTheater = venue.type === "theater";
  const isEmployee = role === "employee";

  // Verifica se l'impiegato ha un voucher pernottamento che include questo teatro come Matching Grant
  const matchingHotelVoucher = userVouchers.find(
    (v) => v.type === "hotel" && (v.theaterVenueId === venue.id || v.status === "redeemed")
  );

  const listPrice = servicePrice(venue, service);
  const isFriend = role === "friend";
  const discount = isFriend ? Math.round(listPrice * FRIEND_DISCOUNT_RATE) : 0;
  const total = listPrice - discount;

  async function pay(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        service,
        cardName,
        cardNumber,
        inviteCode,
      }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(data.error ?? "Pagamento non riuscito.");
      return;
    }
    setMessage(data.message ?? "Pagamento confermato.");
    router.refresh();
  }

  if (!loggedIn) {
    return (
      <div className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/10">
        <h2 className="font-serif text-2xl text-forest">
          {isTheater ? "Botteghino / Controllo Accessi" : "Identificazione ospite"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-olive">
          {isTheater
            ? "Se hai diritto al Matching Grant (abbinato al tuo pernottamento aziendale) accedi con il tuo account dipendente per convalidare l'ingresso gratuito per 2 persone. Se sei un ospite privato, accedi o registrati per ottenere il micro-sconto community del 10% sul biglietto."
            : "Inquadra il QR del luogo e accedi. Se sei stato invitato, registra un account amico: il sistema ti riconosce e applica il micro-sconto community."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`/login?next=/checkin/${venue.checkinCode}`}
            className="rounded-full bg-forest px-6 py-2.5 text-center text-sm font-medium text-cream hover:bg-forest/90 transition shadow-sm"
          >
            Accedi con il tuo account
          </a>
          <a
            href={inviteCode ? `/registrati?invite=${inviteCode}` : "/registrati"}
            className="rounded-full border border-forest/20 px-6 py-2.5 text-center text-sm text-forest hover:bg-sand/30 transition"
          >
            Registrati come amico
          </a>
        </div>
      </div>
    );
  }

  // SE È UN DIPENDENTE AL BOTTEGHINO DI UN TEATRO/EVENTO:
  if (isTheater && isEmployee) {
    return (
      <div className="rounded-[28px] bg-white p-6 shadow-sm border border-gold/30">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gold/20 p-2 text-terracotta">
            <Ticket size={20} />
          </span>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-terracotta block">
              Botteghino · Matching Grant Promotori
            </span>
            <h2 className="font-serif text-2xl text-forest">Convalida Ingresso Spettacolo</h2>
          </div>
        </div>

        {matchingHotelVoucher ? (
          <div className="mt-5 rounded-2xl border border-forest/20 bg-forest/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-forest font-medium text-sm">
              <CheckCircle2 size={18} className="text-forest" />
              <span>Matching Grant attivo per 2 persone!</span>
            </div>
            <p className="text-xs text-olive leading-relaxed">
              Hai già associato il tuo pernottamento welfare. Il tuo biglietto omaggio per 2 persone (25€ + 25€) e l'incontro con gli artisti sono coperti integralmente dal Fondo Promotori.
            </p>
            <div className="pt-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-forest/90 transition"
              >
                Vai al tuo profilo per mostrare il voucher <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-gold/30 bg-cream p-4 space-y-3">
            <p className="text-sm font-medium text-forest">
              Vuoi abbinare il Matching Grant per questo spettacolo?
            </p>
            <p className="text-xs text-olive leading-relaxed">
              Se hai a disposizione un voucher welfare pernottamento da 50€, puoi selezionare questo teatro/evento direttamente dal tuo profilo e riscattare l'omaggio per 2 persone a costo zero.
            </p>
            <div className="pt-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-forest/90 transition"
              >
                Apri il profilo per selezionare e riscattare <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-mist pt-4">
          <p className="text-xs text-olive">
            Preferisci acquistare un biglietto aggiuntivo a pagamento come privato?
          </p>
          <button
            type="button"
            onClick={() => setService("theater")}
            className="mt-2 text-xs font-semibold text-terracotta hover:underline"
          >
            Procedi con pagamento consumer ({formatEuro(total)})
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/10">
      <p className="text-xs uppercase tracking-[0.16em] text-olive">Pagamento ospite · pay-local</p>
      <h2 className="mt-2 font-serif text-2xl text-forest">Saldo in struttura</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setService(item)}
            className={`rounded-full px-4 py-2 text-sm ${
              service === item ? "bg-forest text-cream" : "bg-cream text-forest"
            }`}
          >
            {voucherTypeLabel(item)}
          </button>
        ))}
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Prezzo di listino</dt>
          <dd>{formatEuro(listPrice)}</dd>
        </div>
        <div className="flex justify-between text-terracotta">
          <dt>Micro-sconto community</dt>
          <dd>-{formatEuro(discount)}</dd>
        </div>
        <div className="flex justify-between font-medium text-forest">
          <dt>Totale da pagare ora</dt>
          <dd>{formatEuro(total)}</dd>
        </div>
      </dl>
      <div className="mt-5 grid gap-3">
        <input
          required
          placeholder="Intestatario carta"
          value={cardName}
          onChange={(event) => setCardName(event.target.value)}
          className="rounded-2xl border border-forest/10 bg-cream px-4 py-3"
        />
        <input
          required
          placeholder="Numero carta (simulazione Stripe)"
          value={cardNumber}
          onChange={(event) => setCardNumber(event.target.value)}
          className="rounded-2xl border border-forest/10 bg-cream px-4 py-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="MM/AA"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          />
          <input
            required
            placeholder="CVC"
            value={cvc}
            onChange={(event) => setCvc(event.target.value)}
            className="rounded-2xl border border-forest/10 bg-cream px-4 py-3"
          />
        </div>
      </div>
      {role === "employee" ? (
        <p className="mt-3 text-xs text-olive">
          Stai pagando come privato. Per il riscatto welfare o per il Matching Grant accedi al tuo profilo.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-2xl bg-terracotta py-3 text-sm font-medium text-cream hover:bg-terracotta/90 transition shadow-sm"
      >
        {pending ? "Autorizzazione in corso…" : `Paga ${formatEuro(total)}`}
      </button>
    </form>
  );
}
