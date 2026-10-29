import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, initDb, sqlite } from "@/db";
import { companies, sessions, users, venues, type UserRole } from "@/db/schema";
import { randomToken, unixSeconds } from "@/lib/utils";

export const SESSION_COOKIE = "radici_session";
const SESSION_DAYS = 14;

async function sessionCookieOptions() {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0]?.trim().toLowerCase();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim().toLowerCase();
  const secure =
    proto === "https" ||
    host.endsWith(".e2b.app") ||
    host.includes(".e2b.app:") ||
    process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    path: "/",
    secure,
    sameSite: (secure ? "none" : "lax") as "lax" | "none",
    partitioned: secure,
  };
}

export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number | null;
  venueId: number | null;
  impactPoints: number;
  badgeLevel: string;
  referralCode: string;
  invitedByUserId: number | null;
  company: typeof companies.$inferSelect | null;
  venue: typeof venues.$inferSelect | null;
};

export async function createSession(userId: number) {
  await initDb();
  sqlite.prepare(`DELETE FROM sessions WHERE expires_at < ?`).run(unixSeconds());
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  const cookie = await sessionCookieOptions();
  jar.set(SESSION_COOKIE, token, {
    ...cookie,
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  await initDb();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  const cookie = await sessionCookieOptions();
  jar.set(SESSION_COOKIE, "", {
    ...cookie,
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  await initDb();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;

  const company = row.user.companyId
    ? ((await db.select().from(companies).where(eq(companies.id, row.user.companyId)).limit(1))[0] ?? null)
    : null;

  const venue = row.user.venueId
    ? ((await db.select().from(venues).where(eq(venues.id, row.user.venueId)).limit(1))[0] ?? null)
    : null;

  return {
    id: row.user.id,
    email: row.user.email,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    role: row.user.role,
    companyId: row.user.companyId,
    venueId: row.user.venueId,
    impactPoints: row.user.impactPoints,
    badgeLevel: row.user.badgeLevel,
    referralCode: row.user.referralCode,
    invitedByUserId: row.user.invitedByUserId,
    company,
    venue,
  };
}

export function displayName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`;
}

export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
