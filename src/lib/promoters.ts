import { desc, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { companies, destinations, users, venues, vouchers } from "@/db/schema";

export type PromoterGrantRow = {
  voucherId: number;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  venueName: string;
  venueCity: string;
  theaterName: string;
  redeemedAt: Date | null;
  grantValueCents: number;
};

export type PromoterDashboardData = {
  promoterUser: typeof users.$inferSelect;
  totalFundCents: number;
  totalCommittedCents: number;
  remainingFundCents: number;
  activeGrantsCount: number;
  theatersCount: number;
  promotedDestinationsCount: number;
  grants: PromoterGrantRow[];
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

  // Fondo complessivo stanziato dalla Startup RADICI e dai Promotori Privati
  const TOTAL_PROMOTER_FUND_CENTS = 5000000; // 50.000 €
  const GRANT_UNIT_VALUE_CENTS = 5000; // 50 € (Spettacolo Teatrale per 2 persone 25€+25€ + Incontro Artisti)

  // Recupera tutti i voucher hotel riscattati con l'eventuale teatro scelto
  const hotelVouchers = await db
    .select({
      voucher: vouchers,
      user: users,
      company: companies,
      venue: venues,
    })
    .from(vouchers)
    .innerJoin(users, eq(vouchers.userId, users.id))
    .innerJoin(companies, eq(vouchers.companyId, companies.id))
    .leftJoin(venues, eq(vouchers.venueId, venues.id))
    .where(eq(vouchers.type, "hotel"))
    .orderBy(desc(vouchers.redeemedAt));

  const redeemedHotelVouchers = hotelVouchers.filter((v) => v.voucher.status === "redeemed");

  // Teatri convenzionati con i Promotori
  const allVenues = await db.select().from(venues);
  const theaterVenues = allVenues.filter((v) => v.type === "theater");
  const theaterMap = new Map(theaterVenues.map((th) => [th.id, th]));
  const allDestinations = await db.select().from(destinations);

  // Mappa matching grants leggendo il teatro realmente selezionato dal dipendente
  const grants: PromoterGrantRow[] = redeemedHotelVouchers.map((row) => {
    const selectedTheater = row.voucher.theaterVenueId
      ? theaterMap.get(row.voucher.theaterVenueId)
      : theaterVenues[0];

    return {
      voucherId: row.voucher.id,
      employeeName: `${row.user.firstName} ${row.user.lastName}`,
      employeeEmail: row.user.email,
      companyName: row.company.name,
      venueName: row.venue?.name ?? "Struttura Ricettiva",
      venueCity: row.venue?.city ?? "Territorio",
      theaterName: selectedTheater?.name ?? "Teatro Storico del Territorio",
      redeemedAt: row.voucher.redeemedAt,
      grantValueCents: GRANT_UNIT_VALUE_CENTS,
    };
  });

  const activeGrantsCount = grants.length;
  const totalCommittedCents = activeGrantsCount * GRANT_UNIT_VALUE_CENTS;
  const remainingFundCents = Math.max(0, TOTAL_PROMOTER_FUND_CENTS - totalCommittedCents);

  // Statistiche per ciascun teatro convenzionato
  const theaters = theaterVenues.map((th) => {
    const countForTheater = redeemedHotelVouchers.filter(
      (v) => (v.voucher.theaterVenueId === th.id) || (!v.voucher.theaterVenueId && th.id === theaterVenues[0]?.id)
    ).length;

    return {
      id: th.id,
      name: th.name,
      city: th.city,
      region: th.region,
      grantsGeneratedCount: countForTheater,
    };
  });

  return {
    promoterUser,
    totalFundCents: TOTAL_PROMOTER_FUND_CENTS,
    totalCommittedCents,
    remainingFundCents,
    activeGrantsCount,
    theatersCount: theaterVenues.length,
    promotedDestinationsCount: allDestinations.length,
    grants,
    theaters,
  };
}
