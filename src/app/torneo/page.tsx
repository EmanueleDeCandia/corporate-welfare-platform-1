import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/tournament";
import { TournamentView } from "@/components/tournament-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Torneo dei Trailer di Performing Art · RADICI",
  description:
    "Vota i trailer da 20 secondi degli spettacoli teatrali nei borghi storici. Fai vincere alla tua impresa i 10 Biglietti Omaggio messi in palio dalla Startup RADICI.",
};

export default async function TorneoPage() {
  const user = await getCurrentUser();
  const tournamentData = await getTournamentData(user?.id);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <TournamentView
          data={tournamentData}
          currentUser={
            user
              ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role,
                  companyId: user.companyId,
                  companyName: user.company?.name || null,
                  referralCode: user.referralCode,
                }
              : null
          }
        />
      </main>
    </PublicShell>
  );
}
