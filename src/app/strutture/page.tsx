import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { getVenues } from "@/lib/data";
import { getLocalProducers } from "@/lib/local-producers";
import { Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const [rows, producers] = await Promise.all([getVenues(), getLocalProducers()]);
  const venues = rows.filter((row) => row.venue.type !== "producer");

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/agriturismo-valle.jpg" alt="" className="h-48 w-full object-cover md:h-64" />
      </section>
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Vetrina</p>
        <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Strutture e Tipicità KM 0</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive">
          Hotel, agriturismi, ristoranti e teatri partner — più i <strong>Produttori Locali KM 0</strong> della
          filiera corta: cestini agroalimentari che arrivano in azienda con la flotta del Gruppo Illiria,
          abbattendo la CO2 e valorizzando il territorio.
        </p>

        {producers.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-forest" />
              <h2 className="font-serif text-2xl text-forest md:text-3xl">Tipicità KM 0 · Produttori Locali</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-olive">
              Iniziativa <strong>&ldquo;Welfare &amp; KM 0&rdquo;</strong> di Gruppo Illiria e Startup RADICI: ogni cesto
              venduto evita chilometri di trasporto (0,300 kg di CO2 × km) e gode dello sconto initiative per
              dipendenti, amici invitati e nuovi iscritti.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {producers.map((row) => (
                <div key={row.venue.id} className="relative">
                  <VenueCard
                    venue={row.venue}
                    destination={null}
                    sponsor={null}
                    fromPriceCents={Math.min(...row.products.map((p) => p.priceCents)) || 0}
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-forest px-3 py-1 text-[11px] font-semibold text-cream">
                    -{row.producer.discountBps / 100}% Welfare &amp; KM 0 · {row.stats.co2AvoidedKg.toFixed(1)} kg CO2 evitati
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-14">
          <h2 className="font-serif text-2xl text-forest md:text-3xl">Hotel, agriturismi, ristoranti e teatri</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((row) => (
              <VenueCard
                key={row.venue.id}
                venue={row.venue}
                destination={row.destination}
                sponsor={row.sponsor}
                fromPriceCents={row.flags.fromPriceCents}
              />
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
