import { RegisterForm } from "@/components/register-form";
import { PublicShell } from "@/components/public-shell";
import { initDb } from "@/db";
import { getInviteByCode } from "@/lib/data";
import { listRegisterCatalog } from "@/lib/register-account";
import { isRegisterableRole } from "@/lib/register-types";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; role?: string }>;
}) {
  const { invite, role } = await searchParams;
  const record = invite ? await getInviteByCode(invite) : null;
  await initDb();
  const catalog = listRegisterCatalog();
  const initialRole = !record && role && isRegisterableRole(role) ? role : "friend";

  return (
    <PublicShell>
      <main className="mx-auto max-w-xl px-4 py-12 md:px-6">
        <section className="rounded-[32px] bg-white p-6 md:p-8">
          {record ? (
            <>
              <p className="text-xs uppercase tracking-[0.18em] text-olive">Account amico / consumer</p>
              <h1 className="mt-2 font-serif text-4xl text-forest">Entra nel circuito pay-local</h1>
              <p className="mt-3 text-sm leading-6 text-ink/75">
                Niente voucher aziendali: paghi i servizi locali con la tua carta e ottieni un
                micro-sconto. Chi ti ha invitato riceve Punti Impatto.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.18em] text-olive">Nuovo account RADICI</p>
              <h1 className="mt-2 font-serif text-4xl text-forest">Crea il tuo profilo</h1>
              <p className="mt-3 text-sm leading-6 text-ink/75">
                Scegli il ruolo: nasce un utente distinto nel database, con le funzioni già previste
                per dipendente, amico, CSR, fornitore o promotore.
              </p>
            </>
          )}
          <div className="mt-6">
            <RegisterForm
              inviteCode={record?.code}
              firstName={record?.firstName}
              lastName={record?.lastName}
              email={record?.email}
              initialRole={initialRole}
              catalog={catalog}
            />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
