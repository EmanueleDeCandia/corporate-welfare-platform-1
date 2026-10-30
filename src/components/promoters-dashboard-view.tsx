"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CircleDollarSign,
  HeartHandshake,
  Sparkles,
  Store,
  Ticket,
  Wallet,
} from "lucide-react";
import { apiFetch } from "@/lib/session-client";
import type { PromoterDashboardData, PromoterLedgerRow } from "@/lib/promoters";
import { formatDateTime, formatEuro, grantStatusLabel, paymentStatusLabel, venueTypeLabel, voucherTypeLabel } from "@/lib/utils";

type Tab = "overview" | "companies" | "providers" | "vouchers" | "grants";

export function PromotersDashboardView({ data }: { data: PromoterDashboardData }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const p = data.pipeline;
  const e = data.economics;
  const f = data.voucherFunnel;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-forest p-6 text-cream shadow-sm md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          <Sparkles size={14} /> Control Room Startup RADICI
        </div>
        <h1 className="mt-3 font-serif text-3xl md:text-5xl">Intermediario tecnologico dell&apos;ecosistema</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/80">
          Chiara, qui vedi il volume transato, le fee maturate, i pagamenti impresa → fornitore e i
          flussi voucher. RADICI non emette fatture: genera il prospetto, traccia estremi e saldo.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-cream/15 pt-6 lg:grid-cols-4">
          <Stat label="Volume welfare (GMV)" value={formatEuro(e.gmvCents)} hint="Selezioni intermediante" />
          <Stat label="Commissioni RADICI" value={formatEuro(e.commissionCents)} hint="Fee sul volume transato" />
          <Stat label="In attesa di saldo" value={formatEuro(e.pendingCents)} hint={`${e.pendingCount} documenti`} />
          <Stat label="Saldati" value={formatEuro(e.settledCents)} hint={`${e.settledCount} pagati`} />
        </div>
      </section>

      <div className="flex flex-wrap border-b border-mist">
        {(
          [
            ["overview", "Economics"],
            ["companies", `Aziende (${data.companies.length})`],
            ["providers", `Fornitori (${data.providers.length})`],
            ["vouchers", "Voucher e presenze"],
            ["grants", `Matching Grant (${data.grants.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm ${activeTab === id ? "border-b-2 border-forest font-semibold text-forest" : "text-olive"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[28px] border border-forest/10 bg-white p-6">
              <div className="flex items-center gap-2 text-forest">
                <CircleDollarSign size={20} />
                <h2 className="font-serif text-2xl">Fee per canale</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-forest">
                <li className="flex justify-between gap-3">
                  <span>Pernottamenti · 20% (50 € → 10 + 40)</span>
                  <strong>
                    {formatEuro(e.overnightGmvCents)} · fee {formatEuro(e.overnightCommissionCents)}
                  </strong>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Cene · 60% (25 € → 15 + 10)</span>
                  <strong>
                    {formatEuro(e.dinnerGmvCents)} · fee {formatEuro(e.dinnerCommissionCents)}
                  </strong>
                </li>
                <li className="flex justify-between gap-3 text-olive">
                  <span>Consumer B2C (senza fee welfare)</span>
                  <strong>{formatEuro(e.consumerGmvCents)}</strong>
                </li>
                <li className="flex justify-between gap-3 border-t border-mist pt-3">
                  <span>Netto strutture</span>
                  <strong>{formatEuro(e.providerNetCents)}</strong>
                </li>
              </ul>
            </section>
            <section className="rounded-[28px] border border-forest/10 bg-white p-6">
              <div className="flex items-center gap-2 text-forest">
                <HeartHandshake size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl">Matching Grant · posti</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                Nessun esborso se l&apos;ospite non si presenta. Si gestiscono capienza, conferme T-7/T-3
                e presenze in teatro.
              </p>
              <ul className="mt-4 space-y-1 text-sm text-forest">
                <li>Pernottamenti selezionati: {p.overnightSelected}</li>
                <li>Grant ancora da scegliere: {p.overnightWithoutGrant}</li>
                <li>Posti impegnati: {p.seatsHeld}</li>
                <li>Presenti / no-show: {p.attended} / {p.noShow}</li>
              </ul>
            </section>
          </div>
          <LedgerTable rows={data.ledger} canSettle />
        </div>
      )}

      {activeTab === "companies" && (
        <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
          <div className="flex items-center gap-2 text-forest">
            <Building2 size={20} />
            <h2 className="font-serif text-2xl">Imprese CSR</h2>
          </div>
          <table className="mt-4 w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-olive">
              <tr>
                <th className="py-3">Impresa</th>
                <th className="py-3">Addetti</th>
                <th className="py-3">Plafond virtuale</th>
                <th className="py-3">Reale (selezionato)</th>
                <th className="py-3">Pernottamenti</th>
                <th className="py-3">Cene</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {data.companies.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <p className="font-medium text-forest">{row.name}</p>
                    <p className="text-xs text-olive">{row.city}</p>
                  </td>
                  <td>{row.eligibleEmployees}</td>
                  <td>{formatEuro(row.virtualBudgetCents)}</td>
                  <td>{formatEuro(row.realBudgetCents)}</td>
                  <td>
                    {row.overnightSelected}/{row.overnightBase}
                    <span className="block text-[11px] text-olive">{row.overnightRate}%</span>
                  </td>
                  <td>
                    {row.dinnerSelected}/{row.dinnerBase}
                    <span className="block text-[11px] text-olive">{row.dinnerRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "providers" && (
        <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
          <div className="flex items-center gap-2 text-forest">
            <Store size={20} />
            <h2 className="font-serif text-2xl">Fornitori del territorio</h2>
          </div>
          <table className="mt-4 w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-olive">
              <tr>
                <th className="py-3">Struttura</th>
                <th className="py-3">Ospiti</th>
                <th className="py-3">Presenze</th>
                <th className="py-3">Volume</th>
                <th className="py-3">Fee RADICI</th>
                <th className="py-3">Da saldare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {data.providers.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <p className="font-medium text-forest">{row.name}</p>
                    <p className="text-xs text-olive">{row.city} · {venueTypeLabel(row.type)}</p>
                  </td>
                  <td>{row.selections}</td>
                  <td className="text-xs">
                    {row.attended} presenti · {row.noShow} no-show
                  </td>
                  <td>{formatEuro(row.gmvCents)}</td>
                  <td>{formatEuro(row.commissionCents)}</td>
                  <td>{formatEuro(row.pendingCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "vouchers" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <div className="flex items-center gap-2 text-forest">
              <Ticket size={20} />
              <h2 className="font-serif text-2xl">Funnel voucher</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-forest">
              <li>Emessi (1+1 e extra): {f.overnightAssigned} pernottamenti · {f.dinnerAssigned} cene</li>
              <li>Ancora da selezionare: {f.assigned}</li>
              <li>Selezionati (addebito maturato): {f.selected}</li>
              <li>Presenza convalidata: {f.attended}</li>
              <li>No-show (addebito resta): {f.noShow}</li>
              <li>Extra da residui: {f.extraGranted}</li>
            </ul>
          </section>
          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <div className="flex items-center gap-2 text-forest">
              <Wallet size={20} />
              <h2 className="font-serif text-2xl">Regola extra</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/80">
              Ogni addetto seleziona 1 pernottamento e 1 cena. Extra solo a ridosso della scadenza,
              se resta almeno il 20% inutilizzato, fino al 20% di quei residui e solo a chi ha già
              terminato i propri.
            </p>
          </section>
        </div>
      )}

      {activeTab === "grants" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {data.events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-mist bg-cream/30 p-5">
                <p className="text-xs uppercase text-olive">{event.city} · {event.category}</p>
                <h3 className="font-serif text-2xl text-forest">{event.title}</h3>
                <p className="text-sm text-olive">{event.venueName}</p>
                <p className="mt-2 text-xs">{formatDateTime(event.startsAt)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-forest/10 pt-3 text-sm">
                  <span>Capienza {event.capacity}</span>
                  <strong>
                    {event.seatsOccupied} occupati · {event.seatsFree} liberi
                  </strong>
                </div>
              </div>
            ))}
          </div>
          <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-olive">
                <tr>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Impresa</th>
                  <th className="py-3">Soggiorno</th>
                  <th className="py-3">Evento</th>
                  <th className="py-3">Stato</th>
                  <th className="py-3">Posti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.grants.map((grant) => (
                  <tr key={grant.grantId}>
                    <td className="py-3">
                      {grant.employeeName}
                      <span className="block text-[11px] text-olive">{grant.employeeEmail}</span>
                    </td>
                    <td>{grant.companyName}</td>
                    <td>
                      {grant.venueName}
                      <span className="block text-[11px] text-olive">{grant.assignedAt ? formatDateTime(grant.assignedAt) : "—"}</span>
                    </td>
                    <td>
                      {grant.eventTitle}
                      <span className="block text-[11px] text-olive">{grant.theaterName}</span>
                    </td>
                    <td>{grantStatusLabel(grant.status)}</td>
                    <td>{grant.seatsRequested}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

function LedgerTable({ rows, canSettle }: { rows: PromoterLedgerRow[]; canSettle?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function settle(id: number) {
    setPending(id);
    setError("");
    const res = await apiFetch("/api/promoters/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: id }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(null);
    if (!res.ok) {
      setError(json.error ?? "Saldo non registrato.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-forest">Distinta pagamenti impresa → fornitore</h2>
      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
      <table className="mt-4 w-full min-w-[880px] text-left text-sm">
        <thead className="text-xs uppercase text-olive">
          <tr>
            <th className="py-3">Movimento</th>
            <th className="py-3">Committente</th>
            <th className="py-3">Lordo</th>
            <th className="py-3">Fee</th>
            <th className="py-3">Netto</th>
            <th className="py-3">Fattura</th>
            <th className="py-3">Pagamento</th>
            {canSettle ? <th className="py-3" /> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-mist">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="py-3">
                <p className="font-medium text-forest">{row.guestName}</p>
                <p className="text-[11px] text-olive">
                  {row.venueName} · {row.benefitType ? voucherTypeLabel(row.benefitType) : row.serviceLabel}
                </p>
              </td>
              <td>{row.companyName ?? "—"}</td>
              <td>{formatEuro(row.amountCents)}</td>
              <td>{formatEuro(row.commissionCents)}</td>
              <td>{formatEuro(row.providerNetCents)}</td>
              <td className="text-xs">
                {row.invoiceNumber ? `n. ${row.invoiceNumber} del ${row.invoiceDate}` : "Da emettere"}
              </td>
              <td>
                <span className={`rounded-full px-2 py-1 text-[11px] ${row.paymentStatus === "settled" ? "bg-sage/30 text-forest" : "bg-gold/20 text-terracotta"}`}>
                  {paymentStatusLabel(row.paymentStatus)}
                </span>
              </td>
              {canSettle ? (
                <td>
                  {row.paymentStatus === "pending" && row.invoiceNumber ? (
                    <button
                      type="button"
                      disabled={pending === row.id}
                      onClick={() => settle(row.id)}
                      className="rounded-full bg-forest px-3 py-1 text-[11px] uppercase tracking-wider text-cream disabled:bg-mist disabled:text-olive"
                    >
                      Segna saldato
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-6 text-sm text-olive">Nessun addebito welfare ancora.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-cream/70">{label}</p>
      <p className="mt-2 font-serif text-2xl text-cream md:text-3xl" suppressHydrationWarning>
        {value}
      </p>
      <span className="mt-1 block text-[11px] text-cream/60">{hint}</span>
    </div>
  );
}
