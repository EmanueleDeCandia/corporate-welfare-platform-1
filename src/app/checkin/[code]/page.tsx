import { notFound } from "next/navigation";
import { CheckinClient } from "@/components/checkin-client";
import { PublicShell } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getInviteByEmail, getVenueByCheckin, resolveCheckinCode } from "@/lib/data";
import { sqlite } from "@/db";
import { venueTypeLabel } from "@/lib/utils";
import { ProviderCheckin } from "@/components/provider-checkin";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const target = await resolveCheckinCode(code);
  if (!target) notFound();
  const user = await getCurrentUser();

  if (target.kind === "selection") {
    const sel = target.selection;
    const canMark = user?.role === "provider" && user.venueId === sel.venue_id;
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
          <section className="rounded-[32px] bg-white p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">QR voucher welfare</p>
            <h1 className="mt-2 font-serif text-4xl text-forest">{sel.venue_name}</h1>
            <p className="mt-3 text-sm text-olive">
              {sel.first_name} {sel.last_name} · {sel.offering_name} · {sel.service_date} · presenza {sel.attendance_status}
            </p>
            {canMark ? (
              <ProviderCheckin kind="selection" id={sel.id} venueId={sel.venue_id} status={sel.attendance_status} />
            ) : (
              <p className="mt-4 text-sm text-forest">
                Mostra questo QR al fornitore per registrare la presenza. L&apos;addebito all&apos;impresa è già avvenuto alla selezione.
              </p>
            )}
          </section>
        </main>
      </PublicShell>
    );
  }

  if (target.kind === "grant") {
    const grant = target.grant;
    const canMark = user?.role === "provider" && user.venueId === grant.venue_id;
    const seats = sqlite
      .prepare(`SELECT id, holder_role, holder_name, attended FROM grant_seats WHERE matching_grant_id = ?`)
      .all(grant.id) as Array<{ id: number; holder_role: string; holder_name: string; attended: number }>;
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
          <section className="rounded-[32px] bg-white p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-terracotta">QR Matching Grant</p>
            <h1 className="mt-2 font-serif text-4xl text-forest">{grant.event_title}</h1>
            <p className="mt-3 text-sm text-olive">
              {grant.first_name} {grant.last_name} · {grant.seats_requested} posti · {grant.venue_name}
            </p>
            <ul className="mt-3 text-sm">
              {seats.map((seat) => (
                <li key={seat.id}>
                  {seat.holder_role}: {seat.holder_name} {seat.attended ? "· presente" : ""}
                </li>
              ))}
            </ul>
            {canMark ? (
              <ProviderCheckin kind="grant" id={grant.id} venueId={grant.venue_id} status={grant.status} />
            ) : (
              <p className="mt-4 text-sm">Mostra questo QR in botteghino per convalidare l&apos;ingresso omaggio.</p>
            )}
          </section>
        </main>
      </PublicShell>
    );
  }

  const row = await getVenueByCheckin(code);
  if (!row) notFound();
  const invite = user ? await getInviteByEmail(user.email) : null;

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
          }}
          offerings={row.offerings.filter((item) => item.active)}
          loggedIn={Boolean(user)}
          role={user?.role}
          inviteCode={invite?.code}
        />
      </main>
    </PublicShell>
  );
}
