import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  bookings,
  grantEvents,
  sessions,
  transactions,
  users,
  venueOfferings,
  venues,
  vouchers,
  voucherSelections,
} from "@/db/schema";
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
    const venueId = Number(id);
    if (!venueId || isNaN(venueId)) {
      return NextResponse.json({ error: "Identificativo struttura non valido." }, { status: 400 });
    }

    const [venue] = await db.select().from(venues).where(eq(venues.id, venueId));
    if (!venue) {
      return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });
    }

    // Controllo integrità contabile e fiscale: verifica transazioni e voucher
    const txCount = (await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.venueId, venueId))).length;
    const voucherCount = (await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.venueId, venueId))).length;
    const selectionCount = (await db.select({ id: voucherSelections.id }).from(voucherSelections).where(eq(voucherSelections.venueId, venueId))).length;
    const bookingCount = (await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.venueId, venueId))).length;

    const totalActiveRecords = txCount + voucherCount + selectionCount + bookingCount;

    if (totalActiveRecords > 0) {
      return NextResponse.json(
        {
          error: `Impossibile eliminare "${venue.name}": sono registrate ${totalActiveRecords} operazioni collegate (${txCount} transazioni contabili, ${voucherCount + selectionCount} voucher welfare, ${bookingCount} prenotazioni). Per integrità fiscale, le strutture con storico operativo non possono essere eliminate.`,
        },
        { status: 400 }
      );
    }

    // Procedi con la cancellazione sicura
    // 1. Rimuovi le offerte collegate
    await db.delete(venueOfferings).where(eq(venueOfferings.venueId, venueId));

    // 2. Disaccoppia eventuali spettacoli teatrali referenziati
    await db.update(grantEvents).set({ venueId: null }).where(eq(grantEvents.venueId, venueId));

    // 3. Raccogli gli utenti gestore collegati alla venue
    const venueUsers = await db.select({ id: users.id }).from(users).where(eq(users.venueId, venueId));

    // 4. Disaccoppia providerUserId sulla venue per rompere il vincolo circolare
    await db.update(venues).set({ providerUserId: null }).where(eq(venues.id, venueId));

    // 5. Cancella la struttura
    await db.delete(venues).where(eq(venues.id, venueId));

    // 6. Rimuovi le sessioni e gli account gestore collegati
    for (const u of venueUsers) {
      await db.delete(sessions).where(eq(sessions.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }

    return NextResponse.json({ ok: true, deletedVenueId: venueId });
  } catch (error) {
    console.error("DELETE /api/promoters/venues/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione della struttura." }, { status: 500 });
  }
}
