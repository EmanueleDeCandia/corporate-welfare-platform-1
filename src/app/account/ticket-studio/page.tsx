import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getGrantEvents, getVenues } from "@/lib/data";
import { PublicShell } from "@/components/public-shell";
import { TicketStudio } from "@/components/ticket-studio";

export const dynamic = "force-dynamic";

export default async function TicketStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/ticket-studio");

  const [grantEventsList, venuesList] = await Promise.all([
    getGrantEvents(),
    getVenues(),
  ]);

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-xs font-semibold text-olive hover:text-forest transition"
          >
            <ArrowLeft size={14} /> Torna al Portafoglio Account
          </Link>
        </div>

        <TicketStudio
          events={grantEventsList}
          user={{
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            referralCode: user.referralCode,
            role: user.role,
            company: user.company,
          }}
        />
      </main>
    </PublicShell>
  );
}
