"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  Settings,
  UserPlus,
  CheckCircle2,
  Save,
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
  const router = useRouter();
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

  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "venues" | "invoices" | "settings">("overview");

  // Stato per l'editing dei dati aziendali
  const [companyForm, setCompanyForm] = useState({
    name: company.name,
    vatNumber: company.vatNumber,
    city: company.city,
    sector: company.sector,
    employeesCount: String(company.employeesCount),
    fundedAmountEuro: String(company.fundedAmountCents / 100),
    description: company.description,
  });
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Stato per l'aggiunta di un nuovo dipendente
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ firstName: "", lastName: "", email: "" });
  const [empStatus, setEmpStatus] = useState<string>("");
  const [addingEmp, setAddingEmp] = useState(false);

  async function handleSaveCompany(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("");

    const response = await fetch("/api/company/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: companyForm.name,
        vatNumber: companyForm.vatNumber,
        city: companyForm.city,
        sector: companyForm.sector,
        employeesCount: parseInt(companyForm.employeesCount, 10),
        fundedAmountEuro: parseFloat(companyForm.fundedAmountEuro),
        description: companyForm.description,
      }),
    });

    const res = await response.json();
    setSaving(false);
    if (response.ok) {
      setSaveStatus("Dati aziendali salvati con successo nel database!");
      router.refresh();
    } else {
      setSaveStatus(res.error || "Errore durante il salvataggio.");
    }
  }

  async function handleAddEmployee(e: FormEvent) {
    e.preventDefault();
    setAddingEmp(true);
    setEmpStatus("");

    const response = await fetch("/api/company/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmp),
    });

    const res = await response.json();
    setAddingEmp(false);
    if (response.ok) {
      setEmpStatus(`Dipendente ${newEmp.firstName} ${newEmp.lastName} registrato con 2 voucher attivi!`);
      setNewEmp({ firstName: "", lastName: "", email: "" });
      setShowAddEmp(false);
      router.refresh();
    } else {
      setEmpStatus(res.error || "Errore durante la registrazione del dipendente.");
    }
  }

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
                {company.sector} · {company.city} · {company.employeesCount} Dipendenti eleggibili
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
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
              activeTab === "settings" ? "bg-gold text-forest font-bold" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            <Settings size={13} /> Dati Impresa
          </button>
        </div>
      </section>

      {/* TAB 1: OVERVIEW & PLAFOND */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <span className="text-xs uppercase tracking-wider text-olive font-medium">Plafond Stanziato</span>
              <p className="mt-2 font-serif text-3xl text-forest">{formatEuro(company.fundedAmountCents)}</p>
              <span className="text-xs text-olive">Per {company.employeesCount} addetti eleggibili</span>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <span className="text-xs uppercase tracking-wider text-olive font-medium">Capitale Impegnato (Riscatti)</span>
              <p className="mt-2 font-serif text-3xl text-forest">
                {formatEuro(redeemedHotel * 5000 + redeemedAperitivo * 2500)}
              </p>
              <span className="text-xs text-olive">{totalRedeemed} voucher riscattati (obbligo B2B)</span>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <span className="text-xs uppercase tracking-wider text-gold font-bold">Matching Grant Attivato</span>
              <p className="mt-2 font-serif text-3xl text-forest">{formatEuro(matchingGrantCents)}</p>
              <span className="text-xs text-olive">Cultura erogata a costo ZERO per l&apos;azienda</span>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <span className="text-xs uppercase tracking-wider text-olive font-medium">Adesione Dipendenti</span>
              <p className="mt-2 font-serif text-3xl text-forest">{usageRate}%</p>
              <span className="text-xs text-olive">{employees.length} dipendenti attivi su {company.employeesCount}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6 shadow-sm border border-mist">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest">
                  <Bed size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Canale 1 · Pernottamenti (50€)</h3>
                  <p className="text-xs text-olive">Soggiorni in agriturismi, hotel e dimore storiche</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between border-t border-mist pt-4">
                <span className="text-sm text-ink/75">Riscatti impegnati:</span>
                <span className="font-serif text-2xl text-forest">{redeemedHotel}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-olive">
                Ogni pernottamento sblocca automaticamente il <strong>Matching Grant dei Promotori (+50€)</strong> per due persone a teatro.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm border border-mist">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-terracotta/10 text-terracotta">
                  <UtensilsCrossed size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Canale 2 · Aperitivo / Cena KM 0 (25€)</h3>
                  <p className="text-xs text-olive">Degustazioni a filiera agricola corta locale</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between border-t border-mist pt-4">
                <span className="text-sm text-ink/75">Riscatti impegnati:</span>
                <span className="font-serif text-2xl text-terracotta">{redeemedAperitivo}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-olive">
                I dipendenti possono utilizzare la loro quota per la ristorazione tipica indipendentemente dal pernottamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIPENDENTI & AGGIUNTA NUOVI DIPENDENTI */}
      {activeTab === "employees" && (
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-mist space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Dipendenti dell&apos;Azienda ({employees.length})</h2>
              <p className="text-xs text-olive">
                Elenco dei dipendenti che hanno accesso al portafoglio welfare aziendale di {company.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEmp(!showAddEmp)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream hover:bg-forest/90 transition"
            >
              <UserPlus size={14} /> {showAddEmp ? "Chiudi Modulo" : "Aggiungi Dipendente"}
            </button>
          </div>

          {/* Form inline per aggiungere un dipendente */}
          {showAddEmp && (
            <form onSubmit={handleAddEmployee} className="rounded-2xl border border-gold/40 bg-sand/15 p-5 space-y-4">
              <div className="flex items-center gap-2 text-forest font-serif text-lg">
                <UserPlus size={18} className="text-gold" />
                Registra Nuovo Dipendente Aziendale
              </div>
              <p className="text-xs text-olive">
                Inserisci i dati del lavoratore. Gli verranno assegnati istantaneamente i 2 voucher welfare previsti dal piano di {company.name}.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-medium text-forest">
                  Nome
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    placeholder="Mario"
                    className="mt-1 w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-xs outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-forest">
                  Cognome
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    placeholder="Rossi"
                    className="mt-1 w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-xs outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-forest">
                  Email Aziendale
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    placeholder="mario.rossi@azienda.it"
                    className="mt-1 w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-xs outline-none"
                  />
                </label>
              </div>

              {empStatus ? <p className="text-xs font-semibold text-forest">{empStatus}</p> : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={addingEmp}
                  className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream hover:bg-forest/90 disabled:opacity-50"
                >
                  {addingEmp ? "Creazione in corso…" : "Attiva Dipendente & Genera Voucher"}
                </button>
              </div>
            </form>
          )}

          {/* Tabella Dipendenti */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Email</th>
                  <th className="py-3 text-center">Pernottamenti (50€)</th>
                  <th className="py-3 text-center">Cene KM 0 (25€)</th>
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
                      ) : (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-medium">
                          {2 - totalRedeemed} voucher disponibili
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

      {/* TAB 3: FORNITORI CONVENZIONATI */}
      {activeTab === "venues" && (
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-mist space-y-4">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Fornitori Territoriali Attivi ({venues.length})</h2>
            <p className="text-xs text-olive">
              Strutture agricole, agriturismi, hotel e teatri che accolgono i tuoi dipendenti con fatturazione B2B diretta ad {company.name}.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {venues.map((v) => (
              <div key={v.id} className="rounded-2xl border border-mist p-4 bg-cream/20">
                <span className="text-[10px] uppercase font-bold text-olive">{v.type} · {v.region}</span>
                <h3 className="font-serif text-lg font-bold text-forest">{v.name}</h3>
                <p className="text-xs text-olive mt-1">{v.city} ({v.province})</p>
                <div className="mt-3 pt-2 border-t border-forest/10 flex items-center justify-between text-xs">
                  <span className="text-forest font-medium">Fattura diretta B2B:</span>
                  <span className="text-gold font-bold">Art. 51 TUIR</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: RENDICONTAZIONE B2B & FATTURE */}
      {activeTab === "invoices" && (
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-mist space-y-4">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Rendicontazione Fiscale B2B ({transactions.length})</h2>
            <p className="text-xs text-olive">
              Registro delle prestazioni welfare erogate a favore dei tuoi lavoratori. Tutte le spese sono esenti da contributi e oneri fiscali.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Data</th>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3">Struttura Beneficiaria</th>
                  <th className="py-3">Prestazione</th>
                  <th className="py-3">Importo</th>
                  <th className="py-3 text-right">Inquadramento</th>
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
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: GESTIONE & MODIFICA DATI IMPRESA */}
      {activeTab === "settings" && (
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-mist space-y-6">
          <div className="pb-4 border-b border-mist flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-forest">Dati & Contratto Aziendale</h2>
              <p className="text-xs text-olive">
                Aggiorna i parametri anagrafici, il numero effettivo di dipendenti e il plafond welfare finanziato per {company.name}.
              </p>
            </div>
            {saveStatus ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/15 px-3 py-1 text-xs font-semibold text-forest">
                <CheckCircle2 size={13} /> {saveStatus}
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4 max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-forest">
                Ragione Sociale Impresa
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none font-semibold"
                />
              </label>

              <label className="block text-sm font-medium text-forest">
                Partita IVA
                <input
                  type="text"
                  required
                  value={companyForm.vatNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, vatNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none font-mono"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-forest">
                Città / Sede
                <input
                  type="text"
                  required
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block text-sm font-medium text-forest">
                Settore Economico
                <input
                  type="text"
                  required
                  value={companyForm.sector}
                  onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-mist pt-4">
              <label className="block text-sm font-medium text-forest">
                Numero Dipendenti Eleggibili
                <input
                  type="number"
                  min="1"
                  required
                  value={companyForm.employeesCount}
                  onChange={(e) => setCompanyForm({ ...companyForm, employeesCount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none font-bold text-forest"
                />
                <span className="text-[11px] text-olive block mt-0.5">
                  Determina il numero massimo di aventi diritto al welfare.
                </span>
              </label>

              <label className="block text-sm font-medium text-forest">
                Plafond Welfare Finanziato (€)
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={companyForm.fundedAmountEuro}
                  onChange={(e) => setCompanyForm({ ...companyForm, fundedAmountEuro: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none font-bold text-forest"
                />
                <span className="text-[11px] text-olive block mt-0.5">
                  Massimale economico stanziato dall&apos;azienda per il 2026.
                </span>
              </label>
            </div>

            <label className="block text-sm font-medium text-forest">
              Descrizione Aziendale e Obiettivi ESG
              <textarea
                rows={3}
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-forest/15 bg-cream/40 px-3 py-2 text-sm outline-none"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream hover:bg-forest/90 transition disabled:opacity-50"
              >
                <Save size={15} /> {saving ? "Salvataggio in corso…" : "Salva Modifiche Dati Impresa"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
