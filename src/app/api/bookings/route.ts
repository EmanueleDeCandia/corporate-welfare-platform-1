import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  grantEvents,
  matchingGrants,
  notifications,
  users,
  venueOfferings,
  venues,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getEventCapacityStats, getUserBookings, getVenueBookings } from "@/lib/data";
import { randomCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const venueIdParam = searchParams.get("venueId");

  if (venueIdParam && (me.role === "provider" || me.role === "promoter" || me.role === "admin")) {
    const venueId = parseInt(venueIdParam, 10);
    const rows = await getVenueBookings(venueId);
    return NextResponse.json({ ok: true, bookings: rows });
  }

  const rows = await getUserBookings(me.id);
  return NextResponse.json({ ok: true, bookings: rows });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Effettua il login per completare la prenotazione." }, { status: 401 });
  }

  const body = (await request.json()) as {
    venueId?: number;
    offeringId?: number;
    grantEventId?: number;
    bookingType?: "hospitality" | "dinner" | "theater_event" | "experience";
    bookingDate?: string;
    timeSlot?: string;
    partySize?: number;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    notes?: string;
  };

  const venueId = body.venueId;
  const bookingDate = body.bookingDate?.trim();
  const partySize = Math.max(1, body.partySize || 1);

  if (!venueId || !bookingDate) {
    return NextResponse.json(
      { error: "Struttura e data della prenotazione sono obbligatorie." },
      { status: 400 }
    );
  }

  const [venue] = await db.select().from(venues).where(eq(venues.id, venueId)).limit(1);
  if (!venue) {
    return NextResponse.json({ error: "Struttura convenzionata non trovata." }, { status: 404 });
  }

  // 1. Controllo Overbooking Capienza se si tratta di un evento / teatro con posti limitati
  let grantEvent = null;
  if (body.grantEventId) {
    const capStats = await getEventCapacityStats(body.grantEventId);
    if (!capStats) {
      return NextResponse.json({ error: "Evento culturale non trovato." }, { status: 404 });
    }
    if (capStats.availableSeats < partySize) {
      return NextResponse.json(
        {
          error: `Posti insufficienti per lo spettacolo "${capStats.title}". Posti disponibili residui: ${capStats.availableSeats}, richiesti: ${partySize}. Seleziona un numero inferiore di posti o un'altra data per evitare overbooking.`,
          availableSeats: capStats.availableSeats,
        },
        { status: 400 }
      );
    }

    const [ge] = await db.select().from(grantEvents).where(eq(grantEvents.id, body.grantEventId)).limit(1);
    grantEvent = ge;
  }

  // 2. Calcolo Tariffa di Listino e Sconto Convenzione Community (10%)
  let unitPriceCents = 0;
  let bookingType = body.bookingType || (venue.type === "theater" ? "theater_event" : venue.type === "restaurant" ? "dinner" : "hospitality");

  if (body.offeringId) {
    const [offering] = await db
      .select()
      .from(venueOfferings)
      .where(and(eq(venueOfferings.id, body.offeringId), eq(venueOfferings.venueId, venue.id)))
      .limit(1);
    if (offering) {
      unitPriceCents = offering.listPriceCents;
    }
  }

  if (unitPriceCents === 0) {
    if (body.grantEventId && grantEvent) {
      unitPriceCents = 2500; // Valore biglietto convenzionato evento (25€)
    } else if (bookingType === "hospitality" || venue.type === "hotel" || venue.type === "agriturismo") {
      unitPriceCents = venue.priceHotelCents || 6000;
    } else {
      unitPriceCents = venue.priceAperitivoCents || 3000;
    }
  }

  const discountPercent = 10; // Convenzione community RADICI
  const totalAmountCents = unitPriceCents * partySize;
  const discountCents = Math.round((totalAmountCents * discountPercent) / 100);
  const finalPriceCents = totalAmountCents - discountCents;

  const guestName = body.guestName?.trim() || `${me.firstName} ${me.lastName}`;
  const guestEmail = body.guestEmail?.trim().toLowerCase() || me.email;
  const guestPhone = body.guestPhone?.trim() || null;
  const confirmationToken = randomCode("bkg");

  const [newBooking] = await db
    .insert(bookings)
    .values({
      userId: me.id,
      venueId: venue.id,
      offeringId: body.offeringId ?? null,
      grantEventId: body.grantEventId ?? null,
      bookingType,
      bookingDate,
      timeSlot: body.timeSlot?.trim() || null,
      partySize,
      discountPercent,
      totalAmountCents,
      discountCents,
      finalPriceCents,
      status: "pending",
      confirmationToken,
      guestName,
      guestEmail,
      guestPhone,
      notes: body.notes?.trim() || null,
    })
    .returning();

  // 3. Genera Notifica per la struttura fornitrice
  await db.insert(notifications).values({
    venueId: venue.id,
    type: "community_booking",
    title: `Nuova Prenotazione Community: ${guestName}`,
    body: `${guestName} ha prenotato per ${partySize} ${partySize === 1 ? "persona" : "persone"} in data ${bookingDate}${body.timeSlot ? ` alle ore ${body.timeSlot}` : ""}. Importo convenzionato con sconto 10%: € ${(finalPriceCents / 100).toFixed(2)}.`,
    payload: {
      bookingId: newBooking.id,
      guestName,
      guestEmail,
      partySize,
      bookingDate,
      timeSlot: body.timeSlot,
      finalPriceCents,
      notes: body.notes,
    },
    read: false,
  });

  return NextResponse.json(
    {
      ok: true,
      booking: newBooking,
      message: `Prenotazione registrata con successo presso ${venue.name} per ${partySize} ${partySize === 1 ? "ospite" : "ospiti"}. Lo sconto community del 10% è stato applicato.`,
    },
    { status: 201 }
  );
}
