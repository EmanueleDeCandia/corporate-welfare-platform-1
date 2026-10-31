import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Compass } from "lucide-react";
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
      <section className="overflow-hidden">
        <img
          src={destination.coverImage}
          alt={destination.name}
          className="h-[280px] w-full object-cover md:h-[380px]"
        />
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <Link href="/destinazioni" className="inline-flex items-center gap-2 text-sm text-olive hover:text-forest">
          <ArrowLeft size={14} /> Tutte le destinazioni
        </Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-olive">{destination.region}</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{destination.name}</h1>
        <p className="mt-2 text-lg text-olive">{destination.tagline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-olive">{destination.description}</p>
      </div>

      {/* VENUES IN THIS DESTINATION */}
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
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