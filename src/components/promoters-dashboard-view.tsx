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
  AlertTriangle,
} from "lucide-react";
import type { PromoterDashboardData } from "@/lib/promoters";
import { formatDate, formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  data: PromoterDashboardData;
};

export function PromotersDashboardView({ data }: Props) {
  const [activeTab, setActiveTab] = useState<
    "economics" | "companies" | "venues" | "vouchers" | "grants" | "bookings"
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
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition ${
            activeTab === "bookings"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          <span>Prenotazioni & Overbooking Teatri ({data.totalCommunityBookingsCount})</span>
          {data.overbookingAlertsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
              <AlertTriangle size={10} /> {data.overbookingAlertsCount} a rischio
            </span>
          )}
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

      {/* TAB 6: PRENOTAZIONI COMMUNITY & CONTROLLO OVERBOOKING TEATRI */}
      {activeTab === "bookings" && (
        <section className="space-y-8">
          {/* KPI Prenotazioni Community */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Prenotazioni Totali</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalCommunityBookingsCount}</p>
              <p className="text-xs text-olive mt-1">Ospiti ed eventi convenzionati</p>
            </div>
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Posti Riservati Community</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalCommunityBookingsSeats}</p>
              <p className="text-xs text-olive mt-1">Posti occupati in totale</p>
            </div>
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Presenze Riconfermate</p>
              <p className="mt-2 font-serif text-3xl text-emerald-700">{data.totalCommunityConfirmedCount}</p>
              <p className="text-xs text-olive mt-1">Confermate da ospiti o strutture</p>
            </div>
            <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">Spettacoli a Rischio Overbooking</p>
              <p className="mt-2 font-serif text-3xl text-rose-700">{data.overbookingAlertsCount}</p>
              <p className="text-xs text-rose-800/80 mt-1">Capienza residua ≤ 15%</p>
            </div>
          </div>

          {/* Sezione Monitoraggio Capienza Spettacoli Culturali & Anti-Overbooking */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-mist pb-4">
              <div>
                <h3 className="font-serif text-2xl text-forest">Monitoraggio Capienza Spettacoli & Teatri</h3>
                <p className="text-xs text-olive">
                  Visione aggregata in tempo reale: posti assegnati al Welfare Matching Grant + posti prenotati dalla Community Amici.
                </p>
              </div>
              <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-mono text-forest">
                {data.events.length} eventi programmati
              </span>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {data.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    ev.isOverbookingRisk
                      ? "border-rose-300 bg-rose-50/30 shadow-sm"
                      : "border-forest/10 bg-cream/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-forest/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                        {ev.category}
                      </span>
                      <h4 className="mt-1 font-serif text-xl font-bold text-forest">{ev.title}</h4>
                      <p className="text-xs text-olive">{ev.venueName} · {ev.city}</p>
                    </div>
                    {ev.isOverbookingRisk ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 animate-pulse">
                        <AlertTriangle size={12} /> Rischio Overbooking
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        Capienza Regolare
                      </span>
                    )}
                  </div>

                  {/* Barra visuale occupazione capienza */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-ink/80 mb-1.5 font-medium">
                      <span>Occupati: {ev.seatsOccupied} / {ev.capacity} posti</span>
                      <span className="font-bold">{ev.occupancyPercent}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 flex">
                      {/* Porzione Welfare Grant */}
                      <div
                        style={{ width: `${Math.min(100, Math.round((ev.welfareSeats / ev.capacity) * 100))}%` }}
                        className="bg-gold h-full"
                        title={`Welfare Matching Grant: ${ev.welfareSeats} posti`}
                      />
                      {/* Porzione Community Bookings */}
                      <div
                        style={{ width: `${Math.min(100 - Math.round((ev.welfareSeats / ev.capacity) * 100), Math.round((ev.communitySeats / ev.capacity) * 100))}%` }}
                        className="bg-emerald-600 h-full"
                        title={`Community Bookings: ${ev.communitySeats} posti`}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-olive">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-gold" /> Welfare Grant ({ev.welfareSeats})
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" /> Community ({ev.communitySeats})
                        </span>
                      </div>
                      <span className="font-bold text-forest">
                        {ev.seatsAvailable} posti liberi
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registro Globale Territoriale delle Prenotazioni */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-mist pb-4">
              <div>
                <h3 className="font-serif text-2xl text-forest">Registro Territoriale delle Prenotazioni</h3>
                <p className="text-xs text-olive">
                  Tutte le prenotazioni effettuate dagli amici della community verso agriturismi, hotel, cene e teatri convenzionati.
                </p>
              </div>
            </div>

            {data.communityBookings.length === 0 ? (
              <div className="py-12 text-center text-olive text-sm">
                Nessuna prenotazione community registrata sul circuito al momento.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-mist text-olive uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Data & Orario</th>
                      <th className="pb-3">Ospite</th>
                      <th className="pb-3">Struttura / Teatro</th>
                      <th className="pb-3">Evento / Servizio</th>
                      <th className="pb-3 text-center">Posti</th>
                      <th className="pb-3 text-right">Importo Netto</th>
                      <th className="pb-3 text-center">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {data.communityBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-cream/40 transition">
                        <td className="py-3 font-medium text-forest">
                          {formatDate(b.bookingDate)}
                          <span className="block text-[11px] text-olive">{b.timeSlot || "Standard"}</span>
                        </td>
                        <td className="py-3 text-forest">
                          <p className="font-semibold">{b.guestName}</p>
                          <p className="text-[11px] text-olive">{b.guestEmail}</p>
                          {b.guestPhone && <p className="text-[10px] text-ink/70">Tel: {b.guestPhone}</p>}
                        </td>
                        <td className="py-3 text-forest">
                          <p className="font-medium">{b.venueName}</p>
                          <p className="text-[11px] text-olive">{b.venueCity} ({b.venueType})</p>
                        </td>
                        <td className="py-3 text-forest">
                          {b.eventTitle ? (
                            <span className="font-bold text-forest">🎭 {b.eventTitle}</span>
                          ) : (
                            <span className="text-olive capitalize">{b.venueType}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className="rounded-full bg-cream px-2.5 py-0.5 font-bold text-forest border border-forest/10">
                            {b.partySize} {b.partySize === 1 ? "posto" : "posti"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-serif text-sm font-bold text-forest">
                          {formatEuro(b.finalPriceCents)}
                        </td>
                        <td className="py-3 text-center">
                          {b.status === "presence_confirmed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              ✓ Presenza Riconfermata
                            </span>
                          ) : b.status === "confirmed" ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                              Accettata dal gestore
                            </span>
                          ) : b.status === "pending" ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              In attesa
                            </span>
                          ) : b.status === "attended" ? (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                              Completata
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                              {b.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
