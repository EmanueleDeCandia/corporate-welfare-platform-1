"use client";

import { FormEvent, useState } from "react";
import { persistClientSession } from "@/lib/session-client";

export function RegisterForm({
  inviteCode,
  firstName = "",
  lastName = "",
  email = "",
}: {
  inviteCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const [form, setForm] = useState({
    firstName,
    lastName,
    email,
    password: "radici2026",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, inviteCode }),
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(data.error ?? "Registrazione non riuscita.");
        setPending(false);
        return;
      }
      const dest = data.redirectTo || "/account";
      try {
        const sid = new URL(dest, window.location.origin).searchParams.get("sid");
        if (sid) persistClientSession(sid);
      } catch {
        /* ignore */
      }
      window.location.assign(dest);
    } catch {
      setError("Connessione non riuscita. Riprova.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Nome
          <input
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
            required
          />
        </label>
        <label className="block text-sm">
          Cognome
          <input
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
            required
          />
        </label>
      </div>
      <label className="block text-sm">
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
          required
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
          required
        />
      </label>
      {inviteCode ? (
        <p className="rounded-2xl bg-forest/5 px-4 py-3 text-sm text-forest">
          Invito collegato: <strong>{inviteCode}</strong>. Nascerà un account amico/consumer, senza
          voucher aziendali ma con micro-sconto nei locali del circuito.
        </p>
      ) : (
        <p className="text-sm text-olive">
          La registrazione pubblica crea un account amico. I voucher welfare restano riservati ai
          dipendenti delle imprese clienti.
        </p>
      )}
      {error ? <p className="text-sm text-wine">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-terracotta py-3 text-sm font-medium text-cream"
      >
        {pending ? "Creazione account…" : "Crea account amico"}
      </button>
    </form>
  );
}
