import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { PromotersDashboardView } from "@/components/promoters-dashboard-view";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getPromotersDashboardData } from "@/lib/promoters";

export const dynamic = "force-dynamic";

export default async function PromotersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/promotori");
  }

  // Riservato esclusivamente alla Startup Promotrice RADICI
  if (user.role === "theater") {
    redirect("/teatro");
  }
  if (user.role !== "promoter" && user.role !== "admin") {
    redirect("/account");
  }

  const data = await getPromotersDashboardData(user.id);
  if (!data) {
    redirect("/account");
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-4 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm text-forest hover:bg-forest/5" />
        </div>
        <PromotersDashboardView data={data} />
      </main>
    </PublicShell>
  );
}

