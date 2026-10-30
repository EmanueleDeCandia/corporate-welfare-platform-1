"use client";

import { useState } from "react";
import {
  Ticket,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Sparkles,
  Info,
} from "lucide-react";
import type { TheaterDashboardData, TheaterSpectator } from "@/lib/theater";
import { formatDate, formatDateTime } from "@/lib/utils";

type Props = {
  data: TheaterDashboardData;
};

export function TheaterDashboardView({ data }: Props) {
  const [activeTab, setActiveTab] = useState<"shows" | "spectators" | "venue">("shows");
  const [spectators, setSpectators] = useState<TheaterSpectator[]>(data.spectators);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filteredSpectators = spectators.filter(
    (s) =>
      s.spectatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.spectatorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.showTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAttendanceChange(
    spectator: TheaterSpectator,
    newStatus: "attended" | "no_show" | "pending"
  ) {
    setUpdatingId(spectator.id);
    try {
      const res = await fetch("/api/theater/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: spectator.bookingId,
          grantId: spectator.grantId,
          attendanceStatus: newStatus,
        }),
      });

      if (res.ok) {
        setSpectators((prev) =>
          prev.map((s) =>
            s.id === spectator.id ? { ...s, attendanceStatus: newStatus } : s
          )
        );
      }
    } catch (err) {
      console.error("Errore aggiornamento presenza:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. HEADER TEATRO & PARTNER CULTURALE */}
      <section className="rounded-[32px] bg-wine p-6 text-cream shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/25 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              <Ticket size={14} /> Partner Culturale · Ente Teatrale Convenzionato
            </div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl">
              {data.theaterVenue.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-cream/80">
              <MapPin size={16} className="text-gold" />
              {data.theaterVenue.city} ({data.theaterVenue.province}), {data.theaterVenue.region}
            </p>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-cream/75">
              Cruscotto operativo per la gestione delle rassegne, monitoraggio della capienza sala, anti-overbooking in tempo reale e convalida degli spettatori al botteghino.
            </p>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-cream/70">Referente / Direzione</p>
            <p className="font-medium text-cream">
              {data.managerUser.firstName} {data.managerUser.lastName}
            </p>
            <p className="text-xs text-gold">{data.managerUser.badgeLevel}</p>
          </div>
        </div>

        {/* NOTA DOMINIO & SEPARAZIONE FISCALE */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-black/20 p-4 text-xs text-cream/90">
          <Info className="mt-0.5 shrink-0 text-gold" size={18} />
          <div>
            <p className="font-semibold text-gold">
              Modello Operativo & Separazione di Ruolo:
            </p>
            <p className="mt-1 leading-relaxed text-cream/80">
              Gli spettacoli teatrali ospitati nel circuito RADICI costituiscono un <strong>omaggio culturale finanziato dal fondo Matching Grant della Startup Promotrice RADICI</strong> o prenotazioni dirette della Community.
              Il teatro <strong>non è un fornitore welfare commerciale B2B</strong> e non emette fatture verso le Imprese CSR.
            </p>
          </div>
        </div>
      </section>

      {/* 2. STATS KPI SALA & POSTI */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-olive">Capienza Totale</p>
          <p className="mt-2 font-serif text-3xl font-bold text-forest">{data.stats.totalCapacity}</p>
          <p className="mt-1 text-xs text-olive">Posti disponibili a cartellone</p>
        </div>

        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-olive">Posti Riservati</p>
          <p className="mt-2 font-serif text-3xl font-bold text-terracotta">{data.stats.totalReservedSeats}</p>
          <p className="mt-1 text-xs text-olive">Matching Grant + Community</p>
        </div>

        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-olive">Presenze Riconfermate</p>
          <p className="mt-2 font-serif text-3xl font-bold text-emerald-700">{data.stats.totalConfirmedSeats}</p>
          <p className="mt-1 text-xs text-olive">Rassicurazione anti-overbooking</p>
        </div>

        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-olive">Posti Liberi Residui</p>
          <p className="mt-2 font-serif text-3xl font-bold text-forest">{data.stats.totalAvailableSeats}</p>
          <p className="mt-1 text-xs text-olive">Ancora prenotabili</p>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-forest/10 gap-2">
        <button
          onClick={() => setActiveTab("shows")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "shows"
              ? "border-wine text-wine"
              : "border-transparent text-olive hover:text-forest"
          }`}
        >
          <Calendar size={16} />
          Programmazione & Capienza ({data.shows.length})
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "spectators"
              ? "border-wine text-wine"
              : "border-transparent text-olive hover:text-forest"
          }`}
        >
          <Users size={16} />
          Registro Spettatori & Botteghino ({spectators.length})
        </button>
        <button
          onClick={() => setActiveTab("venue")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "venue"
              ? "border-wine text-wine"
              : "border-transparent text-olive hover:text-forest"
          }`}
        >
          <QrCode size={16} />
          Scheda Teatro & Check-in
        </button>
      </div>

      {/* 4. TAB CONTENT */}
      {activeTab === "shows" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">Spettacoli & Gestione Posti</h2>
            <span className="text-xs text-olive">Controllo anti-overbooking in tempo reale</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {data.shows.map((show) => {
              const fillPct = Math.min(100, Math.round((show.reservedSeats / show.capacity) * 100));
              const isAlmostFull = show.availableSeats <= 5;

              return (
                <div
                  key={show.id}
                  className="rounded-3xl border border-forest/10 bg-white p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-wine/10 px-3 py-1 text-xs font-semibold text-wine uppercase tracking-wider">
                        {show.category}
                      </span>
                      {show.startsAt && (
                        <span className="text-xs text-olive flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateTime(show.startsAt)}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-serif text-xl font-bold text-forest">
                      {show.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-olive">
                      {show.description}
                    </p>

                    {show.artistMeetupIncluded && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-0.5 text-[11px] font-medium text-terracotta">
                        <Sparkles size={12} /> Incontro con gli attori incluso
                      </div>
                    )}
                  </div>

                  {/* Barra riempimento sala */}
                  <div className="mt-6 pt-4 border-t border-forest/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-forest">
                        Occupazione Sala: {show.reservedSeats} / {show.capacity} posti
                      </span>
                      <span className={`font-semibold ${isAlmostFull ? "text-wine" : "text-forest"}`}>
                        {fillPct}% {isAlmostFull && "(Quasi esaurito)"}
                      </span>
                    </div>

                    <div className="mt-2 h-2.5 w-full rounded-full bg-forest/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPct >= 90 ? "bg-wine" : fillPct >= 60 ? "bg-gold" : "bg-emerald-600"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-olive">
                      <span>✓ {show.confirmedSeats} confermati dall&apos;ospite</span>
                      <span className="font-semibold text-forest">
                        {show.availableSeats} posti ancora liberi
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "spectators" && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-2xl text-forest">Registro Spettatori al Botteghino</h2>
              <p className="text-xs text-olive">
                Convalida gli ingressi, verifica le conferme di presenza e monitora i no-show.
              </p>
            </div>

            {/* Cerca spettatore */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 text-olive" size={16} />
              <input
                type="text"
                placeholder="Cerca nome o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-forest/15 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-wine"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand/30 uppercase tracking-wider text-olive border-b border-forest/10">
                  <tr>
                    <th className="py-3 px-4">Spettatore</th>
                    <th className="py-3 px-4">Canale & Provenienza</th>
                    <th className="py-3 px-4">Spettacolo</th>
                    <th className="py-3 px-4 text-center">Posti</th>
                    <th className="py-3 px-4">Conferma Ospite</th>
                    <th className="py-3 px-4">Ingresso Botteghino</th>
                    <th className="py-3 px-4 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/5">
                  {filteredSpectators.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-olive">
                        Nessuno spettatore trovato con i criteri inseriti.
                      </td>
                    </tr>
                  ) : (
                    filteredSpectators.map((s) => (
                      <tr key={s.id} className="hover:bg-cream/40 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-forest">{s.spectatorName}</p>
                          <p className="text-[11px] text-olive">{s.spectatorEmail}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              s.channel === "matching_grant"
                                ? "bg-gold/20 text-terracotta"
                                : "bg-forest/10 text-forest"
                            }`}
                          >
                            {s.channelLabel}
                          </span>
                          {s.linkedStay && (
                            <p className="mt-1 text-[10px] text-olive">
                              Soggiorno: <span className="font-medium text-forest">{s.linkedStay}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-forest">{s.showTitle}</p>
                          {s.date && <p className="text-[10px] text-olive">{formatDate(s.date)}</p>}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-forest">
                          {s.seats}
                        </td>

                        <td className="py-3.5 px-4">
                          {s.guestConfirmationStatus === "presence_confirmed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <CheckCircle2 size={12} /> Presenza Confermata
                            </span>
                          ) : s.guestConfirmationStatus === "cancelled" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-2 py-0.5 text-[11px] font-semibold text-wine">
                              Annullata
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              <Clock size={12} /> In attesa
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {s.attendanceStatus === "attended" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold">
                              ✓ Entrato
                            </span>
                          ) : s.attendanceStatus === "no_show" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-wine text-white px-2.5 py-0.5 text-[10px] font-bold">
                              No-Show
                            </span>
                          ) : (
                            <span className="text-[11px] text-olive">Da convalidare</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {s.attendanceStatus !== "attended" && (
                              <button
                                onClick={() => handleAttendanceChange(s, "attended")}
                                disabled={updatingId === s.id}
                                className="rounded-xl bg-forest px-2.5 py-1 text-[11px] font-medium text-cream hover:bg-forest/90 transition disabled:opacity-50"
                                title="Convalida ingresso al botteghino"
                              >
                                {updatingId === s.id ? "…" : "Ingresso"}
                              </button>
                            )}

                            {s.attendanceStatus !== "no_show" && (
                              <button
                                onClick={() => handleAttendanceChange(s, "no_show")}
                                disabled={updatingId === s.id}
                                className="rounded-xl border border-wine/30 px-2 py-1 text-[11px] text-wine hover:bg-wine/10 transition disabled:opacity-50"
                                title="Segna come assente"
                              >
                                Assente
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "venue" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-xs">
            <h2 className="font-serif text-2xl text-forest">Scheda Teatro Convenzionato</h2>
            <p className="mt-2 text-xs leading-5 text-olive">
              {data.theaterVenue.longDescription || data.theaterVenue.description}
            </p>

            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-forest">
                Servizi inclusi per gli ospiti RADICI:
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.theaterVenue.services?.map((srv, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-sand/50 px-3 py-1 text-xs text-forest"
                  >
                    ✓ {srv}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-xs text-center flex flex-col items-center justify-center">
            <h2 className="font-serif text-2xl text-forest">QR Botteghino</h2>
            <p className="mt-1 text-xs text-olive max-w-sm">
              Codice rapido da inquadrare per la verifica dello spettatore e il check-in immediato all&apos;ingresso.
            </p>
            <img
              src={`/api/qr/${data.theaterVenue.checkinCode}`}
              alt={`QR ${data.theaterVenue.name}`}
              className="mt-4 w-44 rounded-2xl border border-gold/40 shadow-xs"
            />
            <p className="mt-3 font-mono text-xs text-forest">
              Codice: {data.theaterVenue.checkinCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
