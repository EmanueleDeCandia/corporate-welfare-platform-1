import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { getVenues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const rows = await getVenues();

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/agriturismo-valle.jpg" alt="" className="h-48 w-full object-cover md:h-64" />
      </section>
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Vetrina</p>
        <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Hotel e agriturismi partner</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive">
          Ogni struttura ha foto, menù dell&apos;aperitivo convenzionato, descrizione delle stanze e
          disponibilità al riscatto welfare o al pagamento consumer.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <VenueCard
              key={row.venue.id}
              venue={row.venue}
              destination={row.destination}
              sponsor={row.sponsor}
              fromPriceCents={row.flags.fromPriceCents}
            />
          ))}
        </div>
      </main>
    </PublicShell>
  );
}