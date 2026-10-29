"use client";

import { useSearchParams } from "next/navigation";
import { useRef } from "react";

const DEMO_PASSWORD = "radici2026";

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
    hint: "Startup RADICI & Promotori · Matching Grant",
  },
];

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const error = params.get("error") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function enterAs(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} method="post" action="/api/auth/login" className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="block text-sm">
          Email
          <input
            ref={emailRef}
            type="email"
            name="email"
            defaultValue="mario.rossi@acme.it"
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none focus:border-gold"
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            ref={passwordRef}
            type="password"
            name="password"
            defaultValue={DEMO_PASSWORD}
            className="mt-1 w-full rounded-2xl border border-forest/10 bg-cream px-4 py-3 outline-none focus:border-gold"
            required
          />
        </label>
        {error ? <p className="text-sm text-wine">{error}</p> : null}
        <button type="submit" className="w-full rounded-2xl bg-forest py-3 text-sm font-medium text-cream">
          Entra nel tuo spazio
        </button>
      </form>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-olive">Accessi demo · password radici2026</p>
        <p className="mt-1 text-xs text-olive">Un clic entra direttamente nell&apos;account.</p>
        <div className="mt-3 grid gap-2">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => enterAs(demo.email)}
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
