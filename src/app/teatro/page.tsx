import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { PublicShell } from "@/components/public-shell";
import { TheaterDashboardView } from "@/components/theater-dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { getTheaterDashboardData } from "@/lib/theater";

export const dynamic = "force-dynamic";

export default async function TheaterPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/teatro");
  }

  // Riservato al ruolo theater (o promoter/admin per supervisione)
  if (user.role !== "theater" && user.role !== "promoter" && user.role !== "admin") {
    redirect("/account");
  }

  const data = await getTheaterDashboardData(user.id, user.venueId);
  if (!data) {
    redirect("/account");
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-4 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm text-forest hover:bg-forest/5" />
        </div>
        <TheaterDashboardView data={data} />
      </main>
    </PublicShell>
  );
}
