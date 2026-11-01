import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { BlurredPanel } from "@/components/vantaggi/panel";
import { StepsDiagram } from "@/components/duna-diagrams";
import { getSessionToken, pathWithSession } from "@/lib/auth";
import { getPlatformStats, getVenues } from "@/lib/data";
import { formatEuro } from "@/lib/utils";
import {
  benefitMatrix,
  ECOSYSTEM_INTRO,
  IMPACT_INTRO,
  impactIndicators,
  modules,
  POSITIONING,
  processSteps,
  stakeholders,
} from "@/content/vantaggi";
import {
  CHURN_REDUCTION_PERCENT,
  CLAIM_NOTE,
  DEDUCIBILITA_PERCENT,
  INDOTTO_MULTIPLIER,
  MATCHING_GRANT_CENTS,
} from "@/content/vantaggi-claims";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "I vantaggi della partecipazione | RADICI",
  description:
    "Welfare aziendale, vending smart, filiera fresca Km 0 e promozione culturale: cosa ottengono imprese, dipendenti, produttori locali e teatri.",
};

export default async function VantaggiPage() {
  const [stats, allVenues, token] = await Promise.all([getPlatformStats(), getVenues(), getSessionToken()]);
  const href = (path: string) => pathWithSession(path, token);

  const producerCount = allVenues.filter((row) => row.venue.type === "producer").length;
  const theaterCount = allVenues.filter((row) => row.venue.type === "theater").length;
  const hospitalityCount = allVenues.filter((row) => row.venue.type !== "producer").length;

  const indotto = String(INDOTTO_MULTIPLIER).replace(".", ",");

  const impactMeta: Record<string, string> = {
    co2: "0,300 kg di CO₂ evitati per ogni km non percorso",
    indotto: `${indotto}× moltiplicatore dell'indotto locale`,
    cultura: `Teatri convenzionati nel circuito: ${theaterCount} (demo)`,
    esposizione: `Imprese aderenti con reporting attivo: ${stats.companies} (demo)`,
  };

  const kpis = [
    { label: "Imprese aderenti", value: String(stats.companies) },
    { label: "Strutture convenzionate", value: String(hospitalityCount) },
    { label: "Produttori KM 0", value: String(producerCount) },
    { label: "Welfare stanziato", value: formatEuro(stats.fundedCents) },
  ];

  return (
    <PublicShell>
      {/* 1 — Hero */}
      <section className="px-3 pt-6 md:px-6 md:pt-10">
        <BlurredPanel
          image="/images/vantaggi-hero.jpg"
          className="mx-auto max-w-6xl"
          contentClassName="px-6 py-14 md:px-14 md:py-24"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-olive">{POSITIONING.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.12] text-forest md:text-6xl">
            {POSITIONING.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-forest">{POSITIONING.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={href("/imprese")} className="rounded-full bg-forest px-6 py-3 text-sm text-cream">
              Richiedi una convenzione
            </Link>
            <Link
              href={href("/come-funziona")}
              className="rounded-full border border-forest/25 bg-cream px-6 py-3 text-sm text-forest hover:bg-mist"
            >
              Vedi come funziona
            </Link>
          </div>
        </BlurredPanel>
      </section>

      {/* 2 — Fascia KPI (numeri dal database) */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-14 text-center md:grid-cols-4 md:px-6">
        {kpis.map((kpi) => (
          <div key={kpi.label}>
            <p className="font-serif text-3xl text-forest md:text-4xl">{kpi.value}</p>
            <p className="mt-2 text-xs text-olive">{kpi.label}</p>
          </div>
        ))}
      </section>

      {/* 3 — Valore per gli stakeholder */}
      <section className="px-3 md:px-6">
        <BlurredPanel
          image="/images/vantaggi-stakeholder.jpg"
          className="mx-auto max-w-6xl"
          contentClassName="px-5 py-14 md:px-12 md:py-20"
        >
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Valore condiviso</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest md:text-4xl">
              Il valore dell&apos;ecosistema per gli stakeholder e la comunità
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-forest">{ECOSYSTEM_INTRO}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {stakeholders.map((item) => (
              <article
                key={item.key}
                className="rounded-2xl border border-forest/10 bg-white p-6 md:p-7"
              >
                <h3 className="font-serif text-xl text-forest md:text-2xl">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-olive">{item.benefit}</p>
              </article>
            ))}
          </div>
        </BlurredPanel>
      </section>

      {/* 4 — Moduli operativi */}
      <section className="px-3 pt-6 md:px-6">
        <BlurredPanel
          image="/images/vantaggi-moduli.jpg"
          className="mx-auto max-w-6xl"
          contentClassName="px-5 py-14 md:px-12 md:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Come funziona l&apos;ecosistema</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest md:text-4xl">
              I moduli operativi dell&apos;iniziativa
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {modules.map((module) => (
              <article
                key={module.key}
                className="flex flex-col rounded-2xl border border-forest/10 bg-white p-6 md:p-7"
              >
                <p className="font-serif text-3xl text-gold">{module.index}</p>
                <h3 className="mt-3 font-serif text-xl leading-snug text-forest">{module.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-olive">{module.text}</p>
                <p className="mt-5 inline-flex w-fit rounded-full bg-forest/8 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-forest">
                  {module.highlight}
                </p>
              </article>
            ))}
          </div>
        </BlurredPanel>
      </section>

      {/* 5 — Matrice dei benefici */}
      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Destinatari finali</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-forest md:text-4xl">
            La matrice dei benefici
          </h2>

          <div className="mt-10 hidden overflow-hidden rounded-2xl border border-forest/10 bg-white md:block">
            <table className="w-full border-collapse text-left align-top text-sm">
              <thead>
                <tr className="bg-mist/70 text-[11px] uppercase tracking-[0.14em] text-forest">
                  <th scope="col" className="px-5 py-4 font-medium">
                    Destinatario finale
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Esigenza / obiettivo
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Soluzione offerta dall&apos;ecosistema
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">
                    Vantaggio diretto e impatto generato
                  </th>
                </tr>
              </thead>
              <tbody>
                {benefitMatrix.map((row) => (
                  <tr key={row.key} className="border-t border-forest/8 align-top">
                    <th scope="row" className="px-5 py-5 font-serif text-base font-normal text-forest">
                      {row.who}
                    </th>
                    <td className="px-5 py-5 text-olive">{row.need}</td>
                    <td className="px-5 py-5 text-olive">{row.solution}</td>
                    <td className="px-5 py-5 text-forest">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-4 md:hidden">
            {benefitMatrix.map((row) => (
              <article key={row.key} className="rounded-2xl border border-forest/10 bg-white p-5">
                <h3 className="font-serif text-xl text-forest">{row.who}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-olive">Esigenza</dt>
                    <dd className="mt-1 text-olive">{row.need}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-olive">Soluzione</dt>
                    <dd className="mt-1 text-olive">{row.solution}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-olive">Vantaggio</dt>
                    <dd className="mt-1 text-forest">{row.advantage}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-olive">
            <span className="rounded-full bg-mist px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-forest">
              {CLAIM_NOTE}
            </span>
            Deducibilità {DEDUCIBILITA_PERCENT}% · churn −{CHURN_REDUCTION_PERCENT}% · moltiplicatore indotto{" "}
            {String(INDOTTO_MULTIPLIER).replace(".", ",")}× · Matching Grant {formatEuro(MATCHING_GRANT_CENTS)} per due
            persone.
          </p>
        </div>
      </section>

      {/* 6 — Processo di coinvolgimento (sfondo sfocato + diagramma + testo dentro l'immagine) */}
      <section className="px-3 md:px-6">
        <BlurredPanel
          image="/images/vantaggi-processo.jpg"
          className="mx-auto max-w-6xl"
          contentClassName="px-5 py-14 md:px-12 md:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Il percorso</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest md:text-4xl">
              Come funziona il processo di coinvolgimento
            </h2>
          </div>

          <div className="mt-6">
            <StepsDiagram steps={processSteps.map((step) => step.short)} tone="forest" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step, index) => (
              <article
                key={step.key}
                className="rounded-2xl border border-forest/10 bg-white p-6"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-olive">0{index + 1}</p>
                <h3 className="mt-2 font-serif text-lg leading-snug text-forest">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-olive">{step.text}</p>
              </article>
            ))}
          </div>
        </BlurredPanel>
      </section>

      {/* 7 — Indicatori di impatto */}
      <section className="px-3 pt-6 md:px-6">
        <BlurredPanel
          image="/images/vantaggi-impatto.jpg"
          className="mx-auto max-w-6xl"
          contentClassName="px-5 py-14 md:px-12 md:py-20"
        >
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Misurazione</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest md:text-4xl">
              Gli indicatori di impatto dell&apos;ecosistema
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-forest">{IMPACT_INTRO}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {impactIndicators.map((indicator) => (
              <article
                key={indicator.key}
                className="flex flex-col rounded-2xl border border-forest/10 bg-white p-6 md:p-7"
              >
                <h3 className="font-serif text-xl text-forest">{indicator.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-olive">{indicator.text}</p>
                <p className="mt-5 border-t border-forest/10 pt-4 text-xs text-olive">
                  {impactMeta[indicator.key]}
                </p>
              </article>
            ))}
          </div>
        </BlurredPanel>
      </section>

      {/* 8 — CTA finale */}
      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-[28px] bg-forest px-8 py-12 text-cream md:flex-row md:items-center md:px-12">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl leading-tight md:text-4xl">Porta l&apos;ecosistema nella tua impresa</h2>
            <p className="mt-3 text-sm leading-6 text-cream/75">
              Definisci il budget CSR, abilita i voucher welfare e ottieni la rendicontazione d&apos;impatto per il
              Bilancio di Sostenibilità.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={href("/imprese")} className="rounded-full bg-gold px-6 py-3 text-sm text-forest">
              Richiedi una convenzione
            </Link>
            <Link
              href={href("/login")}
              className="rounded-full border border-cream/30 px-6 py-3 text-sm text-cream hover:bg-cream/10"
            >
              Prova la piattaforma
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
