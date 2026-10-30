import Link from "next/link";
import {
  Users,
  Ticket,
  Bed,
  UtensilsCrossed,
  ReceiptText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Company, User, Transaction, Venue, VenueOffering } from "@/db/schema";
import { formatDateTime, formatEuro, initials, paymentStatusLabel, voucherTypeLabel } from "@/lib/utils";
import type { PlanBudget } from "@/lib/welfare";
import { AddEmployeeForm, ExtraAllocationForm } from "@/components/company-employee-actions";

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

export type CompanyDashboardTab = "overview" | "employees" | "venues" | "invoices";

type Props = {
  tab?: string;
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

export function parseCompanyTab(tab?: string): CompanyDashboardTab {
  if (tab === "employees" || tab === "venues" || tab === "invoices") return tab;
  return "overview";
}

export function CompanyDashboardView({ data, tab }: Props) {
  const activeTab = parseCompanyTab(tab);
  const { company, budget, employees, extraEligible, transactions, venues } = data;

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
            <Link
              key={id}
              href={id === "overview" ? "/azienda" : `/azienda?tab=${id}`}
              className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${
                activeTab === id ? "bg-cream text-forest" : "bg-white/10 text-cream"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {activeTab === "overview" && budget ? (
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
      ) : null}

      {activeTab === "employees" ? (
        <div className="space-y-6">
          <AddEmployeeForm />
          <ExtraAllocationForm
            overnightAllowed={Boolean(budget?.overnightExtraAllowed)}
            dinnerAllowed={Boolean(budget?.dinnerExtraAllowed)}
            overnightRemaining={budget?.overnightExtraRemaining ?? 0}
            dinnerRemaining={budget?.dinnerExtraRemaining ?? 0}
            extraWindowOpen={Boolean(budget?.extraWindowOpen)}
            extraOpensOn={budget?.extraOpensOn ?? ""}
            overnightEligible={extraEligible.overnight}
            dinnerEligible={extraEligible.dinner}
          />
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
      ) : null}

      {activeTab === "venues" ? (
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
      ) : null}

      {activeTab === "invoices" ? (
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
                  <td className="py-3 text-xs text-olive">{formatDateTime(transaction.createdAt)}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{venue.name}</td>
                  <td>{formatEuro(transaction.amountCents)}</td>
                  <td className="text-xs">
                    {transaction.invoiceNumber ? `n. ${transaction.invoiceNumber} del ${transaction.invoiceDate}` : "In attesa estremi"}
                  </td>
                  <td>{paymentStatusLabel(transaction.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
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
      <p className="mt-3 font-serif text-3xl text-forest">{value}</p>
      <p className="mt-1 text-xs text-ink/70">{hint}</p>
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
          <p className="text-xs text-olive">
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
