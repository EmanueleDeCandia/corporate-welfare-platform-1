"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { persistClientSession } from "@/lib/session-client";

const DEMO_PASSWORD = "radici2026";

const demos = [
  {
    email: "elena.martini@acme.it",
    label: "Elena Martini (CSR)",
    hint: "Manager CSR · dashboard impresa ACME",
  },
  {
    email: "mario.rossi@acme.it",
    label: "Mario Rossi (Dipendente)",
    hint: "Portafoglio welfare · pernottamento e cena",
  },
  {
    email: "luca.bianchi@acme.it",
    label: "Luca Bianchi (Dipendente)",
    hint: "Dipendente ACME · voucher cena già selezionato",
  },
  {
    email: "luigi.bianchi@email.it",
    label: "Luigi Bianchi (Amico)",
    hint: "Consumer / amico · pagamento locale e inviti",
  },
  {
    email: "elena@lavalle.it",
    label: "Elena Conti (Fornitore)",
    hint: "Agriturismo La Valle · presenze e fatture",
  },
  {
    email: "chiara.promotori@radici.it",
    label: "Chiara Valenti (Promotori)",
    hint: "Startup RADICI · Matching Grant",
  },
];

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const [email, setEmail] = useState("mario.rossi@acme.it");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState(params.get("error") ?? "");
  const [pending, setPending] = useState(false);

  async function loginWith(nextEmail: string, nextPassword: string) {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: nextEmail, password: nextPassword, next }),
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(data.error ?? "Accesso non riuscito.");
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await loginWith(email, password);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none focus:border-gold"
            required
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none focus:border-gold"
            required
          />
        </label>
        {error ? <p className="text-sm text-wine">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-forest py-3 text-sm font-medium text-cream disabled:opacity-60"
        >
          {pending ? "Accesso in corso…" : "Entra nel tuo spazio"}
        </button>
      </form>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Accessi demo · password radici2026</p>
        <p className="mt-1 text-xs text-olive">Un clic entra nell&apos;area giusta per il ruolo.</p>
        <div className="mt-3 grid gap-2">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              disabled={pending}
              onClick={() => loginWith(demo.email, DEMO_PASSWORD)}
              className="rounded-2xl border border-forest/10 px-4 py-3 text-left hover:border-gold disabled:opacity-60"
            >
              <span className="block text-sm font-medium text-forest">{demo.label}</span>
              <span className="text-xs text-olive">{demo.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
