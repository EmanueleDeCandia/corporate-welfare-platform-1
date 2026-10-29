import { PublicShell } from "@/components/public-shell";
import { GrantConfirmForm } from "@/components/grant-confirm-form";

export const dynamic = "force-dynamic";

export default async function GrantConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <PublicShell>
      <main className="mx-auto max-w-xl px-4 py-16">
        <section className="rounded-[32px] bg-white p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Matching Grant</p>
          <h1 className="mt-2 font-serif text-3xl text-forest">Conferma la presenza all&apos;evento</h1>
          <p className="mt-3 text-sm text-olive">
            La conferma deve arrivare almeno 3 giorni prima. Senza risposta i posti si liberano. Nessun esborso in caso di assenza.
          </p>
          <GrantConfirmForm token={token} />
        </section>
      </main>
    </PublicShell>
  );
}
