"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

const demos = [
  {
    email: "elena.martini@acme.it",
    label: "Elena Martini (CSR)",
    hint: "Manager CSR · ACME S.p.A. (Rendicontazione)",
  },
  {
    email: "mario.rossi@acme.it",
    label: "Mario Rossi",
    hint: "Dipendente ACME · portafoglio e referral",
  },
  {
    email: "elena@lavalle.it",
    label: "Elena Conti",
    hint: "Fornitore · Agriturismo La Valle",
  },
  {
    email: "luigi.bianchi@email.it",
    label: "Luigi Bianchi",
    hint: "Amico / consumer · pagamento locale",
  },
  {
    email: "chiara.promotori@radici.it",
    label: "Chiara Valenti (Promotori)",
    hint: "Startup RADICI & Promotori · Fondo Matching Grant",
  },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("mario.rossi@acme.it");
  const [password, setPassword] = useState("radici2026");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next }),
    });
    const data = (await response.json()) as { error?: string; redirectTo?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Accesso non riuscito.");
      return;
    }
    router.push(next || data.redirectTo || "/account");
    router.refresh();
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
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
        <div className="mt-3 grid gap-2">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => {
                setEmail(demo.email);
                setPassword("radici2026");
              }}
              className="rounded-2xl border border-forest/10 px-4 py-3 text-left hover:border-gold"
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