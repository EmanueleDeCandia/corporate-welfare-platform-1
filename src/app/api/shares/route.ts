import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shares, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { awardImpact } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accedi per certificare la condivisione." }, { status: 401 });
  }

  const body = (await request.json()) as { venueId?: number; caption?: string };
  const caption = body.caption?.trim();
  if (!caption) {
    return NextResponse.json({ error: "Il testo del post è obbligatorio." }, { status: 400 });
  }

  const [share] = await db
    .insert(shares)
    .values({
      userId: me.id,
      venueId: body.venueId ?? null,
      caption,
    })
    .returning();

  await awardImpact(me.id, 1, "share", "venue", String(body.venueId ?? share.id));
  const [fresh] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);

  return NextResponse.json({
    ok: true,
    impactPoints: fresh?.impactPoints,
    badgeLevel: fresh?.badgeLevel,
    message: "Condivisione certificata. Hai ottenuto +1 Punto Impatto.",
  });
}
