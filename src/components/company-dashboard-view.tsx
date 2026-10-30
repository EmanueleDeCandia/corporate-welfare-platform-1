"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/session-client";
import {
  Users,
  Ticket,
  Bed,
  UtensilsCrossed,
  ReceiptText,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Company, User, Transaction, Venue, VenueOffering } from "@/db/schema";
import { formatDateTime, formatEuro, initials, paymentStatusLabel, voucherTypeLabel } from "@/lib/utils";
import type { PlanBudget } from "@/lib/welfare";

type EmployeeRow = {
  user: User;
  overnightSelected: number;
  dinnerSelected: number;
  overnightAssigned: number;
  dinnerAssigned: number;
  totalSelected: number;
  hasMatchingGrant: boolean;
  attended: number;
  noShow: number;
  pending: number;
};

type TxItem = {
  transaction: Transaction;
  user: User;
  venue: Venue;
};

type VenueRow = {
  venue: Venue;
  flags: { offersOvernight: boolean; offersDinner: boolean; offersBoth: boolean; fromPriceCents: number };
  offerings: VenueOffering[];
};

type Props = {
  data: {
    company: Company;
    budget: PlanBudget | null;
    totalEmployeesCount: number;
    employees: EmployeeRow[];
    extraEligible: { overnight: User[]; dinner: User[] };
    transactions: TxItem[];
    venues: VenueRow[];
  };
};

export function CompanyDashboardView({ data }: Props) {
  const router = useRouter();
  const { company, budget, employees, extraEligible, transactions, venues } = data;
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "venues" | "invoices">("overview");
  const [extraType, setExtraType] = useState<"overnight" | "dinner">("overnight");
  const [extraIds, setExtraIds] = useState<number[]>([]);
  const [empForm, setEmpForm] = useState({ firstName: "", lastName: "", email: "" });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const eligible = extraType === "overnight" ? extraEligible.overnight : extraEligible.dinner;
  const extraAllowed = extraType === "overnight" ? budget?.overnightExtraAllowed : budget?.dinnerExtraAllowed;
  const extraRemaining = extraType === "overnight" ? budget?.overnightExtraRemaining : budget?.dinnerExtraRemaining;

  async function addEmployee() {
    setPending(true);
    setMessage("");
    const response = await apiFetch("/api/company/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empForm),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(payload.message ?? payload.error ?? "");
    if (response.ok) {
      setEmpForm({ firstName: "", lastName: "", email: "" });
      router.refresh();
    }
  }

  async function allocateExtra() {
    setPending(true);
    setMessage("");
    const response = await apiFetch("/api/company/extra-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitType: extraType, userIds: extraIds }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(payload.message ?? payload.error ?? "");
    if (response.ok) {
      setExtraIds([]);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-forest p-6 text-cream md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold" style={{ background: company.accent }}>
              {initials(company.name)}
            </span>
            <div>
              <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-semibold text-gold">Area Impresa · CSR & Welfare</span>
              <h1 className="mt-1 font-serif text-3xl md:text-4xl">{company.name}</h1>
              <p className="text-xs text-cream/80">Budget virtuale fino alla selezione. Poi l&apos;impresa paga anche in caso di no-show.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wider text-gold">Rating ESG</p>
            <p className="font-serif text-3xl">{company.impactRating}/100</p>
          </div>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto border-t border-white/15 pt-4">
          {(
            [
              ["overview", "Quadro e plafond"],
              ["employees", `Dipendenti (${employees.length})`],
              ["venues", "Fornitori"],
              ["invoices", `Addebiti B2B (${transactions.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${
                activeTab === id ? "bg-cream text-forest" : "bg-white/10 text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-forest">{message}</p> : null}

      {activeTab === "overview" && budget && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Addetti del piano" value={String(budget.eligible_employees)} hint="Plafond virtuale, non utenze create" icon={<Users size={18} />} />
            <Metric label="Budget virtuale" value={formatEuro(budget.virtual_budget_cents)} hint="Addetti × (50 € + 25 €)" icon={<Ticket size={18} />} />
            <Metric label="Budget reale" value={formatEuro(budget.real_budget_cents)} hint="Solo voucher selezionati e successivi" icon={<ReceiptText size={18} />} />
            <Metric
              label="Selezioni"
              value={`${budget.overnight_selected + budget.dinner_selected}`}
              hint={`${budget.overnightSelectionRate}% pernottamenti · ${budget.dinnerSelectionRate}% cene`}
              icon={<Sparkles size={18} />}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ChannelCard
              title="Pernottamenti"
              selected={budget.overnight_base_selected}
              unused={budget.overnightUnused}
              base={budget.overnight_base}
              rate={budget.overnightSelectionRate}
              extraAllowed={budget.overnightExtraAllowed}
              extraRemaining={budget.overnightExtraRemaining}
              extraGranted={budget.overnight_extra_granted}
              extraWindowOpen={budget.extraWindowOpen}
              extraOpensOn={budget.extraOpensOn}
              icon={<Bed size={20} />}
            />
            <ChannelCard
              title="Cene KM 0"
              selected={budget.dinner_base_selected}
              unused={budget.dinnerUnused}
              base={budget.dinner_base}
              rate={budget.dinnerSelectionRate}
              extraAllowed={budget.dinnerExtraAllowed}
              extraRemaining={budget.dinnerExtraRemaining}
              extraGranted={budget.dinner_extra_granted}
              extraWindowOpen={budget.extraWindowOpen}
              extraOpensOn={budget.extraOpensOn}
              icon={<UtensilsCrossed size={20} />}
            />
          </div>
          <div className="rounded-[24px] border border-gold/40 bg-cream p-6">
            <h4 className="flex items-center gap-2 font-serif text-lg text-forest">
              <ShieldCheck size={18} className="text-terracotta" /> Regolamento
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-forest/90">
              <li>• Ogni addetto seleziona 1 pernottamento e 1 cena. Non due dello stesso tipo come base.</li>
              <li>• La selezione è irrevocabile e genera l&apos;addebito B2B, anche in caso di assenza.</li>
              <li>• Extra solo a ridosso della scadenza, se almeno il 20% dei voucher base è ancora inutilizzato. Il tetto è il 20% di quei residui, e va a chi ha già terminato i propri.</li>
              <li>• Il Matching Grant si attiva in un secondo passo, solo sul pernottamento, e non comporta esborso se l&apos;ospite non si presenta a teatro.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <h2 className="font-serif text-2xl text-forest">Aggiungi dipendente</h2>
            <p className="text-xs text-olive">Vengono emessi subito 1 pernottamento + 1 cena sul piano attivo. Password demo: radici2026.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input placeholder="Nome" value={empForm.firstName} onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
              <input placeholder="Cognome" value={empForm.lastName} onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
              <input placeholder="Email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
              <button type="button" disabled={pending} onClick={addEmployee} className="rounded-2xl bg-forest px-4 py-2 text-sm text-cream">
                Emetti 1+1
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <h2 className="font-serif text-2xl text-forest">Riassegnazione extra da residui</h2>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { setExtraType("overnight"); setExtraIds([]); }} className={`rounded-full px-3 py-1 text-xs ${extraType === "overnight" ? "bg-forest text-cream" : "bg-cream"}`}>Pernottamenti</button>
              <button type="button" onClick={() => { setExtraType("dinner"); setExtraIds([]); }} className={`rounded-full px-3 py-1 text-xs ${extraType === "dinner" ? "bg-forest text-cream" : "bg-cream"}`}>Cene</button>
            </div>
            <p className="mt-2 text-xs text-olive">
              {extraAllowed
                ? `Finestra extra aperta. Puoi assegnare fino a ${extraRemaining} voucher (20% dei residui) a chi ha già usato il proprio.`
                : budget && !budget.extraWindowOpen
                  ? `Chiusa fino al ${budget.extraOpensOn}: prima ogni addetto resta su 1 pernottamento e 1 cena.`
                  : "Chiusa: i non selezionati sono sotto il 20%, oppure il tetto sui residui è esaurito."}
            </p>
            <div className="mt-3 space-y-2">
              {eligible.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={extraIds.includes(user.id)}
                    onChange={(event) =>
                      setExtraIds((current) =>
                        event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id),
                      )
                    }
                  />
                  {user.firstName} {user.lastName}
                </label>
              ))}
              {eligible.length === 0 ? <p className="text-sm text-olive">Nessun addetto ha ancora terminato il voucher base di questo tipo, oppure ha già ricevuto l&apos;extra.</p> : null}
            </div>
            <button type="button" disabled={!extraAllowed || extraIds.length === 0 || pending} onClick={allocateExtra} className="mt-4 rounded-full bg-terracotta px-4 py-2 text-xs font-semibold uppercase text-cream disabled:bg-mist disabled:text-olive">
              Assegna extra
            </button>
          </section>

          <section className="rounded-[28px] border border-forest/10 bg-white p-6 overflow-x-auto">
            <h2 className="font-serif text-2xl text-forest">Monitoraggio dipendenti</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-olive">
                <tr>
                  <th className="py-3">Dipendente</th>
                  <th className="py-3 text-center">Pernottamenti</th>
                  <th className="py-3 text-center">Cene</th>
                  <th className="py-3 text-center">Grant</th>
                  <th className="py-3 text-center">Presenze</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {employees.map((row) => (
                  <tr key={row.user.id}>
                    <td className="py-3">
                      <p className="font-medium text-forest">{row.user.firstName} {row.user.lastName}</p>
                      <p className="text-xs text-olive">{row.user.email}</p>
                    </td>
                    <td className="text-center">{row.overnightSelected} sel. / {row.overnightAssigned} ass.</td>
                    <td className="text-center">{row.dinnerSelected} sel. / {row.dinnerAssigned} ass.</td>
                    <td className="text-center">{row.hasMatchingGrant ? "Sì" : "—"}</td>
                    <td className="text-center text-xs">{row.attended} presenti · {row.noShow} no-show · {row.pending} in attesa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {activeTab === "venues" && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {venues.map(({ venue, flags, offerings }) => (
            <div key={venue.id} className="rounded-[24px] border border-forest/10 bg-white p-5">
              <p className="text-xs uppercase text-olive">{venue.city}</p>
              <h3 className="mt-1 font-serif text-xl text-forest">{venue.name}</h3>
              <p className="mt-2 text-xs text-olive">
                {flags.offersBoth ? "Pernottamento e cena" : flags.offersOvernight ? "Solo pernottamento" : flags.offersDinner ? "Solo cena" : "Nessuna offerta welfare"}
              </p>
              <ul className="mt-3 space-y-1 text-xs">
                {offerings.filter((item) => item.acceptsWelfare && item.active).map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{voucherTypeLabel(item.benefitType)} · {item.name}</span>
                    <span>{formatEuro(item.listPriceCents)}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/strutture/${venue.slug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-terracotta">
                Scheda <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === "invoices" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 overflow-x-auto">
          <h2 className="font-serif text-2xl text-forest">Addebiti B2B da selezione</h2>
          <p className="mt-1 text-xs text-olive">
            L&apos;impresa paga il fornitore sul lordo. RADICI traccia estremi fattura e saldo; la fee di piattaforma è a carico del fornitore.
          </p>
          <table className="mt-4 w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-olive">
              <tr>
                <th className="py-3">Data</th>
                <th className="py-3">Dipendente</th>
                <th className="py-3">Fornitore</th>
                <th className="py-3">Lordo</th>
                <th className="py-3">Fattura</th>
                <th className="py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {transactions.map(({ transaction, user, venue }) => (
                <tr key={transaction.id}>
                  <td className="py-3 text-xs text-olive" suppressHydrationWarning>
                    {formatDateTime(transaction.createdAt)}
                  </td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{venue.name}</td>
                  <td suppressHydrationWarning>{formatEuro(transaction.amountCents)}</td>
                  <td className="text-xs">
                    {transaction.invoiceNumber ? `n. ${transaction.invoiceNumber} del ${transaction.invoiceDate}` : "In attesa estremi"}
                  </td>
                  <td>{paymentStatusLabel(transaction.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-forest/10 bg-white p-5">
      <div className="flex items-center justify-between text-olive">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="mt-3 font-serif text-3xl text-forest" suppressHydrationWarning>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink/70" suppressHydrationWarning>
        {hint}
      </p>
    </div>
  );
}

function ChannelCard({
  title,
  selected,
  unused,
  base,
  rate,
  extraAllowed,
  extraRemaining,
  extraGranted,
  extraWindowOpen,
  extraOpensOn,
  icon,
}: {
  title: string;
  selected: number;
  unused: number;
  base: number;
  rate: number;
  extraAllowed: boolean;
  extraRemaining: number;
  extraGranted: number;
  extraWindowOpen: boolean;
  extraOpensOn: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-forest/10 bg-white p-6">
      <div className="flex items-center gap-3 text-forest">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sage/20">{icon}</div>
        <div>
          <h3 className="font-serif text-xl">{title}</h3>
          <p className="text-xs text-olive" suppressHydrationWarning>
            {selected} usati su {base} base ({rate}%) · {unused} ancora disponibili
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-forest">
        Extra: {extraGranted} emessi · tetto residui {extraRemaining} ·{" "}
        {extraAllowed ? "aperti" : extraWindowOpen ? "bloccati" : `chiusi fino al ${extraOpensOn}`}
      </p>
    </div>
  );
}
