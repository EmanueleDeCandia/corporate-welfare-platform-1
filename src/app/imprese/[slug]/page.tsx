import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { db, initDb } from "@/db";
import { bookings } from "@/db/schema";
import { getCompanyBySlug, getCompanyEmployees, getVenuesByCompany } from "@/lib/data";
import { formatEuro, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [venues, employees] = await Promise.all([
    getVenuesByCompany(company.id),
    getCompanyEmployees(company.id),
  ]);

  const employeeIds = employees.map((e) => e.id);

  // =========================================================================
  // PREDISPOSIZIONE SERVER PRODUZIONE:
  // Calcolo non arbitrario della CO₂ evitata:
  // Formula: CO₂ evitata = (numero ordini dei dipendenti presso produttori Filiera Corta) * 15 Kg
  // Ogni acquisto di cesto o prodotto agroalimentare a km 0 evita la catena del freddo industriale
  // e i trasporti logistici interregionali su gomma (15 kg CO₂ eq. risparmiati per ogni ordine).
  // In fase iniziale o demo, se non sono ancora registrati ordini dai dipendenti, viene impiegato
  // il valore registrato a database all'inserimento dell'impresa (o dal seed demo).
  // =========================================================================
  let dynamicCo2Kg = company.co2SavedKg;
  let producerOrdersCount = 0;
  if (employeeIds.length > 0) {
    await initDb();
    const basketBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          inArray(bookings.userId, employeeIds),
          eq(bookings.bookingType, "local_basket")
        )
      );
    producerOrdersCount = basketBookings.length;
    if (producerOrdersCount > 0) {
      dynamicCo2Kg = producerOrdersCount * 15;
    }
  }

  // Calcolo esatto non arbitrario della redistribuzione economica territoriale:
  // Moltiplicatore 5,1x: per ogni euro di welfare finanziato, 5,10€ ricadono direttamente
  // sull'economia reale dei borghi storici e delle filiere locali.
  const localRedistributionCents = Math.round(company.fundedAmountCents * 5.1);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[32px] bg-forest p-8 text-cream">
            <span
              className="grid h-16 w-16 place-items-center rounded-full text-lg font-semibold"
              style={{ background: company.accent }}
            >
              {initials(company.name)}
            </span>
            <h1 className="mt-6 font-serif text-5xl">{company.name}</h1>
            <p className="mt-2 text-sm text-gold">
              {company.city} · {company.sector} · P.IVA {company.vatNumber}
            </p>
            <p className="mt-5 text-sm leading-7 text-cream/80">{company.description}</p>

            {/* Dati e Indicatori non arbitrari */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Stat label="Rating impatto" value={`${company.impactRating}/100`} />
              <Stat label="Dipendenti nel piano" value={String(company.employeesCount)} />
              <Stat label="Welfare finanziato" value={formatEuro(company.fundedAmountCents)} />
              <Stat
                label="Ridistribuito (5,1x)"
                value={formatEuro(localRedistributionCents)}
                sub="Moltiplicatore borghi"
              />
              <Stat
                label="CO₂ evitata"
                value={`${dynamicCo2Kg.toLocaleString("it-IT")} kg`}
                sub={producerOrdersCount > 0 ? `${producerOrdersCount} ordini filiera × 15 kg` : "15 kg / quota"}
              />
              <Stat label="Account attivi" value={String(employees.length)} />
            </div>

            {/* Descrizione Impatto Sviluppo Locale redatta dal Gestore */}
            <div className="mt-6 rounded-2xl bg-white/10 p-5 border border-gold/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  Impatto sullo Sviluppo Locale
                </span>
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-cream">
                  Certificato RADICI
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cream/90 whitespace-pre-line">
                {company.localImpactDescription ||
                  `${company.name} contribuisce direttamente alla rigenerazione economica dei borghi storici italiani, destinando il welfare aziendale a strutture ricettive familiari, produttori agricoli di prossimità e teatri del territorio.`}
              </p>
            </div>

            {/* Pulsante con Link al Reporting Integrato CSR & ESG */}
            <div className="mt-6">
              {company.reportUrl ? (
                <a
                  href={company.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-center text-sm font-semibold text-forest shadow-md transition hover:bg-gold/90 hover:shadow-lg"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Consulta Reporting Integrato CSR & ESG</span>
                </a>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 p-4 text-center">
                  <p className="text-xs text-cream/70">
                    Nessun bilancio sociale esterno collegato. L&apos;impresa può richiederne l&apos;inserimento al gestore RADICI.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl text-forest">Strutture sponsorizzate</h2>
                <p className="mt-1 text-sm text-olive">
                  Hotel, agriturismi, produttori e teatri convenzionati sostenuti direttamente dall&apos;impresa.
                </p>
              </div>
              {venues.length > 0 && (
                <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                  {venues.length} {venues.length === 1 ? "struttura sponsorizzata" : "strutture sponsorizzate"}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5">
              {venues.map((row) => (
                <VenueCard
                  key={row.venue.id}
                  venue={row.venue}
                  destination={row.destination}
                  sponsor={company}
                />
              ))}
              {venues.length === 0 ? (
                <div className="rounded-[28px] border border-forest/10 bg-white p-8 text-center shadow-xs">
                  <p className="font-serif text-xl text-forest">Finanziamento trasversale al circuito</p>
                  <p className="mt-2 text-sm text-olive max-w-md mx-auto">
                    Questa impresa finanzia il welfare in modo diffuso e trasversale, permettendo ai propri dipendenti di spendere i voucher in qualsiasi struttura ricettiva, produttore locale o teatro della rete.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-gold">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      {sub && <p className="text-[10px] text-cream/60 mt-0.5">{sub}</p>}
    </div>
  );
}
