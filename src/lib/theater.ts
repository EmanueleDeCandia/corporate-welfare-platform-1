import { desc, eq, inArray, or } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  grantEvents,
  matchingGrants,
  users,
  venues,
  vouchers,
  bookings,
} from "@/db/schema";

export type TheaterShow = {
  id: number;
  title: string;
  category: string;
  startsAt: Date | null;
  capacity: number;
  reservedSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  description: string;
  artistMeetupIncluded: boolean;
};

export type TheaterSpectator = {
  id: number;
  bookingId?: number;
  grantId?: number;
  spectatorName: string;
  spectatorEmail: string;
  spectatorRole: string;
  channel: "matching_grant" | "community_direct";
  channelLabel: string;
  showId: number;
  showTitle: string;
  seats: number;
  linkedStay: string | null;
  guestConfirmationStatus: "presence_confirmed" | "pending" | "cancelled";
  attendanceStatus: "attended" | "no_show" | "pending";
  date: string | null;
};

export type TheaterDashboardData = {
  theaterVenue: typeof venues.$inferSelect;
  managerUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    badgeLevel: string;
  };
  shows: TheaterShow[];
  spectators: TheaterSpectator[];
  stats: {
    totalCapacity: number;
    totalReservedSeats: number;
    totalConfirmedSeats: number;
    totalAvailableSeats: number;
    totalSpectators: number;
  };
};

export async function getTheaterDashboardData(
  userId: number,
  venueId?: number | null
): Promise<TheaterDashboardData | null> {
  await initDb();

  // 1. Trova l'utente gestore teatro
  const [manager] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!manager) return null;

  // 2. Trova la venue teatro (priorità su venueId o teatro lauro rossi come fallback)
  let theaterVenue: typeof venues.$inferSelect | null = null;
  const targetVenueId = venueId || manager.venueId;

  if (targetVenueId) {
    const [v] = await db.select().from(venues).where(eq(venues.id, targetVenueId)).limit(1);
    theaterVenue = v ?? null;
  }

  if (!theaterVenue) {
    const [fallback] = await db
      .select()
      .from(venues)
      .where(eq(venues.type, "theater"))
      .limit(1);
    theaterVenue = fallback ?? null;
  }

  if (!theaterVenue) return null;

  // 3. Spettacoli associati al teatro
  const eventRows = await db
    .select()
    .from(grantEvents)
    .where(
      or(
        eq(grantEvents.venueId, theaterVenue.id),
        eq(grantEvents.venueName, theaterVenue.name)
      )
    );

  const eventIds = eventRows.map((e) => e.id);

  // 4. Prenotazioni da bookings
  const bookingRows = eventIds.length > 0
    ? await db
        .select({
          booking: bookings,
          user: users,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(
          or(
            inArray(bookings.grantEventId, eventIds),
            eq(bookings.venueId, theaterVenue.id)
          )
        )
        .orderBy(desc(bookings.createdAt))
    : [];

  // 5. Matching Grants collegati
  const grantRows = eventIds.length > 0
    ? await db
        .select({
          grant: matchingGrants,
          event: grantEvents,
          voucher: vouchers,
        })
        .from(matchingGrants)
        .leftJoin(grantEvents, eq(matchingGrants.eventId, grantEvents.id))
        .leftJoin(vouchers, eq(matchingGrants.voucherId, vouchers.id))
        .where(inArray(matchingGrants.eventId, eventIds))
        .orderBy(desc(matchingGrants.createdAt))
    : [];

  // Mappa strutture per soggiorno abbinato (per i voucher)
  const allVenues = await db.select().from(venues);
  const venueMap = new Map(allVenues.map((v) => [v.id, v.name]));

  // Calcolo statistiche spettacoli
  const shows: TheaterShow[] = eventRows.map((e) => {
    // Conta posti prenotati da bookings
    const bookingsForEvent = bookingRows.filter(
      (b) => b.booking.grantEventId === e.id && b.booking.status !== "cancelled"
    );
    const seatsFromBookings = bookingsForEvent.reduce(
      (acc, b) => acc + (b.booking.partySize || 2),
      0
    );

    // Controlla anche eventuali grant non ancora convertiti in booking
    const matchingForEvent = grantRows.filter(
      (g) =>
        g.grant.eventId === e.id &&
        g.grant.status !== "declined" &&
        g.grant.status !== "expired" &&
        !bookingsForEvent.some((b) => b.booking.voucherId === g.grant.voucherId)
    );
    const seatsFromGrants = matchingForEvent.reduce(
      (acc, g) => acc + (g.grant.seatsRequested || 2),
      0
    );

    const totalReserved = seatsFromBookings + seatsFromGrants;
    const confirmedCount =
      bookingsForEvent.filter((b) => b.booking.status === "presence_confirmed" || b.booking.status === "attended").length * 2 +
      matchingForEvent.filter((g) => g.grant.status === "confirmed" || g.grant.status === "attended").length * 2;

    const availableSeats = Math.max(0, e.capacity - totalReserved);

    return {
      id: e.id,
      title: e.title,
      category: e.category,
      startsAt: e.startsAt,
      capacity: e.capacity,
      reservedSeats: totalReserved,
      confirmedSeats: confirmedCount,
      availableSeats,
      description: e.description,
      artistMeetupIncluded: Boolean(e.artistMeetupIncluded),
    };
  });

  // Lista spettatori
  const spectators: TheaterSpectator[] = [];

  // Dalle bookings (unificate)
  for (const b of bookingRows) {
    if (b.booking.bookingType !== "theater_event" && b.booking.venueId !== theaterVenue.id) {
      continue;
    }
    const show = eventRows.find((e) => e.id === b.booking.grantEventId);
    const isWelfare = Boolean(b.booking.voucherId);

    // Trova eventuale soggiorno abbinato
    let linkedStay: string | null = null;
    if (b.booking.voucherId) {
      const stayBooking = bookingRows.find(
        (other) =>
          other.booking.voucherId === b.booking.voucherId &&
          other.booking.bookingType === "hospitality"
      );
      if (stayBooking && stayBooking.booking.venueId) {
        linkedStay = venueMap.get(stayBooking.booking.venueId) ?? null;
      }
    }

    const guestStatus: "presence_confirmed" | "pending" | "cancelled" =
      b.booking.status === "presence_confirmed" || b.booking.status === "attended"
        ? "presence_confirmed"
        : b.booking.status === "cancelled"
        ? "cancelled"
        : "pending";

    const attendance: "attended" | "no_show" | "pending" =
      b.booking.status === "attended"
        ? "attended"
        : b.booking.status === "no_show"
        ? "no_show"
        : "pending";

    spectators.push({
      id: b.booking.id,
      bookingId: b.booking.id,
      spectatorName: b.user ? `${b.user.firstName} ${b.user.lastName}` : "Ospite RADICI",
      spectatorEmail: b.user ? b.user.email : "—",
      spectatorRole: b.user?.role === "employee" ? "Dipendente Welfare" : "Ospite Community",
      channel: isWelfare ? "matching_grant" : "community_direct",
      channelLabel: isWelfare
        ? "Omaggio Matching Grant (Promotori RADICI)"
        : "Prenotazione Ospite Community",
      showId: show?.id || 0,
      showTitle: show?.title || "Spettacolo Teatrale",
      seats: b.booking.partySize || 2,
      linkedStay,
      guestConfirmationStatus: guestStatus,
      attendanceStatus: attendance,
      date: b.booking.bookingDate,
    });
  }

  // Aggiungi eventuali Matching Grants storici se non già in bookings
  for (const g of grantRows) {
    const alreadyIncluded = spectators.some(
      (s) =>
        s.bookingId &&
        bookingRows.some(
          (b) => b.booking.id === s.bookingId && b.booking.voucherId === g.grant.voucherId
        )
    );
    if (alreadyIncluded) continue;

    const stayVenueName = g.voucher?.venueId ? venueMap.get(g.voucher.venueId) : null;
    const isConfirmed = g.grant.status === "confirmed" || g.grant.status === "attended";

    spectators.push({
      id: 10000 + g.grant.id,
      grantId: g.grant.id,
      spectatorName: "Dipendente Beneficiario",
      spectatorEmail: "—",
      spectatorRole: "Dipendente Welfare",
      channel: "matching_grant",
      channelLabel: "Omaggio Matching Grant (Promotori RADICI)",
      showId: g.grant.eventId || 0,
      showTitle: g.event?.title || "Spettacolo Teatrale",
      seats: g.grant.seatsRequested || 2,
      linkedStay: stayVenueName || null,
      guestConfirmationStatus: isConfirmed ? "presence_confirmed" : "pending",
      attendanceStatus:
        g.grant.status === "attended"
          ? "attended"
          : g.grant.status === "no_show"
          ? "no_show"
          : "pending",
      date: g.event?.startsAt ? g.event.startsAt.toISOString().split("T")[0] : null,
    });
  }

  const totalCapacity = shows.reduce((acc, s) => acc + s.capacity, 0);
  const totalReservedSeats = shows.reduce((acc, s) => acc + s.reservedSeats, 0);
  const totalConfirmedSeats = shows.reduce((acc, s) => acc + s.confirmedSeats, 0);
  const totalAvailableSeats = shows.reduce((acc, s) => acc + s.availableSeats, 0);

  return {
    theaterVenue,
    managerUser: {
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      badgeLevel: manager.badgeLevel,
    },
    shows,
    spectators,
    stats: {
      totalCapacity,
      totalReservedSeats,
      totalConfirmedSeats,
      totalAvailableSeats,
      totalSpectators: spectators.length,
    },
  };
}
