import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getCompanies } from "@/lib/data";
import { formatEuro, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/marche.jpg" alt="" className="h-48 w-full object-cover md:h-64" />
      </section>
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Trasparenza ESG</p>
        <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Imprese clienti illuminate</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive">
          Aziende che finanziano il circuito acquistando voucher per i propri dipendenti. Il rating
          di impatto sociale territoriale misura capitale ridistribuito e CO₂ evitata.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/imprese/${company.slug}`}
              className="rounded-2xl bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full text-sm font-semibold text-cream"
                    style={{ background: company.accent }}
                  >
                    {initials(company.name)}
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl text-forest">{company.name}</h2>
                    <p className="text-sm text-olive">
                      {company.city} · {company.sector}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl text-terracotta">{company.impactRating}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-olive">Rating</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/75">{company.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-cream px-3 py-3">
                  <p className="text-xs text-olive">Welfare finanziato</p>
                  <p className="font-medium text-forest">{formatEuro(company.fundedAmountCents)}</p>
                </div>
                <div className="rounded-2xl bg-cream px-3 py-3">
                  <p className="text-xs text-olive">Sul territorio</p>
                  <p className="font-medium text-forest">{formatEuro(company.localRedistributionCents)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}