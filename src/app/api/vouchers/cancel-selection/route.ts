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
  if (!me || me.role !== "employee") {
    return NextResponse.json(
      { error: "Accesso riservato ai dipendenti titolari di voucher welfare." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    voucherId?: number;
  };

  if (!body.voucherId) {
    return NextResponse.json({ error: "ID voucher mancante." }, { status: 400 });
  }

  // 1. Recupera il voucher appartenente all'utente loggato
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, body.voucherId), eq(vouchers.userId, me.id)))
    .limit(1);

  if (!voucher) {
    return NextResponse.json({ error: "Voucher non trovato." }, { status: 404 });
  }

  if (voucher.status !== "selected") {
    return NextResponse.json(
      { error: "Puoi annullare la selezione solo di un voucher attualmente selezionato/prenotato." },
      { status: 400 }
    );
  }

  // 2. Verifica se la presenza è già stata convalidata dal fornitore
  const [selection] = await db
    .select()
    .from(voucherSelections)
    .where(eq(voucherSelections.voucherId, voucher.id))
    .limit(1);

  if (selection && selection.attendanceStatus === "attended") {
    return NextResponse.json(
      { error: "Il servizio è già stato convalidato dal fornitore, non è più possibile annullare." },
      { status: 400 }
    );
  }

  const oldVenueId = voucher.venueId;

  // 3. Ripristina il voucher allo stato 'available'
  await db
    .update(vouchers)
    .set({
      status: "available",
      venueId: null,
      theaterVenueId: null,
      grantEventId: null,
      redeemedAt: null,
    })
    .where(eq(vouchers.id, voucher.id));

  // 4. Rimuovi la selezione da voucher_selections
  await db.delete(voucherSelections).where(eq(voucherSelections.voucherId, voucher.id));

  // 5. Se c'era un Matching Grant associato (posti a teatro riservati), liberalo
  const [grant] = await db
    .select()
    .from(matchingGrants)
    .where(eq(matchingGrants.voucherId, voucher.id))
    .limit(1);

  if (grant) {
    await db.delete(grantConfirmations).where(eq(grantConfirmations.matchingGrantId, grant.id));
    await db.delete(grantSeats).where(eq(grantSeats.matchingGrantId, grant.id));
    await db.delete(matchingGrants).where(eq(matchingGrants.id, grant.id));
  }

  // 6. Elimina le prenotazioni collegate in "bookings"
  await db.delete(bookings).where(eq(bookings.voucherId, voucher.id));

  // 7. Annulla la transazione fiscale B2B pendente per questo voucher
  await db
    .update(transactions)
    .set({
      status: "cancelled",
      paymentStatus: "cancelled",
      paymentNotes: "Selezione annullata dal lavoratore prima della fruizione. Debito riaccreditato.",
    })
    .where(and(eq(transactions.voucherId, voucher.id), eq(transactions.type, "welfare_redeem")));

  // 7. Invia notifica alla struttura precedentemente selezionata
  if (oldVenueId) {
    await db.insert(notifications).values({
      venueId: oldVenueId,
      type: "welfare",
      title: "Selezione voucher annullata dal lavoratore",
      body: `Il lavoratore ${me.firstName} ${me.lastName} ha annullato la prenotazione del voucher welfare. Nessun addebito B2B dovuto per questa struttura.`,
      payload: {
        guest: `${me.firstName} ${me.lastName}`,
        voucherId: voucher.id,
        action: "cancelled_by_employee",
      },
      read: false,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Selezione annullata con successo! Il tuo voucher welfare è di nuovo disponibile nel portafoglio per scegliere un'altra struttura.",
    voucherId: voucher.id,
  });
}
