import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, notifications, transactions, users, venues, vouchers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { awardImpact } from "@/lib/data";
import { matchesVoucher, voucherTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Solo i dipendenti possono riscattare i voucher welfare." }, { status: 403 });
  }

  const body = (await request.json()) as { voucherId?: number; venueId?: number; theaterVenueId?: number };
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
  let theaterVenue = null;
  if (isHotel && body.theaterVenueId) {
    const [th] = await db.select().from(venues).where(eq(venues.id, body.theaterVenueId)).limit(1);
    theaterVenue = th ?? null;
  }

  const now = new Date();
  await db
    .update(vouchers)
    .set({
      status: "redeemed",
      venueId: venue.id,
      theaterVenueId: theaterVenue?.id ?? null,
      redeemedAt: now
    })
    .where(eq(vouchers.id, voucher.id));

  // 1. UNICA Transazione Fiscale B2B (a carico dell'azienda per la struttura)
  // Il Matching Grant dei promotori NON è un voucher fiscale e NON deve entrare nei registri fiscali
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

  await awardImpact(me.id, venue.impactPointsGenerated + (isHotel ? 2 : 0));

  if (company) {
    await db
      .update(companies)
      .set({
        localRedistributionCents: company.localRedistributionCents + voucher.amountCents,
      })
      .where(eq(companies.id, company.id));
  }

  // Notifica fiscale ordinaria per la struttura (solo per il riscatto welfare B2B)
  const guest = `${me.firstName} ${me.lastName}`;
  await db.insert(notifications).values({
    venueId: venue.id,
    type: "welfare",
    title: "Notifica welfare · riscatto istantaneo",
    body: `L'utente dipendente "${guest}" ha riscattato ${voucherTypeLabel(voucher.type)}.`,
    payload: {
      guest,
      company: company?.name ?? "Impresa cliente",
      vat: company?.vatNumber ?? "—",
      amountCents: voucher.amountCents,
      invoiceHint: `EMETTI FATTURA DIRETTA A: Impresa Cliente ${company?.name ?? ""} (P.IVA: ${company?.vatNumber ?? "—"})`,
      vatNote: `Importo da fatturare: € ${(voucher.amountCents / 100).toFixed(2).replace(".", ",")} (IVA 10% inclusa)`,
      transactionId: tx.id,
    },
  });

  const [fresh] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);

  return NextResponse.json({
    ok: true,
    message: isHotel
      ? `Pernottamento confermato presso ${venue.name}! Matching Grant attivato: 2 biglietti per ${theaterVenue?.name ?? "Teatro Partner"} (25€ + 25€) e incontro serale con gli artisti.`
      : `Voucher ${voucherTypeLabel(voucher.type)} riscattato presso ${venue.name}.`,
    impactPoints: fresh?.impactPoints ?? me.impactPoints + 1,
    badgeLevel: fresh?.badgeLevel,
  });
}
