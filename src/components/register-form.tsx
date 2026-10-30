"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Building, Store, User, Users } from "lucide-react";

type RoleOption = "provider" | "csr" | "employee" | "friend";

type Props = {
  initialRole?: string;
  inviteCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  companies: Array<{ id: number; name: string; slug: string }>;
  destinations: Array<{ id: number; name: string; region: string }>;
};

export function RegisterForm({
  initialRole,
  inviteCode,
  firstName = "",
  lastName = "",
  email = "",
  companies,
  destinations,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption>(
    initialRole === "provider" || initialRole === "csr" || initialRole === "employee"
      ? initialRole
      : inviteCode
        ? "friend"
        : "provider"
  );

  const [form, setForm] = useState({
    firstName,
    lastName,
    email,
    password: "radici2026",
    // Campi Fornitore
    venueName: "",
    venueType: "agriturismo" as "agriturismo" | "hotel" | "restaurant" | "theater",
    venueCity: "",
    venueProvince: "MC",
    venueRegion: "Marche",
    destinationId: destinations[0]?.id || 1,
    // Campi Impresa CSR
    companyName: "",
    companyVat: "",
    companyCity: "",
    companySector: "Manifattura & Design",
    companyEmployeesCount: "100",
    companyFundedAmountEuro: "7500",
    companyAddress: "",
    companySdi: "",
    // Campi Dipendente
    companyId: companies[0]?.id || 1,
  });

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const payload = {
      role,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      inviteCode,
      ...(role === "provider" && {
        venueName: form.venueName,
        venueType: form.venueType,
        venueCity: form.venueCity,
        venueProvince: form.venueProvince,
        venueRegion: form.venueRegion,
        destinationId: Number(form.destinationId),
      }),
      ...(role === "csr" && {
        companyName: form.companyName,
        companyVat: form.companyVat,
        companyCity: form.companyCity,
        companySector: form.companySector,
        companyEmployeesCount: form.companyEmployeesCount,
        companyFundedAmountEuro: form.companyFundedAmountEuro,
        companyAddress: form.companyAddress,
        companySdi: form.companySdi,
      }),
      ...(role === "employee" && {
        companyId: Number(form.companyId),
      }),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; redirectTo?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Registrazione non riuscita.");
      return;
    }

    router.push(data.redirectTo || "/account");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Selettore Ruolo */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-olive font-semibold mb-2">
          Seleziona il profilo di registrazione
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setRole("provider")}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
              role === "provider"
                ? "border-forest bg-forest text-cream font-medium"
                : "border-forest/10 bg-cream/40 text-forest hover:border-gold"
            }`}
          >
            <Store size={18} />
            <span className="text-xs">Fornitore / Struttura</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("csr")}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
              role === "csr"
                ? "border-forest bg-forest text-cream font-medium"
                : "border-forest/10 bg-cream/40 text-forest hover:border-gold"
            }`}
          >
            <Building size={18} />
            <span className="text-xs">Impresa CSR</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("employee")}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
              role === "employee"
                ? "border-forest bg-forest text-cream font-medium"
                : "border-forest/10 bg-cream/40 text-forest hover:border-gold"
            }`}
          >
            <User size={18} />
            <span className="text-xs">Dipendente Welfare</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("friend")}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
              role === "friend"
                ? "border-forest bg-forest text-cream font-medium"
                : "border-forest/10 bg-cream/40 text-forest hover:border-gold"
            }`}
          >
            <Users size={18} />
            <span className="text-xs">Amico Community</span>
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Dati Anagrafici Utente */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Nome Referente
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-gold"
              required
            />
          </label>
          <label className="block text-sm">
            Cognome
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-gold"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={role === "employee" ? "mario@acme.it" : "info@struttura.it"}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-gold"
              required
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-gold"
              required
            />
          </label>
        </div>

        {/* 1. SEZIONE SPECIFICA FORNITORE */}
        {role === "provider" && (
          <div className="rounded-2xl border border-gold/40 bg-sand/15 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              Dati della Struttura Convenzionata
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Nome Struttura
                <input
                  type="text"
                  value={form.venueName}
                  onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                  placeholder="es. Agriturismo Colle Fiorito"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="block text-sm">
                Tipologia Attività
                <select
                  value={form.venueType}
                  onChange={(e) => setForm({ ...form, venueType: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="agriturismo">Agriturismo (Alloggio & Cene KM 0)</option>
                  <option value="hotel">Hotel / Dimora Storica</option>
                  <option value="restaurant">Ristorante / Osteria Tipica</option>
                  <option value="theater">Teatro Storico / Operatore Culturale</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-1 block text-sm">
                Comune
                <input
                  type="text"
                  value={form.venueCity}
                  onChange={(e) => setForm({ ...form, venueCity: e.target.value })}
                  placeholder="es. Macerata"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="col-span-1 block text-sm">
                Provincia
                <input
                  type="text"
                  maxLength={2}
                  value={form.venueProvince}
                  onChange={(e) => setForm({ ...form, venueProvince: e.target.value.toUpperCase() })}
                  placeholder="MC"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="col-span-1 block text-sm">
                Regione
                <select
                  value={form.venueRegion}
                  onChange={(e) => setForm({ ...form, venueRegion: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="Marche">Marche</option>
                  <option value="Piemonte">Piemonte</option>
                  <option value="Toscana">Toscana</option>
                  <option value="Puglia">Puglia</option>
                </select>
              </label>
            </div>
            <p className="text-[11px] text-forest/75 leading-relaxed">
              Al termine della registrazione riceverai subito il tuo <strong>Codice QR per la reception</strong> e la <strong>Distinta di Fatturazione</strong> per riscuotere i voucher welfare dalle imprese clienti.
            </p>
          </div>
        )}

        {/* 2. SEZIONE SPECIFICA IMPRESA CSR */}
        {role === "csr" && (
          <div className="rounded-2xl border border-forest/20 bg-cream/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              Dati Impresa Cliente (Sponsor Welfare)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Ragione Sociale
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="es. Nuova Meccanica S.p.A."
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="block text-sm">
                Partita IVA
                <input
                  type="text"
                  value={form.companyVat}
                  onChange={(e) => setForm({ ...form, companyVat: e.target.value })}
                  placeholder="es. 01234567890"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Sede / Città
                <input
                  type="text"
                  value={form.companyCity}
                  onChange={(e) => setForm({ ...form, companyCity: e.target.value })}
                  placeholder="es. Ancona"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="block text-sm">
                Settore di Attività
                <input
                  type="text"
                  value={form.companySector}
                  onChange={(e) => setForm({ ...form, companySector: e.target.value })}
                  placeholder="es. Manifattura e Meccatronica"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Numero Dipendenti / Addetti
                <input
                  type="number"
                  min="1"
                  value={form.companyEmployeesCount}
                  onChange={(e) => {
                    const cnt = e.target.value;
                    const defaultBudget = (Number(cnt) || 0) * 75; // 75€ a dipendente (50€ notte + 25€ cena)
                    setForm({
                      ...form,
                      companyEmployeesCount: cnt,
                      companyFundedAmountEuro: String(defaultBudget),
                    });
                  }}
                  placeholder="es. 100"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none font-semibold text-forest"
                  required
                />
              </label>
              <label className="block text-sm">
                Plafond Welfare Finanziato (€)
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={form.companyFundedAmountEuro}
                  onChange={(e) => setForm({ ...form, companyFundedAmountEuro: e.target.value })}
                  placeholder="es. 7500"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none font-semibold text-forest"
                  required
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Indirizzo Sede Legale (opzionale)
                <input
                  type="text"
                  value={form.companyAddress}
                  onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                  placeholder="es. Via dell'Industria 12"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="block text-sm">
                Codice Destinatario SDI / PEC Fatture
                <input
                  type="text"
                  value={form.companySdi}
                  onChange={(e) => setForm({ ...form, companySdi: e.target.value })}
                  placeholder="es. M5UXCR1 oppure fatture@pec.it"
                  className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>
            <p className="text-[11px] text-olive leading-relaxed">
              Verrà creato il tuo <strong>Piano Welfare Territoriale 2026</strong> deducibile ex Art. 51 TUIR con cruscotto ESG per monitorare i dipendenti.
            </p>
          </div>
        )}

        {/* 3. SEZIONE SPECIFICA DIPENDENTE WELFARE */}
        {role === "employee" && (
          <div className="rounded-2xl border border-forest/20 bg-cream/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              Azienda Datrice di Lavoro (Convenzione Welfare)
            </p>
            <label className="block text-sm">
              Seleziona la tua Azienda
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-forest/10 bg-white px-3 py-2 text-sm outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-olive leading-relaxed">
              Il sistema ti riconoscerà come lavoratore di questa azienda e assegnerà istantaneamente al tuo portafoglio i <strong>2 Voucher Welfare</strong> (Pernottamento da 50€ e Cena KM 0 da 25€).
            </p>
          </div>
        )}

        {/* 4. SEZIONE SPECIFICA AMICO COMMUNITY */}
        {role === "friend" && (
          <div className="rounded-2xl border border-forest/10 bg-sand/15 p-4 text-xs text-olive space-y-1">
            <p className="font-semibold text-forest">Programma Community Radici</p>
            <p>
              Nessun voucher welfare aziendale: acquisti nei locali del circuito con lo <strong>sconto community del 10%</strong>.
              {inviteCode ? ` Codice invito collegato: ${inviteCode}.` : ""}
            </p>
          </div>
        )}

        {error ? <p className="text-sm text-wine">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-forest py-3 text-sm font-medium text-cream disabled:opacity-60 hover:bg-forest/90 transition"
        >
          {pending
            ? "Creazione profilo in corso…"
            : role === "provider"
              ? "Registra Struttura & Accedi al Cruscotto Fornitore"
              : role === "csr"
                ? "Registra Azienda & Attiva Welfare CSR"
                : role === "employee"
                  ? "Attiva Portafoglio Dipendente & Ricevi Voucher"
                  : "Registrati come Membro Community"}
        </button>
      </form>
    </div>
  );
}
