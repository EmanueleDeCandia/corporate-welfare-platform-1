import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
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
              {company.city} · P.IVA {company.vatNumber}
            </p>
            <p className="mt-5 text-sm leading-7 text-cream/80">{company.description}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Stat label="Rating impatto" value={`${company.impactRating}/100`} />
              <Stat label="Dipendenti nel piano" value={String(company.employeesCount)} />
              <Stat label="Welfare finanziato" value={formatEuro(company.fundedAmountCents)} />
              <Stat label="Ridistribuito" value={formatEuro(company.localRedistributionCents)} />
              <Stat label="CO₂ evitata" value={`${company.co2SavedKg.toLocaleString("it-IT")} kg`} />
              <Stat label="Account attivi" value={String(employees.length)} />
            </div>
          </section>
          <section>
            <h2 className="font-serif text-3xl text-forest">Strutture sponsorizzate</h2>
            <p className="mt-2 text-sm text-olive">
              Hotel e agriturismi dove l&apos;impresa appare come finanziatore del circuito.
            </p>
            <div className="mt-6 grid gap-5">
              {venues.map((row) => (
                <VenueCard
                  key={row.venue.id}
                  venue={row.venue}
                  destination={row.destination}
                  sponsor={company}
                  fromPriceCents={row.flags.fromPriceCents}
                />
              ))}
              {venues.length === 0 ? (
                <p className="rounded-[28px] bg-white p-6 text-sm text-olive">
                  Questa impresa finanzia il circuito in modo trasversale, senza sponsor di una
                  singola struttura.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-gold">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
    </div>
  );
}