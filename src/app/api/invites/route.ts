import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { randomCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Devi accedere per invitare un amico." }, { status: 401 });
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Inserisci nome, cognome e email dell'amico." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.inviterId, me.id), eq(invites.email, email)))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Hai già inviato un invito a questa email.", invite: existing }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const [invite] = await db
    .insert(invites)
    .values({
      inviterId: me.id,
      firstName,
      lastName,
      email,
      code: randomCode("ref"),
      status: "pending",
      expiresAt,
    })
    .returning();

  return NextResponse.json({ ok: true, invite });
}
