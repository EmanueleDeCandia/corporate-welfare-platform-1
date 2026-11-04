"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Link2, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  SIM_DEFAULTS,
  SIM_GROUPS,
  SIM_SCENARIOS,
  computeImpact,
  inputsFromQuery,
  inputsToQuery,
  scenarioInputs,
  type SimField,
  type SimInputs,
  type SimResult,
} from "@/lib/economics";

const eur = (n: number) =>
  n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num = (n: number, d = 0) => n.toLocaleString("it-IT", { maximumFractionDigits: d });

function unitSuffix(unit: SimField["unit"]) {
  return unit === "n" ? "" : unit === "kg/km" ? " kg/km" : unit === "€" ? " €" : unit === "%" ? " %" : " km";
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: SimField;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <label className="text-xs font-semibold text-forest leading-snug">{field.label}</label>
        <span className="shrink-0 rounded-md bg-forest/5 px-2 py-0.5 font-mono text-xs text-forest">
          {num(value, 2)}
          {unitSuffix(field.unit)}
        </span>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#1C3A2E]"
      />
      {field.hint && <p className="text-[10px] leading-snug text-olive">{field.hint}</p>}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad";
}) {
  const color = tone === "good" ? "text-forest" : tone === "bad" ? "text-wine" : "text-forest";
  return (
    <div className="rounded-2xl border border-mist bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] leading-snug text-olive">{sub}</p>}
    </div>
  );
}

function Results({ r, i }: { r: SimResult; i: SimInputs }) {
  const satTone =
    r.saturation === "over" ? "bg-wine/10 text-wine" : r.saturation === "warning" ? "bg-gold/20 text-terracotta" : "bg-forest/10 text-forest";
  const SatIcon = r.saturation === "ok" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-serif text-lg text-forest">Impatto sul territorio</h4>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Kpi
            label="Welfare finanziato"
            value={eur(r.fundedEuros)}
            sub={`${num(r.overnightVouchers)} notti + ${num(r.dinnersVoucher)} cene riscattate (${num(r.employees)} addetti)`}
          />
          <Kpi
            label="Ridistribuito sul territorio"
            value={eur(r.redistributedEuros)}
            sub="Moltiplicatore 5,1x Studio Fattibilità"
          />
          <Kpi label="Persone ospitate" value={num(r.overnightPersons)} sub={`${num(r.overnightVouchers)} voucher, ${num(r.guestsAccompanying)} accompagnatori`} />
          <Kpi label="Presenze a teatro (Matching Grant)" value={num(r.theatreAttendance)} />
          <Kpi label="Aperitivi-Cena" value={num(r.dinnersTotal)} sub={`${num(r.dinnersVoucher)} voucher, ${num(r.dinnersExtra)} ricorrenti, ${num(r.dinnersFriends)} amici`} />
          <Kpi label="Ricavi prodotti Km 0" value={eur(r.km0RevenueEuros)} sub="Nessun prelievo sui produttori" />
          <Kpi label="Km evitati" value={num(r.kmAvoided)} sub={`${num(r.km0Deliveries)} consegne in sede`} />
          <Kpi label="CO2 evitata" value={`${num(r.co2AvoidedKg)} kg`} />
        </div>
      </div>

      <div>
        <h4 className="font-serif text-lg text-forest">Sostenibilità della Startup</h4>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Kpi label="Commissioni di convenzione hotel" value={eur(r.hotelCommissionEuros)} sub={`${num(i.hotelCommissionPct)}% su ${eur(r.hotelRevenueEuros)}`} />
          <Kpi label="Margine Aperitivi-Cena" value={eur(r.dinnerMarginEuros)} sub={`${num(r.dinnerMarginPerUnitEuros, 2)} € a cena (${num(r.dinnerMarginPct, 0)}%)`} />
          <Kpi label="Costo di cassa Matching Grant" value={eur(r.grantCashCostEuros)} sub={`Costo opportunità buoni servizi: ${eur(r.grantOpportunityCostEuros)}`} />
          <Kpi
            label="Copertura del grant"
            value={`${num(r.grantCoverageRatio, 2)}x`}
            sub={`Cene per voucher al pareggio del grant: ${num(r.dinnersPerGrantBreakEven, 2)}`}
            tone={r.grantCoverageRatio >= 1 ? "good" : "bad"}
          />
          <Kpi label="Costo torneo trailer" value={eur(r.tournamentCostEuros)} sub={`${num(r.tournamentTickets)} biglietti omaggio`} />
          <Kpi label="Rassegna Startup (6 eventi/mese)" value={eur(r.startupCostEuros)} sub="Costo unitario stimato" />
        </div>
        <div className={`mt-3 rounded-2xl border p-4 ${r.netResultEuros >= 0 ? "border-forest/30 bg-forest/5" : "border-wine/30 bg-wine/5"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">Risultato netto annuo stimato</p>
          <p className={`mt-1 font-serif text-3xl ${r.netResultEuros >= 0 ? "text-forest" : "text-wine"}`}>{eur(r.netResultEuros)}</p>
          <p className="mt-1 text-xs text-olive">
            {r.breakEvenEmployees !== null
              ? `Pareggio a circa ${num(r.breakEvenEmployees)} addetti${
                  r.breakEvenMonths !== null ? `; a questi volumi i costi fissi si coprono in ${num(r.breakEvenMonths, 1)} mesi.` : "."
                }`
              : "Con i parametri attuali il contributo per addetto non è positivo: nessun pareggio raggiungibile aumentando la rete."}
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-serif text-lg text-forest">Quota trattenuta dai partner</h4>
        <div className="mt-2 overflow-hidden rounded-2xl border border-mist bg-white text-xs">
          <table className="w-full">
            <tbody className="divide-y divide-mist">
              <tr>
                <td className="px-3 py-2 text-olive">Hotel e strutture ricettive</td>
                <td className="px-3 py-2 text-right font-semibold text-forest">{num(r.hotelRetainedPct, 0)}% del ricavo</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-olive">Ristoranti partner (per Aperitivo-Cena)</td>
                <td className="px-3 py-2 text-right font-semibold text-forest">15% del prezzo per servizio allestimento</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-olive">Startup (Aperitivo-Cena)</td>
                <td className="px-3 py-2 text-right font-semibold text-forest">65% del prezzo cena</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-olive">Produttori Km 0</td>
                <td className="px-3 py-2 text-right font-semibold text-forest">90% (apporto In Kind)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={`flex items-start gap-3 rounded-2xl p-4 text-xs ${satTone}`}>
        <SatIcon size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">
            Saturazione dei posti letto: {num(r.bedsSaturationPct, 0)}% ({num(r.personsPerShow, 0)} persone per spettacolo su {num(i.bedsPerShow)} posti)
          </p>
          <p className="mt-0.5 opacity-80">
            {r.saturation === "over"
              ? "La domanda supera la disponibilità locale: aumentare i posti convenzionati o gli spettacoli."
              : r.saturation === "warning"
                ? "Disponibilità quasi satura: serve ampliare la rete di strutture."
                : "La capacità locale assorbe la domanda stimata."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ImpactSimulator() {
  const [inputs, setInputs] = useState<SimInputs>(SIM_DEFAULTS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.location.search) {
      setInputs(inputsFromQuery(window.location.search));
    }
  }, []);

  const result = useMemo(() => computeImpact(inputs), [inputs]);
  const scenarios = useMemo(
    () => SIM_SCENARIOS.map((s) => ({ s, r: computeImpact(scenarioInputs(s)) })),
    []
  );

  function set<K extends keyof SimInputs>(key: K, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function copyLink() {
    const q = inputsToQuery(inputs);
    const url = `${window.location.origin}${window.location.pathname}${q ? `?${q}` : ""}#simulatore`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia il link dello scenario:", url);
    }
  }

  return (
    <section id="simulatore" className="space-y-6 scroll-mt-24">
      <div className="border-l-2 border-forest pl-4">
        <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold block">
          Strumento · Simulatore di Impatto
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1 flex items-center gap-2">
          <Calculator size={26} /> Simulatore di Impatto del Circuito
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/80">
          Modifica gli input e verifica in tempo reale impatto sul territorio e sostenibilità economica della Startup. Il
          calcolo è deterministico: stessi input, stessi risultati. Stima a scopo dimostrativo per validare la capacità di Condivisione del Valore.
          Non considera le linee di revenue da rewardding crowfondung per servizi tecnologici, sponsorizzazioni e convenzioni per evento locale con le Unioni di Comuni.
        </p>
      </div>

      {/* Scenari */}
      <div className="rounded-3xl border border-mist bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-lg text-forest">Scenari a confronto</h3>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(({ s }) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setInputs(scenarioInputs(s))}
                className="rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest hover:text-cream cursor-pointer"
              >
                Carica {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-olive">
                <th className="py-2 pr-3">Indicatore</th>
                {scenarios.map(({ s }) => (
                  <th key={s.id} className="py-2 px-3 text-right">{s.label}</th>
                ))}
                <th className="py-2 pl-3 text-right text-forest">Scenario attuale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {(
                [
                  ["Addetti coinvolti", (r: SimResult) => num(r.employees)],
                  ["Welfare finanziato (voucher riscattati)", (r: SimResult) => eur(r.fundedEuros)],
                  ["Ridistribuito sul territorio (5,1x Studio Fattibilità)", (r: SimResult) => eur(r.redistributedEuros)],
                  ["Margine lordo Startup", (r: SimResult) => eur(r.startupGrossMarginEuros)],
                  ["Costo di cassa Matching Grant", (r: SimResult) => eur(r.grantCashCostEuros)],
                  ["Copertura del grant", (r: SimResult) => `${num(r.grantCoverageRatio, 2)}x`],
                  ["Risultato netto annuo", (r: SimResult) => eur(r.netResultEuros)],
                  ["Saturazione posti letto", (r: SimResult) => `${num(r.bedsSaturationPct, 0)}%`],
                ] as Array<[string, (r: SimResult) => string]>
              ).map(([label, fn]) => (
                <tr key={label}>
                  <td className="py-2 pr-3 text-olive">{label}</td>
                  {scenarios.map(({ s, r }) => (
                    <td key={s.id} className="py-2 px-3 text-right text-forest">{fn(r)}</td>
                  ))}
                  <td className="py-2 pl-3 text-right font-semibold text-forest">{fn(result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 space-y-1 text-[11px] text-olive">
          {scenarios.map(({ s }) => (
            <li key={s.id}>
              <span className="font-semibold text-forest">{s.label}:</span> {s.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInputs(SIM_DEFAULTS)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-forest/20 px-3 py-2 text-xs font-semibold text-forest transition hover:bg-forest/5 cursor-pointer"
            >
              <RotateCcw size={14} /> Ripristina parametri
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-cream transition hover:bg-forest/90 cursor-pointer"
            >
              <Link2 size={14} /> {copied ? "Link copiato" : "Copia link dello scenario"}
            </button>
          </div>
          {SIM_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3 rounded-2xl border border-mist bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-serif text-base text-forest">{group.title}</h3>
                {group.description && (
                  <p className="mt-0.5 flex items-start gap-1 text-[11px] text-olive">
                    <Info size={12} className="mt-0.5 shrink-0" /> {group.description}
                  </p>
                )}
              </div>
              {group.fields.map((f) => (
                <FieldRow key={f.key} field={f} value={inputs[f.key]} onChange={(v) => set(f.key, v)} />
              ))}
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-mist bg-cream/60 p-5 shadow-sm">
            <Results r={result} i={inputs} />
          </div>
        </div>
      </div>
    </section>
  );
}
