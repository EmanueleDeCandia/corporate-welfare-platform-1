import { desc, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  companies,
  destinations,
  grantEvents,
  matchingGrants,
  grantSeats,
  grantConfirmations,
  users,
  venues,
  vouchers,
} from "@/db/schema";

export type PromoterGrantRow = {
  voucherId: number;
  grantId: number;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  venueName: string;
  venueCity: string;
  eventTitle: string;
  eventCategory: string;
  eventLocation: string;
  theaterName: string;
  startsAt: Date | null;
  seatsRequested: number;
  status: string;
  confirmedAt: Date | null;
  attendedAt: Date | null;
  grantValueCents: number;
};

export type PromoterDashboardData = {
  promoterUser: typeof users.$inferSelect;
  totalGrantsAssigned: number;
  totalGrantsConfirmed: number;
  totalGrantsAttended: number;
  totalGrantsNoShow: number;
  totalGrantsExpired: number;
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
    startsAt: Date | null;
    capacity: number;
    seatsOccupied: number;
    seatsAvailable: number;
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

  const [promoterUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, promoterUserId))
    .limit(1);

  if (!promoterUser || promoterUser.role !== "promoter") {
    return null;
  }

  // Catalogo Eventi del Matching Grant con capienze
  const allGrantEvents = await db.select().from(grantEvents);
  const grantEventMap = new Map(allGrantEvents.map((ge) => [ge.id, ge]));

  const allVenues = await db.select().from(venues);
  const theaterVenues = allVenues.filter((v) => v.type === "theater");
  const theaterMap = new Map(theaterVenues.map((th) => [th.id, th]));
  const allDestinations = await db.select().from(destinations);

  // Recupera tutti i matching grants con le relazioni
  const grantRows = await db
    .select({
      grant: matchingGrants,
      voucher: vouchers,
      user: users,
      company: companies,
      venue: venues,
    })
    .from(matchingGrants)
    .innerJoin(vouchers, eq(matchingGrants.voucherId, vouchers.id))
    .innerJoin(users, eq(vouchers.userId, users.id))
    .innerJoin(companies, eq(vouchers.companyId, companies.id))
    .leftJoin(venues, eq(vouchers.venueId, venues.id))
    .orderBy(desc(matchingGrants.assignedAt));

  // Posti assegnati complessivi per ciascun grant
  const allSeats = await db.select().from(grantSeats);

  const grants: PromoterGrantRow[] = grantRows.map((row) => {
    const event = grantEventMap.get(row.grant.eventId);
    const theater = event?.venueId ? theaterMap.get(event.venueId) : null;

    return {
      voucherId: row.voucher.id,
      grantId: row.grant.id,
      employeeName: `${row.user.firstName} ${row.user.lastName}`,
      employeeEmail: row.user.email,
      companyName: row.company.name,
      venueName: row.venue?.name ?? "Struttura Ricettiva",
      venueCity: row.venue?.city ?? "Territorio",
      eventTitle: event?.title ?? "Evento Culturale del Territorio",
      eventCategory: event?.category ?? "teatro",
      eventLocation: event ? `${event.venueName} (${event.city})` : "Teatro del Circuito",
      theaterName: theater?.name ?? (event ? event.venueName : "Teatro Storico"),
      startsAt: event?.startsAt ?? null,
      seatsRequested: row.grant.seatsRequested,
      status: row.grant.status,
      confirmedAt: row.grant.confirmedAt,
      attendedAt: row.grant.attendedAt,
      grantValueCents: row.grant.amountCents,
    };
  });

  // Metriche di governance del Matching Grant per la Startup (R7, R8, R9)
  const totalGrantsAssigned = grants.length;
  const totalGrantsConfirmed = grants.filter((g) => g.status === "confirmed").length;
  const totalGrantsAttended = grants.filter((g) => g.status === "attended").length;
  const totalGrantsNoShow = grants.filter((g) => g.status === "no_show").length;
  const totalGrantsExpired = grants.filter((g) => g.status === "expired" || g.status === "declined").length;

  // Statistiche per ciascun evento: capienza, posti occupati e posti disponibili
  const events = allGrantEvents.map((ge) => {
    // Posti occupati = grant attivi o confermati
    const eventGrants = grants.filter(
      (g) =>
        grantRows.find((r) => r.grant.id === g.grantId)?.grant.eventId === ge.id &&
        g.status !== "declined" &&
        g.status !== "expired"
    );

    const seatsOccupied = eventGrants.reduce((sum, g) => sum + g.seatsRequested, 0);
    const capacity = ge.capacity || 50;

    return {
      id: ge.id,
      title: ge.title,
      category: ge.category,
      venueName: ge.venueName,
      city: ge.city,
      startsAt: ge.startsAt,
      capacity,
      seatsOccupied,
      seatsAvailable: Math.max(0, capacity - seatsOccupied),
      grantsGeneratedCount: eventGrants.length,
    };
  });

  // Statistiche per ciascun teatro convenzionato
  const theaters = theaterVenues.map((th) => {
    const count = grants.filter((g) => g.theaterName === th.name).length;
    return {
      id: th.id,
      name: th.name,
      city: th.city,
      region: th.region,
      grantsGeneratedCount: count,
    };
  });

  return {
    promoterUser,
    totalGrantsAssigned,
    totalGrantsConfirmed,
    totalGrantsAttended,
    totalGrantsNoShow,
    totalGrantsExpired,
    eventsCount: allGrantEvents.length,
    theatersCount: theaterVenues.length,
    promotedDestinationsCount: allDestinations.length,
    grants,
    events,
    theaters,
  };
}
