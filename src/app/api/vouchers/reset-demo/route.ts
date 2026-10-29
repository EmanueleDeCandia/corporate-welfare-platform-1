import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions, vouchers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Accesso consentito solo ai dipendenti." }, { status: 403 });
  }

  // Trova tutti i voucher dell'utente
  const myVouchers = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.userId, me.id));

  // Ripristina lo stato:
  // - L'hotel torna ad available, con venueId = null, theaterVenueId = null, redeemedAt = null
  // - L'aperitivo torna ad available
  for (const v of myVouchers) {
    await db
      .update(vouchers)
      .set({
        status: "available",
        venueId: null,
        theaterVenueId: null,
        redeemedAt: null,
      })
      .where(eq(vouchers.id, v.id));
  }

  // Rimuovi eventuali transazioni simulate create da questo utente dipendente
  await db
    .delete(transactions)
    .where(and(eq(transactions.userId, me.id), eq(transactions.type, "welfare_redeem")));

  return NextResponse.json({
    success: true,
    message: "Stato demo ripristinato: ora puoi selezionare struttura e teatro da zero.",
  });
}
