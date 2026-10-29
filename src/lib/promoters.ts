import { db, initDb, sqlite } from "@/db";
import { destinations, users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGrantPipeline, listGrantEvents } from "@/lib/grants";

export type PromoterGrantRow = {
  grantId: number;
  voucherId: number;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  venueName: string;
  venueCity: string;
  eventTitle: string;
  eventCategory: string;
  eventLocation: string;
  theaterName: string;
  status: string;
  seatsRequested: number;
  assignedAt: Date | null;
  confirmationToken: string | null;
};

export type PromoterDashboardData = {
  promoterUser: typeof users.$inferSelect;
  pipeline: ReturnType<typeof getGrantPipeline>;
  eventsCount: number;
  theatersCount: number;
  promotedDestinationsCount: number;
  grants: PromoterGrantRow[];
  events: Array<{
    id: number;
    title: string;
    category: string;
    venueName: string;
    city: string;
    startsAt: Date;
    capacity: number;
    seatsOccupied: number;
    seatsFree: number;
    grantsGeneratedCount: number;
  }>;
  theaters: Array<{
    id: number;
    name: string;
    city: string;
    region: string;
    grantsGeneratedCount: number;
  }>;
};

export async function getPromotersDashboardData(promoterUserId: number): Promise<PromoterDashboardData | null> {
  await initDb();

  const [promoterUser] = await db.select().from(users).where(eq(users.id, promoterUserId)).limit(1);
  if (!promoterUser || (promoterUser.role !== "promoter" && promoterUser.role !== "admin")) {
    return null;
  }

  const pipeline = getGrantPipeline();
  const eventRows = listGrantEvents();
  const allVenues = await db.select().from(venues);
  const theaterVenues = allVenues.filter((v) => v.type === "theater" || v.type === "show_venue");
  const allDestinations = await db.select().from(destinations);

  const grantRows = sqlite
    .prepare(
      `SELECT g.id AS grant_id, g.voucher_id, g.status, g.seats_requested, g.assigned_at,
              u.first_name, u.last_name, u.email,
              c.name AS company_name,
              hv.name AS venue_name, hv.city AS venue_city,
              e.title AS event_title, e.category AS event_category,
              tv.name AS theater_name, tv.city AS theater_city,
              conf.token AS confirmation_token
       FROM matching_grants g
       JOIN vouchers v ON v.id = g.voucher_id
       JOIN users u ON u.id = v.user_id
       JOIN companies c ON c.id = v.company_id
       JOIN grant_events e ON e.id = g.event_id
       JOIN venues tv ON tv.id = e.venue_id
       LEFT JOIN voucher_selections s ON s.voucher_id = v.id
       LEFT JOIN venues hv ON hv.id = s.venue_id
       LEFT JOIN grant_confirmations conf ON conf.matching_grant_id = g.id
       ORDER BY g.assigned_at DESC`,
    )
    .all() as Array<{
    grant_id: number;
    voucher_id: number;
    status: string;
    seats_requested: number;
    assigned_at: number;
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
    venue_name: string | null;
    venue_city: string | null;
    event_title: string;
    event_category: string;
    theater_name: string;
    theater_city: string;
    confirmation_token: string | null;
  }>;

  const grants: PromoterGrantRow[] = grantRows.map((row) => ({
    grantId: row.grant_id,
    voucherId: row.voucher_id,
    employeeName: `${row.first_name} ${row.last_name}`,
    employeeEmail: row.email,
    companyName: row.company_name,
    venueName: row.venue_name ?? "Struttura ricettiva",
    venueCity: row.venue_city ?? "Territorio",
    eventTitle: row.event_title,
    eventCategory: row.event_category,
    eventLocation: `${row.theater_name} (${row.theater_city})`,
    theaterName: row.theater_name,
    status: row.status,
    seatsRequested: row.seats_requested,
    assignedAt: row.assigned_at ? new Date(row.assigned_at * 1000) : null,
    confirmationToken: row.confirmation_token,
  }));

  const grantsByEvent = new Map<number, number>();
  for (const row of grantRows) {
    const event = eventRows.find((item) => item.title === row.event_title);
    if (!event) continue;
    grantsByEvent.set(event.id, (grantsByEvent.get(event.id) ?? 0) + 1);
  }

  const events = eventRows.map((ge) => ({
    id: ge.id,
    title: ge.title,
    category: ge.category,
    venueName: ge.venue_name,
    city: ge.venue_city,
    startsAt: new Date(ge.starts_at * 1000),
    capacity: ge.capacity,
    seatsOccupied: ge.seats_occupied,
    seatsFree: ge.seats_free,
    grantsGeneratedCount: grantRows.filter((row) => row.event_title === ge.title).length,
  }));

  const theaters = theaterVenues.map((th) => ({
    id: th.id,
    name: th.name,
    city: th.city,
    region: th.region,
    grantsGeneratedCount: grantRows.filter((row) => row.theater_name === th.name).length,
  }));

  return {
    promoterUser,
    pipeline,
    eventsCount: eventRows.length,
    theatersCount: theaterVenues.length,
    promotedDestinationsCount: allDestinations.length,
    grants,
    events,
    theaters,
  };
}
