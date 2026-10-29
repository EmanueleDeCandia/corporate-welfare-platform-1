import { NextResponse } from "next/server";
import { sqlite } from "@/db";
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

    // 2. Rimuovi selezioni e matching grant simulati
    sqlite.exec(`
      DELETE FROM voucher_selections;
      DELETE FROM grant_seats;
      DELETE FROM grant_confirmations;
      DELETE FROM matching_grants;
    `);

    // 3. Rimuovi le transazioni di riscatto simulate create durante i test
    sqlite.exec(`
      DELETE FROM transactions WHERE type = 'welfare_redeem';
    `);

    // 4. Ripristina lo stato di lettura delle notifiche ai fornitori
    sqlite.exec(`
      UPDATE notifications SET read = 0;
    `);

    return NextResponse.json({
      success: true,
      message: "Database globale ripristinato con successo: tutti i voucher sono ora disponibili.",
    });
  } catch (error) {
    console.error("Global reset error:", error);
    return NextResponse.json(
      { error: "Errore durante il ripristino globale dei dati." },
      { status: 500 }
    );
  }
}
