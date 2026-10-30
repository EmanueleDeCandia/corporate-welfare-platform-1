import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  companies,
  grantConfirmations,
  grantEvents,
  grantSeats,
  matchingGrants,
  notifications,
  transactions,
  users,
  venueOfferings,
  venues,
  vouchers,
  voucherSelections,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { awardImpact } from "@/lib/data";
import { randomCode, voucherTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Solo i dipendenti possono selezionare i voucher welfare." }, { status: 403 });
  }

  const body = (await request.json()) as {
    voucherId?: number;
    venueId?: number;
    offeringId?: number;
    serviceDate?: string;
    grantEventId?: number;
    grantSeatsCount?: number;
  };

  if (!body.voucherId || !body.venueId) {
    return NextResponse.json({ error: "Seleziona un voucher e una struttura." }, { status: 400 });
  }

  const serviceDate = body.serviceDate || new Date().toISOString().split("T")[0];

  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, body.voucherId), eq(vouchers.userId, me.id)))
    .limit(1);

  if (!voucher || voucher.status !== "available") {
    return NextResponse.json({ error: "Voucher non disponibile o già selezionato." }, { status: 400 });
  }

  const [venue] = await db.select().from(venues).where(eq(venues.id, body.venueId)).limit(1);
  if (!venue) {
    return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });
  }

  // Verifica offering attiva o compatibilità servizio
  let offeringId = body.offeringId ?? null;
  if (!offeringId) {
    const isOvernight = voucher.type === "hotel" || voucher.type === "overnight";
    const [matchingOffering] = await db
      .select()
      .from(venueOfferings)
      .where(
        and(
          eq(venueOfferings.venueId, venue.id),
          eq(venueOfferings.benefitType, isOvernight ? "overnight" : "dinner"),
          eq(venueOfferings.acceptsWelfare, true),
          eq(venueOfferings.active, true)
        )
      )
      .limit(1);

    if (matchingOffering) {
      offeringId = matchingOffering.id;
    }
  }

  const [company] = me.companyId
    ? await db.select().from(companies).where(eq(companies.id, me.companyId)).limit(1)
    : [];

  const isOvernightVoucher = voucher.type === "hotel" || voucher.type === "overnight";

  // Gestione evento Matching Grant (riservato solo a chi seleziona Pernottamento)
  let selectedEvent: typeof grantEvents.$inferSelect | null = null;
  if (isOvernightVoucher) {
    if (body.grantEventId) {
      const [ge] = await db.select().from(grantEvents).where(eq(grantEvents.id, body.grantEventId)).limit(1);
      if (ge && ge.active) selectedEvent = ge;
    }
    if (!selectedEvent) {
      const [fallbackEvent] = await db.select().from(grantEvents).where(eq(grantEvents.active, true)).limit(1);
      selectedEvent = fallbackEvent ?? null;
    }
  }

  const now = new Date();

  // ATOMIC UPDATE: Aggiorna lo stato del voucher
  await db
    .update(vouchers)
    .set({
      status: "selected",
      venueId: venue.id,
      grantEventId: selectedEvent?.id ?? null,
      theaterVenueId: selectedEvent?.venueId ?? null,
      redeemedAt: now,
    })
    .where(and(eq(vouchers.id, voucher.id), eq(vouchers.status, "available")));

  // Registra selezione puntuale del voucher per monitoraggio presenze/no-show
  await db
    .insert(voucherSelections)
    .values({
      voucherId: voucher.id,
      venueId: venue.id,
      offeringId,
      serviceDate,
      selectedAt: now,
      attendanceStatus: "pending",
      notes: "Voucher selezionato dal dipendente. Addebito B2B confermato.",
    })
    .onConflictDoNothing();

  // Scelta posti Matching Grant: 1 persona (25€) o 2 persone (50€ = 25€ + 25€)
  const grantSeatsCount = body.grantSeatsCount === 1 ? 1 : 2;
  const grantAmountCents = grantSeatsCount * 2500;

  // Se pernottamento: crea Matching Grant riservato (1 o 2 posti secondo la scelta dell'utente) e predispone la conferma
  if (isOvernightVoucher && selectedEvent) {
    const [grant] = await db
      .insert(matchingGrants)
      .values({
        voucherId: voucher.id,
        eventId: selectedEvent.id,
        amountCents: grantAmountCents,
        seatsRequested: grantSeatsCount,
        status: "assigned",
        assignedAt: now,
      })
      .returning();

    if (grant) {
      // Posto 1: Dipendente Beneficiario (25€)
      await db.insert(grantSeats).values({
        matchingGrantId: grant.id,
        holderRole: "employee",
        holderName: `${me.firstName} ${me.lastName}`,
        holderEmail: me.email,
        valueCents: 2500,
      });

      // Se ha scelto 2 persone: aggiungi Posto 2 per l'Accompagnatore (25€)
      if (grantSeatsCount === 2) {
        await db.insert(grantSeats).values({
          matchingGrantId: grant.id,
          holderRole: "companion",
          holderName: "Accompagnatore",
          holderEmail: null,
          valueCents: 2500,
        });
      }

      // Calcola finestra conferma (T-7 invio, T-3 scadenza)
      const eventStart = selectedEvent.startsAt || new Date(Date.now() + 30 * 24 * 3600 * 1000);
      const scheduledFor = new Date(eventStart.getTime() - (selectedEvent.confirmationSendDays || 7) * 24 * 3600 * 1000);
      const respondBy = new Date(eventStart.getTime() - (selectedEvent.confirmationDeadlineDays || 3) * 24 * 3600 * 1000);

      await db.insert(grantConfirmations).values({
        matchingGrantId: grant.id,
        token: randomCode("conf"),
        scheduledFor,
        respondBy,
        sentAt: null,
        response: null,
        reminderCount: 0,
      });
    }
  }

  // 1. Transazione Fiscale B2B (obbligazione contrattuale a carico dell'azienda per la struttura)
  const amountCents = voucher.amountCents;
  const commissionBps = 1000; // 10% commissione startup Radici
  const commissionAmountCents = Math.round((amountCents * commissionBps) / 10000);
  const providerNetCents = amountCents - commissionAmountCents;

  const [tx] = await db
    .insert(transactions)
    .values({
      type: "welfare_redeem",
      status: "completed",
      userId: me.id,
      venueId: venue.id,
      companyId: me.companyId,
      voucherId: voucher.id,
      amountCents,
      discountCents: 0,
      listPriceCents: amountCents,
      serviceLabel: voucherTypeLabel(voucher.type),
      paymentStatus: "pending", // In attesa di saldo da parte dell'azienda committente
      commissionBps,
      commissionAmountCents,
      providerNetCents,
      paymentNotes: `Debito welfare aziendale ${company?.name ?? "CSR"} ex Art. 51 TUIR`,
    })
    .returning();

  // 2. Notifica B2B alla struttura con i dati di fatturazione aziendale
  await db.insert(notifications).values({
    venueId: venue.id,
    type: "welfare",
    title: `Nuovo riscatto voucher: ${voucherTypeLabel(voucher.type)}`,
    body: `${me.firstName} ${me.lastName} ha riscattato un voucher welfare da ${(amountCents / 100).toFixed(2)}€. Il pagamento è dovuto dall'impresa ${company?.name ?? "sponsor"} indipendentemente dalla presenza fisica.`,
    payload: {
      guest: `${me.firstName} ${me.lastName}`,
      company: company?.name ?? "Azienda Convenzionata",
      vat: company?.vatNumber ?? "N/D",
      amountCents,
      commissionAmountCents,
      providerNetCents,
      invoiceHint: `EMETTI FATTURA NEL TUO GESTIONALE A: ${company?.name ?? "Azienda"} (P.IVA: ${company?.vatNumber ?? "N/D"})`,
      vatNote: `Lordo: € ${(amountCents / 100).toFixed(2)} | Fee Radici (10%): € ${(commissionAmountCents / 100).toFixed(2)} | Netto fornitore: € ${(providerNetCents / 100).toFixed(2)}`,
      transactionId: tx.id,
      serviceDate,
    },
    read: false,
  });

  // 3. Registra le prenotazioni in "bookings" per consentire al dipendente di gestire presenze e annullamenti come un utente amico
  if (isOvernightVoucher) {
    // Prenotazione Struttura Ricettiva (Hotel / Agriturismo) - 1 Persona Quota Welfare
    await db.insert(bookings).values({
      userId: me.id,
      venueId: venue.id,
      voucherId: voucher.id,
      bookingType: "hospitality",
      bookingDate: serviceDate,
      timeSlot: "Check-in standard",
      partySize: 1, // 1 Persona: quota nominale welfare dipendente
      discountPercent: 0,
      totalAmountCents: amountCents,
      discountCents: amountCents, // 100% coperto da welfare aziendale
      finalPriceCents: 0,
      status: "confirmed",
      confirmationToken: randomCode("bkg-welfare"),
      guestName: `${me.firstName} ${me.lastName}`,
      guestEmail: me.email,
      notes: `Pernottamento Welfare (1 Persona / Quota Dipendente · 100% finanziato da ${company?.name ?? "Impresa CSR"})`,
    });

    // Prenotazione Spettacolo Teatrale Matching Grant (Omaggio Promotori) - Posti Scelti (1 o 2)
    if (selectedEvent) {
      await db.insert(bookings).values({
        userId: me.id,
        venueId: selectedEvent.venueId || venue.id,
        grantEventId: selectedEvent.id,
        voucherId: voucher.id,
        bookingType: "theater_event",
        bookingDate: selectedEvent.startsAt
          ? selectedEvent.startsAt.toISOString().split("T")[0]
          : serviceDate,
        timeSlot: "Inizio Spettacolo",
        partySize: grantSeatsCount, // 1 o 2 Posti scelti dal dipendente
        discountPercent: 0,
        totalAmountCents: grantAmountCents,
        discountCents: grantAmountCents, // 100% omaggio offerto dai Promotori
        finalPriceCents: 0,
        status: "confirmed",
        confirmationToken: randomCode("bkg-grant"),
        guestName: `${me.firstName} ${me.lastName}`,
        guestEmail: me.email,
        notes: `Omaggio Matching Grant Promotori (${grantSeatsCount} ${grantSeatsCount === 1 ? "posto platea" : "posti platea"} · ${selectedEvent.title})`,
      });
    }
  } else {
    // Prenotazione Cena / Degustazione KM 0 - 1 Persona Quota Welfare
    await db.insert(bookings).values({
      userId: me.id,
      venueId: venue.id,
      voucherId: voucher.id,
      bookingType: "dinner",
      bookingDate: serviceDate,
      timeSlot: "Cena ore 20:30",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: amountCents,
      discountCents: amountCents, // 100% coperto da welfare aziendale
      finalPriceCents: 0,
      status: "confirmed",
      confirmationToken: randomCode("bkg-welfare"),
      guestName: `${me.firstName} ${me.lastName}`,
      guestEmail: me.email,
      notes: `Cena & Degustazione KM 0 con Voucher Welfare (1 Persona · 100% finanziato da ${company?.name ?? "Impresa CSR"})`,
    });
  }

  // 3. Punti Impatto al dipendente
  await awardImpact(me.id, venue.impactPointsGenerated);

  return NextResponse.json({
    success: true,
    message: isOvernightVoucher
      ? `Pernottamento confermato presso ${venue.name}! Il Matching Grant (2 ingressi con posti riservati) per "${selectedEvent?.title ?? "Spettacolo"}" è stato attivato.`
      : `Voucher cena/aperitivo confermato presso ${venue.name}!`,
  });
}
