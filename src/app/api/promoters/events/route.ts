import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { grantEvents, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 403 });
    }

    const allEvents = await db.select().from(grantEvents);
    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error("GET /api/promoters/events error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso riservato alla Startup Promotrice RADICI" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      category = "teatro",
      venueId = null,
      venueName: inputVenueName,
      city: inputCity,
      region: inputRegion,
      description,
      startsAt: inputStartsAt,
      capacity = 50,
      grantAmountCents = 5000,
      artistMeetupIncluded = true,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Il titolo dello spettacolo o evento è obbligatorio." }, { status: 400 });
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "La descrizione dell'evento è obbligatoria." }, { status: 400 });
    }

    let parsedStartsAt: Date;
    if (inputStartsAt) {
      parsedStartsAt = new Date(inputStartsAt);
      if (isNaN(parsedStartsAt.getTime())) {
        return NextResponse.json({ error: "Data e ora di inizio non valide." }, { status: 400 });
      }
    } else {
      // Default a 30 giorni nel futuro alle 21:00
      parsedStartsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      parsedStartsAt.setHours(21, 0, 0, 0);
    }

    const numCapacity = Math.max(1, Number(capacity) || 50);

    // Se venueId è fornito, ricaviamo venueName, city e region dalla struttura
    let finalVenueName = inputVenueName ? inputVenueName.trim() : "";
    let finalCity = inputCity ? inputCity.trim() : "";
    let finalRegion = inputRegion ? inputRegion.trim() : "Marche";

    if (venueId && typeof venueId === "number") {
      const [v] = await db.select().from(venues).where(eq(venues.id, venueId));
      if (v) {
        if (!finalVenueName) finalVenueName = v.name;
        if (!finalCity) finalCity = v.city;
        if (!finalRegion) finalRegion = v.region;
      }
    }

    if (!finalVenueName) {
      return NextResponse.json({ error: "Il nome del teatro o location è obbligatorio." }, { status: 400 });
    }

    if (!finalCity) {
      return NextResponse.json({ error: "La città dell'evento è obbligatoria." }, { status: 400 });
    }

    const [newEvent] = await db
      .insert(grantEvents)
      .values({
        title: title.trim(),
        category,
        venueId: typeof venueId === "number" && venueId > 0 ? venueId : null,
        venueName: finalVenueName,
        city: finalCity,
        region: finalRegion,
        description: description.trim(),
        startsAt: parsedStartsAt,
        capacity: numCapacity,
        grantAmountCents: Math.max(0, Number(grantAmountCents) || 5000),
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: Boolean(artistMeetupIncluded),
        active: true,
      })
      .returning();

    return NextResponse.json({ ok: true, event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/promoters/events error:", error);
    return NextResponse.json({ error: "Errore durante la creazione dello spettacolo." }, { status: 500 });
  }
}
