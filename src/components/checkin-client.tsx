"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AfterHydration } from "@/components/after-hydration";
import { apiFetch } from "@/lib/session-client";
import type { LocalProduct, VenueOffering } from "@/db/schema";
import { formatEuro, voucherTypeLabel } from "@/lib/utils";
import { Leaf } from "lucide-react";

export function CheckinClient(props: {
  venue: { id: number; name: string; type: string; checkinCode: string };
  offerings: VenueOffering[];
  producer?: { discountBps: number; initiative: string } | null;
  products?: LocalProduct[];
  loggedIn: boolean;
  role?: string;
  inviteCode?: string;
}) {
  return (
    <AfterHydration>
      <CheckinClientReady {...props} />
    </AfterHydration>
  );
}

function CheckinClientReady({
  venue,
  offerings,
  producer = null,
  products = [],
  loggedIn,
  role,
  inviteCode,
}: {
  venue: { id: number; name: string; type: string; checkinCode: string };
  offerings: VenueOffering[];
  producer?: { discountBps: number; initiative: string } | null;
  products?: LocalProduct[];
  loggedIn: boolean;
  role?: string;
  inviteCode?: string;
}) {
  const router = useRouter();
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? 0);
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const isProducer = venue.type === "producer" && producer && products.length > 0;
  const offering = offerings.find((item) => item.id === offeringId) ?? offerings[0];
  const product = products.find((item) => item.id === productId) ?? products[0];
  const isFriend = role === "friend";
  // Per i Produttori Locali KM 0 lo sconto initiative si applica a TUTTI (dipendenti, amici, nuovi iscritti).
  const km0DiscountBps = isProducer ? producer.discountBps : 0;
  const listPrice = isProducer
    ? (product?.priceCents ?? 0) * quantity
    : offering?.listPriceCents ?? 0;
  const friendDiscountBps = !isProducer && isFriend && offering ? offering.friendDiscountBps : 0;
  const discountBps = km0DiscountBps || friendDiscountBps;
  const discount = Math.round((listPrice * discountBps) / 10000);
  const total = listPrice - discount;
  const kmAvoided = isProducer ? (product?.kmAvoided ?? 0) * quantity : 0;
  const co2Kg = Math.round(0.3 * kmAvoided * 1000) / 1000;
  const isTheater = venue.type === "theater" || venue.type === "show_venue";

  async function pay(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await apiFetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        offeringId: isProducer ? undefined : offering?.id,
        productId: isProducer ? product?.id : undefined,
        quantity: isProducer ? quantity : 1,
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
          {isProducer ? "Acquista un cesto KM 0" : isTheater ? "Botteghino / Controllo accessi" : "Identificazione ospite"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-olive">
          {isProducer
            ? "Accedi o registrati: lo sconto initiative Welfare & KM 0 è riservato a dipendenti, amici invitati e nuovi iscritti del circuito."
            : isTheater
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

  if (!isProducer && !offering) {
    return (
      <div className="rounded-[28px] bg-white p-6">
        <p className="text-sm text-olive">Questa struttura non ha servizi di listino consumer.</p>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/10">
      <p className="text-xs uppercase tracking-[0.16em] text-olive">
        {isProducer ? `Filiera Corta · ${producer.initiative}` : "Pagamento ospite · pay-local"}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-forest">
        {isProducer ? "Scegli il cesto KM 0" : "Saldo in struttura"}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {isProducer
          ? products.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setProductId(item.id)}
                className={`rounded-full px-4 py-2 text-sm ${productId === item.id ? "bg-forest text-cream" : "bg-cream text-forest"}`}
              >
                {item.name} · {formatEuro(item.priceCents)}
              </button>
            ))
          : offerings.map((item) => (
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
      {isProducer ? (
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-olive">Quantità</label>
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} cesto{n > 1 ? "i" : ""}
              </option>
            ))}
          </select>
          {product ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
              <Leaf size={12} /> {product.kmAvoided} km evitati a cesto
            </span>
          ) : null}
        </div>
      ) : null}
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Prezzo di listino</dt>
          <dd>{formatEuro(listPrice)}</dd>
        </div>
        <div className="flex justify-between text-terracotta">
          <dt>
            {isProducer
              ? `Sconto initiative Welfare & KM 0 (-${discountBps / 100}%) · dipendenti, amici e nuovi iscritti`
              : "Micro-sconto community"}
          </dt>
          <dd>-{formatEuro(discount)}</dd>
        </div>
        {isProducer ? (
          <div className="flex justify-between text-forest">
            <dt>Impatto del tuo acquisto</dt>
            <dd>
              {kmAvoided} km evitati · {co2Kg.toFixed(1)} kg CO2
            </dd>
          </div>
        ) : null}
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
      {role === "employee" && !isProducer ? (
        <p className="mt-3 text-xs text-olive">Stai pagando come privato. Per il welfare usa il portafoglio.</p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
      <button type="submit" disabled={pending} className="mt-5 w-full rounded-2xl bg-terracotta py-3 text-sm font-medium text-cream disabled:opacity-60">
        {pending ? "Autorizzazione in corso…" : `Paga ${formatEuro(total)}`}
      </button>
    </form>
  );
}
