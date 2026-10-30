"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AfterHydration } from "@/components/after-hydration";
import { apiFetch } from "@/lib/session-client";
import { Bell, Receipt, Stamp, Wallet } from "lucide-react";
import type { companies, notifications, transactions, users, venues } from "@/db/schema";
import { formatDateTime, formatEuro, grantStatusLabel, paymentStatusLabel, voucherTypeLabel } from "@/lib/utils";

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

type TxItem = {
  transaction: typeof transactions.$inferSelect;
  user: typeof users.$inferSelect;
  company: typeof companies.$inferSelect | null;
};

type Props = {
  venue: typeof venues.$inferSelect;
  notifications: Array<typeof notifications.$inferSelect>;
  transactions: TxItem[];
  selections: SelectionRow[];
  grants: GrantRow[];
};

export function ProviderPanel({ venue, notifications: items, transactions: rows, selections, grants }: Props) {
  return (
    <AfterHydration>
      <ProviderPanelReady
        venue={venue}
        notifications={items}
        transactions={rows}
        selections={selections}
        grants={grants}
      />
    </AfterHydration>
  );
}

function ProviderPanelReady({ venue, notifications: items, transactions: rows, selections, grants }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState<Record<number, { number: string; date: string }>>({});
  const [error, setError] = useState("");

  const welfare = rows.filter((row) => row.transaction.kind === "welfare_charge");
  const consumer = rows.filter((row) => row.transaction.kind === "consumer_payment");
  const totals = useMemo(() => {
    const gross = welfare.reduce((sum, row) => sum + row.transaction.amountCents, 0);
    const fee = welfare.reduce((sum, row) => sum + row.transaction.commissionCents, 0);
    const net = welfare.reduce((sum, row) => sum + row.transaction.providerNetCents, 0);
    const pendingPay = welfare
      .filter((row) => row.transaction.paymentStatus === "pending")
      .reduce((sum, row) => sum + row.transaction.amountCents, 0);
    return { gross, fee, net, pendingPay };
  }, [welfare]);

  async function confirm(id: number) {
    setPending(`n-${id}`);
    await apiFetch(`/api/provider/notifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    setPending(null);
    router.refresh();
  }

  async function attendance(kind: "selection" | "grant", id: number, status: "attended" | "no_show") {
    setPending(`${kind}-${id}-${status}`);
    await apiFetch("/api/provider/attendance", {
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

  async function saveInvoice(transactionId: number) {
    const draft = invoiceDraft[transactionId] ?? { number: "", date: "" };
    setPending(`inv-${transactionId}`);
    setError("");
    const res = await apiFetch("/api/provider/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invoice",
        transactionId,
        invoiceNumber: draft.number,
        invoiceDate: draft.date,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(null);
    if (!res.ok) {
      setError(json.error ?? "Estremi non salvati.");
      return;
    }
    router.refresh();
  }

  async function settle(transactionId: number) {
    setPending(`pay-${transactionId}`);
    setError("");
    const res = await apiFetch("/api/provider/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settle", transactionId }),
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
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Pannello fornitore</p>
        <h1 className="mt-2 font-serif text-4xl">{venue.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/75">
          RADICI ti consegna il prospetto (committente, importo, Art. 51 TUIR). Tu emetti la fattura
          nel tuo gestionale e qui inserisci solo numero e data. Poi segni se l&apos;accredito è arrivato.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Lordo fatturato" value={formatEuro(totals.gross)} />
          <MiniStat label="Fee RADICI" value={formatEuro(totals.fee)} />
          <MiniStat label="Netto struttura" value={formatEuro(totals.net)} />
          <MiniStat label="In attesa di accredito" value={formatEuro(totals.pendingPay)} />
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-6">
        <div className="flex items-center gap-2 text-forest">
          <Wallet size={18} />
          <h2 className="font-serif text-2xl">Distinta prestazioni erogate</h2>
        </div>
        <p className="mt-2 text-xs text-olive">
          Fattura nel tuo gestionale all&apos;impresa committente. Su RADICI restano solo gli estremi e lo stato di pagamento.
        </p>
        {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
        <div className="mt-4 space-y-4">
          {welfare.map(({ transaction, user, company }) => {
            const draft = invoiceDraft[transaction.id] ?? {
              number: transaction.invoiceNumber ?? "",
              date: transaction.invoiceDate ?? "",
            };
            return (
              <article key={transaction.id} className="rounded-2xl border border-mist p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-forest">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-olive">
                      Committente: {company?.name ?? "—"}
                      {company?.vatNumber ? ` · P.IVA ${company.vatNumber}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-forest">
                      {transaction.serviceLabel} · causale Art. 51 TUIR
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] ${transaction.paymentStatus === "settled" ? "bg-sage/30 text-forest" : "bg-gold/20 text-terracotta"}`}>
                    {transaction.paymentStatus === "settled" ? "Pagamento ricevuto / Saldato" : "In attesa di accredito"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <p>Lordo {formatEuro(transaction.amountCents)}</p>
                  <p>Fee RADICI {formatEuro(transaction.commissionCents)}</p>
                  <p>Netto {formatEuro(transaction.providerNetCents)}</p>
                </div>
                {transaction.invoiceNumber ? (
                  <p className="mt-3 text-sm text-forest">
                    Fattura n. {transaction.invoiceNumber} del {transaction.invoiceDate}
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      placeholder="N. fattura (gestionale)"
                      value={draft.number}
                      onChange={(event) =>
                        setInvoiceDraft((current) => ({
                          ...current,
                          [transaction.id]: { ...draft, number: event.target.value },
                        }))
                      }
                      className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(event) =>
                        setInvoiceDraft((current) => ({
                          ...current,
                          [transaction.id]: { ...draft, date: event.target.value },
                        }))
                      }
                      className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={pending === `inv-${transaction.id}`}
                      onClick={() => saveInvoice(transaction.id)}
                      className="rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-wider text-cream"
                    >
                      Salva estremi
                    </button>
                  </div>
                )}
                {transaction.invoiceNumber && transaction.paymentStatus === "pending" ? (
                  <button
                    type="button"
                    disabled={pending === `pay-${transaction.id}`}
                    onClick={() => settle(transaction.id)}
                    className="mt-3 rounded-full border border-forest/20 px-4 py-2 text-xs uppercase tracking-wider text-forest"
                  >
                    Segna pagamento ricevuto
                  </button>
                ) : null}
              </article>
            );
          })}
          {welfare.length === 0 ? <p className="text-sm text-olive">Nessuna selezione welfare su questa struttura.</p> : null}
        </div>
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
          <h2 className="font-serif text-2xl">Prospetti e incassi consumer</h2>
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
                  {item.type === "welfare" ? "Prospetto welfare" : "Incasso referral / consumer"}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-forest">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-forest/80">{item.body}</p>
                <div className="mt-4 space-y-1 text-sm text-forest">
                  {payload.invoiceHint ? <p>→ {String(payload.invoiceHint)}</p> : null}
                  {payload.vatNote ? <p>→ {String(payload.vatNote)}</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-olive">{formatDateTime(item.createdAt)}</p>
                  {item.type !== "welfare" ? (
                    <button
                      type="button"
                      disabled={item.read || pending === `n-${item.id}`}
                      onClick={() => confirm(item.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-[0.12em] text-cream disabled:bg-mist disabled:text-olive"
                    >
                      <Receipt size={14} />
                      {item.read ? "Scontrino segnato" : "Segna scontrino emesso"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs text-olive">
                      <Stamp size={14} /> Estremi nella distinta sopra
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {consumer.length > 0 ? (
        <section className="rounded-[28px] bg-white p-6">
          <h2 className="font-serif text-2xl text-forest">Incassi consumer già ricevuti</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-olive">
                <tr>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Ospite</th>
                  <th className="pb-3">Importo</th>
                  <th className="pb-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {consumer.map(({ transaction, user }) => (
                  <tr key={transaction.id} className="border-t border-mist">
                    <td className="py-3">{formatDateTime(transaction.createdAt)}</td>
                    <td>
                      {user.firstName} {user.lastName}
                      <span className="block text-xs text-olive">Pagamento privato</span>
                    </td>
                    <td>{formatEuro(transaction.amountCents)}</td>
                    <td>{paymentStatusLabel(transaction.paymentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wider text-cream/70">{label}</p>
      <p className="mt-1 font-serif text-xl text-cream" suppressHydrationWarning>
        {value}
      </p>
    </div>
  );
}
