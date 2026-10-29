import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { getCurrentUser } from "@/lib/auth";
import {
  getCompanies,
  getDestinations,
  getPlatformStats,
  getVenues,
} from "@/lib/data";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, destinations, allVenues, companies, user] = await Promise.all([
    getPlatformStats(),
    getDestinations(),
    getVenues(),
    getCompanies(),
    getCurrentUser(),
  ]);

  const featuredVenues = allVenues.slice(0, 3);

  return (
    <PublicShell>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-forest px-4 py-20 text-cream md:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                <Sparkles size={14} /> Welfare Aziendale Territoriale
              </div>

              <h1 className="mt-6 font-serif text-4xl font-normal leading-[1.12] sm:text-5xl lg:text-6xl">
                Riconverti il welfare aziendale in valore reale per il territorio.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/80 font-light">
                RADICI trasforma i piani welfare e i premi di risultato in soggiorni,
                aperitivi a filiera corta e spettacoli dal vivo. Un circuito virtuoso
                dove aziende, dipendenti e fornitori locali creano economia di prossimità.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/esplora"
                  className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream shadow-lg hover:bg-terracotta/90 transition-all"
                >
                  <Compass size={18} /> Esplora la mappa
                </Link>
                {user ? (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-6 py-3.5 text-sm font-medium text-cream hover:bg-cream/20 transition-all"
                  >
                    Il tuo account ({user.firstName})
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/10 px-6 py-3.5 text-sm font-medium text-cream hover:bg-cream/20 transition-all"
                  >
                    Accedi alla demo <ArrowRight size={16} />
                  </Link>
                )}
                <Link
                  href="/come-funziona"
                  className="text-sm text-cream/70 underline underline-offset-4 hover:text-cream transition-colors"
                >
                  Come funziona il circuito
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-cream/10 pt-8 text-xs text-cream/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold" /> Nessun intermediario finanziario
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold" /> Fatturazione diretta alle imprese
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold" /> Rating d&apos;impatto ESG certificato
                </div>
              </div>
            </div>

            {/* HERO STATS CARD */}
            <div className="lg:col-span-5">
              <div className="relative rounded-[32px] border border-gold/25 bg-forest/80 p-8 backdrop-blur-md shadow-2xl">
                <p className="text-xs uppercase tracking-[0.16em] text-gold font-medium">
                  Impatto del Circuito in Tempo Reale
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-cream/5 p-4 border border-cream/10">
                    <p className="text-xs text-cream/60">Welfare Stanziato</p>
                    <p className="mt-1 font-serif text-2xl text-cream font-medium">
                      {formatEuro(stats.fundedCents)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gold/15 p-4 border border-gold/30">
                    <p className="text-xs text-gold">Valore ai Territori</p>
                    <p className="mt-1 font-serif text-2xl text-gold font-semibold">
                      {formatEuro(stats.redistributedCents)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-cream/5 p-4 border border-cream/10">
                    <p className="text-xs text-cream/60">Punti Impatto Sociale</p>
                    <p className="mt-1 font-serif text-2xl text-cream font-medium">
                      {stats.impactPoints}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-cream/5 p-4 border border-cream/10">
                    <p className="text-xs text-cream/60">Strutture & Teatri</p>
                    <p className="mt-1 font-serif text-2xl text-cream font-medium">
                      {stats.venues}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-cream/10 p-4 border border-cream/10">
                  <div className="flex items-center justify-between text-xs text-cream/70">
                    <span>Aziende con piani attivi</span>
                    <span className="font-semibold text-cream">{stats.companies} imprese</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream/15">
                    <div className="h-full bg-gold rounded-full" style={{ width: "78%" }} />
                  </div>
                  <p className="mt-2 text-[11px] text-cream/60">
                    Redistribuzione media locale pari al 68.5% del montante welfare.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 PILLARS SECTION */}
      <section className="bg-cream px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
              Un modello economico trasparente
            </p>
            <h2 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
              Come RADICI connette azienda e comunità
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[28px] bg-white p-7 shadow-sm border border-forest/5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                  <Building2 size={24} />
                </div>
                <h3 className="mt-5 font-serif text-xl text-forest">Per le Imprese</h3>
                <p className="mt-2 text-sm text-olive leading-relaxed">
                  Fatturazione diretta, deducibilità fiscale totale e report ESG di filiera
                  sul capitale rigenerato sul territorio.
                </p>
              </div>
              <Link href="/imprese" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold transition-colors">
                Scopri i vantaggi ESG <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-[28px] bg-white p-7 shadow-sm border border-forest/5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                  <Sparkles size={24} />
                </div>
                <h3 className="mt-5 font-serif text-xl text-forest">Per i Dipendenti</h3>
                <p className="mt-2 text-sm text-olive leading-relaxed">
                  Portafoglio digitale con 1 pernottamento e 1 cena KM 0 all&apos;anno.
                  Selezioni data e struttura; il Matching Grant culturale si attiva dopo.
                </p>
              </div>
              <Link href="/account" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold transition-colors">
                Accedi al portafoglio <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-[28px] bg-white p-7 shadow-sm border border-forest/5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                  <Users size={24} />
                </div>
                <h3 className="mt-5 font-serif text-xl text-forest">Referral & Amici</h3>
                <p className="mt-2 text-sm text-olive leading-relaxed">
                  Invita familiari e amici: loro ottengono il 10% di sconto nei locali convenzionati,
                  tu accumuli Punti Impatto e badge civici.
                </p>
              </div>
              <Link href="/come-funziona" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold transition-colors">
                Vedi il meccanismo <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-[28px] bg-white p-7 shadow-sm border border-forest/5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                  <QrCode size={24} />
                </div>
                <h3 className="mt-5 font-serif text-xl text-forest">Per le Strutture</h3>
                <p className="mt-2 text-sm text-olive leading-relaxed">
                  Pannello cassa dedicato: check-in tramite QR code, notifiche con estremi di
                  fatturazione pronti e zero commissioni d&apos;intermediazione.
                </p>
              </div>
              <Link href="/fornitore" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold transition-colors">
                Area fornitore <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DESTINATIONS PREVIEW */}
      <section className="bg-mist px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
                I comprensori del circuito
              </p>
              <h2 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
                Destinazioni e paesaggi d&apos;autore
              </h2>
            </div>
            <Link
              href="/esplora"
              className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-5 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream transition-all"
            >
              Vedi tutte le mete <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/destinazioni/${dest.slug}`}
                className="group relative overflow-hidden rounded-[28px] bg-forest text-cream shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-forest/40">
                  <img
                    src={dest.coverImage}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs uppercase tracking-[0.14em] text-gold">{dest.region}</span>
                  <h3 className="mt-1 font-serif text-xl font-medium">{dest.name}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-cream/75">{dest.tagline}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-cream/10 pt-3 text-xs text-cream/60">
                    <span>{dest.highlight}</span>
                    <ArrowRight size={14} className="text-gold group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED VENUES */}
      <section className="bg-cream px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
                Accoglienza & Gusto
              </p>
              <h2 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
                Strutture convenzionate in evidenza
              </h2>
            </div>
            <Link
              href="/strutture"
              className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-5 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream transition-all"
            >
              Tutte le strutture ({allVenues.length}) <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVenues.map((row) => (
              <VenueCard
                key={row.venue.id}
                venue={row.venue}
                destination={row.destination}
                sponsor={row.sponsor}
                fromPriceCents={row.flags.fromPriceCents}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CORPORATE PARTNERS */}
      <section className="bg-forest px-4 py-16 text-cream md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Network di responsabilità sociale
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
              Le imprese che sostengono il territorio
            </h2>
            <p className="mt-3 text-sm text-cream/75">
              Aziende virtuose che hanno sostituito buoni generici con budget welfare a chilometro zero.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/imprese/${company.slug}`}
                className="rounded-3xl border border-cream/10 bg-cream/5 p-6 hover:bg-cream/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-medium text-gold">
                    ESG {company.impactRating}/100
                  </span>
                  <span className="text-xs text-cream/50">{company.city}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl">{company.name}</h3>
                <p className="mt-1 text-xs text-cream/65">{company.sector}</p>
                <div className="mt-4 border-t border-cream/10 pt-3 text-xs text-cream/70 flex justify-between">
                  <span>Capitale welfare:</span>
                  <span className="font-semibold text-cream">{formatEuro(company.fundedAmountCents)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-cream px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-terracotta/10 border border-terracotta/20 p-8 text-center md:p-12">
          <h2 className="font-serif text-3xl text-forest sm:text-4xl">
            Pronto a testare il welfare territoriale?
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-sm leading-relaxed text-olive">
            Prova l&apos;esperienza sia dal punto di vista del dipendente (riscatto voucher e referral amici)
            sia dal punto di vista dell&apos;agriturismo (ricezione check-in e fatturazione).
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-forest px-8 py-3.5 text-sm font-medium text-cream hover:bg-forest/90 transition-all"
            >
              Accedi con un utente demo
            </Link>
            <Link
              href="/registrati"
              className="rounded-full border border-forest/20 bg-white px-8 py-3.5 text-sm font-medium text-forest hover:bg-forest/5 transition-all"
            >
              Registra un nuovo account
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}