"use client";

import { useState } from "react";
import { Sparkles, Ticket, ShieldCheck, HeartHandshake, Users } from "lucide-react";
import type { PromoterDashboardData } from "@/lib/promoters";
import { formatDateTime, grantStatusLabel } from "@/lib/utils";

export function PromotersDashboardView({ data }: { data: PromoterDashboardData }) {
  const [activeTab, setActiveTab] = useState<"overview" | "grants" | "theaters">("overview");
  const p = data.pipeline;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-forest p-6 text-cream shadow-sm md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          <Sparkles size={14} /> Circuito Promotori RADICI
        </div>
        <h1 className="mt-3 font-serif text-3xl md:text-5xl">Matching Grant culturale · capienza posti</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/80">
          Nessun fondo contabile e nessun esborso se il beneficiario non si presenta. Si gestiscono i posti
          degli eventi, le conferme T-7/T-3 e le presenze in teatro.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-cream/15 pt-6 lg:grid-cols-4">
          <Stat label="Pernottamenti selezionati" value={String(p.overnightSelected)} hint="Eleggibili al grant" />
          <Stat label="Grant ancora da scegliere" value={String(p.overnightWithoutGrant)} hint="Secondo passo in attesa" />
          <Stat label="Posti impegnati" value={String(p.seatsHeld)} hint="assigned + confermati + presenti" />
          <Stat label="Presenti / no-show" value={`${p.attended} / ${p.noShow}`} hint="Solo statistica, nessun esborso" />
        </div>
      </section>

      <div className="flex border-b border-mist">
        {(
          [
            ["overview", "Pipeline"],
            ["grants", `Registro (${data.grants.length})`],
            ["theaters", `Eventi e capienza (${data.eventsCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm ${activeTab === id ? "border-b-2 border-forest font-semibold text-forest" : "text-olive"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <div className="flex items-center gap-2 text-forest">
              <ShieldCheck size={20} />
              <h2 className="font-serif text-2xl">Stati del grant</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-forest">
              <li>Assegnati: {p.assigned}</li>
              <li>Email T-7 inviata (stub): {p.confirmationSent}</li>
              <li>Confermati: {p.confirmed}</li>
              <li>Rinunce: {p.declined} · scaduti T-3: {p.expired}</li>
              <li>Presenti: {p.attended} · assenti: {p.noShow}</li>
            </ul>
          </section>
          <section className="rounded-[28px] border border-forest/10 bg-white p-6">
            <div className="flex items-center gap-2 text-forest">
              <HeartHandshake size={20} className="text-terracotta" />
              <h2 className="font-serif text-2xl">Regole</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/80">
              Il grant (25 € + 25 €, non cumulabile su una persona) spetta solo a chi ha selezionato il
              pernottamento. Si prenota in un secondo passo. Senza conferma entro T-3 i posti si liberano.
            </p>
            <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
              <Users size={16} className="inline text-terracotta" /> Referente: {data.promoterUser.firstName} {data.promoterUser.lastName}
            </div>
          </section>
        </div>
      )}

      {activeTab === "grants" && (
        <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-olive">
              <tr>
                <th className="py-3">Dipendente</th>
                <th className="py-3">Impresa</th>
                <th className="py-3">Soggiorno</th>
                <th className="py-3">Evento</th>
                <th className="py-3">Stato</th>
                <th className="py-3">Posti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {data.grants.map((grant) => (
                <tr key={grant.grantId}>
                  <td className="py-3">
                    {grant.employeeName}
                    <span className="block text-[11px] text-olive">{grant.employeeEmail}</span>
                  </td>
                  <td>{grant.companyName}</td>
                  <td>
                    {grant.venueName}
                    <span className="block text-[11px] text-olive">{grant.assignedAt ? formatDateTime(grant.assignedAt) : "—"}</span>
                  </td>
                  <td>
                    {grant.eventTitle}
                    <span className="block text-[11px] text-olive">{grant.theaterName}</span>
                  </td>
                  <td>{grantStatusLabel(grant.status)}</td>
                  <td>{grant.seatsRequested}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "theaters" && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-mist bg-cream/30 p-5">
              <p className="text-xs uppercase text-olive">{event.city} · {event.category}</p>
              <h3 className="font-serif text-2xl text-forest">{event.title}</h3>
              <p className="text-sm text-olive">{event.venueName}</p>
              <p className="mt-2 text-xs">{formatDateTime(event.startsAt)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-forest/10 pt-3 text-sm">
                <span>Capienza {event.capacity}</span>
                <strong>
                  {event.seatsOccupied} occupati · {event.seatsFree} liberi
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-cream/70">{label}</p>
      <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">{value}</p>
      <span className="mt-1 block text-[11px] text-cream/60">{hint}</span>
    </div>
  );
}
