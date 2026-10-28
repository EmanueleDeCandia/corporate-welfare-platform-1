import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { PublicShell } from "@/components/public-shell";
import { CompanyDashboardView } from "@/components/company-dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyDashboardData } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/azienda");
  }

  // Se non è CSR, rimanda al proprio account
  if (user.role !== "csr" || !user.companyId) {
    redirect("/account");
  }

  const data = await getCompanyDashboardData(user.companyId);
  if (!data) {
    redirect("/account");
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-4 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm text-forest hover:bg-forest/5" />
        </div>
        <CompanyDashboardView data={data} />
      </main>
    </PublicShell>
  );
}

