import Link from "next/link";
import { MapPin } from "lucide-react";
import type { companies, destinations, venues } from "@/db/schema";
import { formatEuro, initials, venueTypeLabel } from "@/lib/utils";

type Props = {
  venue: typeof venues.$inferSelect;
  destination?: typeof destinations.$inferSelect | null;
  sponsor?: typeof companies.$inferSelect | null;
  featured?: boolean;
  fromPriceCents?: number;
};

export function VenueCard({ venue, destination, sponsor, fromPriceCents = 0 }: Props) {
  const services = venue.services ?? [];

  return (
    <article className="group overflow-hidden rounded-2xl bg-white">
      <Link href={`/strutture/${venue.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={venue.coverImage}
            alt={venue.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-[11px] text-forest">
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
              <p className="text-[11px] text-olive">da</p>
              <p className="text-forest">
                {fromPriceCents > 0 ? formatEuro(fromPriceCents) : "su richiesta"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-olive">{venue.description}</p>
          {services.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-olive">
              {services.slice(0, 2).map((service) => (
                <li key={service}>— {service}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-mist pt-4">
            {sponsor ? (
              <div className="flex items-center gap-2 text-xs text-olive">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-medium text-cream"
                  style={{ background: sponsor.accent }}
                >
                  {initials(sponsor.name)}
                </span>
                <span>
                  Sponsorizzato da
                  <strong className="block font-medium text-forest">{sponsor.name}</strong>
                </span>
              </div>
            ) : (
              <span className="text-xs text-olive">Partner RADICI</span>
            )}
            <span className="text-xs text-olive">+{venue.impactPointsGenerated} Punto Impatto</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
