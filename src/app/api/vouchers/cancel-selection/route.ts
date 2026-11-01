import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { vouchers, voucherSelections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { executeVoucherCancellation } from "@/lib/welfare-cancellation";

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

  // 3. Esegui la cancellazione atomica e aggiorna voucher, notifiche, transazioni e prenotazioni
  const result = await executeVoucherCancellation({
    voucherId: voucher.id,
    userId: me.id,
    guestName: `${me.firstName} ${me.lastName}`,
  });

  return NextResponse.json(result);
}
