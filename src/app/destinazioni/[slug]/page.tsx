import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Compass, MapPin } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { getDestinationBySlug, getVenuesByDestination } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const venues = await getVenuesByDestination(destination.id);

  return (
    <PublicShell>
      {/* HERO DESTINATION */}
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="relative h-[48vh] min-h-[340px] w-full">
          <img
            src={destination.coverImage}
            alt={destination.name}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-transparent" />
        </div>

        <div className="mx-auto -mt-32 max-w-7xl px-4 pb-12 relative z-10 md:px-6">
          <Link
            href="/destinazioni"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold hover:text-cream transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Tutte le destinazioni
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold border border-gold/30">
              {destination.region}
            </span>
            <span className="flex items-center gap-1 text-xs text-cream/75">
              <MapPin size={14} className="text-gold" /> {destination.highlight}
            </span>
          </div>

          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl">{destination.name}</h1>
          <p className="mt-2 text-xl font-light text-cream/90">{destination.tagline}</p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-cream/80">
            {destination.description}
          </p>
        </div>
      </section>

      {/* VENUES IN THIS DESTINATION */}
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">
              Strutture nel territorio
            </p>
            <h2 className="mt-1 font-serif text-3xl text-forest">
              Esperienze convenzionate in {destination.name} ({venues.length})
            </h2>
          </div>
          <Link
            href={`/esplora?dest=${destination.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.12em] text-forest hover:bg-forest hover:text-cream transition-all"
          >
            <Compass size={16} /> Mappa interattiva
          </Link>
        </div>

        {venues.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center text-sm text-olive">
            Nessuna struttura attualmente censita in questo comprensorio.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        )}
      </main>
    </PublicShell>
  );
}