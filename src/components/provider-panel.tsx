"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Receipt,
  Sparkles,
  Stamp,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import type { companies, notifications, transactions, users, venues } from "@/db/schema";
import type { VenueBookingRow } from "@/lib/data";
import { formatDate, formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  venue: typeof venues.$inferSelect;
  notifications: Array<typeof notifications.$inferSelect>;
  transactions: Array<{
    transaction: typeof transactions.$inferSelect;
    user: typeof users.$inferSelect;
    company: typeof companies.$inferSelect | null;
    attendanceStatus?: string;
    checkedInAt?: Date | null;
  }>;
  bookings?: VenueBookingRow[];
};

export function ProviderPanel({ venue, notifications: items, transactions: rows, bookings = [] }: Props) {
  const router = useRouter();
  const [panelTab, setPanelTab] = useState<"welfare" | "community">("welfare");
  const [welfareFilter, setWelfareFilter] = useState<"active" | "cancelled" | "all">("active");
  const [pending, setPending] = useState<number | null>(null);

  // Filtra transazioni welfare attive vs revocate
  const activeRows = rows.filter(
    (r) => r.transaction.status !== "cancelled" && r.transaction.paymentStatus !== "cancelled"
  );
  const cancelledRows = rows.filter(
    (r) => r.transaction.status === "cancelled" || r.transaction.paymentStatus === "cancelled"
  );
  const displayedRows =
    welfareFilter === "active" ? activeRows : welfareFilter === "cancelled" ? cancelledRows : rows;

  // Stato per l'editing degli estremi fattura inline
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [invNum, setInvNum] = useState("");
  const [invDate, setInvDate] = useState("");
  const [invNotes, setInvNotes] = useState("");

  async function updateBookingStatus(bookingId: number, status: string) {
    setPending(bookingId);
    try {
      await fetch("/api/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function confirmNotification(id: number) {
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

  async function saveInvoiceDetails(txId: number) {
    setPending(txId);
    await fetch("/api/provider/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: txId,
        invoiceNumber: invNum,
        invoiceDate: invDate,
        paymentNotes: invNotes,
      }),
    });
    setEditingTxId(null);
    setPending(null);
    router.refresh();
  }

  async function togglePaymentStatus(txId: number, currentStatus: string | null) {
    setPending(txId);
    const nextStatus = currentStatus === "settled" ? "pending" : "settled";
    await fetch("/api/provider/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: txId,
        paymentStatus: nextStatus,
      }),
    });
    setPending(null);
    router.refresh();
  }

  // Calcolo KPI del fornitore
  const totalVolumeCents = rows.reduce((s, r) => s + r.transaction.amountCents, 0);
  const totalCommissionCents = rows.reduce(
    (s, r) => s + (r.transaction.commissionAmountCents || Math.round(r.transaction.amountCents * 0.1)),
    0
  );
  const totalNetCents = rows.reduce(
    (s, r) => s + (r.transaction.providerNetCents || r.transaction.amountCents - Math.round(r.transaction.amountCents * 0.1)),
    0
  );
  const settledNetCents = rows
    .filter((r) => r.transaction.paymentStatus === "settled")
    .reduce(
      (s, r) => s + (r.transaction.providerNetCents || r.transaction.amountCents - Math.round(r.transaction.amountCents * 0.1)),
      0
    );
  const pendingNetCents = totalNetCents - settledNetCents;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Pannello Struttura Convenzionata</p>
        <h1 className="mt-2 font-serif text-4xl">{venue.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/80">
          Monitoraggio delle prestazioni welfare e consumer, registrazione delle fatture emesse nel tuo gestionale e controllo dei saldi.
        </p>

        {/* Quick KPI stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-cream/60">Volume Lordo Riscattato</p>
            <p className="font-serif text-2xl text-cream">{formatEuro(totalVolumeCents)}</p>
          </div>
          <div>
            <p className="text-xs text-cream/60">Commissione Radici (10%)</p>
            <p className="font-serif text-2xl text-gold">{formatEuro(totalCommissionCents)}</p>
          </div>
          <div>
            <p className="text-xs text-cream/60">Compenso Netto Struttura</p>
            <p className="font-serif text-2xl text-sand">{formatEuro(totalNetCents)}</p>
          </div>
          <div>
            <p className="text-xs text-cream/60">In Attesa di Accredito</p>
            <p className="font-serif text-2xl text-terracotta">{formatEuro(pendingNetCents)}</p>
          </div>
        </div>
      </section>

      {/* Navigazione Tab del Pannello Fornitore */}
      <div className="flex gap-2 border-b border-forest/10 pb-3">
        <button
          type="button"
          onClick={() => setPanelTab("welfare")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            panelTab === "welfare"
              ? "bg-forest text-cream shadow-sm"
              : "bg-white text-forest hover:bg-cream border border-forest/10"
          }`}
        >
          <FileText size={16} />
          Distinta Welfare B2B ({activeRows.length})
        </button>
        <button
          type="button"
          onClick={() => setPanelTab("community")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            panelTab === "community"
              ? "bg-forest text-cream shadow-sm"
              : "bg-white text-forest hover:bg-cream border border-forest/10"
          }`}
        >
          <CalendarCheck size={16} />
          Prenotazioni Community & Spettacoli ({bookings.length})
        </button>
      </div>

      {panelTab === "welfare" ? (
        <>
          {/* Regola Fiscale Chiave (Art. 51 TUIR) */}
          <section className="rounded-2xl border border-gold/40 bg-sand/15 p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 text-forest shrink-0" size={20} />
              <div className="text-sm leading-relaxed text-forest">
                <strong className="block text-base font-serif mb-1">Regola Fondamentale di Pagamento Welfare (Art. 51 TUIR)</strong>
                Ogni voucher selezionato dal lavoratore costituisce un <strong>debito certo ed esigibile</strong> a carico dell&apos;Impresa CSR committente:
                il compenso a tuo favore è <strong>dovuto per legge al momento del riscatto</strong>, sia che l&apos;ospite si presenti sia in caso di mancato arrivo (no-show).
                Emetti la fattura dal tuo gestionale contabile intestandola all&apos;azienda indicata e segna qui il numero di fattura e l&apos;avvenuto saldo.
                La rilevazione della presenza fisica serve unicamente al monitoraggio statistico ed ESG territoriale.
              </div>
            </div>
          </section>

          {/* Registro Prestazioni & Controllo Eventi Fiscale */}
          <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-forest">Distinta Prestazioni & Eventi di Pagamento</h2>
            <p className="text-xs text-olive mt-0.5">
              Registra il numero della fattura che hai emesso nel tuo gestionale contabile e indica quando l&apos;azienda ha saldato il bonifico.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-forest/5 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setWelfareFilter("active")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                welfareFilter === "active" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
              }`}
            >
              Da Fatturare ({activeRows.length})
            </button>
            <button
              type="button"
              onClick={() => setWelfareFilter("cancelled")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                welfareFilter === "cancelled" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
              }`}
            >
              Annullate ({cancelledRows.length})
            </button>
            <button
              type="button"
              onClick={() => setWelfareFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                welfareFilter === "all" ? "bg-forest text-cream shadow-sm" : "text-forest hover:bg-forest/10"
              }`}
            >
              Tutte ({rows.length})
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-mist text-[11px] uppercase tracking-[0.14em] text-olive">
              <tr>
                <th className="pb-3">Data Riscatto</th>
                <th className="pb-3">Ospite / Beneficiario</th>
                <th className="pb-3">Committente Fattura</th>
                <th className="pb-3">Importo & Fee Radici</th>
                <th className="pb-3">Presenza (ESG)</th>
                <th className="pb-3">Estremi Fattura Esterna</th>
                <th className="pb-3 text-right">Stato Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-olive">
                    {welfareFilter === "active"
                      ? "Nessuna prestazione welfare attiva da fatturare."
                      : welfareFilter === "cancelled"
                      ? "Nessuna prestazione annullata."
                      : "Nessuna operazione registrata."}
                  </td>
                </tr>
              ) : (
                displayedRows.map(({ transaction: tx, user, company, attendanceStatus }) => {
                  const isCancelled = tx.status === "cancelled" || tx.paymentStatus === "cancelled";
                  const commission = tx.commissionAmountCents || Math.round(tx.amountCents * 0.1);
                  const net = tx.providerNetCents || tx.amountCents - commission;
                  const isEditing = editingTxId === tx.id;
                  const isSettled = tx.paymentStatus === "settled";

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isCancelled ? "bg-mist/20 opacity-70" : "hover:bg-sand/5"
                      }`}
                    >
                      {/* Data */}
                      <td className="py-4 align-top">
                        <span className="font-medium text-forest">{formatDateTime(tx.createdAt)}</span>
                        <span className="block text-[11px] text-olive">{tx.serviceLabel}</span>
                        {isCancelled && (
                          <span className="block text-[10px] text-terracotta font-medium mt-0.5">
                            Revocata dal lavoratore
                          </span>
                        )}
                      </td>

                      {/* Ospite */}
                      <td className="py-4 align-top">
                        <span className="font-medium text-forest">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="block text-xs text-olive">{user.email}</span>
                      </td>

                      {/* Committente */}
                      <td className="py-4 align-top">
                        {isCancelled ? (
                          <div>
                            <span className="font-semibold text-forest line-through">{company ? company.name : "N/D"}</span>
                            <span className="block text-[11px] font-semibold text-terracotta">Selezione annullata dal cliente</span>
                            <span className="block text-[10px] text-olive">Nessuna fattura da emettere</span>
                          </div>
                        ) : company ? (
                          <div>
                            <span className="font-semibold text-forest">{company.name}</span>
                            <span className="block text-[11px] font-mono text-olive">P.IVA: {company.vatNumber}</span>
                            <span className="inline-block mt-0.5 rounded bg-sage/20 px-1.5 py-0.5 text-[10px] text-forest font-medium">
                              Welfare Art. 51
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-forest">Pagamento Privato</span>
                            <span className="block text-[11px] text-olive">Ospite consumer B2C</span>
                          </div>
                        )}
                      </td>

                      {/* Importi */}
                      <td className="py-4 align-top">
                        {isCancelled ? (
                          <div>
                            <span className="line-through text-olive/60 text-xs">{formatEuro(tx.amountCents)}</span>
                            <span className="block text-xs font-bold text-terracotta">0,00 € (Revocato)</span>
                            <span className="block text-[10px] text-olive">Nessun compenso dovuto</span>
                          </div>
                        ) : (
                          <div className="text-forest">
                            <span className="font-semibold">{formatEuro(tx.amountCents)}</span>
                            <span className="block text-[11px] text-olive">Fee Radici (10%): -{formatEuro(commission)}</span>
                            <span className="block text-xs font-semibold text-forest/90">Netto tuo: {formatEuro(net)}</span>
                          </div>
                        )}
                      </td>

                      {/* Presenza fisica (ESG) */}
                      <td className="py-4 align-top">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-mist/60 px-2.5 py-1 text-xs font-semibold text-olive">
                            Non applicabile (Revocato)
                          </span>
                        ) : tx.voucherId ? (
                          <div className="space-y-1.5">
                            {attendanceStatus === "attended" ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-2.5 py-1 text-xs font-semibold text-forest">
                                  <CheckCircle2 size={13} className="text-forest" /> Presente (Convalidato)
                                </span>
                                <button
                                  type="button"
                                  disabled={pending === tx.voucherId}
                                  onClick={() => registerAttendance(tx.voucherId!, "no_show")}
                                  className="mt-1 block text-[10px] text-olive hover:text-terracotta underline"
                                >
                                  Modifica in No-Show
                                </button>
                              </div>
                            ) : attendanceStatus === "no_show" ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-1 text-xs font-semibold text-terracotta">
                                  <UserX size={13} className="text-terracotta" /> Assente (No-Show)
                                </span>
                                <button
                                  type="button"
                                  disabled={pending === tx.voucherId}
                                  onClick={() => registerAttendance(tx.voucherId!, "attended")}
                                  className="mt-1 block text-[10px] text-olive hover:text-forest underline"
                                >
                                  Modifica in Presente
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={pending === tx.voucherId}
                                    onClick={() => registerAttendance(tx.voucherId!, "attended")}
                                    className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-forest hover:bg-forest/20 transition disabled:opacity-50"
                                    title="Convalida presenza fisica dell'ospite nel database"
                                  >
                                    <CheckCircle2 size={12} /> Presente
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending === tx.voucherId}
                                    onClick={() => registerAttendance(tx.voucherId!, "no_show")}
                                    className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] font-semibold text-terracotta hover:bg-terracotta/20 transition disabled:opacity-50"
                                    title="Registra mancato arrivo (no-show) nel database"
                                  >
                                    <UserX size={12} /> No-Show
                                  </button>
                                </div>
                                <span className="block text-[10px] text-olive/80 mt-0.5">
                                  (Compenso comunque dovuto)
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-olive">Consumato in loco</span>
                        )}
                      </td>

                      {/* Estremi Fattura Esterna */}
                      <td className="py-4 align-top">
                        {isCancelled ? (
                          <span className="text-xs text-olive italic">Non fatturabile</span>
                        ) : isEditing ? (
                        <div className="space-y-2 rounded-xl border border-forest/20 bg-cream p-3 min-w-[200px]">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-forest">N° Fattura Gestionale</label>
                            <input
                              type="text"
                              value={invNum}
                              onChange={(e) => setInvNum(e.target.value)}
                              placeholder="es. Fatt. 42/2026"
                              className="mt-0.5 w-full rounded border border-forest/20 px-2 py-1 text-xs text-forest focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-forest">Data Emissione</label>
                            <input
                              type="date"
                              value={invDate}
                              onChange={(e) => setInvDate(e.target.value)}
                              className="mt-0.5 w-full rounded border border-forest/20 px-2 py-1 text-xs text-forest focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              disabled={pending === tx.id}
                              onClick={() => saveInvoiceDetails(tx.id)}
                              className="rounded bg-forest px-2.5 py-1 text-[11px] text-cream hover:bg-forest/90"
                            >
                              Salva
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTxId(null)}
                              className="rounded border border-forest/20 px-2.5 py-1 text-[11px] text-forest hover:bg-forest/5"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {tx.invoiceNumber ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
                                <FileText size={12} /> {tx.invoiceNumber}
                              </span>
                              {tx.invoiceDate ? (
                                <span className="block text-[11px] text-olive">del {tx.invoiceDate}</span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTxId(tx.id);
                                  setInvNum(tx.invoiceNumber ?? "");
                                  setInvDate(tx.invoiceDate ?? "");
                                  setInvNotes(tx.paymentNotes ?? "");
                                }}
                                className="text-[11px] text-forest underline hover:text-forest/70 block"
                              >
                                Modifica estremi
                              </button>
                            </div>
                          ) : (
                            <div>
                              <span className="block text-xs italic text-olive">Fattura non ancora indicata</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTxId(tx.id);
                                  setInvNum("");
                                  setInvDate(new Date().toISOString().split("T")[0]);
                                  setInvNotes("");
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline"
                              >
                                <Stamp size={12} /> Inserisci N° Fattura
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Stato Saldo / Pagamento */}
                    <td className="py-4 align-top text-right">
                      <div className="inline-flex flex-col items-end gap-1.5">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-3 py-1 text-xs font-semibold text-forest">
                            <CheckCircle2 size={13} className="text-forest" /> Saldato
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-semibold text-terracotta">
                            <Clock size={13} /> In attesa di saldo
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={pending === tx.id}
                          onClick={() => togglePaymentStatus(tx.id, tx.paymentStatus)}
                          className="text-[11px] text-olive hover:text-forest underline transition"
                        >
                          {isSettled ? "Segna come Da Saldare" : "Segna come Saldato"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </section>
        </>
      ) : (
        /* Sezione Prenotazioni Community & Spettacoli Teatrali */
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-forest/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-forest">Gestione Prenotazioni Community & Ospiti</h2>
              <p className="text-xs text-olive mt-0.5">
                Accetta o gestisci le prenotazioni convenzionate (sconto 10%), richiedi o ricevi la riconferma di presenza ed evita l&apos;overbooking.
              </p>
            </div>
            <span className="text-xs rounded-full bg-forest/5 px-3 py-1 font-mono text-forest">
              {bookings.length} {bookings.length === 1 ? "prenotazione" : "prenotazioni"}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarCheck className="mx-auto text-forest/25" size={44} />
              <h3 className="mt-3 font-serif text-xl text-forest">Nessuna prenotazione community ricevuta</h3>
              <p className="mt-1 text-xs text-olive max-w-sm mx-auto">
                Le prenotazioni inviate dagli amici della community con convenzione 10% appariranno qui.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-forest/10 text-olive uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Data & Orario</th>
                    <th className="pb-3">Ospite</th>
                    <th className="pb-3">Servizio / Evento</th>
                    <th className="pb-3 text-center">Posti</th>
                    <th className="pb-3 text-right">Totale Convenzione</th>
                    <th className="pb-3 text-center">Stato Presenza</th>
                    <th className="pb-3 text-right">Azioni Struttura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/5">
                  {bookings.map(({ booking: b, user: u, grantEvent: ge }) => {
                    const isPending = b.status === "pending";
                    const isConfirmed = b.status === "confirmed";
                    const isPresenceConfirmed = b.status === "presence_confirmed";
                    const isAttended = b.status === "attended";
                    const isNoShow = b.status === "no_show";

                    return (
                      <tr key={b.id} className="hover:bg-sand/10 transition">
                        <td className="py-3.5 align-top">
                          <p className="font-bold text-forest">{formatDate(b.bookingDate)}</p>
                          <p className="text-[11px] text-olive">{b.timeSlot || "Orario standard"}</p>
                        </td>

                        <td className="py-3.5 align-top">
                          <p className="font-semibold text-forest">{b.guestName}</p>
                          <p className="text-olive">{b.guestEmail}</p>
                          {b.guestPhone && <p className="text-[10px] text-ink/70">Tel: {b.guestPhone}</p>}
                          {b.notes && <p className="mt-1 text-[10px] italic text-olive">Note: {b.notes}</p>}
                        </td>

                        <td className="py-3.5 align-top">
                          {ge ? (
                            <div>
                              <span className="inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest">
                                Spettacolo
                              </span>
                              <p className="mt-0.5 font-bold text-forest">{ge.title}</p>
                            </div>
                          ) : (
                            <span className="font-medium text-forest capitalize">
                              {b.bookingType === "dinner" ? "Cena tipica" : "Pernottamento"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 align-top text-center">
                          <span className="inline-block rounded-full bg-cream px-2.5 py-1 font-bold text-forest border border-forest/10">
                            {b.partySize} {b.partySize === 1 ? "posto" : "posti"}
                          </span>
                          {b.voucherId ? (
                            <span className="block mt-1 text-[10px] text-forest font-semibold">
                              1 Quota Welfare (B2B)
                            </span>
                          ) : (
                            <span className="block mt-1 text-[10px] text-olive font-medium">
                              Privato Community
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 align-top text-right font-medium">
                          {b.voucherId ? (
                            <div>
                              <p className="font-bold text-forest">0 € (Welfare)</p>
                              <p className="text-[10px] text-olive">Addebito ad Impresa</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-forest">{formatEuro(b.finalPriceCents)}</p>
                              <p className="text-[10px] text-terracotta">Sconto 10% Community</p>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 align-top text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-forest">
                              <Clock size={11} className="text-gold" /> In attesa
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-forest">
                              <CheckCircle2 size={11} className="text-forest" /> Accettata
                            </span>
                          )}
                          {isPresenceConfirmed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-forest shadow-xs border border-forest/20">
                              <CheckCircle2 size={11} className="text-forest" /> Presenza Riconfermata
                            </span>
                          )}
                          {isAttended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-[11px] font-semibold text-cream">
                              <CheckCircle2 size={11} className="text-gold" /> Presente
                            </span>
                          )}
                          {isNoShow && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-2.5 py-1 text-[11px] font-semibold text-wine">
                              No-Show
                            </span>
                          )}
                          {b.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-forest/70">
                              Annullata
                            </span>
                          )}
                          {b.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-2.5 py-1 text-[11px] font-semibold text-wine">
                              Rifiutata
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {isPending && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={pending === b.id}
                                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                                  className="rounded-full bg-forest px-3 py-1 text-[10px] font-bold text-cream hover:bg-forest/90 transition"
                                >
                                  Accetta
                                </button>
                                <button
                                  type="button"
                                  disabled={pending === b.id}
                                  onClick={() => updateBookingStatus(b.id, "rejected")}
                                  className="rounded-full border border-forest/20 px-2.5 py-1 text-[10px] font-medium text-forest hover:bg-wine/10 hover:text-wine hover:border-wine/20 transition"
                                >
                                  Rifiuta
                                </button>
                              </div>
                            )}

                            {(isConfirmed || isPresenceConfirmed) && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={pending === b.id}
                                  onClick={() => updateBookingStatus(b.id, "attended")}
                                  className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1 text-[10px] font-bold text-cream hover:bg-forest-deep transition"
                                >
                                  <UserCheck size={11} /> Segna Presente
                                </button>
                                <button
                                  type="button"
                                  disabled={pending === b.id}
                                  onClick={() => updateBookingStatus(b.id, "no_show")}
                                  className="inline-flex items-center gap-1 rounded-full border border-wine/20 px-2 py-1 text-[10px] font-medium text-wine hover:bg-wine/10 transition"
                                >
                                  <UserX size={11} /> No-Show
                                </button>
                              </div>
                            )}

                            {(isAttended || isNoShow) && (
                              <span className="text-[10px] text-olive font-medium">
                                Check-in registrato
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Sezione Notifiche Operative */}
      <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
        <div className="flex items-center gap-2 text-forest">
          <Bell size={18} />
          <h2 className="font-serif text-2xl">Notifiche e Istruzioni di Fatturazione Esterna</h2>
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const payload = (item.payload ?? {}) as Record<string, any>;
            const isCancelled =
              Boolean(payload.cancelled) ||
              item.title.toLowerCase().includes("annullat") ||
              item.body.toLowerCase().includes("annullat");

            return (
              <article
                key={item.id}
                className={`rounded-3xl border p-5 ${
                  isCancelled
                    ? "border-terracotta/30 bg-terracotta/5"
                    : item.type === "welfare"
                    ? "border-gold/40 bg-cream"
                    : "border-sage/40 bg-sage/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-olive">
                    {isCancelled
                      ? "Avviso Selezione Annullata (Nessun addebito)"
                      : item.type === "welfare"
                      ? "Notifica riscatto welfare B2B (Dovuto per legge)"
                      : "Notifica referral community"}
                  </p>
                  {isCancelled && (
                    <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-terracotta">
                      Non Fatturare
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-serif text-2xl text-forest">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-forest/80">{item.body}</p>
                <div className="mt-4 space-y-1 text-sm text-forest font-mono text-xs">
                  {isCancelled ? (
                    <div className="rounded-xl border border-terracotta/20 bg-white/70 p-3 text-terracotta">
                      <p className="font-bold">⚠️ PRENOTAZIONE REVOCATA: NESSUNA FATTURA DA EMETTERE</p>
                      <p className="text-[11px] mt-0.5 font-sans text-forest/80">
                        Il lavoratore ha modificato o annullato la selezione prima della fruizione. Nessuna prestazione richiesta per questa struttura.
                      </p>
                    </div>
                  ) : (
                    <>
                      {payload.invoiceHint ? <p className="font-bold">→ {String(payload.invoiceHint)}</p> : null}
                      {payload.vatNote ? <p>→ {String(payload.vatNote)}</p> : null}
                      {payload.impact ? <p>→ Impatto: {String(payload.impact)}</p> : null}
                    </>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest/10 pt-3">
                  <p className="text-xs text-olive">{formatDateTime(item.createdAt)}</p>
                  <button
                    type="button"
                    disabled={item.read || pending === item.id}
                    onClick={() => confirmNotification(item.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-[0.12em] text-cream disabled:bg-mist disabled:text-olive transition hover:bg-forest/90"
                  >
                    {item.type === "welfare" ? <Stamp size={14} /> : <Receipt size={14} />}
                    {item.read ? "Notifica presa in carico" : "Segna come letta"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
