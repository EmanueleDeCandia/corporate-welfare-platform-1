"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  Users,
  Ticket,
  Bed,
  UtensilsCrossed,
  ReceiptText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Gift,
} from "lucide-react";
import type { Company, Venue, User, Transaction } from "@/db/schema";
import { formatDateTime, formatEuro, initials } from "@/lib/utils";

type EmployeeRow = {
  user: User;
  totalRedeemed: number;
  hotelCount: number;
  aperitivoCount: number;
  hasMatchingGrant: boolean;
  canRedeemMore: boolean;
};

type TxItem = {
  transaction: Transaction;
  user: User;
  venue: Venue;
};

type Props = {
  data: {
    company: Company;
    totalEmployeesCount: number;
    totalVouchersPlafond: number;
    redeemedHotel: number;
    redeemedAperitivo: number;
    totalRedeemed: number;
    availableVouchers: number;
    usageRate: number;
    matchingGrantCents: number;
    employees: EmployeeRow[];
    transactions: TxItem[];
    venues: Venue[];
  };
};

export function CompanyDashboardView({ data }: Props) {
  const {
    company,
    totalEmployeesCount,
    totalVouchersPlafond,
    redeemedHotel,
    redeemedAperitivo,
    totalRedeemed,
    availableVouchers,
    usageRate,
    matchingGrantCents,
    employees,
    transactions,
    venues,
  } = data;

  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "venues" | "invoices">("overview");

  return (
    <div className="space-y-8">
      {/* Intestazione Impresa CSR */}
      <section className="rounded-[32px] bg-forest p-6 text-cream md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold"
              style={{ background: company.accent }}
            >
              {initials(company.name)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-semibold text-gold">
                  Area Riservata Impresa · CSR & Welfare
                </span>
                <span className="text-xs text-cream/70">P.IVA {company.vatNumber}</span>
              </div>
              <h1 className="mt-1 font-serif text-3xl md:text-4xl">{company.name}</h1>
              <p className="text-xs text-cream/80 md:text-sm">
                Gestione del piano welfare territoriale e monitoraggio Matching Grant Promotori
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wider text-gold">Rating Territoriale ESG</p>
            <p className="font-serif text-3xl text-cream">{company.impactRating}/100</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex gap-2 border-t border-white/15 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
              activeTab === "overview" ? "bg-cream text-forest" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            Quadro Generale & Plafond
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("employees")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
              activeTab === "employees" ? "bg-cream text-forest" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            Dipendenti & Riscatti ({employees.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("venues")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
              activeTab === "venues" ? "bg-cream text-forest" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            Fornitori Convenzionati ({venues.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
              activeTab === "invoices" ? "bg-cream text-forest" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            Rendicontazione B2B ({transactions.length})
          </button>
        </div>
      </section>

      {/* TAB 1: OVERVIEW & PLAFOND METRICHE */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[24px] bg-white p-5 border border-forest/10 shadow-sm">
              <div className="flex items-center justify-between text-olive">
                <span className="text-xs uppercase tracking-wider font-semibold">Organico Addetti</span>
                <Users size={18} />
              </div>
              <p className="mt-3 font-serif text-3xl text-forest">{totalEmployeesCount}</p>
              <p className="mt-1 text-xs text-ink/70">Dipendenti registrati nel piano welfare</p>
            </div>

            <div className="rounded-[24px] bg-white p-5 border border-forest/10 shadow-sm">
              <div className="flex items-center justify-between text-olive">
                <span className="text-xs uppercase tracking-wider font-semibold">Voucher Disponibili</span>
                <Ticket size={18} />
              </div>
              <p className="mt-3 font-serif text-3xl text-forest">
                {availableVouchers} <span className="text-sm font-normal text-olive">/ {totalVouchersPlafond}</span>
              </p>
              <p className="mt-1 text-xs text-ink/70">Quota residua libera per riscatto 2° voucher</p>
            </div>

            <div className="rounded-[24px] bg-white p-5 border border-forest/10 shadow-sm">
              <div className="flex items-center justify-between text-olive">
                <span className="text-xs uppercase tracking-wider font-semibold">Voucher Riscattati</span>
                <TrendingUp size={18} />
              </div>
              <p className="mt-3 font-serif text-3xl text-terracotta">{totalRedeemed}</p>
              <p className="mt-1 text-xs text-ink/70">{usageRate}% del totale assegnato</p>
            </div>

            <div className="rounded-[24px] bg-white p-5 border border-forest/10 shadow-sm">
              <div className="flex items-center justify-between text-olive">
                <span className="text-xs uppercase tracking-wider font-semibold">Valore Ridistribuito</span>
                <ReceiptText size={18} />
              </div>
              <p className="mt-3 font-serif text-3xl text-forest">{formatEuro(company.localRedistributionCents)}</p>
              <p className="mt-1 text-xs text-ink/70">Liquidato ai fornitori convenzionati</p>
            </div>
          </div>

          {/* I due canali di welfare: Pernottamento vs Aperitivo/Cena */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6 border border-forest/10">
              <div className="flex items-center gap-3 text-forest">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sage/20 text-forest">
                  <Bed size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Canale 1 · Pernottamento</h3>
                  <p className="text-xs text-olive">Agriturismi e Hotel convenzionati (50€)</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between border-t border-mist pt-4">
                <span className="text-sm text-ink/75">Riscatti impegnati:</span>
                <span className="font-serif text-2xl text-forest">{redeemedHotel}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-olive">
                Ogni riscatto impegna formalmente la tariffa convenzionata con la struttura di ospitalità,
                a prescindere dalla presenza fisica successiva del dipendente.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-6 border border-forest/10">
              <div className="flex items-center gap-3 text-forest">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-terracotta">
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Canale 2 · Aperitivo - Cena</h3>
                  <p className="text-xs text-olive">Degustazioni a filiera agricola corta KM 0</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between border-t border-mist pt-4">
                <span className="text-sm text-ink/75">Riscatti impegnati:</span>
                <span className="font-serif text-2xl text-terracotta">{redeemedAperitivo}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-olive">
                I dipendenti scelgono liberamente se utilizzare la propria quota per la ristorazione rurale.
                Non vi è alcun obbligo di abbinamento simultaneo.
              </p>
            </div>
          </div>

          {/* EVIDENZA MATCHING GRANT DEI PROMOTORI (SOLO PER PERNOTTAMENTO = 50€) */}
          <div className="rounded-[28px] bg-gradient-to-br from-forest-deep to-forest p-6 text-cream border border-gold/40 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-gold">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-forest uppercase tracking-wider">
                      Matching Grant Promotori
                    </span>
                    <span className="text-xs text-gold">Valore: 50,00 € a soggiorno</span>
                  </div>
                  <h3 className="mt-1 font-serif text-2xl text-cream">
                    Attivazione automatica su ogni Voucher di Pernottamento
                  </h3>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wider text-gold">Valore Aggiunto Generato</p>
                <p className="font-serif text-2xl text-cream">{formatEuro(matchingGrantCents)}</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-cream/80 md:text-sm">
              I promotori del circuito monitorano i riscatti e intervengono con un contributo <strong>Matching Grant da 50€</strong> (pari al valore del voucher pernottamento) che include automaticamente:
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                <p className="text-sm font-semibold text-gold">1. Biglietto Spettacolo a Teatro Omaggio</p>
                <p className="mt-1 text-xs text-cream/80">Ingresso coperto al 100% per la rassegna teatrale/culturale partner</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                <p className="text-sm font-semibold text-gold">2. Incontro Esclusivo Serale in Struttura</p>
                <p className="mt-1 text-xs text-cream/80">Incontro riservato serale con gli artisti direttamente in Hotel o Agriturismo</p>
              </div>
            </div>
          </div>

          {/* Regola di business riassuntiva */}
          <div className="rounded-[24px] bg-cream p-6 border border-gold/40">
            <h4 className="font-serif text-lg text-forest flex items-center gap-2">
              <ShieldCheck size={18} className="text-terracotta" /> Regolamento del Piano Welfare
            </h4>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-forest/90 md:text-sm">
              <li>• Ogni dipendente ha diritto di default a riscattare fino a <strong>2 voucher a scelta</strong> (Pernottamento o Cena).</li>
              <li>• Il secondo voucher può essere richiesto <strong>solo fino ad esaurimento delle quote residue</strong> ({availableVouchers} rimanenti).</li>
              <li>• Al riscatto il dipendente seleziona obbligatoriamente il fornitore convenzionato; il riscatto è immediato e irrevocabile.</li>
              <li>• Se il voucher è un <strong>Pernottamento (50€)</strong>, si attiva immediatamente il Matching Grant dei Promotori (50€) con Biglietto Spettacolo + Incontro con gli artisti in Hotel/Agriturismo.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: MONITORAGGIO DIPENDENTI */}
      {activeTab === "employees" && (
        <section className="rounded-[28px] bg-white p-6 border border-forest/10">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Stato Riscatto Dipendenti</h2>
              <p className="text-xs text-olive">Monitoraggio delle scelte individuali e dei Matching Grant attivati</p>
            </div>
            <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest">
              {employees.length} dipendenti attivi
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Email</th>
                  <th className="py-3 text-center">Pernottamenti (50€)</th>
                  <th className="py-3 text-center">Cene KM 0</th>
                  <th className="py-3 text-center">Matching Grant (50€)</th>
                  <th className="py-3 text-center">Totale Riscattati</th>
                  <th className="py-3 text-right">Stato Plafond</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {employees.map(({ user, totalRedeemed, hotelCount, aperitivoCount, hasMatchingGrant, canRedeemMore }) => (
                  <tr key={user.id} className="hover:bg-sand/30 transition">
                    <td className="py-3 font-medium text-forest">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="text-olive text-xs">{user.email}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-sage/20 px-2.5 py-0.5 text-xs font-semibold text-forest">
                        {hotelCount}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                        {aperitivoCount}
                      </span>
                    </td>
                    <td className="text-center">
                      {hasMatchingGrant ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-bold text-terracotta">
                          <Sparkles size={11} /> Attivo (+50€)
                        </span>
                      ) : (
                        <span className="text-xs text-olive">—</span>
                      )}
                    </td>
                    <td className="text-center font-bold text-forest">
                      {totalRedeemed} / 2
                    </td>
                    <td className="text-right">
                      {totalRedeemed >= 2 ? (
                        <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-olive">
                          Massimo raggiunto (2/2)
                        </span>
                      ) : canRedeemMore ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-medium">
                          Può richiedere {2 - totalRedeemed}° buono
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-medium">
                          Plafond residuo esaurito
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

      {/* TAB 3: FORNITORI CONVENZIONATI NAVIGABILI */}
      {activeTab === "venues" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-forest">Fornitori Convenzionati di Ospitalità</h2>
            <p className="text-xs text-olive">
              Agriturismi e Hotel dove i dipendenti possono soggiornare e sbloccare il Matching Grant dei Promotori
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="rounded-[24px] bg-white border border-forest/10 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-semibold text-forest uppercase tracking-wider">
                      {venue.type === "agriturismo" ? "Agriturismo" : "Hotel & Relais"}
                    </span>
                    <span className="text-xs text-olive flex items-center gap-1">
                      <MapPin size={12} /> {venue.city} ({venue.province})
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl text-forest">{venue.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-ink/75 line-clamp-2">{venue.description}</p>

                  <div className="mt-4 space-y-1.5 border-t border-mist pt-3 text-xs text-forest/90">
                    <div className="flex justify-between">
                      <span className="text-olive">Pernottamento:</span>
                      <span className="font-medium">{formatEuro(venue.priceHotelCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-olive">Aperitivo / Cena KM 0:</span>
                      <span className="font-medium">{formatEuro(venue.priceAperitivoCents)}</span>
                    </div>
                    <div className="rounded-xl bg-gold/15 p-2 text-[11px] text-terracotta flex items-center gap-1.5">
                      <Sparkles size={13} /> Include Matching Grant: incontro serale artisti
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-mist flex items-center justify-between">
                  <span className="text-[11px] text-olive">Convenzione attiva</span>
                  <Link
                    href={`/strutture/${venue.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
                  >
                    Vedi scheda <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: RENDICONTAZIONE B2B (FATTURE ELETTRONICHE) */}
      {activeTab === "invoices" && (
        <section className="rounded-[28px] bg-white p-6 border border-forest/10">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Fascicolo Fiscale & Fatturazione B2B</h2>
              <p className="text-xs text-olive">
                Transazioni welfare conformi ex Art. 51 TUIR intestate ad {company.name}
              </p>
            </div>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-terracotta">
              Isolato da spese private / referral
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Data Riscatto</th>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Fornitore di Ospitalità</th>
                  <th className="py-3">Servizio</th>
                  <th className="py-3">Importo B2B</th>
                  <th className="py-3 text-right">Trattamento Fiscale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {transactions.map(({ transaction, user, venue }) => (
                  <tr key={transaction.id} className="hover:bg-sand/30 transition">
                    <td className="py-3 text-xs text-olive">{formatDateTime(transaction.createdAt)}</td>
                    <td className="font-medium text-forest">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="text-forest">
                      {venue.name}
                      <span className="block text-[11px] text-olive">{venue.city}</span>
                    </td>
                    <td className="text-xs font-medium text-ink/80">{transaction.serviceLabel}</td>
                    <td className="font-serif text-base text-forest">{formatEuro(transaction.amountCents)}</td>
                    <td className="text-right">
                      <span className="rounded-full bg-sage/20 px-2.5 py-1 text-[11px] font-semibold text-forest">
                        Fattura B2B (Art. 51 TUIR)
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-olive">
                      Nessun riscatto ancora registrato. I riscatti welfare con fattura B2B appariranno qui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
