import { desc, eq, inArray } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  certificates,
  companies,
  destinations,
  invites,
  notifications,
  shares,
  transactions,
  users,
  venues,
  vouchers,
  voucherSelections,
  grantEvents,
  type GrantEvent,
  type VoucherType,
} from "@/db/schema";
import { badgeForPoints } from "@/lib/utils";

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
  return rows;
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
  return row ?? null;
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
  return row ?? null;
}

export async function getVenuesByDestination(destinationId: number) {
  await initDb();
  return db
    .select({
      venue: venues,
      destination: destinations,
      sponsor: companies,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .leftJoin(companies, eq(venues.sponsorCompanyId, companies.id))
    .where(eq(venues.destinationId, destinationId));
}

export async function getVenuesByCompany(companyId: number) {
  await initDb();
  return db
    .select({
      venue: venues,
      destination: destinations,
    })
    .from(venues)
    .innerJoin(destinations, eq(venues.destinationId, destinations.id))
    .where(eq(venues.sponsorCompanyId, companyId));
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
      selection: voucherSelections,
      voucher: vouchers,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .leftJoin(companies, eq(transactions.companyId, companies.id))
    .leftJoin(vouchers, eq(transactions.voucherId, vouchers.id))
    .leftJoin(voucherSelections, eq(transactions.voucherId, voucherSelections.voucherId))
    .where(eq(transactions.venueId, venueId))
    .orderBy(desc(transactions.createdAt));

  return rows.map((r) => ({
    transaction: r.transaction,
    user: r.user,
    company: r.company,
    attendanceStatus: r.selection?.attendanceStatus || (r.voucher?.status === "attended" ? "attended" : r.voucher?.status === "no_show" ? "no_show" : "pending"),
    checkedInAt: r.selection?.checkedInAt ?? null,
  }));
}

export async function awardImpact(userId: number, points = 1) {
  await initDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const next = user.impactPoints + points;
  const badge = badgeForPoints(next).label;
  const [updated] = await db
    .update(users)
    .set({ impactPoints: next, badgeLevel: badge })
    .where(eq(users.id, userId))
    .returning();
  return updated;
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

export async function getRedeemableVenues(type: VoucherType) {
  await initDb();
  const all = await getVenues();
  return all.filter((row) => {
    if (type === "theater") return row.venue.type === "theater";
    if (type === "hotel" || type === "overnight") return row.venue.type === "hotel" || row.venue.type === "agriturismo";
    if (type === "aperitivo" || type === "dinner") return row.venue.type !== "theater";
    return row.venue.type !== "theater";
  });
}

export async function getVenueOfferings(venueId?: number) {
  await initDb();
  const { venueOfferings } = await import("@/db/schema");
  if (venueId) {
    return db.select().from(venueOfferings).where(eq(venueOfferings.venueId, venueId));
  }
  return db.select().from(venueOfferings);
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
