import { notFound } from "next/navigation";
import { CheckinClient } from "@/components/checkin-client";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getInviteByEmail, getUserVouchers, getVenueByCheckin } from "@/lib/data";
import { venueTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const row = await getVenueByCheckin(code);
  if (!row) notFound();
  const user = await getCurrentUser();
  const invite = user ? await getInviteByEmail(user.email) : null;
  const userVouchers = user?.role === "employee" ? await getUserVouchers(user.id) : [];

  return (
    <PublicShell>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
        <section className="overflow-hidden rounded-[32px] bg-white">
          <img src={row.venue.coverImage} alt={row.venue.name} className="h-56 w-full object-cover" />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">
              QR della struttura · {venueTypeLabel(row.venue.type)}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-forest">{row.venue.name}</h1>
            <p className="mt-2 text-sm text-olive">
              {row.venue.city}, {row.destination.region}
            </p>
            <p className="mt-4 text-sm leading-6 text-ink/75">{row.venue.description}</p>
          </div>
        </section>
        <CheckinClient
          venue={{
            id: row.venue.id,
            name: row.venue.name,
            type: row.venue.type,
            checkinCode: row.venue.checkinCode,
            priceHotelCents: row.venue.priceHotelCents,
            priceAperitivoCents: row.venue.priceAperitivoCents,
            priceShowCents: row.venue.priceShowCents,
          }}
          loggedIn={Boolean(user)}
          role={user?.role}
          inviteCode={invite?.code}
          userVouchers={userVouchers}
        />
      </main>
    </PublicShell>
  );
}
