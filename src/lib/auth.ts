import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, initDb, sqlite } from "@/db";
import { companies, sessions, users, venues, type UserRole } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  SESSION_HEADER,
  cookieOptionsFromHeaders,
} from "@/lib/session-cookie";
import { randomToken, unixSeconds } from "@/lib/utils";

export {
  SESSION_COOKIE,
  SESSION_HEADER,
  cookieOptionsFromHeaders,
  isHttpsRequest,
  pathWithSession,
  publicOriginFromHeaders,
} from "@/lib/session-cookie";

export async function sessionCookieOptions() {
  return cookieOptionsFromHeaders(await headers());
}

export function defaultPathForRole(role: string) {
  if (role === "provider") return "/fornitore";
  if (role === "csr") return "/azienda";
  if (role === "promoter" || role === "admin") return "/promotori";
  return "/account";
}

export async function getSessionToken() {
  const jar = await cookies();
  const h = await headers();
  return jar.get(SESSION_COOKIE)?.value || h.get(SESSION_HEADER) || "";
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
  return { token, expiresAt };
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
  const h = await headers();
  const token = jar.get(SESSION_COOKIE)?.value || h.get(SESSION_HEADER) || undefined;
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
