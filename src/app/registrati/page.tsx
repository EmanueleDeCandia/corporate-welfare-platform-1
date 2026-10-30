import { RegisterForm } from "@/components/register-form";
import { PublicShell } from "@/components/public-shell";
import { getCompanies, getDestinations, getInviteByCode } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; role?: string }>;
}) {
  const { invite, role } = await searchParams;
  const [record, companiesList, destinationsList] = await Promise.all([
    invite ? getInviteByCode(invite) : null,
    getCompanies(),
    getDestinations(),
  ]);

  return (
    <PublicShell>
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <section className="rounded-[32px] bg-white p-6 shadow-sm border border-forest/5 md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gold font-semibold">
            Onboarding Circuito RADICI
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl text-forest">
            Crea il tuo profilo
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Scegli il tuo ruolo per attivare i servizi dedicati: convenzionamento agriturismi e strutture, welfare aziendale per le imprese, o accesso dipendenti e community.
          </p>
          <div className="mt-6">
            <RegisterForm
              initialRole={role}
              inviteCode={record?.code}
              firstName={record?.firstName}
              lastName={record?.lastName}
              email={record?.email}
              companies={companiesList.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
              destinations={destinationsList.map((d) => ({ id: d.id, name: d.name, region: d.region }))}
            />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
