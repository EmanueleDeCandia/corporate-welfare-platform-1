"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { VenueOffering } from "@/db/schema";
import { formatEuro, voucherTypeLabel } from "@/lib/utils";

export function CheckinClient({
  venue,
  offerings,
  loggedIn,
  role,
  inviteCode,
}: {
  venue: { id: number; name: string; type: string; checkinCode: string };
  offerings: VenueOffering[];
  loggedIn: boolean;
  role?: string;
  inviteCode?: string;
}) {
  const router = useRouter();
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? 0);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const offering = offerings.find((item) => item.id === offeringId) ?? offerings[0];
  const isFriend = role === "friend";
  const listPrice = offering?.listPriceCents ?? 0;
  const discount = isFriend && offering ? Math.round((listPrice * offering.friendDiscountBps) / 10000) : 0;
  const total = listPrice - discount;
  const isTheater = venue.type === "theater" || venue.type === "show_venue";

  async function pay(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        offeringId: offering?.id,
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
          {isTheater ? "Botteghino / Controllo accessi" : "Identificazione ospite"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-olive">
          {isTheater
            ? "Se hai il Matching Grant accedi con l'account dipendente e mostra il QR del grant. Gli amici pagano con sconto community."
            : "Inquadra il QR del luogo e accedi. Se sei stato invitato, registra un account amico: il sistema applica lo sconto community."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={`/login?next=/checkin/${venue.checkinCode}`} className="rounded-full bg-forest px-6 py-2.5 text-center text-sm font-medium text-cream">
            Accedi
          </a>
          <a href={inviteCode ? `/registrati?invite=${inviteCode}` : "/registrati"} className="rounded-full border border-forest/20 px-6 py-2.5 text-center text-sm text-forest">
            Registrati come amico
          </a>
        </div>
      </div>
    );
  }

  if (isTheater && role === "employee") {
    return (
      <div className="rounded-[28px] bg-white p-6 border border-gold/30">
        <h2 className="font-serif text-2xl text-forest">Matching Grant</h2>
        <p className="mt-3 text-sm text-olive">
          Il grant si prenota dal portafoglio dopo la selezione del pernottamento. Se hai già i posti, mostra il QR grant in botteghino.
        </p>
        <a href="/account" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream">
          Apri il portafoglio
        </a>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="rounded-[28px] bg-white p-6">
        <p className="text-sm text-olive">Questa struttura non ha servizi di listino consumer.</p>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/10">
      <p className="text-xs uppercase tracking-[0.16em] text-olive">Pagamento ospite · pay-local</p>
      <h2 className="mt-2 font-serif text-2xl text-forest">Saldo in struttura</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {offerings.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOfferingId(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${offeringId === item.id ? "bg-forest text-cream" : "bg-cream text-forest"}`}
          >
            {voucherTypeLabel(item.benefitType)} · {item.name}
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
        <input required placeholder="Intestatario carta" value={cardName} onChange={(event) => setCardName(event.target.value)} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
        <input required placeholder="Numero carta (simulazione)" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="MM/AA" value={expiry} onChange={(event) => setExpiry(event.target.value)} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
          <input required placeholder="CVC" value={cvc} onChange={(event) => setCvc(event.target.value)} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3" />
        </div>
      </div>
      {role === "employee" ? (
        <p className="mt-3 text-xs text-olive">Stai pagando come privato. Per il welfare usa il portafoglio.</p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
      <button type="submit" disabled={pending} className="mt-5 w-full rounded-2xl bg-terracotta py-3 text-sm font-medium text-cream">
        {pending ? "Autorizzazione in corso…" : `Paga ${formatEuro(total)}`}
      </button>
    </form>
  );
}
