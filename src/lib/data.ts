import { desc, eq, inArray } from "drizzle-orm";
import { db, initDb, sqlite } from "@/db";
import {
  certificates,
  companies,
  destinations,
  grantEvents,
  invites,
  notifications,
  shares,
  transactions,
  users,
  venueOfferings,
  venues,
  vouchers,
  type BenefitType,
  type VenueOffering,
} from "@/db/schema";
import { awardImpactSync } from "@/lib/welfare";

export async function getDestinations() {
  await initDb();
  return db.select().from(destinations);
}

export async function getDestinationBySlug(slug: string) {
  await initDb();
  const [row] = await db.select().from(destinations).where(eq(destinations.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCompanies() {
  await initDb();
  return db.select().from(companies).orderBy(desc(companies.impactRating));
}

export async function getCompanyBySlug(slug: string) {
  await initDb();
  const [row] = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  return row ?? null;
}

export async function getVenueOfferings(venueId?: number) {
  await initDb();
  if (venueId) {
    return db.select().from(venueOfferings).where(eq(venueOfferings.venueId, venueId));
  }
  return db.select().from(venueOfferings);
}

export function groupOfferings(rows: VenueOffering[]) {
  const map = new Map<number, VenueOffering[]>();
  for (const row of rows) {
    const list = map.get(row.venueId) ?? [];
    list.push(row);
    map.set(row.venueId, list);
  }
  return map;
}

export function offeringFlags(offerings: VenueOffering[]) {
  const active = offerings.filter((item) => item.active);
  const offersOvernight = active.some((item) => item.benefitType === "overnight");
  const offersDinner = active.some((item) => item.benefitType === "dinner");
  const prices = active.map((item) => item.listPriceCents);
  return {
    offersOvernight,
    offersDinner,
    offersBoth: offersOvernight && offersDinner,
    fromPriceCents: prices.length ? Math.min(...prices) : 0,
  };
}

async function hydrateVenueRows<T extends { venue: { id: number } }>(rows: T[]) {
  const offerings = await db.select().from(venueOfferings);
  const byVenue = groupOfferings(offerings);
  return rows.map((row) => {
    const list = byVenue.get(row.venue.id) ?? [];
    return { ...row, offerings: list, flags: offeringFlags(list) };
  });
}

export async function getVenues() {
  await initDb();
  const rows = await db
    .select({
      venue: venues,
      destination: destinations,
      sponsor: companies,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .leftJoin(companies, eq(venues.sponsorCompanyId, companies.id));
  return hydrateVenueRows(rows);
}

export async function getVenueBySlug(slug: string) {
  await initDb();
  const [row] = await db
    .select({
      venue: venues,
      destination: destinations,
      sponsor: companies,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .leftJoin(companies, eq(venues.sponsorCompanyId, companies.id))
    .where(eq(venues.slug, slug))
    .limit(1);
  if (!row) return null;
  const offerings = await db.select().from(venueOfferings).where(eq(venueOfferings.venueId, row.venue.id));
  return { ...row, offerings, flags: offeringFlags(offerings) };
}

export async function getVenueByCheckin(code: string) {
  await initDb();
  const [row] = await db
    .select({
      venue: venues,
      destination: destinations,
      sponsor: companies,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .leftJoin(companies, eq(venues.sponsorCompanyId, companies.id))
    .where(eq(venues.checkinCode, code))
    .limit(1);
  if (!row) return null;
  const offerings = await db.select().from(venueOfferings).where(eq(venueOfferings.venueId, row.venue.id));
  return { ...row, offerings, flags: offeringFlags(offerings) };
}

export async function getVenuesByDestination(destinationId: number) {
  await initDb();
  const rows = await db
    .select({
      venue: venues,
      destination: destinations,
      sponsor: companies,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .leftJoin(companies, eq(venues.sponsorCompanyId, companies.id))
    .where(eq(venues.destinationId, destinationId));
  return hydrateVenueRows(rows);
}

export async function getVenuesByCompany(companyId: number) {
  await initDb();
  const rows = await db
    .select({
      venue: venues,
      destination: destinations,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .where(eq(venues.sponsorCompanyId, companyId));
  return hydrateVenueRows(rows);
}

export async function getUserVouchers(userId: number) {
  await initDb();
  return db.select().from(vouchers).where(eq(vouchers.userId, userId));
}

export async function getUserInvites(userId: number) {
  await initDb();
  return db.select().from(invites).where(eq(invites.inviterId, userId)).orderBy(desc(invites.createdAt));
}

export async function getInviteByCode(code: string) {
  await initDb();
  const [row] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
  return row ?? null;
}

export async function getInviteByEmail(email: string) {
  await initDb();
  const [row] = await db.select().from(invites).where(eq(invites.email, email.toLowerCase())).limit(1);
  return row ?? null;
}

export async function getUserTransactions(userId: number) {
  await initDb();
  const rows = await db
    .select({
      transaction: transactions,
      venue: venues,
    })
    .from(transactions)
    .innerJoin(venues, eq(transactions.venueId, venues.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
  return rows;
}

export async function getUserShares(userId: number) {
  await initDb();
  return db.select().from(shares).where(eq(shares.userId, userId)).orderBy(desc(shares.createdAt));
}

export async function getUserCertificates(userId: number) {
  await initDb();
  return db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.createdAt));
}

export async function getProviderNotifications(venueId: number) {
  await initDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.venueId, venueId))
    .orderBy(desc(notifications.createdAt));
}

export async function getProviderTransactions(venueId: number) {
  await initDb();
  const rows = await db
    .select({
      transaction: transactions,
      user: users,
      company: companies,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .leftJoin(companies, eq(transactions.companyId, companies.id))
    .where(eq(transactions.venueId, venueId))
    .orderBy(desc(transactions.createdAt));
  return rows;
}

export async function getProviderSelections(venueId: number) {
  await initDb();
  return sqlite
    .prepare(
      `SELECT s.*, v.benefit_type, v.amount_cents, v.status AS voucher_status,
              u.first_name, u.last_name, u.email, o.name AS offering_name, c.name AS company_name
       FROM voucher_selections s
       JOIN vouchers v ON v.id = s.voucher_id
       JOIN users u ON u.id = v.user_id
       JOIN venue_offerings o ON o.id = s.offering_id
       LEFT JOIN companies c ON c.id = v.company_id
       WHERE s.venue_id = ?
       ORDER BY s.service_date DESC, s.selected_at DESC`,
    )
    .all(venueId) as Array<{
    id: number;
    voucher_id: number;
    venue_id: number;
    offering_id: number;
    service_date: string;
    selected_at: number;
    attendance_status: string;
    qr_token: string;
    benefit_type: string;
    amount_cents: number;
    voucher_status: string;
    first_name: string;
    last_name: string;
    email: string;
    offering_name: string;
    company_name: string | null;
  }>;
}

export async function getProviderGrants(venueId: number) {
  await initDb();
  return sqlite
    .prepare(
      `SELECT g.*, e.title AS event_title, e.starts_at, u.first_name, u.last_name, u.email, c.name AS company_name
       FROM matching_grants g
       JOIN grant_events e ON e.id = g.event_id
       JOIN vouchers v ON v.id = g.voucher_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN companies c ON c.id = v.company_id
       WHERE e.venue_id = ?
       ORDER BY e.starts_at DESC`,
    )
    .all(venueId) as Array<{
    id: number;
    voucher_id: number;
    event_id: number;
    seats_requested: number;
    status: string;
    qr_token: string;
    assigned_at: number;
    event_title: string;
    starts_at: number;
    first_name: string;
    last_name: string;
    email: string;
    company_name: string | null;
  }>;
}

export async function awardImpact(
  userId: number,
  points = 1,
  reason = "manual",
  refType = "none",
  refId = "0",
) {
  await initDb();
  const result = awardImpactSync(userId, points, reason, refType, refId);
  if (!result) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user ?? null;
  }
  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return updated ?? null;
}

export async function getPlatformStats() {
  await initDb();
  const allCompanies = await db.select().from(companies);
  const allVenues = await db.select().from(venues);
  const allTx = await db.select().from(transactions);
  const allUsers = await db.select().from(users);

  return {
    companies: allCompanies.length,
    venues: allVenues.length,
    fundedCents: allCompanies.reduce((sum, company) => sum + company.fundedAmountCents, 0),
    redistributedCents: allCompanies.reduce((sum, company) => sum + company.localRedistributionCents, 0),
    impactPoints: allUsers.reduce((sum, user) => sum + user.impactPoints, 0),
    transactions: allTx.length,
  };
}

export async function getRedeemableVenues(type: BenefitType) {
  await initDb();
  const all = await getVenues();
  return all.filter((row) =>
    row.offerings.some((offering) => offering.active && offering.acceptsWelfare && offering.benefitType === type),
  );
}

export async function getCompanyEmployees(companyId: number) {
  await initDb();
  return db.select().from(users).where(eq(users.companyId, companyId));
}

export async function getUsersByIds(ids: number[]) {
  await initDb();
  if (ids.length === 0) return [];
  return db.select().from(users).where(inArray(users.id, ids));
}

export async function getGrantEvents() {
  await initDb();
  return db.select().from(grantEvents).where(eq(grantEvents.active, true));
}

export async function getEmployeeWallet(userId: number) {
  await initDb();
  const userVouchers = await getUserVouchers(userId);
  const voucherIds = userVouchers.map((item) => item.id);
  const selections =
    voucherIds.length === 0
      ? []
      : (sqlite
          .prepare(
            `SELECT s.*, vn.name AS venue_name, vn.city AS venue_city, o.name AS offering_name
             FROM voucher_selections s
             JOIN venues vn ON vn.id = s.venue_id
             JOIN venue_offerings o ON o.id = s.offering_id
             WHERE s.voucher_id IN (${voucherIds.map(() => "?").join(",")})`,
          )
          .all(...voucherIds) as Array<{
          id: number;
          voucher_id: number;
          venue_id: number;
          offering_id: number;
          service_date: string;
          selected_at: number;
          attendance_status: string;
          qr_token: string;
          venue_name: string;
          venue_city: string;
          offering_name: string;
        }>);
  const grants =
    voucherIds.length === 0
      ? []
      : (sqlite
          .prepare(
            `SELECT g.*, e.title AS event_title, e.starts_at, e.category, vn.name AS theater_name, vn.city AS theater_city,
                    c.token AS confirmation_token, c.response AS confirmation_response, c.respond_by
             FROM matching_grants g
             JOIN grant_events e ON e.id = g.event_id
             JOIN venues vn ON vn.id = e.venue_id
             LEFT JOIN grant_confirmations c ON c.matching_grant_id = g.id
             WHERE g.voucher_id IN (${voucherIds.map(() => "?").join(",")})`,
          )
          .all(...voucherIds) as Array<{
          id: number;
          voucher_id: number;
          event_id: number;
          seats_requested: number;
          status: string;
          qr_token: string;
          assigned_at: number;
          event_title: string;
          starts_at: number;
          category: string;
          theater_name: string;
          theater_city: string;
          confirmation_token: string | null;
          confirmation_response: string | null;
          respond_by: number | null;
        }>);
  return { vouchers: userVouchers, selections, grants };
}

export type SelectionCheckin = {
  id: number;
  venue_id: number;
  voucher_id: number;
  service_date: string;
  attendance_status: string;
  qr_token: string;
  benefit_type: string;
  first_name: string;
  last_name: string;
  offering_name: string;
  venue_name: string;
  venue_checkin: string;
};

export type GrantCheckin = {
  id: number;
  event_id: number;
  status: string;
  qr_token: string;
  seats_requested: number;
  event_title: string;
  starts_at: number;
  venue_id: number;
  venue_name: string;
  venue_checkin: string;
  first_name: string;
  last_name: string;
};

export type CheckinTarget =
  | { kind: "venue"; code: string }
  | { kind: "selection"; selection: SelectionCheckin }
  | { kind: "grant"; grant: GrantCheckin };

export async function resolveCheckinCode(code: string): Promise<CheckinTarget | null> {
  await initDb();
  const venue = sqlite.prepare(`SELECT checkin_code FROM venues WHERE checkin_code = ?`).get(code) as
    | { checkin_code: string }
    | undefined;
  if (venue) return { kind: "venue", code };

  const selection = sqlite
    .prepare(
      `SELECT s.id, s.venue_id, s.voucher_id, s.service_date, s.attendance_status, s.qr_token,
              v.benefit_type, u.first_name, u.last_name, o.name AS offering_name,
              vn.name AS venue_name, vn.checkin_code AS venue_checkin
       FROM voucher_selections s
       JOIN vouchers v ON v.id = s.voucher_id
       JOIN users u ON u.id = v.user_id
       JOIN venue_offerings o ON o.id = s.offering_id
       JOIN venues vn ON vn.id = s.venue_id
       WHERE s.qr_token = ?`,
    )
    .get(code) as SelectionCheckin | undefined;
  if (selection) return { kind: "selection", selection };

  const grant = sqlite
    .prepare(
      `SELECT g.id, g.event_id, g.status, g.qr_token, g.seats_requested,
              e.title AS event_title, e.starts_at, e.venue_id,
              vn.name AS venue_name, vn.checkin_code AS venue_checkin,
              u.first_name, u.last_name
       FROM matching_grants g
       JOIN grant_events e ON e.id = g.event_id
       JOIN venues vn ON vn.id = e.venue_id
       JOIN vouchers v ON v.id = g.voucher_id
       JOIN users u ON u.id = v.user_id
       WHERE g.qr_token = ?`,
    )
    .get(code) as GrantCheckin | undefined;
  if (grant) return { kind: "grant", grant };
  return null;
}
