import { PublicShell } from "@/components/public-shell";
import { SearchPanel } from "@/components/search-panel";
import { VenueCard } from "@/components/venue-card";
import { DynamicMap } from "@/components/dynamic-map";
import { getDestinations, getVenues } from "@/lib/data";
import { venueTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; destinazione?: string }>;
}) {
  const params = await searchParams;
  const [rows, destinations] = await Promise.all([getVenues(), getDestinations()]);
  const query = (params.q ?? "").toLowerCase();

  const filtered = rows.filter((row) => {
    const haystack = `${row.venue.name} ${row.venue.city} ${row.venue.description} ${row.destination.name}`.toLowerCase();
    const matchesQuery = query ? haystack.includes(query) : true;
    const matchesType = params.tipo ? row.venue.type === params.tipo : true;
    const matchesDest = params.destinazione ? row.destination.slug === params.destinazione : true;
    return matchesQuery && matchesType && matchesDest;
  });

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-olive">Portale pubblico</p>
        <h1 className="mt-2 font-serif text-5xl text-forest">Esplora la destinazione</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/75">
          Mappa e geolocalizzazione dei territori turistici divisi per macro-aree. Filtra hotel
          partner, agriturismi gusto, teatri ed esperienze a tavola.
        </p>
        <div className="mt-6">
          <SearchPanel initialQuery={params.q ?? ""} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {destinations.map((destination) => (
            <a
              key={destination.id}
              href={`/esplora?destinazione=${destination.slug}`}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] ${
                params.destinazione === destination.slug
                  ? "bg-forest text-cream"
                  : "bg-white text-forest"
              }`}
            >
              {destination.name}
            </a>
          ))}
        </div>
        <div className="mt-6">
          <DynamicMap
            venues={filtered.map((row) => ({
              id: row.venue.id,
              name: row.venue.name,
              slug: row.venue.slug,
              type: row.venue.type,
              city: row.venue.city,
              lat: row.venue.lat,
              lng: row.venue.lng,
              coverImage: row.venue.coverImage,
              fromPriceCents: row.flags.fromPriceCents,
              localSupportPercent: row.venue.localSupportPercent,
            }))}
            zoom={params.destinazione ? 8 : 6}
            center={
              filtered[0]
                ? [filtered[0].venue.lat, filtered[0].venue.lng]
                : [42.7, 12.6]
            }
          />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <VenueCard
              key={row.venue.id}
              venue={row.venue}
              destination={row.destination}
              sponsor={row.sponsor}
              fromPriceCents={row.flags.fromPriceCents}
            />
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-olive">
            Nessuna struttura per {params.tipo ? venueTypeLabel(params.tipo) : "questa ricerca"}.
          </p>
        ) : null}
      </main>
    </PublicShell>
  );
}
