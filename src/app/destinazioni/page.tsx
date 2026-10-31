import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getDestinations, getVenues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DestinationsListPage() {
  const [destinations, venues] = await Promise.all([getDestinations(), getVenues()]);

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/hero.jpg" alt="" className="h-48 w-full object-cover md:h-64" />
      </section>
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-olive">Macro-aree del circuito</p>
          <h1 className="mt-3 font-serif text-4xl text-forest sm:text-5xl">I comprensori RADICI</h1>
          <p className="mt-4 text-[15px] leading-7 text-olive">
            Dalle colline maceratesi alle vigne delle Langhe, dai poderi senesi alle masserie del
            Salento: quattro geografie dove il welfare finanzia accoglienza e cultura a KM 0.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {destinations.map((destination) => {
            const count = venues.filter((row) => row.destination.id === destination.id).length;
            return (
              <Link key={destination.id} href={`/destinazioni/${destination.slug}`} className="group overflow-hidden rounded-2xl">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={destination.coverImage}
                    alt={destination.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-4 pb-5 pt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-olive">{destination.region}</p>
                  <h2 className="mt-1 font-serif text-3xl">{destination.name}</h2>
                  <p className="mt-2 text-sm text-olive">{destination.tagline}</p>
                  <p className="mt-3 text-xs text-olive">{count} strutture convenzionate</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </PublicShell>
  );
}
