import { NextResponse } from "next/server";
import { sqlite } from "@/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1. Resetta tutti i voucher nel database a 'available'
    // Ripristinando lo stato pulito iniziale per tutti i dipendenti di tutte le aziende
    sqlite.exec(`
      UPDATE vouchers
      SET status = 'available',
          venue_id = NULL,
          theater_venue_id = NULL,
          grant_event_id = NULL,
          redeemed_at = NULL;
    `);

    // 2. Rimuovi le transazioni di riscatto simulate create durante i test
    sqlite.exec(`
      DELETE FROM transactions WHERE type = 'welfare_redeem';
    `);

    // 3. Ripristina lo stato di lettura delle notifiche ai fornitori
    sqlite.exec(`
      UPDATE notifications SET read = 0;
    `);

    return NextResponse.json({
      success: true,
      message: "Database globale ripristinato con successo: tutti i voucher di tutti i dipendenti sono ora disponibili e pronti per nuovi test.",
    });
  } catch (error) {
    console.error("Global reset error:", error);
    return NextResponse.json(
      { error: "Errore durante il ripristino globale dei dati." },
      { status: 500 }
    );
  }
}
