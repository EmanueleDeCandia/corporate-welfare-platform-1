import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PublicShell } from "@/components/public-shell";
import { ImpactCertificateStudio } from "@/components/certificati-impatto/ImpactCertificateStudio";

export const dynamic = "force-dynamic";

export default async function AccountCertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/certificati");

  const companyName = user.company?.name || "";
  const roleLabel =
    user.role === "employee"
      ? "Dipendente Welfare"
      : user.role === "csr"
      ? "Referente CSR Azienda"
      : user.role === "promoter"
      ? "Promotore Territoriale"
      : user.role === "theater" || user.role === "provider"
      ? "Struttura Partner"
      : "Community";

  const backHref =
    user.role === "promoter" || user.role === "admin"
      ? "/promotori"
      : user.role === "theater"
      ? "/teatro"
      : user.role === "csr"
      ? "/azienda"
      : user.role === "provider"
      ? "/fornitore"
      : "/account";

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <ImpactCertificateStudio
          showBackLink={true}
          backHref={backHref}
          backLabel="Torna al Cruscotto"
          initialContext={{
            first: user.firstName,
            last: user.lastName,
            company: companyName,
            promoter: "RADICI · Welfare & Territorio Marche",
            role: roleLabel,
            distanceKm: 55,
          }}
        />
      </main>
    </PublicShell>
  );
}
