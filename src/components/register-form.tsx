"use client";

import { FormEvent, useMemo, useState } from "react";
import { persistClientSession } from "@/lib/session-client";
import type { RegisterableRole } from "@/lib/register-types";

const ROLES: Array<{ id: RegisterableRole; title: string; hint: string }> = [
  {
    id: "friend",
    title: "Amico / consumer",
    hint: "Paghi in locale con micro-sconto. Niente voucher aziendali.",
  },
  {
    id: "employee",
    title: "Dipendente",
    hint: "Portafoglio welfare: 1 pernottamento e 1 cena sul piano dell'impresa.",
  },
  {
    id: "csr",
    title: "CSR / impresa",
    hint: "Dashboard aziendale, dipendenti, extra e Matching Grant.",
  },
  {
    id: "provider",
    title: "Fornitore",
    hint: "Pannello struttura: presenze, fatture, saldo pending/settled.",
  },
  {
    id: "promoter",
    title: "Promotore RADICI",
    hint: "Control Room della startup: matching, fee, imprese e strutture.",
  },
];

type Catalog = {
  companies: Array<{ id: number; name: string; city: string }>;
  destinations: Array<{ id: number; name: string; region: string }>;
  venues: Array<{ id: number; name: string; city: string; type: string }>;
};

export function RegisterForm({
  inviteCode,
  firstName = "",
  lastName = "",
  email = "",
  initialRole = "friend",
  catalog,
}: {
  inviteCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  initialRole?: RegisterableRole;
  catalog: Catalog;
}) {
  const lockedFriend = Boolean(inviteCode);
  const [role, setRole] = useState<RegisterableRole>(lockedFriend ? "friend" : initialRole);
  const [form, setForm] = useState({
    firstName,
    lastName,
    email,
    password: "radici2026",
    companyId: "",
    companyName: "",
    vatNumber: "",
    city: "",
    venueId: "",
    venueName: "",
    venueType: "agriturismo",
    destinationId: catalog.destinations[0] ? String(catalog.destinations[0].id) : "",
    companyMode: "new" as "new" | "existing",
    venueMode: (catalog.venues.length ? "existing" : "new") as "new" | "existing",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedRole = lockedFriend ? "friend" : role;
  const submitLabel = useMemo(() => {
    if (pending) return "Creazione account…";
    if (selectedRole === "employee") return "Crea account dipendente";
    if (selectedRole === "csr") return "Crea account CSR";
    if (selectedRole === "provider") return "Crea account fornitore";
    if (selectedRole === "promoter") return "Crea account promotore";
    return "Crea account amico";
  }, [pending, selectedRole]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: selectedRole,
        inviteCode,
      };
      if (selectedRole === "employee") {
        payload.companyId = Number(form.companyId);
      }
      if (selectedRole === "csr") {
        if (form.companyMode === "existing") payload.companyId = Number(form.companyId);
        else {
          payload.companyName = form.companyName;
          payload.vatNumber = form.vatNumber;
          payload.city = form.city;
        }
      }
      if (selectedRole === "provider") {
        if (form.venueMode === "existing") payload.venueId = Number(form.venueId);
        else {
          payload.venueName = form.venueName;
          payload.venueType = form.venueType;
          payload.destinationId = Number(form.destinationId);
          payload.city = form.city;
        }
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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
      {lockedFriend ? (
        <p className="rounded-2xl bg-forest/5 px-4 py-3 text-sm text-forest">
          Invito collegato: <strong>{inviteCode}</strong>. Nasce un account amico/consumer, senza
          voucher aziendali ma con micro-sconto nei locali del circuito.
        </p>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium text-forest">Che profilo vuoi creare?</legend>
          <div className="mt-3 grid gap-2">
            {ROLES.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 ${
                  selectedRole === item.id ? "border-gold bg-gold/10" : "border-forest/10 bg-cream"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.id}
                  checked={selectedRole === item.id}
                  onChange={() => setRole(item.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-forest">{item.title}</span>
                  <span className="text-xs text-olive">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

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
          minLength={6}
        />
      </label>

      {selectedRole === "employee" ? (
        <label className="block text-sm">
          Impresa di appartenenza
          <select
            value={form.companyId}
            onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
            required
          >
            <option value="">Seleziona impresa</option>
            {catalog.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} · {company.city}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedRole === "csr" ? (
        <div className="space-y-3 rounded-2xl border border-forest/10 p-4">
          <p className="text-sm font-medium text-forest">Impresa CSR</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.companyMode === "new"}
                onChange={() => setForm((current) => ({ ...current, companyMode: "new" }))}
              />
              Nuova impresa
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.companyMode === "existing"}
                onChange={() => setForm((current) => ({ ...current, companyMode: "existing" }))}
              />
              Impresa già in circuito
            </label>
          </div>
          {form.companyMode === "existing" ? (
            <label className="block text-sm">
              Impresa
              <select
                value={form.companyId}
                onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                required
              >
                <option value="">Seleziona impresa</option>
                {catalog.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} · {company.city}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3">
              <label className="block text-sm">
                Ragione sociale
                <input
                  value={form.companyName}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  P.IVA
                  <input
                    value={form.vatNumber}
                    onChange={(event) => setForm((current) => ({ ...current, vatNumber: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="block text-sm">
                  Città
                  <input
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                    required
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {selectedRole === "provider" ? (
        <div className="space-y-3 rounded-2xl border border-forest/10 p-4">
          <p className="text-sm font-medium text-forest">Struttura</p>
          {catalog.venues.length ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.venueMode === "existing"}
                  onChange={() => setForm((current) => ({ ...current, venueMode: "existing" }))}
                />
                Struttura libera
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.venueMode === "new"}
                  onChange={() => setForm((current) => ({ ...current, venueMode: "new" }))}
                />
                Nuova struttura
              </label>
            </div>
          ) : (
            <p className="text-xs text-olive">Nessuna struttura libera: crea la tua nel circuito.</p>
          )}
          {form.venueMode === "existing" && catalog.venues.length ? (
            <label className="block text-sm">
              Struttura
              <select
                value={form.venueId}
                onChange={(event) => setForm((current) => ({ ...current, venueId: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                required
              >
                <option value="">Seleziona struttura</option>
                {catalog.venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} · {venue.city}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3">
              <label className="block text-sm">
                Nome struttura
                <input
                  value={form.venueName}
                  onChange={(event) => setForm((current) => ({ ...current, venueName: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  Tipo
                  <select
                    value={form.venueType}
                    onChange={(event) => setForm((current) => ({ ...current, venueType: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                  >
                    <option value="agriturismo">Agriturismo</option>
                    <option value="hotel">Hotel</option>
                    <option value="restaurant">Ristorante</option>
                  </select>
                </label>
                <label className="block text-sm">
                  Destinazione
                  <select
                    value={form.destinationId}
                    onChange={(event) => setForm((current) => ({ ...current, destinationId: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                    required
                  >
                    {catalog.destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name} · {destination.region}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                Città
                <input
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none"
                />
              </label>
            </div>
          )}
        </div>
      ) : null}

      {error ? <p className="text-sm text-wine">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-terracotta py-3 text-sm font-medium text-cream disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
