import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { venues, venueOfferings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  const body = (await request.json()) as {
    venueId?: number;
    rooms?: Array<{
      name: string;
      description: string;
      capacity: number;
      priceCents: number;
    }>;
  };

  const venueId = body.venueId ?? me.venueId;
  if (!venueId) {
    return NextResponse.json({ error: "ID struttura non specificato." }, { status: 400 });
  }

  const isProviderOwner = me.role === "provider" && me.venueId === venueId;
  const isPromoterOrAdmin = me.role === "promoter" || me.role === "admin";

  if (!isProviderOwner && !isPromoterOrAdmin) {
    return NextResponse.json(
      { error: "Non sei autorizzato a modificare il listino di questa struttura." },
      { status: 403 }
    );
  }

  if (!Array.isArray(body.rooms)) {
    return NextResponse.json({ error: "Formato camere non valido." }, { status: 400 });
  }

  // Sanitizzazione e validazione camere
  const sanitizedRooms = body.rooms.map((r) => ({
    name: String(r.name || "").trim() || "Camera Convenzionata",
    description: String(r.description || "").trim(),
    capacity: Number(r.capacity) > 0 ? Number(r.capacity) : 1,
    priceCents: Math.max(0, Math.round(Number(r.priceCents) || 5000)),
  }));

  // Aggiornamento su tabella venues
  await db
    .update(venues)
    .set({ rooms: sanitizedRooms })
    .where(eq(venues.id, venueId));

  // Sincronizzazione con venue_offerings per le offerte di pernottamento
  for (const room of sanitizedRooms) {
    const existing = await db
      .select()
      .from(venueOfferings)
      .where(
        and(
          eq(venueOfferings.venueId, venueId),
          eq(venueOfferings.name, room.name)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(venueOfferings)
        .set({
          description: room.description,
          listPriceCents: room.priceCents,
          dailyCapacity: 4,
          acceptsWelfare: true,
        })
        .where(eq(venueOfferings.id, existing[0].id));
    } else {
      await db.insert(venueOfferings).values({
        venueId,
        benefitType: "overnight",
        name: room.name,
        description: room.description,
        listPriceCents: room.priceCents,
        acceptsWelfare: true,
        dailyCapacity: 4,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Offerte camere e convenzioni aggiornate con successo.",
    rooms: sanitizedRooms,
  });
}
