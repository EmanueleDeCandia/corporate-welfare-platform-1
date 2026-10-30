import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  const body = (await request.json()) as {
    bookingId?: number;
    status?:
      | "pending"
      | "confirmed"
      | "presence_confirmed"
      | "rejected"
      | "cancelled"
      | "attended"
      | "no_show";
    notes?: string;
  };

  if (!body.bookingId || !body.status) {
    return NextResponse.json(
      { error: "ID prenotazione e nuovo stato obbligatori." },
      { status: 400 }
    );
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, body.bookingId))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ error: "Prenotazione non trovata." }, { status: 404 });
  }

  // Controllo autorizzazioni
  const isGuestOwner = booking.userId === me.id;
  const isVenueOwner = me.role === "provider" && me.venueId === booking.venueId;
  const isPromoterOrAdmin = me.role === "promoter" || me.role === "admin";

  if (!isGuestOwner && !isVenueOwner && !isPromoterOrAdmin) {
    return NextResponse.json(
      { error: "Non sei autorizzato a modificare questa prenotazione." },
      { status: 403 }
    );
  }

  // Vincoli logici sui ruoli:
  // - L'ospite (guest) può confermare la propria presenza ('presence_confirmed') o annullare ('cancelled')
  if (isGuestOwner && !isVenueOwner && !isPromoterOrAdmin) {
    if (body.status !== "presence_confirmed" && body.status !== "cancelled") {
      return NextResponse.json(
        { error: "Come ospite puoi solo riconfermare la presenza o annullare la prenotazione." },
        { status: 403 }
      );
    }
  }

  const now = new Date();
  const updates: Partial<typeof bookings.$inferInsert> = {
    status: body.status,
  };

  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (body.status === "confirmed") {
    updates.confirmedAt = now;
  } else if (body.status === "presence_confirmed") {
    updates.presenceConfirmedAt = now;
  } else if (body.status === "attended") {
    updates.attendedAt = now;
  }

  const [updated] = await db
    .update(bookings)
    .set(updates)
    .where(eq(bookings.id, booking.id))
    .returning();

  let message = "Stato prenotazione aggiornato.";
  if (body.status === "presence_confirmed") {
    message = "Grazie! La tua presenza è stata confermata. La struttura è informata del tuo arrivo.";
  } else if (body.status === "cancelled") {
    message = "Prenotazione annullata. I posti sono stati liberati per altri partecipanti.";
  } else if (body.status === "confirmed") {
    message = "Prenotazione confermata con successo.";
  } else if (body.status === "attended") {
    message = "Presenza convalidata al check-in.";
  } else if (body.status === "no_show") {
    message = "Segnalato no-show per la prenotazione.";
  }

  return NextResponse.json({
    ok: true,
    booking: updated,
    message,
  });
}
