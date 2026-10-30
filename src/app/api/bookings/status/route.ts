import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  grantConfirmations,
  grantSeats,
  matchingGrants,
  notifications,
  transactions,
  vouchers,
  voucherSelections,
  venues,
} from "@/db/schema";
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

  // Sincronizzazione automatica con Voucher e Matching Grant
  if (booking.voucherId) {
    if (body.status === "cancelled") {
      // 1. Ripristina il voucher welfare ad 'available'
      await db
        .update(vouchers)
        .set({
          status: "available",
          venueId: null,
          theaterVenueId: null,
          grantEventId: null,
          redeemedAt: null,
        })
        .where(eq(vouchers.id, booking.voucherId));

      // 2. Rimuovi la selezione da voucher_selections
      await db.delete(voucherSelections).where(eq(voucherSelections.voucherId, booking.voucherId));

      // 3. Se era legato a un Matching Grant (posti teatro), liberali immediatamente
      const [grant] = await db
        .select()
        .from(matchingGrants)
        .where(eq(matchingGrants.voucherId, booking.voucherId))
        .limit(1);

      if (grant) {
        await db.delete(grantConfirmations).where(eq(grantConfirmations.matchingGrantId, grant.id));
        await db.delete(grantSeats).where(eq(grantSeats.matchingGrantId, grant.id));
        await db.delete(matchingGrants).where(eq(matchingGrants.id, grant.id));
      }

      // 4. Annulla anche la transazione B2B
      await db
        .update(transactions)
        .set({
          status: "cancelled",
          paymentStatus: "cancelled",
          paymentNotes: "Prenotazione annullata dal lavoratore. Voucher ripristinato.",
        })
        .where(and(eq(transactions.voucherId, booking.voucherId), eq(transactions.type, "welfare_redeem")));

      // 5. Annulla tutte le altre prenotazioni collegate a questo stesso voucher
      await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.voucherId, booking.voucherId));
    } else if (body.status === "presence_confirmed") {
      // Se l'utente riconferma la presenza per lo spettacolo o il soggiorno
      if (booking.bookingType === "theater_event") {
        await db
          .update(matchingGrants)
          .set({ status: "confirmed", confirmedAt: now })
          .where(eq(matchingGrants.voucherId, booking.voucherId));
      }
    }
  }

  let message = "Stato prenotazione aggiornato.";
  if (body.status === "presence_confirmed") {
    message = "Grazie! La tua presenza è stata confermata. La struttura è informata del tuo arrivo.";
  } else if (body.status === "cancelled") {
    message = booking.voucherId
      ? "Prenotazione annullata. Il voucher welfare è di nuovo disponibile nel tuo portafoglio per selezionare un altro fornitore!"
      : "Prenotazione annullata. I posti sono stati liberati per altri partecipanti.";
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
