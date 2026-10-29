"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CheckCircle2, Receipt, Stamp, UserX } from "lucide-react";
import type { companies, notifications, transactions, users, venues } from "@/db/schema";
import { formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  venue: typeof venues.$inferSelect;
  notifications: Array<typeof notifications.$inferSelect>;
  transactions: Array<{
    transaction: typeof transactions.$inferSelect;
    user: typeof users.$inferSelect;
    company: typeof companies.$inferSelect | null;
  }>;
};

export function ProviderPanel({ venue, notifications: items, transactions: rows }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);

  async function confirm(id: number) {
    setPending(id);
    await fetch(`/api/provider/notifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    setPending(null);
    router.refresh();
  }

  async function registerAttendance(voucherId: number, status: "attended" | "no_show") {
    setPending(voucherId);
    await fetch("/api/provider/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId, status }),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Pannello fornitore locale</p>
        <h1 className="mt-2 font-serif text-4xl">{venue.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/75">
          Due flussi distinti, un&apos;unica inbox: fatturazione diretta alle imprese per i riscatti
          welfare e incassi carta per gli amici consumer.
        </p>
      </section>

      <section className="rounded-[28px] bg-white p-6">
        <div className="flex items-center gap-2 text-forest">
          <Bell size={18} />
          <h2 className="font-serif text-2xl">Notifiche di fatturazione e incasso</h2>
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const payload = (item.payload ?? {}) as Record<string, any>;
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
                  {payload.impact ? <p>→ Effetto: {String(payload.impact)}</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-olive">{formatDateTime(item.createdAt)}</p>
                  <button
                    type="button"
                    disabled={item.read || pending === item.id}
                    onClick={() => confirm(item.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-[0.12em] text-cream disabled:bg-mist disabled:text-olive"
                  >
                    {item.type === "welfare" ? <Stamp size={14} /> : <Receipt size={14} />}
                    {item.read
                      ? item.type === "welfare"
                        ? "Fattura segnata"
                        : "Scontrino segnato"
                      : item.type === "welfare"
                        ? "Segna fattura emessa"
                        : "Segna scontrino emesso"}
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
                <th className="pb-3 text-right">Presenza Ospite</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ transaction, user, company }) => (
                <tr key={transaction.id} className="border-t border-mist">
                  <td className="py-3">{formatDateTime(transaction.createdAt)}</td>
                  <td>
                    {user.firstName} {user.lastName}
                    <span className="block text-xs text-olive">
                      {company ? company.name : "Pagamento privato"}
                    </span>
                  </td>
                  <td>{transaction.type === "welfare_redeem" ? "Welfare B2B" : "Consumer B2C"}</td>
                  <td>{formatEuro(transaction.amountCents)}</td>
                  <td className="capitalize">{transaction.status}</td>
                  <td className="text-right">
                    {transaction.voucherId ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={pending === transaction.voucherId}
                          onClick={() => registerAttendance(transaction.voucherId!, "attended")}
                          className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-medium text-forest hover:bg-forest/20 transition disabled:opacity-50"
                          title="Segna presenza fisica dell'ospite"
                        >
                          <CheckCircle2 size={12} /> Presente
                        </button>
                        <button
                          type="button"
                          disabled={pending === transaction.voucherId}
                          onClick={() => registerAttendance(transaction.voucherId!, "no_show")}
                          className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] font-medium text-terracotta hover:bg-terracotta/20 transition disabled:opacity-50"
                          title="Segna mancato arrivo (no-show)"
                        >
                          <UserX size={12} /> Assente
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-olive">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}