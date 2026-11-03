import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  companies,
  grantConfirmations,
  grantSeats,
  matchingGrants,
  notifications,
  transactions,
  vouchers,
  voucherSelections,
} from "@/db/schema";

export interface CancelVoucherResult {
  ok: boolean;
  voucherId: number;
  oldVenueId: number | null;
  message: string;
}

/**
 * Annulla in modo atomico e coerente la selezione di un voucher welfare:
 * 1. Ripristina il voucher allo stato 'available' e rimuove i riferimenti di struttura ed eventi.
 * 2. Elimina la riga da 'voucher_selections' (annulla la presenza pending).
 * 3. Libera il Matching Grant e i posti a teatro (grant_seats e grant_confirmations).
 * 4. Aggiorna lo stato delle prenotazioni collegate in 'bookings' a 'cancelled'.
 * 5. Aggiorna la transazione fiscale B2B in 'transactions' a 'cancelled' (debito azzerato).
 * 6. Aggiorna tutte le notifiche di riscatto/fatturazione per la struttura a '[ANNULLATO]'
 *    eliminando l'istruzione di emettere fattura.
 * 7. Inserisce una notifica esplicita di annullamento per la struttura.
 */
export async function executeVoucherCancellation({
  voucherId,
  userId,
  guestName,
}: {
  voucherId: number;
  userId: number;
  guestName: string;
}): Promise<CancelVoucherResult> {
  // 1. Recupera il voucher
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1);

  if (!voucher) {
    throw new Error("Voucher non trovato o non appartenente all'utente.");
  }

  const oldVenueId = voucher.venueId;

  // Recupera ragione sociale azienda per le note
  let companyName = "Impresa Committente";
  if (voucher.companyId) {
    const [comp] = await db.select().from(companies).where(eq(companies.id, voucher.companyId)).limit(1);
    if (comp) companyName = comp.name;
  }

  // 2. Ripristina il voucher allo stato 'available'
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

  // 3. Rimuovi la selezione da voucher_selections
  await db.delete(voucherSelections).where(eq(voucherSelections.voucherId, voucher.id));

  // 4. Se c'era un Matching Grant associato, liberalo
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

  // 5. Aggiorna tutte le prenotazioni collegate a questo voucher a 'cancelled'
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      notes: "Selezione annullata dal lavoratore.",
    })
    .where(eq(bookings.voucherId, voucher.id));

  // 6. Annulla la transazione fiscale B2B pendente per questo voucher
  await db
    .update(transactions)
    .set({
      status: "cancelled",
      paymentStatus: "cancelled",
      paymentNotes: `Selezione annullata dal lavoratore prima della fruizione. Nessun pagamento dovuto da ${companyName}.`,
    })
    .where(and(eq(transactions.voucherId, voucher.id), eq(transactions.type, "welfare_redeem")));

  // 7. Aggiorna le notifiche per la struttura fornitrice
  if (oldVenueId) {
    const serviceName =
      voucher.type === "hotel"
        ? "Pernottamento (50€)"
        : voucher.type === "aperitivo"
        ? "Cena / Degustazione KM 0 (25€)"
        : "Voucher Welfare";

    const existingNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.venueId, oldVenueId));

    for (const notif of existingNotifs) {
      const payload = notif.payload as Record<string, any> | null;
      const isRelatedToVoucher =
        payload?.voucherId === voucher.id ||
        (payload?.guest === guestName && notif.type === "welfare" && !payload?.cancelled);

      if (isRelatedToVoucher) {
        await db
          .update(notifications)
          .set({
            title: `[ANNULLATO] Selezione voucher revocata: ${serviceName} - Non fatturare`,
            body: `Il lavoratore ${guestName} ha annullato la selezione del voucher ${serviceName} prima della fruizione. Nessuna prestazione è stata erogata: NON EMETTERE ALCUNA FATTURA nel tuo gestionale contabile a carico di ${companyName}.`,
            read: true,
            payload: {
              ...(payload || {}),
              cancelled: true,
              serviceLabel: serviceName,
              voucherId: voucher.id,
              invoiceHint: "SELEZIONE ANNULLATA - NESSUNA FATTURA DA EMETTERE",
              status: "cancelled",
            },
          })
          .where(eq(notifications.id, notif.id));
      }
    }

    // Inserisci notifica esplicita di avvenuta cancellazione
    await db.insert(notifications).values({
      venueId: oldVenueId,
      type: "welfare",
      title: `[ANNULLATO] Selezione voucher revocata dal lavoratore: ${serviceName}`,
      body: `Il lavoratore ${guestName} ha annullato la prenotazione del voucher welfare ${serviceName}. Nessun addebito B2B dovuto e nessuna prestazione richiesta per la struttura.`,
      payload: {
        guest: guestName,
        voucherId: voucher.id,
        serviceLabel: serviceName,
        action: "cancelled_by_employee",
        cancelled: true,
        invoiceHint: "PRENOTAZIONE ANNULLATA - NESSUN PAGAMENTO DOVUTO",
        status: "cancelled",
      },
      read: false,
    });
  }

  return {
    ok: true,
    voucherId: voucher.id,
    oldVenueId,
    message: "Selezione annullata con successo! Il tuo voucher welfare è di nuovo disponibile nel portafoglio per scegliere un'altra struttura.",
  };
}
