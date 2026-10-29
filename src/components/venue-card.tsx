import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import type { companies, destinations, venues } from "@/db/schema";
import { formatEuro, initials, venueTypeLabel } from "@/lib/utils";

type Props = {
  venue: typeof venues.$inferSelect;
  destination?: typeof destinations.$inferSelect | null;
  sponsor?: typeof companies.$inferSelect | null;
  featured?: boolean;
  fromPriceCents?: number;
};

export function VenueCard({ venue, destination, sponsor, featured = false, fromPriceCents = 0 }: Props) {
  const services = venue.services ?? [];

  return (
    <article
      className={`group overflow-hidden rounded-[28px] border border-forest/8 bg-white ${
        featured ? "shadow-[0_30px_70px_rgba(28,58,46,0.12)]" : "shadow-sm"
      }`}
    >
      <Link href={`/strutture/${venue.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={venue.coverImage}
            alt={venue.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-forest">
            {venueTypeLabel(venue.type)}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl leading-tight text-forest">{venue.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-olive">
                <MapPin size={14} />
                {venue.city}, {destination?.region ?? venue.region}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-olive">da</p>
              <p className="font-medium text-forest">
                {fromPriceCents > 0 ? formatEuro(fromPriceCents) : "su richiesta"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-forest/75">{venue.description}</p>
          {services.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-forest">
              {services.slice(0, 2).map((service) => (
                <li key={service}>— {service}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-mist pt-4">
            {sponsor ? (
              <div className="flex items-center gap-2 text-xs text-olive">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold text-cream"
                  style={{ background: sponsor.accent }}
                >
                  {initials(sponsor.name)}
                </span>
                <span>
                  Sponsorizzato da
                  <strong className="block text-forest">{sponsor.name}</strong>
                </span>
              </div>
            ) : (
              <span className="text-xs uppercase tracking-[0.14em] text-olive">Partner RADICI</span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-forest/8 px-3 py-1 text-xs text-forest">
              <Sparkles size={13} />
              Genera +{venue.impactPointsGenerated} Punto Impatto
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}