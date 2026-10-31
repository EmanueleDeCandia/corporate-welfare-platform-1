import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { CycleDiagram } from "@/components/duna-diagrams";
import { getCurrentUser } from "@/lib/auth";
import { getCompanies, getDestinations, getPlatformStats, getVenues } from "@/lib/data";
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
  const accountPath =
    user?.role === "provider"
      ? "/fornitore"
      : user?.role === "csr"
        ? "/azienda"
        : user?.role === "promoter" || user?.role === "admin"
          ? "/promotori"
          : "/account";

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/hero.jpg" alt="" className="h-[320px] w-full object-cover md:h-[420px]" />
      </section>

      <section className="px-4 py-16 text-center md:py-24">
        <p className="text-[11px] uppercase tracking-[0.2em] text-olive">Welfare territoriale</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-[1.15] text-forest sm:text-5xl md:text-6xl">
          Il nuovo standard del welfare che resta sul territorio.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-olive">
          RADICI riconverte premi e piani welfare in soggiorni, cene KM 0 e cultura locale. Un
          circuito dove impresa, dipendente e fornitore creano economia di prossimità.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/esplora" className="rounded-full bg-forest px-5 py-2 text-sm text-cream">
            Esplora
          </Link>
          {user ? (
            <Link href={accountPath} className="rounded-full border border-forest/15 px-5 py-2 text-sm text-forest">
              Il tuo spazio
            </Link>
          ) : (
            <Link href="/login" className="rounded-full border border-forest/15 px-5 py-2 text-sm text-forest">
              Accedi alla demo
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-3 gap-6 px-4 pb-8 text-center md:px-6">
        <div>
          <p className="font-serif text-3xl md:text-5xl">{formatEuro(stats.fundedCents)}</p>
          <p className="mt-2 text-xs text-olive">welfare stanziato</p>
        </div>
        <div>
          <p className="font-serif text-3xl md:text-5xl">{formatEuro(stats.redistributedCents)}</p>
          <p className="mt-2 text-xs text-olive">valore ai territori</p>
        </div>
        <div>
          <p className="font-serif text-3xl md:text-5xl">{stats.venues}</p>
          <p className="mt-2 text-xs text-olive">strutture e teatri</p>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Pensato per convertire. Costruito per durare.</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Imprese CSR",
              text: "Fatturazione diretta, deducibilità e report ESG sul capitale che torna al territorio.",
              href: "/imprese",
            },
            {
              title: "Dipendenti",
              text: "Un pernottamento e una cena KM 0. Poi il Matching Grant culturale, senza anticipi.",
              href: "/account",
            },
            {
              title: "Fornitori",
              text: "Check-in, prospetto Art. 51 TUIR, numero fattura e stato Da saldare → Saldato.",
              href: "/fornitore",
            },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="rounded-2xl bg-mist/80 p-7 hover:bg-mist">
              <h3 className="font-serif text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-olive">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl md:text-4xl">I comprensori</h2>
            <Link href="/destinazioni" className="text-sm text-olive hover:text-forest">
              Tutte →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((dest) => (
              <Link key={dest.id} href={`/destinazioni/${dest.slug}`} className="group overflow-hidden rounded-2xl">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={dest.coverImage}
                    alt={dest.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-olive">{dest.region}</p>
                  <h3 className="font-serif text-xl">{dest.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px]">
          <div className="relative px-6 py-16 text-center md:px-12 md:py-24">
            <img
              src="/images/abstract-blur.jpg"
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px]"
            />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.18em] text-cream/80">Il circuito</p>
              <h2 className="mt-3 font-serif text-3xl text-cream md:text-4xl">
                L&apos;infrastruttura dietro ogni soggiorno
              </h2>
              <div className="mt-10">
                <CycleDiagram />
              </div>
              <Link href="/come-funziona" className="mt-8 inline-flex rounded-full border border-cream/40 px-4 py-1.5 text-sm text-cream">
                Come funziona
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-olive">Dipendenti</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Un portafoglio, due voucher, un territorio.</h2>
            <p className="mt-4 text-sm leading-7 text-olive">
              Ogni dipendente sceglie data e struttura. Extra solo a ridosso della scadenza, se resta
              circa il 20% inutilizzato. Gli amici pagano in locale e tu accumuli Punti Impatto.
            </p>
            <Link href="/account" className="mt-6 inline-flex text-sm text-forest underline underline-offset-4">
              Accedi al portafoglio
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src="/images/val-dorcia.jpg" alt="" className="h-72 w-full object-cover md:h-80" />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-2xl md:order-1">
            <img src="/images/agriturismo-valle.jpg" alt="" className="h-72 w-full object-cover md:h-80" />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-olive">Fornitori</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Due canali. Una distinta chiara.</h2>
            <p className="mt-4 text-sm leading-7 text-olive">
              Welfare B2B e consumer B2C. RADICI mostra la fee, tu inserisci numero e data fattura,
              lo stato passa da pending a settled.
            </p>
            <Link href="/login" className="mt-6 inline-flex text-sm text-forest underline underline-offset-4">
              Pannello fornitore
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl md:text-4xl">Strutture in evidenza</h2>
            <Link href="/strutture" className="text-sm text-olive hover:text-forest">
              Tutte ({allVenues.length}) →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
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

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Imprese che sostengono il territorio</h2>
          <p className="mt-3 text-sm text-olive">
            Hanno sostituito i buoni generici con budget welfare a chilometro zero.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {companies.map((company) => (
            <Link key={company.id} href={`/imprese/${company.slug}`} className="rounded-2xl bg-white p-6">
              <p className="text-[11px] text-olive">
                ESG {company.impactRating}/100 · {company.city}
              </p>
              <h3 className="mt-3 font-serif text-xl">{company.name}</h3>
              <p className="mt-1 text-xs text-olive">{company.sector}</p>
              <p className="mt-4 text-sm text-forest">{formatEuro(company.fundedAmountCents)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-3xl py-12 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Pronto a testare il circuito?</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-olive">
            Prova l&apos;esperienza del dipendente, dell&apos;amico consumer e del fornitore. Password demo
            radici2026.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-full bg-forest px-5 py-2 text-sm text-cream">
              Accedi
            </Link>
            <Link href="/registrati" className="rounded-full border border-forest/15 px-5 py-2 text-sm text-forest">
              Crea un account
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
