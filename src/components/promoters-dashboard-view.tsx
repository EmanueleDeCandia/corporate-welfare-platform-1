"use client";

import { useState } from "react";
import {
  Sparkles,
  Ticket,
  Building,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  HeartHandshake,
  Users,
  Coins,
  Receipt,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  UserCheck,
  UserX,
  FileText,
  BadgeEuro,
} from "lucide-react";
import type { PromoterDashboardData } from "@/lib/promoters";
import { formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  data: PromoterDashboardData;
};

export function PromotersDashboardView({ data }: Props) {
  const [activeTab, setActiveTab] = useState<
    "economics" | "companies" | "venues" | "vouchers" | "grants"
  >("economics");

  return (
    <div className="space-y-8">
      {/* HEADER: CABINA DI REGIA RADICI STARTUP */}
      <section className="rounded-[32px] bg-forest p-6 text-cream shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles size={14} /> Startup RADICI · Platform Management & Backoffice
            </div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl">
              Control Room Piattaforma & Promotori
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/80">
              Regia completa dell&apos;ecosistema: monitoraggio contratti welfare delle imprese CSR, governance dei fornitori territoriali, commissioni di piattaforma maturate, controllo eventi di pagamento e fondo Matching Grant culturale.
            </p>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs text-cream/70">Gestore Piattaforma</p>
            <p className="font-medium text-cream">{data.promoterUser.firstName} {data.promoterUser.lastName}</p>
            <p className="text-xs text-gold">{data.promoterUser.email}</p>
          </div>
        </div>

        {/* KPI CHIAVE DELLA STARTUP */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-cream/15 pt-6 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Volume Transato (GMV)</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {formatEuro(data.totalGmvCents)}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">Flussi economici complessivi</span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 border border-gold/30 bg-gold/5">
            <p className="text-xs uppercase tracking-wider text-gold font-bold">Commissioni Radici (10%)</p>
            <p className="mt-2 font-serif text-2xl text-gold md:text-3xl">
              {formatEuro(data.totalCommissionsCents)}
            </p>
            <span className="mt-1 block text-[11px] text-gold/80">
              Ricavo della Startup Promotrice
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Pagamenti Fornitori</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {formatEuro(data.totalSettledCents)}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">
              Saldati ({formatEuro(data.totalPendingCents)} in attesa)
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Ecosistema Attivo</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {data.companiesCount} CSR · {data.venuesCount} Fornitori
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">
              {data.employeesCount} dipendenti nel circuito
            </span>
          </div>
        </div>
      </section>

      {/* NAVIGAZIONE TAB */}
      <div className="flex flex-wrap gap-2 border-b border-mist">
        <button
          type="button"
          onClick={() => setActiveTab("economics")}
          className={`px-4 py-3 text-sm font-medium transition ${
            activeTab === "economics"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Transazioni & Commissioni ({data.platformTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-3 text-sm font-medium transition ${
            activeTab === "companies"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Imprese CSR & Contratti ({data.companiesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("venues")}
          className={`px-4 py-3 text-sm font-medium transition ${
            activeTab === "venues"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Fornitori del Territorio ({data.venuesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`px-4 py-3 text-sm font-medium transition ${
            activeTab === "vouchers"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Flussi Voucher ({data.totalVouchersIssued})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("grants")}
          className={`px-4 py-3 text-sm font-medium transition ${
            activeTab === "grants"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Matching Grant Culturale ({data.totalGrantsAssigned})
        </button>
      </div>

      {/* TAB 1: ECONOMICS & COMMISSIONI RADICI */}
      {activeTab === "economics" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Registro Transazioni & Commissioni</h2>
              <p className="text-xs text-olive">
                Supervisione delle transazioni intermediate, calcolo automatico della commissione Radici (10%) e stato dei saldi aziende-fornitori.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                Fee Startup Applicata: 10%
              </span>
              <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">
                Ricavo Totale: {formatEuro(data.totalCommissionsCents)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Data</th>
                  <th className="py-3">Servizio</th>
                  <th className="py-3">Utente & Impresa CSR</th>
                  <th className="py-3">Struttura Beneficiaria</th>
                  <th className="py-3">Lordo Transato</th>
                  <th className="py-3 text-gold">Fee Radici (10%)</th>
                  <th className="py-3">Netto Fornitore</th>
                  <th className="py-3">Fattura Gestionale</th>
                  <th className="py-3 text-right">Stato Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.platformTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-cream/40 transition">
                    <td className="py-3 text-xs text-olive">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3 font-medium text-forest">
                      {tx.serviceLabel}
                      <span className="block text-[11px] text-olive capitalize">{tx.type}</span>
                    </td>
                    <td className="py-3 text-forest">
                      <span className="font-medium">{tx.userName}</span>
                      <span className="block text-[11px] text-olive">
                        {tx.companyName ? `${tx.companyName} (CSR)` : "Consumer Privato"}
                      </span>
                    </td>
                    <td className="py-3 text-forest">
                      <span className="font-medium">{tx.venueName}</span>
                      <span className="block text-[11px] text-olive capitalize">
                        {tx.venueType} · {tx.venueCity}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-forest">
                      {formatEuro(tx.amountCents)}
                    </td>
                    <td className="py-3 font-semibold text-forest bg-gold/5">
                      +{formatEuro(tx.commissionCents)}
                    </td>
                    <td className="py-3 font-medium text-forest">
                      {formatEuro(tx.providerNetCents)}
                    </td>
                    <td className="py-3 text-xs">
                      {tx.invoiceNumber ? (
                        <span className="inline-flex items-center gap-1 rounded bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
                          <FileText size={11} /> {tx.invoiceNumber}
                        </span>
                      ) : (
                        <span className="italic text-olive">Non inserita</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {tx.paymentStatus === "settled" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-2.5 py-0.5 text-xs font-semibold text-forest">
                          <CheckCircle2 size={12} /> Saldato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                          <Clock size={12} /> Da saldare
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: IMPRESE CSR & CONTRATTI WELFARE */}
      {activeTab === "companies" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Governance Imprese Clienti (CSR)</h2>
            <p className="text-xs text-olive">
              Monitoraggio dei piani welfare aziendali, plafond complessivi versati e saldi verso i fornitori del territorio.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {data.companiesList.map((c) => (
              <div key={c.id} className="rounded-2xl border border-mist p-5 bg-cream/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-olive">{c.sector} · {c.city}</span>
                    <h3 className="font-serif text-2xl text-forest">{c.name}</h3>
                    <p className="text-xs font-mono text-olive">P.IVA: {c.vatNumber}</p>
                  </div>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    {c.employeesCount} Dipendenti
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-forest/10 pt-3 text-xs">
                  <div>
                    <p className="text-olive">Plafond Welfare Finanziato</p>
                    <p className="font-serif text-lg font-bold text-forest">{formatEuro(c.fundedAmountCents)}</p>
                  </div>
                  <div>
                    <p className="text-olive">Voucher Riscattati</p>
                    <p className="font-serif text-lg font-bold text-forest">
                      {c.totalVouchersRedeemed} / {c.totalVouchersIssued}
                    </p>
                  </div>
                  <div>
                    <p className="text-olive">Debito Welfare Fornitori</p>
                    <p className="font-serif text-base font-semibold text-forest">{formatEuro(c.totalDebtToProvidersCents)}</p>
                  </div>
                  <div>
                    <p className="text-olive">Stato Saldi Fornitori</p>
                    <p className="text-xs font-medium text-forest">
                      Saldati: <strong className="text-forest">{formatEuro(c.totalSettledToProvidersCents)}</strong>
                      <span className="block text-[11px] text-terracotta font-medium">
                        In attesa: {formatEuro(c.totalPendingToProvidersCents)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: FORNITORI DEL TERRITORIO */}
      {activeTab === "venues" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Rete Strutture & Partner Territoriali</h2>
            <p className="text-xs text-olive">
              Catalogo convenzionato (agriturismi, hotel, ristoranti, teatri), volumi riscattati, presenze convalidate e commissioni maturate per Radici.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Struttura</th>
                  <th className="py-3">Tipologia</th>
                  <th className="py-3">Località</th>
                  <th className="py-3">Riscatti Ricevuti</th>
                  <th className="py-3">Presenze / No-Show</th>
                  <th className="py-3">Volume Lordo</th>
                  <th className="py-3 text-gold">Fee Radici</th>
                  <th className="py-3 text-right">Netto Fornitore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.venuesList.map((v) => (
                  <tr key={v.id} className="hover:bg-cream/40 transition">
                    <td className="py-3 font-semibold text-forest">{v.name}</td>
                    <td className="py-3 capitalize text-xs text-olive">{v.type}</td>
                    <td className="py-3 text-xs text-olive">{v.city} ({v.province})</td>
                    <td className="py-3 font-medium text-forest">{v.redeemedCount}</td>
                    <td className="py-3 text-xs">
                      <span className="text-forest font-medium">{v.attendedCount} presenti</span>
                      {v.noShowCount > 0 ? (
                        <span className="text-terracotta block">· {v.noShowCount} no-show</span>
                      ) : null}
                    </td>
                    <td className="py-3 font-semibold text-forest">{formatEuro(v.grossVolumeCents)}</td>
                    <td className="py-3 font-semibold text-forest bg-gold/5">+{formatEuro(v.commissionsPaidCents)}</td>
                    <td className="py-3 text-right font-medium text-forest">{formatEuro(v.netRevenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: FLUSSI VOUCHER */}
      {activeTab === "vouchers" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Ciclo di Vita & Flusso Voucher Welfare</h2>
            <p className="text-xs text-olive">
              Ogni selezione/riscatto di un voucher attiva l&apos;obbligo di pagamento a carico dell&apos;azienda CSR. La presenza reale viene monitorata per l&apos;impatto ESG.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-olive">Voucher Totali Emessi</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalVouchersIssued}</p>
              <span className="text-[11px] text-olive">Stanziati nei piani welfare</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-olive">Riscattati (Dovuti)</p>
              <p className="mt-2 font-serif text-3xl text-forest font-bold">{data.totalVouchersRedeemed}</p>
              <span className="text-[11px] text-forest">Onere certo per l&apos;azienda</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-forest">Presenze Effettive</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalVouchersAttended}</p>
              <span className="text-[11px] text-forest">Ospiti verificati sul territorio</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-terracotta">No-Show Segnalati</p>
              <p className="mt-2 font-serif text-3xl text-terracotta">{data.totalVouchersNoShow}</p>
              <span className="text-[11px] text-olive">Compenso comunque dovuto</span>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MATCHING GRANT CULTURALE */}
      {activeTab === "grants" && (
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-forest">
                <ShieldCheck size={20} className="text-forest" />
                <h2 className="font-serif text-2xl">Natura del Matching Grant Culturale</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                Il Matching Grant <strong>NON è un voucher welfare aziendale</strong>: è un beneficio culturale integrativo stanziato direttamente dalla <strong>Startup RADICI</strong> e dai partner culturali (valore 50€: 25€ + 25€ per lavoratore e accompagnatore).
              </p>
              <div className="mt-4 rounded-2xl bg-cream p-4 border border-gold/30 text-xs text-forest space-y-1">
                <p>• <strong>Capienza Fondo Promotori:</strong> {formatEuro(data.grantFundCapacityCents)}</p>
                <p>• <strong>Grant Erogati ad Oggi:</strong> {formatEuro(data.grantFundSpentCents)} ({data.totalGrantsAssigned} attivazioni)</p>
                <p>• <strong>Fondo Residuo Disponibile:</strong> {formatEuro(data.grantFundCapacityCents - data.grantFundSpentCents)}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-forest">
                <Calendar size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl">Finestre di Conferma T-7 / T-3</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                A differenza del voucher welfare (dovuto al riscatto), il Matching Grant richiede la conferma del posto a teatro a 7 giorni dall&apos;evento (T-7) con deadline a 3 giorni (T-3), per garantire la piena capienza ai teatri partner.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-forest">{data.totalGrantsConfirmed}</span>
                  <span className="text-[10px] text-olive">Confermati</span>
                </div>
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-forest">{data.totalGrantsAttended}</span>
                  <span className="text-[10px] text-olive">Presenti a Teatro</span>
                </div>
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-terracotta">{data.totalGrantsExpired + data.totalGrantsNoShow}</span>
                  <span className="text-[10px] text-olive">Posti Rilasciati</span>
                </div>
              </div>
            </div>
          </div>

          {/* Registro Grant */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <h3 className="font-serif text-2xl text-forest mb-4">Registro Matching Grant Attivati</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                  <tr>
                    <th className="py-3">Dipendente</th>
                    <th className="py-3">Azienda Sponsor</th>
                    <th className="py-3">Struttura Ricettiva</th>
                    <th className="py-3">Teatro Convenzionato</th>
                    <th className="py-3">Stato Posto</th>
                    <th className="py-3 text-right">Quota Fondo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {data.grants.map((grant) => (
                    <tr key={grant.voucherId} className="hover:bg-cream/40 transition">
                      <td className="py-3 font-medium text-forest">
                        {grant.employeeName}
                        <span className="block text-[11px] text-olive">{grant.employeeEmail}</span>
                      </td>
                      <td className="py-3 text-forest">{grant.companyName}</td>
                      <td className="py-3 text-forest">
                        {grant.venueName}
                        <span className="block text-[11px] text-olive">{grant.venueCity}</span>
                      </td>
                      <td className="py-3 text-xs text-forest">{grant.theaterName}</td>
                      <td className="py-3 text-xs">
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest capitalize">
                          {grant.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-serif text-base text-forest">
                        {formatEuro(grant.grantValueCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
