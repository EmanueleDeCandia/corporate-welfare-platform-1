import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { bookings, grantEvents, matchingGrants, vouchers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso riservato alla Startup Promotrice RADICI" }, { status: 403 });
    }

    const { id } = await params;
    const eventId = Number(id);
    if (!eventId || isNaN(eventId)) {
      return NextResponse.json({ error: "Identificativo evento non valido." }, { status: 400 });
    }

    const [event] = await db.select().from(grantEvents).where(eq(grantEvents.id, eventId));
    if (!event) {
      return NextResponse.json({ error: "Spettacolo / Evento non trovato." }, { status: 404 });
    }

    // Verifica se ci sono assegnazioni o prenotazioni attive collegate a questo spettacolo
    const grantCount = (await db.select({ id: matchingGrants.id }).from(matchingGrants).where(eq(matchingGrants.eventId, eventId))).length;
    const voucherCount = (await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.grantEventId, eventId))).length;
    const bookingCount = (await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.grantEventId, eventId))).length;

    const totalActiveGrantsAndBookings = grantCount + voucherCount + bookingCount;

    if (totalActiveGrantsAndBookings > 0) {
      return NextResponse.json(
        {
          error: `Impossibile eliminare lo spettacolo "${event.title}": sono presenti ${totalActiveGrantsAndBookings} prenotazioni o voucher matching grant assegnati (${grantCount + voucherCount} welfare, ${bookingCount} community). Per evitare overbooking o cancellazioni arbitrarie agli ospiti, l'evento non può essere rimosso.`,
        },
        { status: 400 }
      );
    }

    await db.delete(grantEvents).where(eq(grantEvents.id, eventId));

    return NextResponse.json({ ok: true, deletedEventId: eventId });
  } catch (error) {
    console.error("DELETE /api/promoters/events/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione dello spettacolo." }, { status: 500 });
  }
}

