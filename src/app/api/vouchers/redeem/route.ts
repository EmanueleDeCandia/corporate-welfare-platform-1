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

  const body = (await request.json()) as { voucherId?: number; venueId?: number };
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

  const now = new Date();
  await db
    .update(vouchers)
    .set({ status: "redeemed", venueId: venue.id, redeemedAt: now })
    .where(eq(vouchers.id, voucher.id));

  // 1. Transazione Welfare Aziendale (B2B)
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

  // 2. MATCHING GRANT PROMOTORI (SOLO PER VOUCHER PERNOTTAMENTO)
  // Valore identico a 50€:
  // - Biglietto Spettacolo Omaggio
  // - Incontro serale con gli artisti in Hotel
  // - Evento del giorno successivo organizzato dal Comune
  const isHotel = voucher.type === "hotel";
  if (isHotel) {
    await db.insert(transactions).values({
      type: "welfare_redeem",
      status: "completed",
      userId: me.id,
      venueId: venue.id,
      companyId: null, // Finanziato dai Promotori / Matching Grant (non dall'azienda)
      voucherId: null,
      amountCents: 5000, // 50,00 € identico al voucher pernottamento
      discountCents: 0,
      listPriceCents: 5000,
      serviceLabel: "Matching Grant Promotori (50€): Biglietto Spettacolo + Incontro Artisti in Hotel + Evento Comune",
    });
  }

  await awardImpact(me.id, venue.impactPointsGenerated + (isHotel ? 2 : 0));

  if (company) {
    await db
      .update(companies)
      .set({
        localRedistributionCents: company.localRedistributionCents + voucher.amountCents,
      })
      .where(eq(companies.id, company.id));
  }

  const guest = `${me.firstName} ${me.lastName}`;
  await db.insert(notifications).values({
    venueId: venue.id,
    type: "welfare",
    title: isHotel ? "Riscatto Pernottamento + Matching Grant Attivato (50€)" : "Notifica welfare · riscatto istantaneo",
    body: `L'utente dipendente "${guest}" ha riscattato ${voucherTypeLabel(voucher.type)} presso la tua struttura.${
      isHotel
        ? " ATTIVATO MATCHING GRANT PROMOTORI (50€): Omaggio Biglietto Spettacolo + Incontro serale artisti in Hotel + Evento Comune."
        : ""
    }`,
    payload: {
      guest,
      company: company?.name ?? "Impresa cliente",
      vat: company?.vatNumber ?? "—",
      amountCents: voucher.amountCents,
      invoiceHint: `EMETTI FATTURA DIRETTA A: Impresa Cliente ${company?.name ?? ""} (P.IVA: ${company?.vatNumber ?? "—"})`,
      vatNote: `Importo da fatturare: € ${(voucher.amountCents / 100).toFixed(2).replace(".", ",")} (IVA 10% inclusa)`,
      matchingGrant: isHotel
        ? "Matching Grant Promotori (50€): Biglietto Spettacolo + Incontro con gli Artisti in Hotel + Evento Comune giorno dopo."
        : undefined,
      transactionId: tx.id,
    },
  });

  const [fresh] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);

  return NextResponse.json({
    ok: true,
    message: isHotel
      ? `Pernottamento confermato presso ${venue.name}! I Promotori hanno attivato il Matching Grant da 50€: Biglietto Spettacolo + Incontro con gli artisti in Hotel + Evento Comune.`
      : `Voucher ${voucherTypeLabel(voucher.type)} riscattato presso ${venue.name}.`,
    impactPoints: fresh?.impactPoints ?? me.impactPoints + 1,
    badgeLevel: fresh?.badgeLevel,
  });
}
