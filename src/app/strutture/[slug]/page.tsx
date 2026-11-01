import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Sparkles, ShoppingBag, Leaf, Gift } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyById, getProducerVenueStats, getUserVouchers, getVenueBySlug } from "@/lib/data";
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
  const row = await getVenueBySlug(slug);
  if (!row) notFound();
  const { venue, destination, sponsor } = row;
  const user = await getCurrentUser();
  const vouchers = user?.role === "employee" ? await getUserVouchers(user.id) : [];
  const redeemable = vouchers.filter(
    (voucher) => voucher.status === "available" && matchesVoucher(venue.type, voucher.type),
  );

  const isProducer = venue.type === "producer";
  const producerStats = isProducer ? await getProducerVenueStats(venue.id) : null;
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
              {isProducer ? "Produttore Locale KM 0 · Filiera Corta" : venueTypeLabel(venue.type)}
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

              {/* Colonna Destra: Ritiro QR, Contatti e Info Check-in */}
              <aside className="space-y-6">
                <section className="rounded-[28px] bg-forest p-6 text-cream shadow-md">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs text-gold mb-3">
                    <Sparkles size={13} /> Ritiro Diretto o Consegna
                  </div>
                  <h2 className="font-serif text-2xl">Sei sul posto per il ritiro?</h2>
                  <p className="mt-2 text-xs leading-relaxed text-cream/80">
                    Mostra il codice al produttore o inquadra il QR per verificare la prenotazione e il saldo immediato con accredito di +{venue.impactPointsGenerated} Punti Impatto.
                  </p>

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
                      Sponsor Territoriale ESG
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
                  <h2 className="font-serif text-2xl text-forest">Camere & Alloggi</h2>
                  <div className="mt-4 space-y-3">
                    {rooms.map((room) => (
                      <div key={room.name} className="rounded-2xl bg-cream p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-forest">{room.name}</p>
                          <p className="font-semibold text-terracotta">{formatEuro(room.priceCents)}</p>
                        </div>
                        <p className="mt-1 text-xs text-olive leading-relaxed">{room.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {aperitivoMenu.length > 0 ? (
                <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                  <h2 className="font-serif text-2xl text-forest">Menù Degustazione KM 0</h2>
                  <div className="mt-4 space-y-3">
                    {aperitivoMenu.map((item) => (
                      <div key={item.name} className="border-b border-mist pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-baseline gap-3">
                          <p className="font-medium text-forest">{item.name}</p>
                          <p className="font-semibold text-terracotta text-sm">{formatEuro(item.priceCents)}</p>
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
