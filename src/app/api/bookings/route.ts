import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  grantEvents,
  matchingGrants,
  notifications,
  transactions,
  users,
  venueOfferings,
  venues,
  type BookingType,
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
    bookingType?: BookingType;
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

  // 2. Calcolo Tariffa di Listino e Sconto Convenzione Community
  let unitPriceCents = 0;
  let bookingType: BookingType =
    body.bookingType ||
    (venue.type === "producer"
      ? "local_basket"
      : venue.type === "theater"
      ? "theater_event"
      : venue.type === "restaurant"
      ? "dinner"
      : "hospitality");

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
    if (venue.type === "producer" || bookingType === "local_basket") {
      unitPriceCents = venue.priceBasketCents || 3800;
    } else if (body.grantEventId && grantEvent) {
      unitPriceCents = 2500; // Valore biglietto convenzionato evento (25€)
    } else if (bookingType === "dinner") {
      unitPriceCents = venue.priceAperitivoCents || 3000;
    } else if (bookingType === "hospitality" || venue.type === "hotel" || venue.type === "agriturismo") {
      unitPriceCents = venue.priceHotelCents || 6000;
    } else {
      unitPriceCents = venue.priceAperitivoCents || 3000;
    }
  }

  // REGOLA FONDAMENTALE: Gli sconti sono riservati ESCLUSIVAMENTE agli invitati amici (ruolo "friend").
  // Per i dipendenti aziendali (ruolo "employee") non ci sono sconti: il welfare copre i loro voucher, mentre gli acquisti extra sono a tariffa piena.
  const isFriend = me.role === "friend";
  const discountPercent = isFriend ? 10 : 0;
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

  // 3. Se acquisto cesto di filiera corta, registra transazione consumer e assegna punti impatto
  if (bookingType === "local_basket") {
    const commissionBps = 1000;
    const commissionAmountCents = Math.round((finalPriceCents * commissionBps) / 10000);
    const providerNetCents = finalPriceCents - commissionAmountCents;

    await db.insert(transactions).values({
      type: "consumer_payment",
      status: "completed",
      userId: me.id,
      venueId: venue.id,
      amountCents: finalPriceCents,
      discountCents,
      listPriceCents: totalAmountCents,
      serviceLabel: `Cesto Filiera Corta: ${venue.basketName || "Prodotti KM 0"}`,
      paymentStatus: "settled",
      settledAt: new Date(),
      commissionBps,
      commissionAmountCents,
      providerNetCents,
      paymentNotes: `Acquisto Cesto Enogastronomico Filiera Corta da ${guestName}`,
    });

    const { awardImpact } = await import("@/lib/data");
    await awardImpact(me.id, venue.impactPointsGenerated || 2);
  }

  // 4. Genera Notifica per la struttura fornitrice o produttore
  await db.insert(notifications).values({
    venueId: venue.id,
    type: bookingType === "local_basket" ? "order" : "community_booking",
    title: bookingType === "local_basket" ? `Nuovo Ordine Cesto: ${guestName}` : `Nuova Prenotazione: ${guestName}`,
    body: `${guestName} ha ${bookingType === "local_basket" ? "ordinato" : "prenotato"} ${partySize} ${partySize === 1 ? (bookingType === "local_basket" ? "cesto" : "persona") : (bookingType === "local_basket" ? "cesti" : "persone")} in data ${bookingDate}${body.timeSlot ? ` (${body.timeSlot})` : ""}. Totale: € ${(finalPriceCents / 100).toFixed(2)}${discountPercent > 0 ? " (Sconto 10% applicato)" : ""}.`,
    payload: {
      bookingId: newBooking.id,
      guestName,
      guestEmail,
      partySize,
      bookingDate,
      timeSlot: body.timeSlot,
      finalPriceCents,
      bookingType,
      basketName: venue.basketName,
      notes: body.notes,
    },
    read: false,
  });

  const message =
    bookingType === "local_basket"
      ? `Ordine per il cesto "${venue.basketName || "Prodotti Locali"}" completato con successo presso ${venue.name}! Totale: € ${(finalPriceCents / 100).toFixed(2)}${discountPercent > 0 ? " (Sconto community del 10% applicato)" : ""}.`
      : `Prenotazione registrata con successo presso ${venue.name} per ${partySize} ${partySize === 1 ? "ospite" : "ospiti"}.${discountPercent > 0 ? " Lo sconto community del 10% è stato applicato." : ""}`;

  return NextResponse.json(
    {
      ok: true,
      booking: newBooking,
      message,
    },
    { status: 201 }
  );
}
