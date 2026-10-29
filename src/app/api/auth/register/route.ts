import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { badgeForPoints, hashPassword, randomCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    inviteCode?: string;
  };

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!firstName || !lastName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Compila tutti i campi. La password deve avere almeno 6 caratteri." },
      { status: 400 },
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Esiste già un account con questa email." }, { status: 409 });
  }

  let invite = body.inviteCode
    ? (await db.select().from(invites).where(eq(invites.code, body.inviteCode)).limit(1))[0]
    : undefined;
  if (!invite) {
    invite = (await db.select().from(invites).where(eq(invites.email, email)).limit(1))[0];
  }
  if (invite?.expiresAt && invite.expiresAt < new Date()) {
    invite = undefined;
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      role: "friend",
      impactPoints: 0,
      badgeLevel: badgeForPoints(0).label,
      referralCode: randomCode("amico"),
      invitedByUserId: invite?.inviterId ?? null,
    })
    .returning();

  if (invite && invite.status === "pending") {
    await db
      .update(invites)
      .set({ status: "registered", friendUserId: user.id, acceptedAt: new Date() })
      .where(and(eq(invites.id, invite.id)));
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, redirectTo: "/account" });
}
