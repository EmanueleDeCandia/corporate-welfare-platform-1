import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSession,
  defaultPathForRole,
  pathWithSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { isRegisterableRole, registerAccount } from "@/lib/register-account";
import { WelfareError } from "@/lib/welfare";

export const dynamic = "force-dynamic";

function optionalId(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
    inviteCode?: string;
    companyId?: number | string;
    companyName?: string;
    vatNumber?: string;
    city?: string;
    venueId?: number | string;
    venueName?: string;
    venueType?: string;
    destinationId?: number | string;
  };

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const inviteCode = body.inviteCode?.trim() || undefined;
  const role = inviteCode ? "friend" : body.role?.trim() || "friend";

  if (!firstName || !lastName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Compila tutti i campi. La password deve avere almeno 6 caratteri." },
      { status: 400 },
    );
  }

  if (!isRegisterableRole(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  try {
    const created = registerAccount({
      firstName,
      lastName,
      email,
      password,
      role,
      inviteCode,
      companyId: optionalId(body.companyId),
      companyName: body.companyName,
      vatNumber: body.vatNumber,
      city: body.city,
      venueId: optionalId(body.venueId),
      venueName: body.venueName,
      venueType: body.venueType,
      destinationId: optionalId(body.destinationId),
    });

    const { token, expiresAt } = await createSession(created.userId);
    const redirectTo = pathWithSession(defaultPathForRole(created.role), token);
    const cookie = await sessionCookieOptions();
    const response = NextResponse.json({ ok: true, redirectTo, role: created.role });
    response.cookies.set(SESSION_COOKIE, token, { ...cookie, expires: expiresAt });
    return response;
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
