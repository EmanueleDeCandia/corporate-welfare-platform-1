import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
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
import { getLocalProducerByVenueId } from "@/lib/local-producers";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProviderPage() {
  const user = await getCurrentUser();
  const token = await getSessionToken();
  if (!user) redirect("/login?next=/fornitore");
  if (user.role !== "provider" || !user.venue) redirect(pathWithSession("/account", token));

  const [items, rows, selections, grants, producerRow] = await Promise.all([
    getProviderNotifications(user.venue.id),
    getProviderTransactions(user.venue.id),
    getProviderSelections(user.venue.id),
    getProviderGrants(user.venue.id),
    user.venue.type === "producer" ? getLocalProducerByVenueId(user.venue.id) : Promise.resolve(null),
  ]);

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-6 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm" />
        </div>
        {producerRow ? (
          <section className="mb-6 rounded-[28px] bg-forest p-6 text-cream md:p-8">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
              <Leaf size={14} /> Produttore Locale KM 0 · {producerRow.producer.initiative}
            </p>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl">{user.venue.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cream/80">
              I tuoi cestini arrivano nelle imprese CSR con la flotta del Gruppo Illiria. Ogni vendita registra km
              evitati e CO2 risparmiata; lo sconto initiative del {producerRow.producer.discountBps / 100}% si applica a
              dipendenti, amici invitati e nuovi iscritti.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.basketsSold}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">cestini venduti</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{formatEuro(producerRow.stats.volumeCents)}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">volume vendite</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.kmAvoidedTotal} km</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">percorso evitato</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-serif text-3xl text-gold">{producerRow.stats.co2AvoidedKg.toFixed(1)} kg</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cream/70">CO2 evitata</p>
              </div>
            </div>
            <Link
              href={`/strutture/${user.venue.slug}`}
              className="mt-5 inline-flex rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-forest"
            >
              Vedi la scheda pubblica del produttore
            </Link>
          </section>
        ) : null}
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
