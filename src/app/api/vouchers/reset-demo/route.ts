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

    // 3. Rimuovi tutte le transazioni di prova e riscatto demo
    sqlite.exec(`
      DELETE FROM transactions;
    `);

    // 4. Rimuovi tutte le notifiche per rendere l'ambiente delle notifiche completamente pulito
    sqlite.exec(`
      DELETE FROM notifications;
    `);

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
