import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { getInviteByCode, getVenues } from "@/lib/data";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatEuro, venueTypeLabel } from "@/lib/utils";
import { Sparkles, Utensils, Bed, Ticket, ArrowRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invite = await getInviteByCode(code);
  if (!invite) notFound();
  const [inviter] = await db.select().from(users).where(eq(users.id, invite.inviterId)).limit(1);
  const venues = await getVenues();

  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6 space-y-8">
        {/* Intestazione Invito con Sconto 10% */}
        <section className="rounded-[32px] bg-white p-6 md:p-8 border border-forest/10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta flex items-center gap-1.5">
              <Sparkles size={14} /> Sconto Community 10% Attivo
            </span>
            <span className="text-xs text-olive">Codice Convenzione: {invite.code}</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl md:text-4xl text-forest">
            Ciao {invite.firstName}, {inviter ? `${inviter.firstName} ${inviter.lastName}` : "un amico"} ti ha regalato lo sconto RADICI
          </h1>

          <p className="mt-3 text-sm md:text-base leading-7 text-ink/80">
            Questo invito personale ti dà diritto al <strong>10% di sconto immediato</strong> su soggiorni,
            cene contadine e rassegne teatrali nel circuito montano marchigiano.
            Non consumi alcun buono welfare: paghi in autonomia con la tua carta beneficiando della convenzione.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-mist pt-4">
            <Link
              href={`/registrati?invite=${invite.code}`}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-cream hover:bg-terracotta/90 transition shadow-sm"
            >
              Attiva account e sblocca lo sconto <ArrowRight size={16} />
            </Link>
            <span className="text-xs text-olive flex items-center gap-1">
              <ShieldCheck size={14} className="text-forest" /> Pagamento trasparente in cassa con regolare scontrino
            </span>
          </div>
        </section>

        {/* Tabella / Elenco Prezzi e Strutture Convenzionate */}
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-forest">Listino Prezzi Convenzionati con Sconto 10%</h2>
            <p className="text-xs md:text-sm text-olive">
              Presenta il tuo codice invito all&apos;arrivo oppure inquadra il QR code sul posto per accedere direttamente alla cassa con lo sconto applicato.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {venues.slice(0, 6).map(({ venue, destination }) => {
              const hasHotel = venue.priceHotelCents > 0;
              const hasAperitivo = venue.priceAperitivoCents > 0;
              const hasShow = venue.priceShowCents > 0;

              return (
                <div
                  key={venue.id}
                  className="rounded-[24px] bg-white p-5 border border-forest/10 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-[11px] font-semibold text-forest uppercase tracking-wider">
                        {venueTypeLabel(venue.type)}
                      </span>
                      <span className="text-xs text-olive">{venue.city} ({destination.region})</span>
                    </div>

                    <h3 className="mt-2 font-serif text-xl text-forest">{venue.name}</h3>
                    <p className="mt-1 text-xs text-ink/70 line-clamp-2">{venue.description}</p>

                    {/* Prezzi esposti con sconto 10% calcolato */}
                    <div className="mt-4 space-y-2 border-t border-mist pt-3 text-xs">
                      {hasHotel && (
                        <div className="flex items-center justify-between">
                          <span className="text-olive flex items-center gap-1.5">
                            <Bed size={14} /> Pernottamento:
                          </span>
                          <span>
                            <span className="line-through text-olive/60 mr-1.5">{formatEuro(venue.priceHotelCents)}</span>
                            <strong className="text-terracotta text-sm">{formatEuro(Math.round(venue.priceHotelCents * 0.9))}</strong>
                          </span>
                        </div>
                      )}
                      {hasAperitivo && (
                        <div className="flex items-center justify-between">
                          <span className="text-olive flex items-center gap-1.5">
                            <Utensils size={14} /> Cena / Degustazione KM 0:
                          </span>
                          <span>
                            <span className="line-through text-olive/60 mr-1.5">{formatEuro(venue.priceAperitivoCents)}</span>
                            <strong className="text-terracotta text-sm">{formatEuro(Math.round(venue.priceAperitivoCents * 0.9))}</strong>
                          </span>
                        </div>
                      )}
                      {hasShow && (
                        <div className="flex items-center justify-between">
                          <span className="text-olive flex items-center gap-1.5">
                            <Ticket size={14} /> Biglietto Spettacolo:
                          </span>
                          <span>
                            <span className="line-through text-olive/60 mr-1.5">{formatEuro(venue.priceShowCents)}</span>
                            <strong className="text-terracotta text-sm">{formatEuro(Math.round(venue.priceShowCents * 0.9))}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-mist flex items-center justify-between">
                    <span className="text-[11px] text-olive">Sconto 10% garantito</span>
                    <Link
                      href={`/checkin/${venue.checkinCode}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
                    >
                      Vai alla Cassa Convenzionata →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
