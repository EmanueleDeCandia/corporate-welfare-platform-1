"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bed,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Info,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Sparkles,
  Stamp,
  Trash2,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import type { companies, notifications, transactions, users, venues } from "@/db/schema";
import type { VenueBookingRow } from "@/lib/data";
import { formatDate, formatDateTime, formatEuro } from "@/lib/utils";
import { ImpactCertificateStudio } from "@/components/certificati-impatto/ImpactCertificateStudio";
import { Award } from "lucide-react";

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
  const isHospitality =
    venue.type === "hotel" ||
    venue.type === "agriturismo" ||
    (venue.rooms && venue.rooms.length > 0);

  const [panelTab, setPanelTab] = useState<"welfare" | "community" | "rooms" | "certificati">("welfare");
  const [welfareFilter, setWelfareFilter] = useState<"active" | "cancelled" | "all">("active");
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "active" | "cancelled">("all");
  const [pending, setPending] = useState<number | null>(null);

  // Stato per la gestione delle offerte camere convenzionate
  const [roomsList, setRoomsList] = useState<
    Array<{ name: string; description: string; capacity: number; priceCents: number }>
  >(
    venue.rooms && venue.rooms.length > 0
      ? venue.rooms
      : [
          {
            name: "Camera Singola (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto. Prezzo convenzionato 50,00 € coperto al 100% da 1 Voucher Welfare aziendale nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto. Camera matrimoniale o doppia con servizi privati, colazione e accoglienza del territorio.",
            capacity: 2,
            priceCents: 10000,
          },
        ]
  );
  const [savingRooms, setSavingRooms] = useState(false);
  const [roomSaveMsg, setRoomSaveMsg] = useState("");

  async function handleSaveRooms(e: React.FormEvent) {
    e.preventDefault();
    setSavingRooms(true);
    setRoomSaveMsg("");
    try {
      const res = await fetch("/api/provider/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: venue.id, rooms: roomsList }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoomSaveMsg(data.error || "Errore durante il salvataggio del listino camere.");
      } else {
        setRoomSaveMsg(
          "Offerte camere aggiornate con successo! Le modifiche e le spiegazioni sono ora visibili nella pagina pubblica della tua struttura."
        );
        router.refresh();
      }
    } catch {
      setRoomSaveMsg("Errore di connessione.");
    } finally {
      setSavingRooms(false);
    }
  }

  function handleRoomChange(index: number, field: string, value: any) {
    setRoomsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addRoom() {
    setRoomsList((prev) => [
      ...prev,
      {
        name: `Nuova Camera ${prev.length + 1}`,
        description: "Descrizione e dettagli della camera convenzionata...",
        capacity: 2,
        priceCents: 5000,
      },
    ]);
  }

  function removeRoom(index: number) {
    if (roomsList.length <= 1) {
      alert("È richiesta almeno una camera nel listino convenzionato.");
      return;
    }
    setRoomsList((prev) => prev.filter((_, i) => i !== index));
  }

  function resetDefaultRooms() {
    setRoomsList([
      {
        name: "Camera Singola (Convenzione Welfare Aziendale · 1 Persona)",
        description:
          "1 Posto letto. Prezzo convenzionato 50,00 € coperto al 100% da 1 Voucher Welfare aziendale nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
        capacity: 1,
        priceCents: 5000,
      },
      {
        name: "Camera Doppia (1 Quota Welfare + 1 Quota Accompagnatore)",
        description:
          "2 Posti letto. Camera matrimoniale o doppia con servizi privati, colazione e accoglienza del territorio.",
        capacity: 2,
        priceCents: 10000,
      },
    ]);
  }

  // Isola unicamente le prestazioni Welfare B2B (voucher con impresa committente ex Art. 51 TUIR)
  // I pagamenti privati con carta degli ospiti consumer sono gestiti nel tab "Prenotazioni Community"
  const welfareRows = rows.filter(
    (r) => r.transaction.type === "welfare_redeem" || r.transaction.voucherId !== null || r.company !== null
  );

  // Filtra transazioni welfare attive vs revocate
  const activeRows = welfareRows.filter(
    (r) => r.transaction.status !== "cancelled" && r.transaction.paymentStatus !== "cancelled"
  );
  const cancelledRows = welfareRows.filter(
    (r) => r.transaction.status === "cancelled" || r.transaction.paymentStatus === "cancelled"
  );
  const displayedRows =
    welfareFilter === "active" ? activeRows : welfareFilter === "cancelled" ? cancelledRows : welfareRows;

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

  // Calcolo KPI del fornitore (Welfare B2B)
  const totalVolumeCents = welfareRows.reduce((s, r) => s + r.transaction.amountCents, 0);
  const totalCommissionCents = welfareRows.reduce(
    (s, r) => s + (r.transaction.commissionAmountCents || Math.round(r.transaction.amountCents * 0.1)),
    0
  );
  const totalNetCents = welfareRows.reduce(
    (s, r) => s + (r.transaction.providerNetCents || r.transaction.amountCents - Math.round(r.transaction.amountCents * 0.1)),
    0
  );
  const settledNetCents = welfareRows
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
      <div className="flex gap-2 border-b border-forest/10 pb-3 overflow-x-auto">
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
        {isHospitality ? (
          <button
            type="button"
            onClick={() => setPanelTab("rooms")}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              panelTab === "rooms"
                ? "bg-forest text-cream shadow-sm"
                : "bg-white text-forest hover:bg-cream border border-forest/10"
            }`}
          >
            <Bed size={16} />
            Offerte Camere & Convenzioni ({roomsList.length})
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPanelTab("certificati")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            panelTab === "certificati"
              ? "bg-forest text-cream shadow-sm"
              : "bg-white text-forest hover:bg-cream border border-forest/10"
          }`}
        >
          <Award size={16} />
          Attestati d&apos;Impatto
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
                La rilevazione della presenza fisica serve unicamente al monitoraggio statistico ed CSR territoriale.
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
                <th className="pb-3">Presenza (CSR)</th>
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

                      {/* Presenza fisica (CSR) */}
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
      ) : panelTab === "community" ? (
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
      ) : panelTab === "rooms" ? (
        /* Sezione Gestione Offerte Camere & Convenzioni Welfare */
        <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-forest/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-forest">Gestione Listino Camere & Convenzioni</h2>
              <p className="text-xs text-olive mt-0.5">
                Definisci le offerte sulle camere (singola, doppia) e spiega le condizioni welfare aziendale e community visibili sulla pagina pubblica.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetDefaultRooms}
                className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-cream/50 px-3.5 py-1.5 text-xs font-medium text-forest hover:bg-cream transition"
                title="Ripristina l'offerta standard: Camera Singola 50€ e Camera Doppia 100€"
              >
                <RotateCcw size={13} /> Ripristina Offerte Standard
              </button>
              <button
                type="button"
                onClick={addRoom}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-cream hover:bg-forest/90 transition shadow-xs"
              >
                <Plus size={14} /> Nuova Offerta Camera
              </button>
            </div>
          </div>

          {/* GUIDA RIGOROSA ALLE CONVENZIONI WELFARE & SPESE PRIVATE */}
          <div className="mt-4 rounded-2xl border border-forest/15 bg-cream/40 p-4 text-xs text-olive leading-relaxed space-y-2">
            <strong className="block text-sm font-serif text-forest">Linee Guida Nazionali Welfare (Art. 51 TUIR):</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Camera Singola (50,00 €):</strong> 1 Posto letto. Riservata alla singola persona beneficiaria del Voucher Welfare Aziendale (coperta al 100% con voucher da 50 €). Se l&apos;addetto prenota per 2 persone/posti letto, il prezzo per l&apos;altra persona è la differenza tra il prezzo esposto e 50 € del voucher.
              </li>
              <li>
                <strong>Camera Doppia:</strong> 2 Posti letto. Convenzione Welfare Aziendale & Accompagnatore: copre la quota di 1 lavoratore (50 € con voucher) per un posto letto. Nella camera per 2 posti letto, la seconda persona/accompagnatore non beneficiaria può essere saldata con carta personale dall&apos;addetto o direttamente dall&apos;invitato (su piattaforma o al check-in). Il prezzo per la seconda persona è la differenza tra il prezzo esposto e 50 € del voucher. In fase di prenotazione va indicata la seconda persona per la separazione contabile.
              </li>
              <li>
                <strong>Amici & Invitati Community (senza welfare):</strong> I prezzi base delle camere sono identici, con applicazione automatica dello sconto convenzione del 10% saldabile per intero con la propria carta personale.
              </li>
            </ul>
          </div>

          {/* Form Editing Camere */}
          <form onSubmit={handleSaveRooms} className="mt-6 space-y-5">
            {roomsList.map((room, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-forest/15 bg-cream/40 p-5 space-y-4 relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-forest text-cream text-[11px] font-bold w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-forest text-sm">
                      {room.capacity === 1 ? "Camera Singola (1 Posto Letto)" : "Camera Doppia / Multipla"}
                    </span>
                  </div>
                  {roomsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(idx)}
                      className="text-xs text-terracotta hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={13} /> Elimina Offerta
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest">
                      Titolo Offerta / Nome Camera
                    </label>
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => handleRoomChange(idx, "name", e.target.value)}
                      required
                      placeholder="Es. Camera Singola (Convenzione Welfare Aziendale)"
                      className="mt-1 w-full rounded-xl border border-forest/20 bg-white px-3.5 py-2 text-sm text-forest"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest">
                      Prezzo Convenzione (€)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={Math.round(room.priceCents / 100)}
                        onChange={(e) =>
                          handleRoomChange(idx, "priceCents", Math.round(Number(e.target.value) * 100))
                        }
                        required
                        className="w-full rounded-xl border border-forest/20 bg-white px-3.5 py-2 text-sm text-forest font-semibold"
                      />
                      <span className="text-sm font-bold text-forest">€</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest">
                      Capienza (Posti Letto)
                    </label>
                    <select
                      value={room.capacity}
                      onChange={(e) => handleRoomChange(idx, "capacity", Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-forest/20 bg-white px-3.5 py-2 text-sm text-forest"
                    >
                      <option value={1}>1 Posto Letto (Singola)</option>
                      <option value={2}>2 Posti Letto (Doppia/Matrimoniale)</option>
                      <option value={3}>3 Posti Letto (Tripla)</option>
                      <option value={4}>4 Posti Letto (Quadrupla)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest">
                      Descrizione Dettagliata & Condizioni per gli Ospiti
                    </label>
                    <textarea
                      rows={2}
                      value={room.description}
                      onChange={(e) => handleRoomChange(idx, "description", e.target.value)}
                      placeholder="Spiega i servizi inclusi, la tipologia di letto e le condizioni per la seconda persona..."
                      className="mt-1 w-full rounded-xl border border-forest/20 bg-white px-3.5 py-2 text-sm text-forest"
                    />
                  </div>
                </div>
              </div>
            ))}

            {roomSaveMsg && (
              <div
                className={`rounded-2xl p-4 text-xs font-medium ${
                  roomSaveMsg.includes("successo")
                    ? "bg-forest/10 text-forest border border-forest/20"
                    : "bg-terracotta/10 text-terracotta border border-terracotta/20"
                }`}
              >
                {roomSaveMsg}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingRooms}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-semibold text-cream shadow-md transition hover:bg-forest/90 disabled:opacity-50"
              >
                <Save size={16} />
                {savingRooms ? "Salvataggio in corso..." : "Salva Modifiche Listino Camere"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        /* Sezione Studio Attestati d'Impatto Km 0 */
        <ImpactCertificateStudio
          initialContext={{
            company: venue.name,
            promoter: "RADICI · Welfare & Territorio Marche",
            role: "Struttura Partner Convenzionata",
            city: venue.city,
            distanceKm: 40,
          }}
        />
      )}

      {/* Sezione Notifiche Operative */}
      <section className="rounded-[28px] bg-white p-6 shadow-sm border border-forest/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-forest/10 pb-4">
          <div className="flex items-center gap-2 text-forest">
            <Bell size={18} />
            <h2 className="font-serif text-2xl">Notifiche e Istruzioni di Fatturazione Esterna</h2>
          </div>

          {/* TENDINA FILTRO NOTIFICHE */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="notif-filter-select" className="text-xs text-olive font-medium flex items-center gap-1">
              <Filter size={13} /> Mostra:
            </label>
            <select
              id="notif-filter-select"
              value={notifFilter}
              onChange={(e) => setNotifFilter(e.target.value as any)}
              className="rounded-full border border-forest/20 bg-cream/50 px-3.5 py-1.5 text-xs font-semibold text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
            >
              <option value="all">Tutte le Notifiche ({items.length})</option>
              <option value="unread">Da Leggere / In Attesa ({items.filter((i) => !i.read).length})</option>
              <option value="active">Riscatti Welfare Attivi ({items.filter((i) => {
                const p = (i.payload ?? {}) as Record<string, any>;
                return !Boolean(p.cancelled) && !i.title.toLowerCase().includes("annullat") && !i.body.toLowerCase().includes("annullat");
              }).length})</option>
              <option value="cancelled">Revocate & Annullate ({items.filter((i) => {
                const p = (i.payload ?? {}) as Record<string, any>;
                return Boolean(p.cancelled) || i.title.toLowerCase().includes("annullat") || i.body.toLowerCase().includes("annullat");
              }).length})</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {(() => {
            const displayedItems = items.filter((item) => {
              const payload = (item.payload ?? {}) as Record<string, any>;
              const isCancelled =
                Boolean(payload.cancelled) ||
                item.title.toLowerCase().includes("annullat") ||
                item.body.toLowerCase().includes("annullat");

              if (notifFilter === "unread") return !item.read;
              if (notifFilter === "active") return !isCancelled;
              if (notifFilter === "cancelled") return isCancelled;
              return true;
            });

            if (displayedItems.length === 0) {
              return (
                <div className="py-8 text-center text-xs text-olive">
                  {notifFilter === "unread"
                    ? "Nessuna notifica in attesa di lettura: tutte le notifiche sono state prese in carico."
                    : notifFilter === "active"
                    ? "Nessun riscatto welfare attivo da fatturare al momento."
                    : notifFilter === "cancelled"
                    ? "Nessuna notifica di annullamento o revoca presente."
                    : "Nessuna notifica registrata per questa struttura."}
                </div>
              );
            }

            return displayedItems.map((item) => {
              const payload = (item.payload ?? {}) as Record<string, any>;
              const isCancelled =
                Boolean(payload.cancelled) ||
                item.title.toLowerCase().includes("annullat") ||
                item.body.toLowerCase().includes("annullat");

              const serviceLabel =
                payload.serviceLabel ||
                (payload.voucherId === 1 || item.title.toLowerCase().includes("pernottamento")
                  ? "Pernottamento (50€)"
                  : payload.voucherId === 2 ||
                    item.title.toLowerCase().includes("cena") ||
                    item.title.toLowerCase().includes("degustazione") ||
                    item.title.toLowerCase().includes("aperitivo")
                  ? "Cena / Degustazione KM 0 (25€)"
                  : payload.voucherId
                  ? `Voucher #${payload.voucherId}`
                  : null);

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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-olive font-medium">
                        {isCancelled
                          ? "Avviso Selezione Annullata (Nessun addebito)"
                          : item.type === "welfare"
                          ? "Notifica riscatto welfare B2B (Dovuto per legge)"
                          : item.type === "community_booking"
                          ? "Prenotazione Community (Convenzione 10%)"
                          : item.type === "order"
                          ? "Ordine Prodotti Locali KM 0"
                          : "Notifica referral community"}
                      </p>
                      {serviceLabel && (
                        <span className="rounded-full border border-forest/15 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold text-forest">
                          {serviceLabel}
                        </span>
                      )}
                    </div>
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
                      <div className="rounded-xl border border-terracotta/20 bg-white/80 p-3.5 text-terracotta space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                          <XCircle size={14} className="shrink-0" />
                          <span>Prenotazione Revocata: Nessuna fattura da emettere</span>
                        </div>
                        <p className="text-[11px] font-sans text-forest/80 leading-relaxed">
                          Il lavoratore ha modificato o annullato la selezione prima della fruizione. Nessuna prestazione richiesta per questa struttura.
                        </p>

                        {/* NOTA ESPLICATIVA DEMO & AUDIT */}
                        <div className="mt-2.5 pt-2.5 border-t border-forest/10 text-[11px] font-sans space-y-1 text-olive leading-relaxed">
                          <div className="flex items-center gap-1 font-semibold text-forest text-xs">
                            <Info size={12} className="shrink-0 text-forest" />
                            <span>Nota di Tracciamento DEMO:</span>
                          </div>
                          {item.read ? (
                            <p>
                              <strong>Notifica originaria convertita:</strong> La precedente notifica di fatturazione emessa alle {formatDateTime(item.createdAt)} è stata convertita automaticamente in <em>&ldquo;Annullata / Presa in carico&rdquo;</em> per bloccare la pratica precedente ed evitare fatturazioni indebite.
                            </p>
                          ) : (
                            <p>
                              <strong>Nuovo avviso di revoca:</strong> Notifica generata al momento dell&apos;annullamento alle {formatDateTime(item.createdAt)} per allertare il fornitore. Clicca su <em>&ldquo;Segna come letta&rdquo;</em> per confermare la presa visione e archiviarla.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {payload.invoiceHint ? <p className="font-bold">→ {String(payload.invoiceHint)}</p> : null}
                        {payload.vatNote ? <p>→ {String(payload.vatNote)}</p> : null}
                        {payload.impact ? <p>→ Impatto: {String(payload.impact)}</p> : null}
                        <div className="mt-2 pt-2 border-t border-forest/10 font-sans text-[11px] text-olive">
                          {item.type === "welfare"
                            ? "Nota DEMO: In caso di successiva revoca o cambio struttura, questa notifica verrà automaticamente marcata come [ANNULLATO] per bloccare l'emissione della fattura."
                            : "Prenotazione con sconto community 10%. Pagamento diretto dall'ospite con carta personale su piattaforma o al check-in (scontrino o corrispettivo fiscale all'ospite)."}
                        </div>
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
            });
          })()}
        </div>
      </section>
    </div>
  );
}
