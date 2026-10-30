import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { PublicShell } from "@/components/public-shell";
import { CompanyDashboardView } from "@/components/company-dashboard-view";
import { getCurrentUser, getSessionToken, pathWithSession } from "@/lib/auth";
import { getCompanyDashboardData } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const token = await getSessionToken();
  if (!user) {
    redirect("/login?next=/azienda");
  }

  if (user.role !== "csr" || !user.companyId) {
    redirect(pathWithSession("/account", token));
  }

  const data = await getCompanyDashboardData(user.companyId);
  if (!data) {
    redirect(pathWithSession("/account", token));
  }

  const { tab } = await searchParams;

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-4 flex justify-end">
          <LogoutButton className="rounded-full border border-forest/15 px-4 py-2 text-sm text-forest hover:bg-forest/5" />
        </div>
        <CompanyDashboardView data={data} tab={tab} />
      </main>
    </PublicShell>
  );
}

