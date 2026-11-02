import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, sqlite } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  try {
    // 1. Resetta tutti i voucher nel database a 'available'
    sqlite.exec(`
      UPDATE vouchers
      SET status = 'available',
          venue_id = NULL,
          theater_venue_id = NULL,
          grant_event_id = NULL,
          redeemed_at = NULL;
    `);

    // 2. Rimuovi selezioni, prenotazioni welfare e matching grant simulati
    sqlite.exec(`
      DELETE FROM voucher_selections;
      DELETE FROM grant_seats;
      DELETE FROM grant_confirmations;
      DELETE FROM matching_grants;
      DELETE FROM bookings WHERE voucher_id IS NOT NULL;
    `);

    // 3. Rimuovi le transazioni di riscatto simulate create durante i test
    sqlite.exec(`
      DELETE FROM transactions WHERE type = 'welfare_redeem';
    `);

    // 4. Annulla e revoca esplicitamente tutte le notifiche di fatturazione welfare per i fornitori
    const welfareNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, "welfare"));

    for (const notif of welfareNotifs) {
      const payload = (notif.payload as Record<string, any>) || {};
      if (!payload.cancelled || !notif.title.includes("[ANNULLATO]")) {
        await db
          .update(notifications)
          .set({
            title: `[ANNULLATO] Selezione voucher revocata - Non fatturare`,
            body: `La selezione demo del voucher welfare è stata azzerata. Nessun addebito B2B dovuto e nessuna prestazione richiesta per la struttura.`,
            read: true,
            payload: {
              ...payload,
              cancelled: true,
              invoiceHint: "SELEZIONE ANNULLATA - NESSUNA FATTURA DA EMETTERE",
              status: "cancelled",
            },
          })
          .where(eq(notifications.id, notif.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database globale ripristinato con successo: tutti i voucher sono ora disponibili e le notifiche di fatturazione sono state revocate.",
    });
  } catch (error) {
    console.error("Global reset error:", error);
    return NextResponse.json(
      { error: "Errore durante il ripristino globale dei dati." },
      { status: 500 }
    );
  }
}
