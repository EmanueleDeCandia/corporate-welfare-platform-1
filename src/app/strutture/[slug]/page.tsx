import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf, MapPin, Sparkles, Truck } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getUserVouchers, getVenueBySlug } from "@/lib/data";
import { getLocalProducerBySlug } from "@/lib/local-producers";
import { formatEuro, initials, venueTypeLabel } from "@/lib/utils";
import { VenueRedeem } from "@/components/venue-redeem";

export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getVenueBySlug(slug);
  if (!row) notFound();
  const { venue, destination, sponsor, offerings } = row;
  const user = await getCurrentUser();
  const producerRow = venue.type === "producer" ? await getLocalProducerBySlug(slug) : null;
  const vouchers = user?.role === "employee" ? await getUserVouchers(user.id) : [];
  const redeemable = vouchers.filter((voucher) =>
    voucher.status === "assigned" &&
    offerings.some((offering) => offering.active && offering.acceptsWelfare && offering.benefitType === voucher.benefitType),
  );

  const services = venue.services ?? [];
  const gallery = venue.gallery ?? [];
  const rooms = offerings.filter((item) => item.benefitType === "overnight");
  const aperitivoMenu = offerings.filter((item) => item.benefitType === "dinner");

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src={venue.coverImage} alt={venue.name} className="h-[280px] w-full object-cover md:h-[380px]" />
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <Link href="/strutture" className="inline-flex items-center gap-2 text-sm text-olive hover:text-forest">
          <ArrowLeft size={14} /> Tutte le strutture
        </Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-olive">{venueTypeLabel(venue.type)}</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{venue.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-olive">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} /> {venue.city}, {destination.region}
          </span>
          <span>
            {destination.name} · {destination.highlight}
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles size={13} /> +{venue.impactPointsGenerated} Punti Impatto
          </span>
        </p>
      </div>

      {/* MAIN CONTENT (PLACED CLEANLY BELOW HERO) */}
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {producerRow ? (
          <section className="mb-8 rounded-[28px] bg-forest p-6 text-cream md:p-8">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
              <Leaf size={14} /> Iniziativa {producerRow.producer.initiative}
            </p>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl">
              Valorizzazione che abbatte la CO2: la flotta del Gruppo Illiria porta i prodotti freschi direttamente in azienda
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/80">
              Il Gruppo Illiria mette a disposizione la sua flotta e le imprese CSR ricevono i cestini KM 0
              direttamente in sede: si risparmia tempo, si ottiene lo sconto initiative del{" "}
              <strong className="text-gold">{producerRow.producer.discountBps / 100}%</strong> (riservato a
              dipendenti, amici invitati e nuovi iscritti) e si valorizza la filiera locale abbattendo le
              emissioni: ogni cesto evita chilometri di trasporto su strada.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.basketsSold}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">cestini venduti</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{formatEuro(producerRow.stats.volumeCents)}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">volume vendite</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.kmAvoidedTotal} km</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">percorso evitato</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.co2AvoidedKg.toFixed(1)} kg</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">CO2 evitata (0,300 kg × km)</p>
              </div>
            </div>
          </section>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl bg-white p-6 md:p-8">
            <h2 className="font-serif text-2xl text-forest">
              {producerRow ? "Il produttore e la sua filiera" : "Presentazione della struttura"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-forest/85">{venue.longDescription}</p>

            {producerRow ? (
              <div className="mt-6 border-t border-forest/10 pt-6">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-olive">
                  <Truck size={14} /> Consegna KM 0 con flotta Gruppo Illiria
                </h3>
                <p className="mt-3 text-sm leading-6 text-forest/85">
                  I cestini partono dal produttore e arrivano in azienda senza passaggi intermedi: ogni consegna
                  evita da 30 a 70 km di percorso (0,300 kg di CO2 per km). Lo sconto initiative del{" "}
                  {producerRow.producer.discountBps / 100}% si applica a dipendenti con voucher, amici invitati e
                  nuovi iscritti non invitati.
                </p>
              </div>
            ) : null}

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
            {producerRow ? (
              <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                <h2 className="font-serif text-2xl text-forest">Cestini KM 0</h2>
                <p className="mt-1 text-xs text-olive">
                  Sconto initiative Welfare &amp; KM 0 del {producerRow.producer.discountBps / 100}% per dipendenti,
                  amici invitati e nuovi iscritti.
                </p>
                <div className="mt-4 space-y-3">
                  {producerRow.products.filter((p) => p.active).map((product) => {
                    const discountCents = Math.round((product.priceCents * producerRow.producer.discountBps) / 10000);
                    return (
                      <div key={product.id} className="rounded-2xl bg-cream p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-forest">{product.name}</p>
                          <div className="text-right">
                            <p className="text-xs text-olive line-through">{formatEuro(product.priceCents)}</p>
                            <p className="font-semibold text-terracotta">{formatEuro(product.priceCents - discountCents)}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-olive leading-relaxed">{product.description}</p>
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-forest">
                          <Leaf size={12} /> {product.kmAvoided} km evitati · {(0.3 * product.kmAvoided).toFixed(1)} kg CO2 per cesto
                        </p>
                      </div>
                    );
                  })}
                </div>
                <Link
                  href={`/checkin/${venue.checkinCode}`}
                  className="mt-4 block rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-cream hover:bg-forest/90"
                >
                  Acquista i cestini
                </Link>
              </section>
            ) : null}
            {rooms.length > 0 ? (
              <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
                <h2 className="font-serif text-2xl text-forest">Camere & Alloggi</h2>
                <div className="mt-4 space-y-3">
                  {rooms.map((room) => (
                    <div key={room.id} className="rounded-2xl bg-cream p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-forest">{room.name}</p>
                        <p className="font-semibold text-terracotta">{formatEuro(room.listPriceCents)}</p>
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
                    <div key={item.id} className="border-b border-mist pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-baseline gap-3">
                        <p className="font-medium text-forest">{item.name}</p>
                        <p className="font-semibold text-terracotta text-sm">{formatEuro(item.listPriceCents)}</p>
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
                  <VenueRedeem vouchers={redeemable} venueId={venue.id} offerings={offerings} />
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
      </main>
    </PublicShell>
  );
}