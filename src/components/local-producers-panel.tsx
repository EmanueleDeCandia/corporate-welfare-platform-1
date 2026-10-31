"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Leaf, Plus, Truck } from "lucide-react";
import { apiFetch } from "@/lib/session-client";
import type { PromoterLocalProducerRow } from "@/lib/promoters";
import { formatEuro } from "@/lib/utils";

export function LocalProducersPanel({
  producers,
  destinations,
}: {
  producers: PromoterLocalProducerRow[];
  destinations: Array<{ id: number; name: string; region: string }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    city: "",
    destinationId: destinations[0] ? String(destinations[0].id) : "",
    productName: "Cesto della Filiera Corta",
    priceEuros: "40",
    kmAvoided: "50",
    discountPercent: "10",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totals = producers.reduce(
    (acc, row) => ({
      baskets: acc.baskets + row.basketsSold,
      volumeCents: acc.volumeCents + row.volumeCents,
      km: acc.km + row.kmAvoidedTotal,
      co2: acc.co2 + row.co2AvoidedKg,
    }),
    { baskets: 0, volumeCents: 0, km: 0, co2: 0 },
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await apiFetch("/api/promoters/local-producers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          destinationId: Number(form.destinationId),
          productName: form.productName,
          priceCents: Math.round(Number(form.priceEuros || "40") * 100),
          kmAvoided: Number(form.kmAvoided || "50"),
          discountBps: Math.round(Number(form.discountPercent || "10") * 100),
        }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? "Creazione non riuscita.");
        setPending(false);
        return;
      }
      setMessage(data.message ?? "Produttore locale KM 0 aggiunto.");
      setForm((current) => ({ ...current, name: "", city: "" }));
      router.refresh();
    } catch {
      setError("Connessione non riuscita. Riprova.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-forest p-6 text-cream md:p-8">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
          <Leaf size={14} /> Filiera Corta KM 0 · initiative &ldquo;Welfare &amp; KM 0&rdquo; — Gruppo Illiria e Startup RADICI
        </p>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl">Produttori Locali: flotta Illiria, CO2 abbattuta</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/80">
          Il Gruppo Illiria mette a disposizione la sua flotta: i prodotti freschi dei produttori locali arrivano
          direttamente nelle imprese CSR. Ogni cesto venduto registra km evitati e CO2 risparmiata (0,300 kg × km).
          Lo sconto initiative (default 10%) si applica a dipendenti, amici invitati e nuovi iscritti.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-serif text-3xl text-gold">{totals.baskets}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">cestini venduti</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-serif text-3xl text-gold">{formatEuro(totals.volumeCents)}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">volume vendite</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-serif text-3xl text-gold">{totals.km} km</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">percorso evitato</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-serif text-3xl text-gold">{totals.co2.toFixed(1)} kg</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">CO2 evitata</p>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-[28px] border border-forest/10 bg-white p-6">
        <div className="flex items-center gap-2 text-forest">
          <Truck size={20} />
          <h2 className="font-serif text-2xl">Produttori Locali KM 0</h2>
        </div>
        <table className="mt-4 w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase text-olive">
            <tr>
              <th className="py-3">Produttore</th>
              <th className="py-3">Sede</th>
              <th className="py-3">Sconto initiative</th>
              <th className="py-3">Cestini</th>
              <th className="py-3">Volume</th>
              <th className="py-3">Km evitati</th>
              <th className="py-3">CO2 evitata</th>
              <th className="py-3">Prodotti</th>
            </tr>
          </thead>
          <tbody>
            {producers.map((row) => (
              <tr key={row.producerId} className="border-t border-mist">
                <td className="py-3 font-medium text-forest">{row.name}</td>
                <td className="py-3 text-xs text-olive">
                  {row.city} · {row.region}
                </td>
                <td className="py-3 text-terracotta">-{row.discountBps / 100}%</td>
                <td className="py-3">{row.basketsSold}</td>
                <td className="py-3">{formatEuro(row.volumeCents)}</td>
                <td className="py-3">{row.kmAvoidedTotal} km</td>
                <td className="py-3 font-medium text-forest">{row.co2AvoidedKg.toFixed(1)} kg</td>
                <td className="py-3">{row.productsCount}</td>
              </tr>
            ))}
            {producers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-olive">
                  Nessun produttore locale ancora: aggiungine uno qui sotto.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="rounded-[28px] border border-gold/40 bg-gold/5 p-6">
        <div className="flex items-center gap-2 text-forest">
          <Plus size={20} />
          <h2 className="font-serif text-2xl">Aggiungi un Produttore Locale KM 0</h2>
        </div>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-sm md:col-span-2">
            Nome del produttore / azienda agricola
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
              placeholder="es. Orto di San Marcello"
            />
          </label>
          <label className="block text-sm">
            Città
            <input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
            />
          </label>
          <label className="block text-sm">
            Destinazione
            <select
              value={form.destinationId}
              onChange={(event) => setForm((current) => ({ ...current, destinationId: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
            >
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name} · {destination.region}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Primo cesto (nome)
            <input
              value={form.productName}
              onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="block text-sm">
            Prezzo cesto (€ · 30–60)
            <input
              type="number"
              min={30}
              max={60}
              value={form.priceEuros}
              onChange={(event) => setForm((current) => ({ ...current, priceEuros: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="block text-sm">
            Km evitati per cesto (30–70)
            <input
              type="number"
              min={30}
              max={70}
              value={form.kmAvoided}
              onChange={(event) => setForm((current) => ({ ...current, kmAvoided: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="block text-sm">
            Sconto initiative Welfare &amp; KM 0 (%)
            <input
              type="number"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-white px-4 py-3 outline-none"
              required
            />
          </label>
          <p className="text-xs leading-5 text-olive md:col-span-2">
            Ogni cesto venduto evita {form.kmAvoided || 50} km = {(0.3 * Number(form.kmAvoided || 50)).toFixed(1)} kg di
            CO2 (0,300 kg × km). Consegna in azienda con la flotta del Gruppo Illiria.
          </p>
          {error ? <p className="text-sm text-wine md:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm text-forest md:col-span-2">{message}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream disabled:opacity-60 md:col-span-2 md:w-auto"
          >
            {pending ? "Aggiunta in corso…" : "Aggiungi Produttore Locale KM 0"}
          </button>
        </form>
      </section>
    </div>
  );
}
