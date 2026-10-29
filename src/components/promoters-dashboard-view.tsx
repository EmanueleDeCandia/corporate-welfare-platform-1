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
} from "lucide-react";
import type { PromoterDashboardData } from "@/lib/promoters";
import { formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  data: PromoterDashboardData;
};

export function PromotersDashboardView({ data }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "grants" | "theaters">("overview");

  return (
    <div className="space-y-8">
      {/* HEADER CRUSCOTTO PROMOTORI */}
      <section className="rounded-[32px] bg-forest p-6 text-cream shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles size={14} /> Circuito Promotori RADICI & Partner
            </div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl">
              Fondo Matching Grant Culturale
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/80">
              Governance e monitoraggio del fondo privato integrativo stanziato da Startup RADICI
              e partner culturali. Raddoppia il valore del soggiorno per ogni lavoratore
              offrendo lo spettacolo a teatro e l&apos;incontro con gli artisti.
            </p>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs text-cream/70">Referente Promotori</p>
            <p className="font-medium text-cream">{data.promoterUser.firstName} {data.promoterUser.lastName}</p>
            <p className="text-xs text-gold">{data.promoterUser.email}</p>
          </div>
        </div>

        {/* METRICHE CHIAVE DEL FONDO */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-cream/15 pt-6 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Grant Assegnati</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {data.totalGrantsAssigned}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">Da voucher pernottamento</span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-gold">Confermati (T-7 / T-3)</p>
            <p className="mt-2 font-serif text-2xl text-gold md:text-3xl">
              {data.totalGrantsConfirmed}
            </p>
            <span className="mt-1 block text-[11px] text-gold/80">
              {data.totalGrantsAttended} già presenti a teatro
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Scaduti / No-Show</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {data.totalGrantsExpired + data.totalGrantsNoShow}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">
              Posti liberati per capienza
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Teatri & Palcoscenici</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">{data.theatersCount}</p>
            <span className="mt-1 block text-[11px] text-cream/60">{data.eventsCount} eventi attivi</span>
          </div>
        </div>
      </section>

      {/* NAVIGAZIONE TAB */}
      <div className="flex border-b border-mist">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 text-sm font-medium transition ${
            activeTab === "overview"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Panoramica & Governance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("grants")}
          className={`px-5 py-3 text-sm font-medium transition ${
            activeTab === "grants"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Registro Matching Grant ({data.totalGrantsAssigned})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("theaters")}
          className={`px-5 py-3 text-sm font-medium transition ${
            activeTab === "theaters"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Teatri Storici Convenzionati ({data.theatersCount})
        </button>
      </div>

      {/* TAB 1: PANORAMICA & GOVERNANCE */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-forest">
              <ShieldCheck size={20} className="text-forest" />
              <h2 className="font-serif text-2xl">Principio di Separazione Fiscale</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/80">
              I fondi erogati per il Matching Grant sono <strong>totalmente autonomi</strong> dal
              Plafond Welfare aziendale delle imprese sponsor (ACME, Verde Energia, ecc.).
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-forest/90">
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">✓</span>
                <span><strong>Nessun onere per l&apos;azienda:</strong> le imprese saldano solo fatture per alloggio e cene (Art. 51 TUIR).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">✓</span>
                <span><strong>Nessun onere per il Comune:</strong> l&apos;ente pubblico tutela il territorio ma non eroga contributi diretti ai dipendenti.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">✓</span>
                <span><strong>Fondo Promotori:</strong> copre integralmente il pacchetto culturale (50€) composto da teatro e incontro serale con gli artisti.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-bold">✓</span>
                <span><strong>Copertura della Startup:</strong> La Startup copre completamente il costo del Matching Grant con i servizi che gestisce per conto delle imprese di ricettività beneficiarie del welfare Aziendale.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-forest">
              <HeartHandshake size={20} className="text-terracotta" />
              <h2 className="font-serif text-2xl">Composizione del Matching Grant</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/80">
              Ogni volta che un dipendente riscatta un voucher di tipo <strong>Pernottamento (50€)</strong>, il sistema attiva in automatico il pacchetto culturale complementare valido per 2 persone. Un singolo addetto /a con un amico /a, familiare, partner. Il Matching Grant ha il valore di 25€ + 25€ e non può essere usato totalmente da una singola persona.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-cream p-4 border border-gold/30">
                <div className="flex items-center gap-2 text-forest font-medium">
                  <Ticket size={16} className="text-terracotta" /> Biglietto Spettacolo a Teatro (2 Persone · 25€ + 25€)
                </div>
                <p className="mt-1 text-xs text-olive leading-5">
                  Accesso per il lavoratore e il proprio accompagnatore (amico, partner o familiare) presso il teatro storico convenzionato.
                </p>
              </div>
              <div className="rounded-2xl bg-cream p-4 border border-gold/30">
                <div className="flex items-center gap-2 text-forest font-medium">
                  <Users size={16} className="text-terracotta" /> Incontro Serale Riservato con gli Artisti
                </div>
                <p className="mt-1 text-xs text-olive leading-5">
                  Esperienza condivisa in coppia presso l&apos;agriturismo o la dimora storica ospitante al termine della rappresentazione.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: REGISTRO DEI MATCHING GRANT ATTIVATI */}
      {activeTab === "grants" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Registro dei Matching Grant Riconosciuti</h2>
              <p className="text-xs text-olive">
                Elenco dei lavoratori che hanno sbloccato il grant culturale tramite il pernottamento
              </p>
            </div>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">
              Valore Unitario: 50,00 €
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Data Attivazione</th>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Azienda Sponsor</th>
                  <th className="py-3">Struttura Ospitante</th>
                  <th className="py-3">Teatro Convenzionato</th>
                  <th className="py-3 text-right">Quota Fondo Promotori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.grants.map((grant) => (
                  <tr key={grant.voucherId} className="hover:bg-cream/40 transition">
                    <td className="py-3 text-xs text-olive">
                      {grant.confirmedAt ? formatDateTime(grant.confirmedAt) : grant.startsAt ? `Inizio: ${formatDateTime(grant.startsAt)}` : "—"}
                    </td>
                    <td className="font-medium text-forest">
                      {grant.employeeName}
                      <span className="block text-[11px] text-olive">{grant.employeeEmail}</span>
                    </td>
                    <td className="text-forest font-medium">{grant.companyName}</td>
                    <td className="text-forest">
                      {grant.venueName}
                      <span className="block text-[11px] text-olive">{grant.venueCity}</span>
                    </td>
                    <td className="text-xs font-medium text-ink/80">{grant.theaterName}</td>
                    <td className="text-right font-serif text-base text-forest">
                      {formatEuro(grant.grantValueCents)}
                    </td>
                  </tr>
                ))}
                {data.grants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-olive">
                      Nessun matching grant ancora attivato. Appena un lavoratore riscatta il pernottamento, apparirà qui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: TEATRI STORICI CONVENZIONATI */}
      {activeTab === "theaters" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Palcoscenici & Teatri Partner</h2>
            <p className="text-xs text-olive">
              Istituzioni culturali convenzionate che accolgono gli ospiti con biglietto a carico dei Promotori
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.theaters.map((th) => (
              <div key={th.id} className="rounded-2xl border border-mist p-5 bg-cream/30">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-olive">{th.region}</span>
                    <h3 className="font-serif text-2xl text-forest">{th.name}</h3>
                    <p className="text-sm text-olive">{th.city}</p>
                  </div>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    Partner Attivo
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-xs text-forest">
                  <span>Biglietti Promotori Attivati:</span>
                  <strong className="font-serif text-base">{th.grantsGeneratedCount}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

