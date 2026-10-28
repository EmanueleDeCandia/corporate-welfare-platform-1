import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Inserisci email e password." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  await createSession(user.id);
  const redirectTo = user.role === "provider" ? "/fornitore" : user.role === "csr" ? "/azienda" : "/account";
  return NextResponse.json({
    ok: true,
    redirectTo,
    role: user.role,
  });
}
