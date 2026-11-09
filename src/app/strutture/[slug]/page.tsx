import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Sparkles, ShoppingBag, Leaf, Gift, Landmark, Calendar, Ticket } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  getCompanyById,
  getProducerVenueStats,
  getUserVouchers,
  getVenueBySlug,
  getVenueGrantEvents,
} from "@/lib/data";
import { formatEuro, initials, matchesVoucher, venueTypeLabel } from "@/lib/utils";
import { VenueRedeem } from "@/components/venue-redeem";
import { ProducerBasketOrderClient } from "@/components/producer-basket-order-client";

export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "casale-del-conero-5000-477" || slug.startsWith("casale-del-conero")) {
    redirect("/strutture/agriturismo-colle");
  }
  const row = await getVenueBySlug(slug);
  if (!row) notFound();
  const { venue, destination, sponsor } = row;
  const user = await getCurrentUser();
  const vouchers = user?.role === "employee" ? await getUserVouchers(user.id) : [];
  const redeemable = vouchers.filter(
    (voucher) => voucher.status === "available" && matchesVoucher(venue.type, voucher.type),
  );

  const isProducer = venue.type === "producer";
  const isTheater = venue.type === "theater";
  const producerStats = isProducer ? await getProducerVenueStats(venue.id) : null;
  const theaterEvents = isTheater ? await getVenueGrantEvents(venue.id) : [];
  const userCompany = user?.companyId ? await getCompanyById(user.companyId) : null;

  const services = venue.services ?? [];
  const gallery = venue.gallery ?? [];
  const rooms = venue.rooms ?? [];
  const aperitivoMenu = venue.aperitivoMenu ?? [];

  return (
    <PublicShell>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="relative h-[45vh] min-h-[320px] max-h-[460px] w-full">
          <img
            src={venue.coverImage}
            alt={venue.name}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-black/30" />
        </div>

        <div className="mx-auto -mt-28 max-w-7xl px-4 pb-10 relative z-10 md:px-6">
          <Link
            href="/strutture"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold hover:text-cream transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Tutte le strutture
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold border border-gold/30">
              {isProducer
                ? "Produttore Locale KM 0 · Filiera Corta"
                : isTheater
                ? "Teatro Storico · Matching Grant RADICI"
                : venueTypeLabel(venue.type)}
            </span>
            <span className="flex items-center gap-1 text-xs text-cream/80">
              <MapPin size={14} className="text-gold" /> {venue.city}, {destination.region}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/15 backdrop-blur-sm px-3 py-0.5 text-xs text-cream">
              <Sparkles size={13} className="text-gold" /> +{venue.impactPointsGenerated} Punti Impatto
            </span>
          </div>

          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl text-cream">{venue.name}</h1>
          <p className="mt-2 text-sm text-cream/75 max-w-2xl">
            Comprensorio: <span className="text-cream font-medium">{destination.name}</span> · {destination.highlight}
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {isProducer && producerStats ? (
          /* SEZIONE DEDICATA AI PRODUTTORI LOCALI FILIERA CORTA */
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[32px] bg-white p-6 shadow-sm border border-forest/5 md:p-8 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl text-forest">Presentazione del Produttore & Territorio</h2>
                  <p className="mt-4 text-base leading-relaxed text-forest/85">{venue.longDescription}</p>
                </div>

                {services.length > 0 && (
                  <div className="border-t border-forest/10 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive mb-3">
                      Dotazioni, Lavorazioni & Servizi
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2 text-sm text-forest/90">
                      {services.map((service) => (
                        <li key={service} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {gallery.length > 0 && (
                  <div className="border-t border-forest/10 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive mb-4">
                      Galleria Fotografica della Tenuta
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {gallery.map((image, idx) => (
                        <div key={idx} className="overflow-hidden rounded-2xl aspect-[4/3] bg-forest/5">
                          <img
                            src={image}
                            alt={`${venue.name} galleria ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              <aside className="space-y-6">
                <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest">
                      <Leaf size={24} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-forest">Filiera Corta Garantita</h3>
                      <p className="text-xs text-olive">Zero intermediari · 100% ricavo al produttore</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-xs leading-relaxed text-forest/80 border-t border-mist pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-forest">Commissioni Startup RADICI:</span>
                      <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-bold text-forest">0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-forest">Sconto per Dipendenti CSR:</span>
                      <span className="font-semibold text-terracotta">10% Welfare</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-forest">Regola Reciprocità 10:1:</span>
                      <span className="font-semibold text-forest">1 Cesto Omaggio ogni 10</span>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            {/* WIDGET INTERATTIVO ORDINE CESTO & BILANCIO AMBIENTALE */}
            <ProducerBasketOrderClient
              venue={{
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                city: venue.city,
                region: destination.region,
                basketName: venue.basketName,
                basketDescription: venue.basketDescription,
                priceBasketCents: venue.priceBasketCents,
                coverImage: venue.coverImage,
                checkinCode: venue.checkinCode,
                impactPointsGenerated: venue.impactPointsGenerated,
                freeBasketThreshold: venue.freeBasketThreshold || 10,
                freeBasketsEarned: venue.freeBasketsEarned || 0,
              }}
              stats={producerStats}
              currentUser={
                user
                  ? {
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      role: user.role,
                      companyName: userCompany?.name || null,
                    }
                  : null
              }
            />
          </div>
        ) : isTheater ? (
          /* SEZIONE DEDICATA AI TEATRI STORICI & MATCHING GRANT */
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* COLONNA SINISTRA: PRESENTAZIONE TEATRO, DOTAZIONI & GALLERIA */}
            <article className="rounded-[32px] bg-white p-6 shadow-sm border border-forest/5 md:p-8 space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-forest">Patrimonio Storico & Sala Teatrale</h2>
                <p className="mt-4 text-base leading-relaxed text-forest/85">{venue.longDescription}</p>
              </div>

              {services.length > 0 && (
                <div className="border-t border-forest/10 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive mb-3">
                    Dotazioni, Palcoscenico & Servizi di Accoglienza
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2 text-sm text-forest/90">
                    {services.map((service) => (
                      <li key={service} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {gallery.length > 0 && (
                <div className="border-t border-forest/10 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive mb-4">
                    Galleria Fotografica del Teatro
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gallery.map((image, idx) => (
                      <div key={idx} className="overflow-hidden rounded-2xl aspect-[16/10] bg-forest/5">
                        <img
                          src={image}
                          alt={`${venue.name} galleria ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* COLONNA DESTRA: MATCHING GRANT DEI PROMOTORI & CARTELLONE SPETTACOLI */}
            <aside className="space-y-6">
              {/* CARD MATCHING GRANT */}
              <section className="rounded-[28px] bg-gradient-to-br from-forest to-forest-deep p-6 text-cream shadow-md border border-gold/20">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  <Sparkles size={16} />
                  Omaggio Culturale Promotori RADICI
                </div>
                <h3 className="mt-2 font-serif text-2xl text-cream">Matching Grant Teatrale</h3>
                <p className="mt-2 text-xs leading-relaxed text-cream/80">
                  Questo teatro partecipa all&apos;omaggio culturale finanziato al 100% dai{" "}
                  <strong>Promotori della startup RADICI</strong>: garantisce{" "}
                  <strong>2 ingressi riservati di platea (valore 50 €)</strong> con accesso al ridotto per gli ospiti
                  che pernottano nei borghi convenzionati.
                </p>
                <div className="mt-4 rounded-xl bg-white/10 p-3.5 border border-white/10 flex items-center justify-between text-xs">
                  <span>Valore Omaggio per Soggiorno:</span>
                  <span className="font-semibold text-gold text-sm">{formatEuro(venue.priceShowCents || 5000)} (Coppia)</span>
                </div>
              </section>

              {/* CARTELLONE & EVENTI IN PROGRAMMA */}
              <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-terracotta" />
                  <h3 className="font-serif text-xl text-forest">Cartellone & Stagione in Programma</h3>
                </div>
                {theaterEvents.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {theaterEvents.map((evt) => (
                      <div key={evt.id} className="rounded-2xl bg-cream/70 p-4 border border-forest/10 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif text-base text-forest font-semibold">{evt.title}</h4>
                          <span className="shrink-0 rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-semibold text-forest uppercase tracking-wider">
                            {evt.category}
                          </span>
                        </div>
                        <p className="text-xs text-forest/80 leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-olive pt-2 border-t border-forest/10">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} className="text-forest/60" />
                            {evt.startsAt
                              ? new Date(evt.startsAt).toLocaleDateString("it-IT", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : "In programmazione"}
                          </span>
                          <span>Capienza: {evt.capacity} posti</span>
                        </div>
                        {evt.artistMeetupIncluded && (
                          <p className="text-[11px] font-medium text-terracotta flex items-center gap-1">
                            <Sparkles size={12} /> Incontro con gli artisti e la compagnia a fine spettacolo
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-olive">Nessun evento al momento in cartellone per questo teatro.</p>
                )}
              </section>

              {/* BOTTEGHINO & CHECK-IN QR */}
              <section className="rounded-[28px] bg-forest p-6 text-cream shadow-md">
                <h3 className="font-serif text-xl">Botteghino & Convalida Posti</h3>
                <p className="mt-2 text-xs leading-relaxed text-cream/80">
                  Mostra la conferma della tua prenotazione o inquadra il codice QR al foyer per ritirare i tagliandi d&apos;ingresso.
                </p>
                <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-white/10 p-4 border border-white/15">
                  <img
                    src={`/api/qr/${venue.checkinCode}`}
                    alt={`QR ${venue.name}`}
                    className="w-36 h-36 rounded-xl bg-white p-2"
                  />
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-gold">
                    Codice Foyer: {venue.checkinCode}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          /* SEZIONE STANDARD STRUTTURE RICETTIVE (HOTEL, AGRITURISMI, RISTORANTI) */
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[32px] bg-white p-6 shadow-sm border border-forest/5 md:p-8">
              <h2 className="font-serif text-2xl text-forest">Presentazione della struttura</h2>
              <p className="mt-4 text-base leading-relaxed text-forest/85">{venue.longDescription}</p>

              {services.length > 0 ? (
                <div className="mt-6 border-t border-forest/10 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">
                    Dotazioni e Servizi
                  </h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-forest/90">
                    {services.map((service) => (
                      <li key={service} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {sponsor ? (
                <div className="mt-8 flex items-center gap-4 rounded-2xl bg-cream p-4 border border-forest/5">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-cream shadow-sm"
                    style={{ background: sponsor.accent }}
                  >
                    {initials(sponsor.name)}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-olive">
                      Sponsor Territoriale CSR
                    </p>
                    <p className="text-sm text-forest">
                      Finanziato nel piano welfare da{" "}
                      <Link href={`/imprese/${sponsor.slug}`} className="font-semibold text-terracotta hover:underline">
                        {sponsor.name}
                      </Link>
                    </p>
                  </div>
                </div>
              ) : null}

              {gallery.length > 0 ? (
                <div className="mt-8 border-t border-forest/10 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive mb-4">
                    Galleria Immagini
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {gallery.map((image, idx) => (
                      <div key={idx} className="overflow-hidden rounded-2xl aspect-[4/3] bg-forest/5">
                        <img
                          src={image}
                          alt={`${venue.name} galleria ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            <aside className="space-y-6">
              {rooms.length > 0 ? (
                <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                  <div className="flex items-center justify-between border-b border-forest/10 pb-3">
                    <div>
                      <h2 className="font-serif text-2xl text-forest">Camere & Convenzioni</h2>
                      <p className="text-xs text-olive mt-0.5">
                        Offerte per dipendenti welfare aziendale e ospiti community.
                      </p>
                    </div>
                    <span className="rounded-full bg-forest/5 px-2.5 py-1 text-[11px] font-semibold text-forest">
                      {rooms.length} Offerte
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {rooms.map((room) => {
                      const isSingle = room.capacity === 1 || room.name.toLowerCase().includes("singol");
                      return (
                        <div key={room.name} className="rounded-2xl bg-cream/40 p-4 border border-forest/10">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-forest text-sm md:text-base">{room.name}</p>
                              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center rounded-full border border-forest/15 bg-forest/5 px-2.5 py-0.5 text-[10px] font-medium text-forest">
                                  {room.capacity} {room.capacity === 1 ? "Posto Letto" : "Posti Letto"}
                                </span>
                                {isSingle ? (
                                  <span className="inline-flex items-center rounded-full border border-forest/15 bg-white px-2.5 py-0.5 text-[10px] font-medium text-forest">
                                    50 € Voucher (100% Coperto)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-forest/15 bg-white px-2.5 py-0.5 text-[10px] font-medium text-forest">
                                    50 € Voucher + differenza di prezzo con Carta Personale
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="font-serif text-lg font-semibold text-forest shrink-0">{formatEuro(room.priceCents)}</p>
                          </div>

                          {room.description &&
                          !room.description.trim().startsWith("Convenzione Welfare Aziendale & Accompagnatore") && (
                            <p className="mt-2 text-xs text-olive leading-relaxed">{room.description}</p>
                          )}

                          {/* Spiegazione trasparente neutra */}
                          <div className="mt-3 rounded-xl bg-white p-3 text-xs text-forest/90 border border-forest/10 leading-relaxed">
                            {isSingle ? (
                              <p>
                                <strong>Convenzione Welfare Aziendale:</strong> Copre al 100% la quota di 1 lavoratore (50 € con voucher) per un posto letto. Il voucher welfare è personale e nominativo.
                              </p>
                            ) : (
                              <p>
                                <strong>Convenzione Welfare Aziendale & Accompagnatore:</strong> Copre la quota di 1 lavoratore (50 € con voucher) per un posto letto. Nella camera per 2 posti letto, la seconda persona/accompagnatore non beneficiaria può essere saldata con carta personale dall&apos;addetto o direttamente dall&apos;invitato (su piattaforma o al check-in). Il prezzo per la seconda persona è la differenza tra il prezzo esposto e 50€ del voucher. In fase di prenotazione va indicata la seconda persona per la separazione contabile.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CONDIZIONI AMICI E INVITATI SENZA WELFARE */}
                  <div className="mt-4 rounded-2xl border border-forest/10 bg-cream/40 p-4 text-xs text-olive leading-relaxed">
                    <strong className="text-forest font-semibold block mb-1">
                      Condizioni per Amici e Ospiti Community (Senza Welfare):
                    </strong>
                    I prezzi base delle camere sono identici ({rooms.map((r) => `${r.name.includes("Singol") ? "50 € singola" : "100 € doppia"}`).slice(0, 2).join(" · ")}). Gli invitati della Community RADICI beneficiano dello <strong>sconto convenzione del 10%</strong> (45 € singola / 90 € doppia) saldabile per intero con carta personale, sostenendo la filiera locale e facendo maturare Punti Impatto a chi li ha invitati.
                  </div>
                </section>
              ) : null}

              {aperitivoMenu.length > 0 ? (
                <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                  <div className="border-b border-forest/10 pb-3">
                    <h2 className="font-serif text-2xl text-forest">Menù Degustazione KM 0</h2>
                    <div className="mt-2.5 rounded-xl border border-forest/10 bg-cream/40 p-3 text-xs text-forest/85 leading-relaxed">
                      <strong className="text-forest">Convenzione Welfare:</strong> Con il voucher di Welfare Aziendale di 25€, l&apos;addetto può scegliere qualsiasi servizio di Degustazione esposto sia di prezzo inferiore che superiore a quello del buono.
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {aperitivoMenu.map((item) => (
                      <div key={item.name} className="border-b border-mist pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-baseline gap-3">
                          <p className="font-medium text-forest text-sm">{item.name}</p>
                          <p className="font-semibold text-forest text-sm">{formatEuro(item.priceCents)}</p>
                        </div>
                        <p className="mt-1 text-xs text-olive leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* CHECK-IN / REDEEM SECTION */}
              <section className="rounded-[28px] bg-forest p-6 text-cream shadow-md">
                <h2 className="font-serif text-2xl">Sei sul posto?</h2>
                <p className="mt-2 text-xs leading-relaxed text-cream/80">
                  Dipendenti: riscatto istantaneo dei voucher welfare. Amici: inquadra il QR per ottenere lo sconto community.
                </p>

                {user?.role === "employee" ? (
                  <div className="mt-4">
                    <VenueRedeem vouchers={redeemable} venueId={venue.id} />
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-2.5">
                    <Link
                      href={`/checkin/${venue.checkinCode}`}
                      className="rounded-full bg-terracotta px-4 py-2.5 text-center text-sm font-semibold text-cream shadow hover:bg-terracotta/90 transition-colors"
                    >
                      Check-in QR / Pagamento Scontato
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-full bg-white/10 px-4 py-2 text-center text-xs text-cream/90 hover:bg-white/20 transition-colors"
                    >
                      Accedi per riscattare voucher
                    </Link>
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-white/10 p-4 border border-white/15">
                  <img
                    src={`/api/qr/${venue.checkinCode}`}
                    alt={`QR ${venue.name}`}
                    className="w-36 h-36 rounded-xl bg-white p-2"
                  />
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-gold">
                    Codice: {venue.checkinCode}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
