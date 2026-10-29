"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Receipt, Stamp } from "lucide-react";
import type { companies, notifications, transactions, users, venues } from "@/db/schema";
import { formatDateTime, formatEuro, grantStatusLabel, voucherTypeLabel } from "@/lib/utils";

type SelectionRow = {
  id: number;
  service_date: string;
  attendance_status: string;
  qr_token: string;
  benefit_type: string;
  amount_cents: number;
  first_name: string;
  last_name: string;
  offering_name: string;
  company_name: string | null;
};

type GrantRow = {
  id: number;
  status: string;
  seats_requested: number;
  qr_token: string;
  event_title: string;
  starts_at: number;
  first_name: string;
  last_name: string;
  company_name: string | null;
};

type Props = {
  venue: typeof venues.$inferSelect;
  notifications: Array<typeof notifications.$inferSelect>;
  transactions: Array<{
    transaction: typeof transactions.$inferSelect;
    user: typeof users.$inferSelect;
    company: typeof companies.$inferSelect | null;
  }>;
  selections: SelectionRow[];
  grants: GrantRow[];
};

export function ProviderPanel({ venue, notifications: items, transactions: rows, selections, grants }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function confirm(id: number) {
    setPending(`n-${id}`);
    await fetch(`/api/provider/notifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    setPending(null);
    router.refresh();
  }

  async function attendance(kind: "selection" | "grant", id: number, status: "attended" | "no_show") {
    setPending(`${kind}-${id}-${status}`);
    await fetch("/api/provider/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        kind === "grant"
          ? { kind: "grant", grantId: id, status, venueId: venue.id }
          : { kind: "selection", selectionId: id, status, venueId: venue.id },
      ),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Pannello fornitore</p>
        <h1 className="mt-2 font-serif text-4xl">{venue.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/75">
          Selezioni welfare (fattura B2B anche in caso di no-show), presenze del giorno e incassi consumer.
        </p>
      </section>

      <section className="rounded-[28px] bg-white p-6">
        <h2 className="font-serif text-2xl text-forest">Presenze welfare</h2>
        <div className="mt-4 space-y-3">
          {selections.map((item) => (
            <article key={item.id} className="rounded-2xl border border-mist p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-forest">
                    {item.first_name} {item.last_name}
                  </p>
                  <p className="text-xs text-olive">
                    {item.company_name} · {voucherTypeLabel(item.benefit_type)} · {item.offering_name} · {item.service_date}
                  </p>
                  <p className="mt-1 text-xs">
                    {formatEuro(item.amount_cents)} già addebitati · presenza: {item.attendance_status}
                  </p>
                </div>
                {item.attendance_status === "pending" ? (
                  <div className="flex gap-2">
                    <button type="button" disabled={pending === `selection-${item.id}-attended`} onClick={() => attendance("selection", item.id, "attended")} className="rounded-full bg-forest px-3 py-1.5 text-xs text-cream">
                      Presente
                    </button>
                    <button type="button" disabled={pending === `selection-${item.id}-no_show`} onClick={() => attendance("selection", item.id, "no_show")} className="rounded-full border border-forest/20 px-3 py-1.5 text-xs">
                      Non presentato
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {selections.length === 0 ? <p className="text-sm text-olive">Nessuna selezione su questa struttura.</p> : null}
        </div>
      </section>

      {grants.length > 0 ? (
        <section className="rounded-[28px] bg-white p-6">
          <h2 className="font-serif text-2xl text-forest">Matching Grant · botteghino</h2>
          <div className="mt-4 space-y-3">
            {grants.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gold/30 bg-cream p-4">
                <p className="font-medium text-forest">
                  {item.first_name} {item.last_name} · {item.seats_requested} posti
                </p>
                <p className="text-xs text-olive">
                  {item.event_title} · {grantStatusLabel(item.status)} · {item.company_name}
                </p>
                {["assigned", "confirmation_sent", "confirmed"].includes(item.status) ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => attendance("grant", item.id, "attended")} className="rounded-full bg-forest px-3 py-1.5 text-xs text-cream">
                      Check-in teatro
                    </button>
                    <button type="button" onClick={() => attendance("grant", item.id, "no_show")} className="rounded-full border px-3 py-1.5 text-xs">
                      Assente
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] bg-white p-6">
        <div className="flex items-center gap-2 text-forest">
          <Bell size={18} />
          <h2 className="font-serif text-2xl">Notifiche di fatturazione e incasso</h2>
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const payload = (item.payload ?? {}) as Record<string, unknown>;
            return (
              <article
                key={item.id}
                className={`rounded-3xl border p-5 ${
                  item.type === "welfare" ? "border-gold/40 bg-cream" : "border-sage/40 bg-sage/10"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-olive">
                  {item.type === "welfare" ? "Notifica welfare" : "Notifica referral / consumer"}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-forest">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-forest/80">{item.body}</p>
                <div className="mt-4 space-y-1 text-sm text-forest">
                  {payload.invoiceHint ? <p>→ {String(payload.invoiceHint)}</p> : null}
                  {payload.vatNote ? <p>→ {String(payload.vatNote)}</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-olive">{formatDateTime(item.createdAt)}</p>
                  <button
                    type="button"
                    disabled={item.read || pending === `n-${item.id}`}
                    onClick={() => confirm(item.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-[0.12em] text-cream disabled:bg-mist disabled:text-olive"
                  >
                    {item.type === "welfare" ? <Stamp size={14} /> : <Receipt size={14} />}
                    {item.read ? "Segnato" : item.type === "welfare" ? "Segna fattura emessa" : "Segna scontrino emesso"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-6">
        <h2 className="font-serif text-2xl text-forest">Registro incassi</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-olive">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Ospite</th>
                <th className="pb-3">Canale</th>
                <th className="pb-3">Importo</th>
                <th className="pb-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ transaction, user, company }) => (
                <tr key={transaction.id} className="border-t border-mist">
                  <td className="py-3">{formatDateTime(transaction.createdAt)}</td>
                  <td>
                    {user.firstName} {user.lastName}
                    <span className="block text-xs text-olive">{company ? company.name : "Pagamento privato"}</span>
                  </td>
                  <td>{transaction.kind === "welfare_charge" ? "Welfare B2B" : "Consumer B2C"}</td>
                  <td>{formatEuro(transaction.amountCents)}</td>
                  <td className="capitalize">{transaction.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
