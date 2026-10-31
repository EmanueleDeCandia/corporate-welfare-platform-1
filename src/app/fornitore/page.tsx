import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ProviderPanel } from "@/components/provider-panel";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser, getSessionToken, pathWithSession } from "@/lib/auth";
import {
  getProviderGrants,
  getProviderNotifications,
  getProviderSelections,
  getProviderTransactions,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProviderPage() {
  const user = await getCurrentUser();
  const token = await getSessionToken();
  if (!user) redirect("/login?next=/fornitore");
  if (user.role !== "provider" || !user.venue) redirect(pathWithSession("/account", token));

  const [items, rows, selections, grants] = await Promise.all([
    getProviderNotifications(user.venue.id),
    getProviderTransactions(user.venue.id),
    getProviderSelections(user.venue.id),
    getProviderGrants(user.venue.id),
  ]);

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-6 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm" />
        </div>
        <ProviderPanel
          venue={user.venue}
          notifications={items}
          transactions={rows}
          selections={selections}
          grants={grants}
        />
        <section className="mt-6 rounded-[28px] bg-white p-6">
          <h2 className="font-serif text-2xl text-forest">QR della struttura</h2>
          <p className="mt-2 text-sm text-olive">
            Da esporre in reception. Gli amici lo inquadrano per registrarsi e pagare. I dipendenti mostrano il QR del proprio voucher.
          </p>
          <img
            src={`/api/qr/${user.venue.checkinCode}`}
            alt={`QR ${user.venue.name}`}
            className="mt-4 w-48 rounded-3xl border border-gold/30"
          />
        </section>
      </main>
    </PublicShell>
  );
}
