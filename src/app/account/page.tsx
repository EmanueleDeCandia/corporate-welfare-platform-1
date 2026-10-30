import { redirect } from "next/navigation";
import { AccountHub } from "@/components/account-hub";
import { LogoutButton } from "@/components/logout-button";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  getGrantEvents,
  getUserCertificates,
  getUserInvites,
  getUserShares,
  getUserTransactions,
  getUserVouchers,
  getVenues,
} from "@/lib/data";
import { badgeForPoints } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  
  // Smistamento rigoroso dei ruoli: ogni ruolo ha la sua area dedicata
  if (user.role === "promoter" || user.role === "admin") redirect("/promotori");
  if (user.role === "csr") redirect("/azienda");
  if (user.role === "provider") redirect("/fornitore");

  const [vouchers, venues, grantEventsList, invites, transactions, shares, certificates] = await Promise.all([
    getUserVouchers(user.id),
    getVenues(),
    getGrantEvents(),
    getUserInvites(user.id),
    getUserTransactions(user.id),
    getUserShares(user.id),
    getUserCertificates(user.id),
  ]);

  const badge = badgeForPoints(user.impactPoints);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-6 rounded-[32px] bg-white p-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-olive font-semibold">
              {user.role === "employee" ? "Account Dipendente Welfare Aziendale" : "Account Community · Amico Invitato"}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 text-sm text-olive">
              {user.role === "employee" && user.company
                ? `Dipendente di ${user.company.name} · ${badge.label} · ${user.impactPoints} punti impatto`
                : `Ospite del circuito locale · ${badge.label} · ${user.impactPoints} punti impatto`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cream px-4 py-2 text-sm text-forest border border-forest/10 font-medium">
              Badge: {user.badgeLevel}
            </div>
            <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm text-forest hover:bg-forest/5" />
          </div>
        </div>
        <div className="mt-6">
          <AccountHub
            user={user}
            company={user.company}
            vouchers={vouchers}
            venues={venues.map((row) => row.venue)}
            grantEvents={grantEventsList}
            invites={invites}
            transactions={transactions}
            shares={shares}
            certificates={certificates}
          />
        </div>
      </main>
    </PublicShell>
  );
}
