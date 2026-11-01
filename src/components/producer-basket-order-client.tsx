"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Calendar,
  Truck,
  Leaf,
  Gift,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { formatEuro } from "@/lib/utils";
import type { ProducerVenueStats } from "@/lib/data";

type Props = {
  venue: {
    id: number;
    name: string;
    slug: string;
    city: string;
    region: string;
    basketName: string | null;
    basketDescription: string | null;
    priceBasketCents: number;
    coverImage: string;
    checkinCode: string;
    impactPointsGenerated: number;
    freeBasketThreshold: number;
    freeBasketsEarned: number;
  };
  stats: ProducerVenueStats;
  currentUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    companyName?: string | null;
  } | null;
};

export function ProducerBasketOrderClient({ venue, stats, currentUser }: Props) {
  const router = useRouter();

  const [quantity, setQuantity] = useState<number>(1);
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [timeSlot, setTimeSlot] = useState<string>("11:00");
  const [guestName, setGuestName] = useState<string>(
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ""
  );
  const [guestEmail, setGuestEmail] = useState<string>(currentUser?.email || "");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: number;
    message: string;
    confirmationToken: string;
    finalPriceCents: number;
    discountPercent: number;
  } | null>(null);

  const unitPriceCents = venue.priceBasketCents || 3800;
  const isFriend = currentUser?.role === "friend";
  const discountPercent = isFriend ? 10 : 0;
  const listPriceCents = unitPriceCents * quantity;
  const discountCents = Math.round((listPriceCents * discountPercent) / 100);
  const finalPriceCents = listPriceCents - discountCents;

  // Calcolo scientifico parametri ambientali (da tabella fisica/chimica standard):
  // Tratta dedicata eliminata: 50 km a tratta (range 40-75 km)
  // CO2 evitata: 0,265 kg per km (furgone diesel 10 L/100km, 2.65 kg CO2/L)
  const kmAvoided = quantity * 50;
  const co2SavedKg = Number((kmAvoided * 0.265).toFixed(1));
  const impactPointsEarned = (venue.impactPointsGenerated || 2) * quantity;

  // Progresso regola 10 a 1 verso il prossimo cesto omaggio per gli addetti CSR
  const threshold = venue.freeBasketThreshold || 10;
  const currentProgress = stats.basketsProgressToNextGift;
  const newProgress = (currentProgress + quantity) % threshold;
  const willUnlockGift = currentProgress + quantity >= threshold;

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage("Per completare l'ordine o prenotare il ritiro, effettua prima il login o registrati con il link invito.");
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage("Inserisci nome e cognome e un indirizzo email valido.");
      return;
    }

    try {
      setLoading(true);
      const deliveryNote =
        deliveryMethod === "pickup"
          ? "Ritiro diretto in loco durante il soggiorno / visita"
          : "Consegna sul tragitto ordinario dell'operatore (sinergie di trasporto a km zero)";
      const combinedNotes = notes.trim()
        ? `[${deliveryNote}] ${notes.trim()}`
        : `[${deliveryNote}]`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venue.id,
          bookingType: "local_basket",
          bookingDate,
          timeSlot,
          partySize: quantity,
          guestName,
          guestEmail,
          guestPhone,
          notes: combinedNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossibile completare l'ordine del cesto.");
      }

      setConfirmedOrder({
        id: data.booking.id,
        message: data.message,
        confirmationToken: data.booking.confirmationToken,
        finalPriceCents,
        discountPercent,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Si è verificato un errore durante l'ordine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* BOX PRINCIPALE PRODOTTO / CESTO */}
      <div className="rounded-[32px] bg-white p-6 md:p-8 shadow-sm border border-forest/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-mist">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
              <ShoppingBag size={14} /> Presidio Agroalimentare a Filiera Corta
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-forest">
              {venue.basketName || "Cesto Tipico Territoriale KM 0"}
            </h2>
            <p className="text-sm text-olive mt-1">
              Produzione artigianale selezionata a {venue.city} ({venue.region}). 100% dell&apos;incasso all&apos;operatore locale (0% fee startup).
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs uppercase tracking-wider text-olive font-medium block">Prezzo Unitario</span>
            <span className="font-serif text-3xl font-bold text-forest">{formatEuro(unitPriceCents)}</span>
            {isFriend && (
              <span className="inline-block mt-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                -10% Sconto Community
              </span>
            )}
          </div>
        </div>

        {/* DESCRIZIONE DETTAGLIATA CESTO */}
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-[0.16em] font-bold text-olive">Contenuto e Tipicità del Cesto</h3>
          <p className="mt-2 text-sm md:text-base leading-relaxed text-forest/90 bg-cream/40 p-5 rounded-2xl border border-forest/5">
            {venue.basketDescription ||
              "Selezione artigianale di specialità del territorio a km zero, confezionate fresche senza imballaggi plastici monouso."}
          </p>
        </div>

        {/* FEEDBACK SUCCESSO ORDINE */}
        {confirmedOrder ? (
          <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-900">
              <CheckCircle2 size={28} className="text-emerald-700 shrink-0" />
              <div>
                <h4 className="font-serif text-xl font-bold">Ordine Confermato con Successo!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Codice prenotazione: <strong className="font-mono">{confirmedOrder.confirmationToken}</strong> (ID #{confirmedOrder.id})
                </p>
              </div>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed bg-white/70 p-4 rounded-xl">
              {confirmedOrder.message}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="rounded-xl bg-white p-3 border border-emerald-100">
                <span className="text-olive block text-[10px] uppercase font-bold">Importo Pagato</span>
                <span className="font-serif text-base font-bold text-forest">{formatEuro(confirmedOrder.finalPriceCents)}</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100">
                <span className="text-olive block text-[10px] uppercase font-bold">Tratta Dedicata Evitata</span>
                <span className="font-serif text-base font-bold text-forest">~{kmAvoided} km</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100">
                <span className="text-olive block text-[10px] uppercase font-bold">CO₂ Risparmiata</span>
                <span className="font-serif text-base font-bold text-emerald-700">-{co2SavedKg} kg</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100">
                <span className="text-olive block text-[10px] uppercase font-bold">Punti Guadagnati</span>
                <span className="font-serif text-base font-bold text-gold">+{impactPointsEarned}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmedOrder(null)}
                className="rounded-full bg-emerald-800 px-5 py-2 text-xs font-semibold text-cream hover:bg-emerald-900 transition"
              >
                Ordina un altro cesto
              </button>
            </div>
          </div>
        ) : (
          /* FORM DI PRENOTAZIONE E ACQUISTO */
          <form onSubmit={handleOrder} className="mt-8 space-y-6">
            {/* SELETTORE QUANTITA & CALCOLO DINAMICO */}
            <div className="rounded-2xl bg-cream/30 p-5 border border-forest/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-forest block">
                    Numero di Cesti Desiderati
                  </label>
                  <p className="text-xs text-olive mt-0.5">
                    Confezionati su misura per il tuo soggiorno o per il tragitto di consegna.
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-white border border-forest/15 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-forest font-bold hover:bg-forest/10 disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-serif text-lg font-bold text-forest">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-forest font-bold hover:bg-forest/10 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* RIEPILOGO ECONOMICO ED ECOLOGICO REAL-TIME */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-forest/10">
                <div className="rounded-xl bg-white p-3 border border-forest/5">
                  <span className="text-[10px] uppercase font-bold text-olive block">Listino Totale</span>
                  <span className="font-serif text-lg text-forest font-semibold">{formatEuro(listPriceCents)}</span>
                  {discountPercent > 0 && (
                    <span className="text-[10px] text-emerald-700 block font-medium">-{discountPercent}% Sconto Community</span>
                  )}
                </div>
                <div className="rounded-xl bg-white p-3 border border-forest/5">
                  <span className="text-[10px] uppercase font-bold text-olive block">Totale Netto</span>
                  <span className="font-serif text-lg text-terracotta font-bold">{formatEuro(finalPriceCents)}</span>
                  <span className="text-[10px] text-olive block">100% all&apos;agricoltore</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-forest/5">
                  <span className="text-[10px] uppercase font-bold text-olive block">Km Dedicati Azzerati</span>
                  <span className="font-serif text-lg text-forest font-semibold">~{kmAvoided} km</span>
                  <span className="text-[10px] text-olive block">tratta evitata</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-forest/5">
                  <span className="text-[10px] uppercase font-bold text-olive block">CO₂ Risparmiata</span>
                  <span className="font-serif text-lg text-emerald-700 font-bold">-{co2SavedKg} kg</span>
                  <span className="text-[10px] text-olive block">0,265 kg CO₂/km</span>
                </div>
              </div>
            </div>

            {/* MODALITA DI RITIRO / CONSEGNA */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider font-bold text-forest block">
                Modalità di Ritiro o Consegna
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    deliveryMethod === "pickup"
                      ? "border-forest bg-forest/5 shadow-sm ring-1 ring-forest"
                      : "border-forest/15 bg-white hover:bg-cream/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-forest" />
                    <span className="font-semibold text-sm text-forest">Ritiro Diretto in Loco</span>
                  </div>
                  <p className="text-xs text-olive mt-1.5 leading-relaxed">
                    Ritira il cesto direttamente presso il frantoio/caseificio a {venue.city} durante la tua visita o soggiorno. Tratta aggiuntiva: <strong>0 km</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    deliveryMethod === "delivery"
                      ? "border-forest bg-forest/5 shadow-sm ring-1 ring-forest"
                      : "border-forest/15 bg-white hover:bg-cream/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-forest" />
                    <span className="font-semibold text-sm text-forest">Consegna di Prossimità</span>
                  </div>
                  <p className="text-xs text-olive mt-1.5 leading-relaxed">
                    Recapito lungo il tragitto ordinario dell&apos;operatore o flotta partner. Sinergia a impatto marginale zero, senza corrieri espressi dedicati a vuoto.
                  </p>
                </button>
              </div>
            </div>

            {/* DETTAGLI LOGISTICI E CONTATTI */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Data Desiderata
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Fascia Oraria Indicativa
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                >
                  <option value="10:00 - 12:30">Mattina (10:00 - 12:30)</option>
                  <option value="15:30 - 18:30">Pomeriggio (15:30 - 18:30)</option>
                  <option value="18:30 - 20:00">Aperitivo / Sera (18:30 - 20:00)</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Email di Conferma
                </label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="mario.rossi@email.it"
                  className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Telefono di Contatto (per concordare il ritiro / consegna)
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider font-bold text-olive block mb-1">
                  Note Aggiuntive per il Produttore (opzionali)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Es. Alloggio presso agriturismo convenzionato / preferenze di orario..."
                  className="w-full rounded-xl border border-forest/15 bg-white px-3.5 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>
            </div>

            {/* RECIPROCITA & IMPATTO BUSINESS RULE 10 A 1 */}
            <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50/60 p-4 flex items-start gap-3">
              <Gift size={20} className="text-emerald-800 shrink-0 mt-0.5" />
              <div className="text-xs text-forest leading-relaxed">
                <strong className="text-emerald-900 block font-semibold mb-0.5">
                  Reciprocità Territoriale: Regola 10 ad 1 per gli Addetti CSR
                </strong>
                Ordinando questo cesto contribuisci con <strong>+{quantity} cesto</strong> al contatore del produttore. 
                Ogni 10 acquisti, il produttore dona 1 cesto in omaggio agli addetti delle Imprese CSR che sostengono il welfare locale.
                {willUnlockGift && (
                  <span className="block mt-1 font-bold text-emerald-800">
                    🎉 Con questo ordine viene maturato un nuovo Cesto in Omaggio per gli addetti CSR!
                  </span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                {errorMessage}
              </div>
            )}

            {/* PULSANTE INVIO O LOGIN */}
            {currentUser ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-forest px-6 py-3.5 text-center text-sm font-semibold text-cream shadow-md hover:bg-forest/90 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Elaborazione in corso..."
                ) : (
                  <>
                    <ShoppingBag size={16} /> Conferma Ordine Cesto ({formatEuro(finalPriceCents)})
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-2xl bg-cream p-5 text-center space-y-3 border border-forest/10">
                <p className="text-xs text-olive leading-relaxed">
                  Per procedere con l&apos;acquisto del cesto accedi al tuo account o registrati come membro community.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/login?redirect=/strutture/${venue.slug}`}
                    className="w-full sm:w-auto rounded-full bg-forest px-6 py-2.5 text-xs font-semibold text-cream hover:bg-forest/90 transition shadow-sm"
                  >
                    Accedi per Ordinare
                  </Link>
                  <Link
                    href="/registrati"
                    className="w-full sm:w-auto rounded-full bg-white border border-forest/20 px-6 py-2.5 text-xs font-semibold text-forest hover:bg-forest/5 transition"
                  >
                    Registrati come Membro Community (-10%)
                  </Link>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* BOX AMBIENTALE & REGOLA 10:1 (STATISTICHE PRODUTTORE) */}
      <div className="rounded-[32px] bg-forest text-cream p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs text-gold">
              <Leaf size={14} /> Bilancio di Sostenibilità & Filiera Corta
            </div>
            <h3 className="font-serif text-2xl text-cream mt-2">Impatto Ambientale e Sociale di {venue.name}</h3>
            <p className="text-xs text-cream/70 mt-1 max-w-xl">
              I km logistici dedicati sono azzerati grazie al ritiro diretto in loco durante il soggiorno o alla consegna di prossimità sul tragitto ordinario di una impresa con sinergie di trasporto.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5 text-right shrink-0 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-cream/70 block">Commissioni Radici</span>
            <span className="font-serif text-xl font-bold text-gold">0,00 € (0%)</span>
            <span className="text-[10px] text-cream/60 block">100% all&apos;agricoltore</span>
          </div>
        </div>

        {/* 4 CARD SCIENTIFICHE D'IMPATTO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Cesti Venduti</span>
            <p className="font-serif text-3xl text-gold mt-1">{stats.basketsSold}</p>
            <p className="text-[11px] text-cream/60 mt-0.5">filiera diretta verificata</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Km Dedicati Azzerati</span>
            <p className="font-serif text-3xl text-gold mt-1">~{stats.kmAvoidedTotal} km</p>
            <p className="text-[11px] text-cream/60 mt-0.5">ritiro in loco / tragitto proprio</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">CO₂ Risparmiata</span>
            <p className="font-serif text-3xl text-gold mt-1">~{stats.co2SavedKg} kg</p>
            <p className="text-[11px] text-cream/60 mt-0.5">0,265 kg CO₂ per km evitato</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Omaggi Addetti CSR</span>
            <p className="font-serif text-3xl text-gold mt-1">{stats.freeBasketsEarned}</p>
            <p className="text-[11px] text-cream/60 mt-0.5">regola 10 ad 1 attiva</p>
          </div>
        </div>

        {/* PROGRESSIONE VERSO IL PROSSIMO CESTO OMAGGIO PER GLI ADDETTI CSR */}
        <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cream flex items-center gap-1.5">
              <Gift size={14} className="text-gold" /> Progresso Prossimo Cesto Omaggio Addetti CSR (Regola 10:1)
            </span>
            <span className="font-mono text-gold font-bold">
              {stats.basketsProgressToNextGift} / {stats.freeBasketThreshold} acquisti
            </span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, (stats.basketsProgressToNextGift / stats.freeBasketThreshold) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-cream/70">
            Mancano <strong>{stats.freeBasketThreshold - stats.basketsProgressToNextGift} acquisti</strong> al prossimo cesto omaggio consegnato agli addetti delle Imprese CSR sostenitrici del territorio.
          </p>
        </div>
      </div>
    </div>
  );
}
