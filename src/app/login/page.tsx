import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { PublicShell } from "@/components/public-shell";

export default function LoginPage() {
  return (
    <PublicShell>
      <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:px-6">
        <div className="overflow-hidden rounded-[32px]">
          <img src="/images/ulivi.jpg" alt="Uliveto" className="h-full min-h-[420px] w-full object-cover" />
        </div>
        <section className="rounded-[32px] bg-white p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-olive">Spazio riservato</p>
          <h1 className="mt-2 font-serif text-4xl text-forest">Accedi al tuo account</h1>
          <p className="mt-3 text-sm leading-6 text-ink/75">
            Dipendenti, amici consumer e fornitori locali usano lo stesso ingresso. Il ruolo decide
            se vedi il portafoglio o le notifiche di fatturazione.
          </p>
          <div className="mt-6">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-sm text-olive">
            Non hai un account?{" "}
            <Link href="/registrati" className="text-terracotta">
              Registrati come dipendente, amico, CSR, fornitore o promotore
            </Link>
          </p>
        </section>
      </main>
    </PublicShell>
  );
}
