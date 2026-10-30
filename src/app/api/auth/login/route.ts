import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE,
  createSession,
  defaultPathForRole,
  pathWithSession,
  safeNextPath,
  sessionCookieOptions,
} from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

function redirectForRole(role: string, next?: string | null) {
  const fallback = defaultPathForRole(role);
  const safe = safeNextPath(next);
  if (!safe) return fallback;
  if (role === "csr" && safe.startsWith("/azienda")) return safe;
  if (role === "provider" && safe.startsWith("/fornitore")) return safe;
  if ((role === "promoter" || role === "admin") && safe.startsWith("/promotori")) return safe;
  if (
    (role === "employee" || role === "friend") &&
    (safe.startsWith("/account") || safe.startsWith("/strutture") || safe.startsWith("/checkin") || safe.startsWith("/esplora"))
  ) {
    return safe;
  }
  return fallback;
}

function isJsonRequest(request: Request) {
  return (request.headers.get("content-type") ?? "").includes("application/json");
}

async function readCredentials(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as { email?: string; password?: string; next?: string };
    return {
      email: body.email?.trim().toLowerCase() ?? "",
      password: body.password ?? "",
      next: body.next,
    };
  }
  const form = await request.formData();
  return {
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
    next: String(form.get("next") ?? "") || null,
  };
}

function withSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
  cookie: Awaited<ReturnType<typeof sessionCookieOptions>>,
) {
  response.cookies.set(SESSION_COOKIE, token, { ...cookie, expires: expiresAt });
  return response;
}

function relativeRedirect(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

function fail(request: Request, message: string, status: number) {
  if (isJsonRequest(request)) {
    return NextResponse.json({ error: message }, { status });
  }
  return relativeRedirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function POST(request: Request) {
  await ensureSeeded();
  const { email, password, next } = await readCredentials(request);

  if (!email || !password) {
    return fail(request, "Inserisci email e password.", 400);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail(request, "Credenziali non valide.", 401);
  }

  const { token, expiresAt } = await createSession(user.id);
  const destination = redirectForRole(user.role, next);
  const redirectTo = pathWithSession(destination, token);
  const cookie = await sessionCookieOptions();

  if (isJsonRequest(request)) {
    const response = NextResponse.json({
      ok: true,
      redirectTo,
      role: user.role,
    });
    return withSessionCookie(response, token, expiresAt, cookie);
  }

  return withSessionCookie(relativeRedirect(redirectTo), token, expiresAt, cookie);
}
