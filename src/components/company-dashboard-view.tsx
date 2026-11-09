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
  Truck,
  Leaf,
  ShoppingBag,
} from "lucide-react";
import type { Company, Venue, User, Transaction } from "@/db/schema";
import { formatDateTime, formatEuro, initials } from "@/lib/utils";
import { RoleBadge } from "@/components/design-system/role-badge";
import { StatusBadge } from "@/components/design-system/status-badge";
import { ExplanatoryNoteTrigger } from "@/components/explanatory-note-modal";
import { ImpactCertificateStudio } from "@/components/certificati-impatto/ImpactCertificateStudio";
import { Award } from "lucide-react";

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

type ProducerBasketOrder = {
  id: number;
  createdAt: Date;
  orderDate: string;
  buyerName: string;
  buyerEmail: string;
  buyerRole: string;
  connectedViaEmployeeName: string | null;
  producerName: string;
  producerCity: string;
  basketName: string;
  quantity: number;
  finalPriceCents: number;
  isFreeGift: boolean;
  status: string;
  deliveryMode: string;
  kmAvoided: number;
  co2SavedKg: number;
  notes: string | null;
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
    producerBasketsSummary?: {
      totalOrders: number;
      totalBasketsSold: number;
      totalSpentCents: number;
      kmAvoided: number;
      co2SavedKg: number;
      orders: ProducerBasketOrder[];
    };
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
    producerBasketsSummary,
  } = data;

  const [activeTab, setActiveTab] = useState<
    "overview" | "employees" | "venues" | "invoices" | "baskets" | "certificati" | "settings"
  >("overview");

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

  // Filtro fatture attive vs annullate
  const [invoiceFilter, setInvoiceFilter] = useState<"active" | "cancelled" | "all">("active");
  const activeTransactions = transactions.filter(
    (t) => t.transaction.status !== "cancelled" && t.transaction.paymentStatus !== "cancelled"
  );
  const cancelledTransactions = transactions.filter(
    (t) => t.transaction.status === "cancelled" || t.transaction.paymentStatus === "cancelled"
  );
  const displayedTransactions =
    invoiceFilter === "active"
      ? activeTransactions
      : invoiceFilter === "cancelled"
      ? cancelledTransactions
      : transactions;

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
                  {company.entityType === "public" ? "Area Riservata Ente Pubblico · Welfare" : "Area Riservata Impresa · CSR & Welfare"}
                </span>
                <span className="text-xs text-cream/70">P.IVA {company.vatNumber}</span>
                <ExplanatoryNoteTrigger
                  noteId="nota-4"
                  className="border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-forest"
                />
              </div>
              <h1 className="mt-1 font-serif text-3xl md:text-4xl">{company.name}</h1>
              <p className="text-xs text-cream/80 md:text-sm">
                {company.sector} · {company.city} · {company.employeesCount} Dipendenti eleggibili
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wider text-gold">Rating Territoriale CSR</p>
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
            Rendicontazione B2B ({activeTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("baskets")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
              activeTab === "baskets" ? "bg-cream text-forest font-bold" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            <Truck size={13} /> Sinergie Flotta & KM 0 ({producerBasketsSummary?.totalOrders || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certificati")}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition inline-flex items-center gap-1.5 ${
              activeTab === "certificati" ? "bg-cream text-forest font-bold" : "bg-white/10 text-cream hover:bg-white/15"
            }`}
          >
            <Award size={13} /> Attestati d&apos;Impatto
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
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-olive font-medium">Plafond Stanziato</span>
                <ExplanatoryNoteTrigger noteId="nota-2" />
              </div>
              <p className="mt-2 font-serif text-3xl text-forest">{formatEuro(company.fundedAmountCents)}</p>
              <span className="text-xs text-olive">Per {company.employeesCount} addetti eleggibili (75€ cad.)</span>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <span className="text-xs uppercase tracking-wider text-olive font-medium">Capitale Impegnato (Riscatti)</span>
              <p className="mt-2 font-serif text-3xl text-forest">
                {formatEuro(redeemedHotel * 5000 + redeemedAperitivo * 2500)}
              </p>
              <span className="text-xs text-olive">{totalRedeemed} voucher riscattati (obbligo B2B)</span>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-mist">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-gold font-bold">Matching Grant Attivato</span>
                <ExplanatoryNoteTrigger noteId="nota-3" />
              </div>
              <p className="mt-2 font-serif text-3xl text-forest">{formatEuro(matchingGrantCents)}</p>
              <span className="text-xs text-olive">Cultura per 2 a costo ZERO per l&apos;azienda</span>
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
                        <span className="rounded-full bg-forest/10 text-forest px-2.5 py-1 text-[11px] font-semibold">
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
          <div className="pb-4 border-b border-mist flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-forest">Rendicontazione Fiscale B2B ({activeTransactions.length})</h2>
              <p className="text-xs text-olive">
                Registro delle prestazioni welfare erogate a favore dei tuoi lavoratori. Tutte le spese sono esenti da contributi e oneri fiscali.
              </p>
            </div>
            <div className="inline-flex rounded-full bg-forest/5 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setInvoiceFilter("active")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  invoiceFilter === "active" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
                }`}
              >
                Da Saldare ({activeTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setInvoiceFilter("cancelled")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  invoiceFilter === "cancelled" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
                }`}
              >
                Annullate ({cancelledTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setInvoiceFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  invoiceFilter === "all" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
                }`}
              >
                Tutte ({transactions.length})
              </button>
            </div>
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
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-olive">
                      {invoiceFilter === "active"
                        ? "Nessuna fattura attiva pendente di saldo."
                        : invoiceFilter === "cancelled"
                        ? "Nessuna selezione annullata."
                        : "Nessun movimento registrato."}
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map(({ transaction, user, venue }) => {
                    const isCancelled =
                      transaction.status === "cancelled" || transaction.paymentStatus === "cancelled";

                    return (
                      <tr
                        key={transaction.id}
                        className={`transition ${isCancelled ? "bg-mist/20 opacity-70" : "hover:bg-sand/30"}`}
                      >
                        <td className="py-3 text-xs text-olive">
                          {formatDateTime(transaction.createdAt)}
                          {isCancelled && (
                            <span className="block text-[10px] text-terracotta font-medium">Revocata prima della fruizione</span>
                          )}
                        </td>
                        <td className="font-medium text-forest">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="text-forest">
                          {venue.name}
                          <span className="block text-[11px] text-olive">{venue.city}</span>
                        </td>
                        <td className="text-xs font-medium text-ink/80">{transaction.serviceLabel}</td>
                        <td className="font-serif text-base text-forest">
                          {isCancelled ? (
                            <div>
                              <span className="line-through text-olive/60 text-sm">{formatEuro(transaction.amountCents)}</span>
                              <span className="block text-xs font-bold text-terracotta">0,00 € (Annullata)</span>
                            </div>
                          ) : (
                            formatEuro(transaction.amountCents)
                          )}
                        </td>
                        <td className="text-right">
                          {isCancelled ? (
                            <span className="rounded-full bg-terracotta/15 px-2.5 py-1 text-[11px] font-semibold text-terracotta">
                              Selezione Annullata (0 € dovuto)
                            </span>
                          ) : (
                            <span className="rounded-full bg-sage/20 px-2.5 py-1 text-[11px] font-semibold text-forest">
                              Fattura B2B (Art. 51 TUIR)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
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
              Descrizione Aziendale e Obiettivi CSR
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

      {/* TAB: SINERGIE FLOTTA & CESTI KM 0 */}
      {activeTab === "baskets" && (
        <section className="space-y-6">
          <div className="rounded-[32px] bg-forest p-6 text-cream md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold inline-flex items-center gap-1.5">
                    <Truck size={13} /> Sinergie Flotta Aziendale · Impatto KM 0
                  </span>
                  <ExplanatoryNoteTrigger
                    noteId="nota-4"
                    className="border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-forest"
                  />
                </div>
                <h2 className="mt-2 font-serif text-2xl md:text-3xl">Filiera Agroalimentare di Prossimità</h2>
                <p className="mt-1 text-xs md:text-sm text-cream/80 max-w-2xl leading-relaxed">
                  Consegne a impatto logistico marginale zero: i prodotti dei piccoli produttori vengono recapitati presso la sede aziendale
                  sfruttando i percorsi già pianificati dei rifornitori partner. Ritiro in sede sia per gli addetti sia per gli amici della community da loro invitati.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-right border border-white/10 shrink-0">
                <span className="text-[10px] uppercase font-bold text-cream/70 block">CO₂ Evitata</span>
                <span className="font-serif text-3xl font-bold text-gold">
                  {producerBasketsSummary?.co2SavedKg || 0} kg
                </span>
                <span className="text-[10px] text-cream/60 block">sinergie flotta (50 km / cesto)</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Ordini Totali</span>
                <p className="font-serif text-2xl text-cream mt-1">{producerBasketsSummary?.totalOrders || 0}</p>
                <p className="text-[11px] text-cream/60 mt-0.5">addetti & amici collegati</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Cesti Consegnati</span>
                <p className="font-serif text-2xl text-cream mt-1">{producerBasketsSummary?.totalBasketsSold || 0}</p>
                <p className="text-[11px] text-cream/60 mt-0.5">ritiro in sede aziendale</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Km Dedicati Azzerati</span>
                <p className="font-serif text-2xl text-gold mt-1">~{producerBasketsSummary?.kmAvoided || 0} km</p>
                <p className="text-[11px] text-cream/60 mt-0.5">tratte a vuoto evitate</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-cream/70 font-semibold block">Valore Economico</span>
                <p className="font-serif text-2xl text-cream mt-1">{formatEuro(producerBasketsSummary?.totalSpentCents || 0)}</p>
                <p className="text-[11px] text-cream/60 mt-0.5">100% ai produttori locali</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-mist">
            <h3 className="font-serif text-xl text-forest mb-4">Registro Consegne Cesti KM 0 (Sede Aziendale)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-mist text-[11px] font-bold uppercase tracking-wider text-olive">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Acquirente</th>
                    <th className="pb-3">Produttore & Cesto</th>
                    <th className="pb-3">Cesto & Quantità</th>
                    <th className="pb-3">Impatto KM 0</th>
                    <th className="pb-3">Importo</th>
                    <th className="pb-3 text-right">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist text-xs">
                  {(!producerBasketsSummary?.orders || producerBasketsSummary.orders.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-olive">
                        Nessun ordine di cesto filiera corta registrato al momento.
                      </td>
                    </tr>
                  ) : (
                    producerBasketsSummary.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-cream/40 transition">
                        <td className="py-3.5 font-mono text-olive whitespace-nowrap">
                          {o.orderDate || formatDateTime(o.createdAt).split(" ")[0]}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-forest">{o.buyerName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <RoleBadge role={o.buyerRole as any} />
                            {o.connectedViaEmployeeName && (
                              <span className="text-[10px] text-olive font-medium">
                                (Rete addetto: {o.connectedViaEmployeeName})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <p className="font-medium text-forest">{o.producerName}</p>
                          <p className="text-[11px] text-olive">{o.producerCity}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-forest">
                            {o.quantity}x {o.basketName}
                          </p>
                          <p className="text-[10px] text-olive font-mono mt-0.5">
                            ritiro in sede aziendale
                          </p>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-forest">
                            <Leaf size={11} className="text-forest" />
                            sinergie flotta ({o.co2SavedKg} kg CO₂)
                          </span>
                          <span className="text-[10px] text-olive block mt-0.5">
                            {o.kmAvoided} km dedicati azzerati
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-forest whitespace-nowrap">
                          {o.isFreeGift ? (
                            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-bold text-forest">
                              Omaggio (10:1)
                            </span>
                          ) : (
                            formatEuro(o.finalPriceCents)
                          )}
                        </td>
                        <td className="py-3.5 text-right whitespace-nowrap">
                          {(() => {
                            const isCancelled = o.status === "cancelled";
                            const isConfirmed = o.status === "attended" || o.status === "presence_confirmed";
                            const variant = isCancelled ? "cancelled" : isConfirmed ? "confirmed" : "pending";
                            const label = o.isFreeGift
                              ? "Omaggio Erogato"
                              : isCancelled
                              ? "Annullato"
                              : isConfirmed
                              ? "Consegnato"
                              : "In Consegna";
                            return <StatusBadge variant={variant} label={label} />;
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB: CERTIFICATI D'IMPATTO */}
      {activeTab === "certificati" && (
        <ImpactCertificateStudio
          initialContext={{
            company: company.name,
            promoter: "RADICI · Welfare & Territorio Marche",
            role: "Azienda Shared Value · CSR",
            city: company.city,
            distanceKm: 55,
          }}
        />
      )}
    </div>
  );
}
