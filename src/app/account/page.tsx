import { redirect } from "next/navigation";
import { AccountHub } from "@/components/account-hub";
import { LogoutButton } from "@/components/logout-button";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  getEmployeeWallet,
  getUserCertificates,
  getUserInvites,
  getUserShares,
  getUserTransactions,
  getVenues,
} from "@/lib/data";
import { listGrantEvents } from "@/lib/grants";
import { badgeForPoints } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  if (user.role === "provider") redirect("/fornitore");
  if (user.role === "csr") redirect("/azienda");
  if (user.role === "promoter") redirect("/promotori");

  const [wallet, venues, invites, transactions, shares, certificates] = await Promise.all([
    getEmployeeWallet(user.id),
    getVenues(),
    getUserInvites(user.id),
    getUserTransactions(user.id),
    getUserShares(user.id),
    getUserCertificates(user.id),
  ]);
  const grantEventsList = listGrantEvents();
  const badge = badgeForPoints(user.impactPoints);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-6 rounded-[32px] bg-white p-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-olive">
              {user.role === "employee" ? "Account dipendente" : "Account amico / consumer"}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 text-sm text-olive">
              {user.company?.name ?? "Ospite del circuito"} · {badge.label} · {user.impactPoints} punti
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cream px-4 py-2 text-sm text-forest">
              Badge: {user.badgeLevel}
            </div>
            <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-6">
          <AccountHub
            user={user}
            company={user.company}
            vouchers={wallet.vouchers}
            selections={wallet.selections}
            grants={wallet.grants}
            venues={venues}
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
