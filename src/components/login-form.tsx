"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type DemoUser = {
  email: string;
  label: string;
  category: "Startup Promotrice" | "Impresa CSR" | "Fornitore Locale" | "Dipendente Welfare" | "Amico Community";
  hint: string;
};

const demos: DemoUser[] = [
  // 1. Promotori / Platform Admin
  {
    email: "chiara.promotori@radici.it",
    label: "Chiara Valenti",
    category: "Startup Promotrice",
    hint: "Startup RADICI · Regia totale piattaforma & Matching Grant",
  },
  // 2. Aziende CSR
  {
    email: "elena.martini@acme.it",
    label: "Elena Martini",
    category: "Impresa CSR",
    hint: "CSR Manager · ACME S.p.A. (Contratto welfare 2026)",
  },
  {
    email: "alberto.bianchi@verdeenergia.it",
    label: "Alberto Bianchi",
    category: "Impresa CSR",
    hint: "CSR Manager · Verde Energia Italia (Verifica plafond)",
  },
  // 3. Fornitori
  {
    email: "elena@lavalle.it",
    label: "Elena Conti",
    category: "Fornitore Locale",
    hint: "Fornitore Agriturismo · La Valle (Fatturazione diretta B2B)",
  },
  {
    email: "matteo@osteriadeltiglio.it",
    label: "Matteo Sereni",
    category: "Fornitore Locale",
    hint: "Fornitore Ristorante KM 0 · Osteria del Tiglio (Recanati)",
  },
  {
    email: "paolo@teatrolauro.it",
    label: "Paolo Luzi",
    category: "Fornitore Locale",
    hint: "Fornitore Culturale · Teatro Storico Lauro Rossi",
  },
  // 4. Dipendenti Welfare
  {
    email: "mario.rossi@acme.it",
    label: "Mario Rossi",
    category: "Dipendente Welfare",
    hint: "Dipendente ACME · Pernottamento e Matching Grant attivi",
  },
  {
    email: "davide.ferri@bancaadriatica.it",
    label: "Davide Ferri",
    category: "Dipendente Welfare",
    hint: "Dipendente Banca Adriatica · 2 voucher disponibili da scegliere",
  },
  // 5. Amici Community
  {
    email: "luigi.bianchi@email.it",
    label: "Luigi Bianchi",
    category: "Amico Community",
    hint: "Membro Community · Invitato da Mario (Zero voucher, -10%)",
  },
  {
    email: "francesca.romani@email.it",
    label: "Francesca Romani",
    category: "Amico Community",
    hint: "Membro Community · Invitata da Giulia (Tariffe scontate)",
  },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("chiara.promotori@radici.it");
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
      body: JSON.stringify({ email, password }),
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
          className="w-full rounded-2xl bg-forest py-3 text-sm font-medium text-cream disabled:opacity-60 hover:bg-forest/90 transition"
        >
          {pending ? "Accesso in corso…" : "Entra nel tuo spazio"}
        </button>
      </form>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-olive font-semibold">
            Matrice Profili Demo · Password: radici2026
          </p>
          <span className="text-[10px] text-olive">Clicca per compilare</span>
        </div>
        <div className="mt-3 grid gap-2 max-h-[360px] overflow-y-auto pr-1">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => {
                setEmail(demo.email);
                setPassword("radici2026");
              }}
              className={`rounded-2xl border px-3.5 py-2.5 text-left transition hover:border-gold ${
                email === demo.email ? "border-gold bg-gold/5" : "border-forest/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-forest">{demo.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    demo.category === "Startup Promotrice"
                      ? "bg-gold/25 text-terracotta"
                      : demo.category === "Impresa CSR"
                        ? "bg-forest/15 text-forest"
                        : demo.category === "Fornitore Locale"
                          ? "bg-sage/30 text-forest"
                          : demo.category === "Dipendente Welfare"
                            ? "bg-cream text-forest border border-forest/10"
                            : "bg-mist text-olive"
                  }`}
                >
                  {demo.category}
                </span>
              </div>
              <span className="mt-0.5 block text-[11px] text-olive">{demo.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
