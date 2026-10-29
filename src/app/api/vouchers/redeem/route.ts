import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, grantEvents, notifications, transactions, users, venues, vouchers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { awardImpact } from "@/lib/data";
import { matchesVoucher, voucherTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Solo i dipendenti possono riscattare i voucher welfare." }, { status: 403 });
  }

  const body = (await request.json()) as {
    voucherId?: number;
    venueId?: number;
    theaterVenueId?: number;
    grantEventId?: number;
  };

  if (!body.voucherId || !body.venueId) {
    return NextResponse.json({ error: "Seleziona un voucher e una struttura." }, { status: 400 });
  }

  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, body.voucherId), eq(vouchers.userId, me.id)))
    .limit(1);

  if (!voucher || voucher.status !== "available") {
    return NextResponse.json({ error: "Voucher non disponibile." }, { status: 400 });
  }

  const [venue] = await db.select().from(venues).where(eq(venues.id, body.venueId)).limit(1);
  if (!venue) {
    return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });
  }
  if (!matchesVoucher(venue.type, voucher.type)) {
    return NextResponse.json(
      { error: "Questa struttura non accetta il cassetto fiscale selezionato." },
      { status: 400 },
    );
  }

  const [company] = me.companyId
    ? await db.select().from(companies).where(eq(companies.id, me.companyId)).limit(1)
    : [];

  const isHotel = voucher.type === "hotel";
  let resolvedGrantEventId: number | null = null;
  let resolvedTheaterVenueId: number | null = body.theaterVenueId ?? null;

  if (isHotel) {
    if (body.grantEventId) {
      const [ge] = await db.select().from(grantEvents).where(eq(grantEvents.id, body.grantEventId)).limit(1);
      if (ge) {
        resolvedGrantEventId = ge.id;
        if (ge.venueId) resolvedTheaterVenueId = ge.venueId;
      }
    } else if (body.theaterVenueId) {
      // Fallback: cerca o associa per venueId
      const [ge] = await db.select().from(grantEvents).where(eq(grantEvents.venueId, body.theaterVenueId)).limit(1);
      if (ge) resolvedGrantEventId = ge.id;
    }
  }

  const now = new Date();
  await db
    .update(vouchers)
    .set({
      status: "redeemed",
      venueId: venue.id,
      theaterVenueId: resolvedTheaterVenueId,
      grantEventId: resolvedGrantEventId,
      redeemedAt: now,
    })
    .where(eq(vouchers.id, voucher.id));

  // 1. UNICA Transazione Fiscale B2B (a carico dell'azienda per la struttura ricettiva)
  const [tx] = await db
    .insert(transactions)
    .values({
      type: "welfare_redeem",
      status: "completed",
      userId: me.id,
      venueId: venue.id,
      companyId: me.companyId,
      voucherId: voucher.id,
      amountCents: voucher.amountCents,
      discountCents: 0,
      listPriceCents: voucher.amountCents,
      serviceLabel: voucherTypeLabel(voucher.type),
    })
    .returning();

  // 2. Notifica B2B alla struttura con i dati di fatturazione aziendale
  await db.insert(notifications).values({
    venueId: venue.id,
    type: "welfare",
    title: `Nuovo riscatto voucher: ${voucherTypeLabel(voucher.type)}`,
    body: `${me.firstName} ${me.lastName} ha riscattato un voucher welfare da ${voucher.amountCents / 100}€. Fattura da emettere all'azienda ${company?.name ?? "sponsor"}.`,
    payload: {
      guest: `${me.firstName} ${me.lastName}`,
      company: company?.name ?? "Azienda Convenzionata",
      vat: company?.vatNumber ?? "N/D",
      amountCents: voucher.amountCents,
      invoiceHint: "Fattura elettronica B2B intestata all'azienda sponsor (Art. 51 TUIR)",
      vatNote: `Importo da fatturare: € ${(voucher.amountCents / 100).toFixed(2)}`,
      transactionId: tx.id,
    },
    read: false,
  });

  // 3. Punti Impatto al dipendente
  await awardImpact(me.id, venue.impactPointsGenerated);

  return NextResponse.json({
    success: true,
    message: isHotel
      ? "Pernottamento prenotato con successo! Il Matching Grant per l'evento selezionato è stato attivato per 2 persone."
      : "Voucher aperitivo/cena riscattato con successo!",
  });
}
