import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  bookings,
  grantEvents,
  sessions,
  transactions,
  users,
  venueOfferings,
  venues,
  vouchers,
  voucherSelections,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso riservato alla Startup Promotrice RADICI" }, { status: 403 });
    }

    const { id } = await params;
    const venueId = Number(id);
    if (!venueId || isNaN(venueId)) {
      return NextResponse.json({ error: "Identificativo struttura non valido." }, { status: 400 });
    }

    const [existingVenue] = await db.select().from(venues).where(eq(venues.id, venueId));
    if (!existingVenue) {
      return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      type,
      destinationId,
      city,
      province,
      region,
      description,
      longDescription,
      coverImage,
      priceHotelCents,
      priceAperitivoCents,
      priceShowCents,
      basketName,
      basketDescription,
      priceBasketCents,
      dailyCapacity,
      sponsorCompanyId,
      services,
    } = body;

    const updates: Partial<typeof venues.$inferInsert> = {};

    if (name && typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (type && typeof type === "string") {
      updates.type = type;
    }
    if (destinationId && typeof destinationId === "number") {
      updates.destinationId = destinationId;
    }
    if (city && typeof city === "string" && city.trim()) {
      updates.city = city.trim();
    }
    if (province && typeof province === "string" && province.trim()) {
      updates.province = province.trim().toUpperCase();
    }
    if (region && typeof region === "string" && region.trim()) {
      updates.region = region.trim();
    }
    if (description !== undefined && typeof description === "string") {
      updates.description = description.trim();
    }
    if (longDescription !== undefined && typeof longDescription === "string") {
      updates.longDescription = longDescription.trim();
    }
    if (coverImage && typeof coverImage === "string" && coverImage.trim()) {
      updates.coverImage = coverImage.trim();
    }
    if (priceHotelCents !== undefined) {
      updates.priceHotelCents = Math.max(0, Number(priceHotelCents) || 0);
    }
    if (priceAperitivoCents !== undefined) {
      updates.priceAperitivoCents = Math.max(0, Number(priceAperitivoCents) || 0);
    }
    if (priceShowCents !== undefined) {
      updates.priceShowCents = Math.max(0, Number(priceShowCents) || 0);
    }
    if (basketName !== undefined) {
      updates.basketName = typeof basketName === "string" && basketName.trim() ? basketName.trim() : null;
    }
    if (basketDescription !== undefined) {
      updates.basketDescription =
        typeof basketDescription === "string" && basketDescription.trim() ? basketDescription.trim() : null;
    }
    if (priceBasketCents !== undefined) {
      updates.priceBasketCents = Math.max(0, Number(priceBasketCents) || 0);
    }
    if (sponsorCompanyId !== undefined) {
      updates.sponsorCompanyId =
        sponsorCompanyId && typeof sponsorCompanyId === "number" && sponsorCompanyId > 0
          ? sponsorCompanyId
          : null;
    }
    if (services && Array.isArray(services)) {
      updates.services = services;
    }

    const [updatedVenue] = await db
      .update(venues)
      .set(updates)
      .where(eq(venues.id, venueId))
      .returning();

    // Sincronizza offerte convenzionate collegate in venue_offerings
    const targetType = updates.type || existingVenue.type;
    const hotelPrice = updates.priceHotelCents !== undefined ? updates.priceHotelCents : existingVenue.priceHotelCents;
    const foodPrice = updates.priceAperitivoCents !== undefined ? updates.priceAperitivoCents : existingVenue.priceAperitivoCents;
    const capacityVal = dailyCapacity && typeof dailyCapacity === "number" ? dailyCapacity : 10;

    if (targetType === "hotel" || targetType === "agriturismo") {
      const existingOvernight = await db
        .select()
        .from(venueOfferings)
        .where(and(eq(venueOfferings.venueId, venueId), eq(venueOfferings.benefitType, "overnight")));
      if (existingOvernight.length > 0) {
        await db
          .update(venueOfferings)
          .set({ listPriceCents: hotelPrice, dailyCapacity: capacityVal })
          .where(eq(venueOfferings.id, existingOvernight[0].id));
      } else {
        await db.insert(venueOfferings).values({
          venueId,
          benefitType: "overnight",
          name: "Soggiorno & Pernottamento Tipico",
          description: "Pernottamento in camera comfort con prima colazione artigianale dei borghi.",
          listPriceCents: hotelPrice,
          acceptsWelfare: true,
          dailyCapacity: capacityVal,
          active: true,
        });
      }

      const existingDinner = await db
        .select()
        .from(venueOfferings)
        .where(and(eq(venueOfferings.venueId, venueId), eq(venueOfferings.benefitType, "dinner")));
      if (existingDinner.length > 0) {
        await db
          .update(venueOfferings)
          .set({ listPriceCents: foodPrice, dailyCapacity: capacityVal })
          .where(eq(venueOfferings.id, existingDinner[0].id));
      } else {
        await db.insert(venueOfferings).values({
          venueId,
          benefitType: "dinner",
          name: "Degustazione Tipica & Cena Tradizionale",
          description: "Percorso enogastronomico con prodotti del territorio.",
          listPriceCents: foodPrice,
          acceptsWelfare: true,
          dailyCapacity: capacityVal,
          active: true,
        });
      }
    } else if (targetType === "restaurant") {
      const existingDinner = await db
        .select()
        .from(venueOfferings)
        .where(and(eq(venueOfferings.venueId, venueId), eq(venueOfferings.benefitType, "dinner")));
      if (existingDinner.length > 0) {
        await db
          .update(venueOfferings)
          .set({ listPriceCents: foodPrice, dailyCapacity: capacityVal })
          .where(eq(venueOfferings.id, existingDinner[0].id));
      } else {
        await db.insert(venueOfferings).values({
          venueId,
          benefitType: "dinner",
          name: "Cena Tradizionale del Borgo",
          description: "Menu della tradizione contadina locale.",
          listPriceCents: foodPrice,
          acceptsWelfare: true,
          dailyCapacity: capacityVal,
          active: true,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      venue: updatedVenue,
    });
  } catch (error) {
    console.error("PATCH /api/promoters/venues/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento della struttura." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso riservato alla Startup Promotrice RADICI" }, { status: 403 });
    }

    const { id } = await params;
    const venueId = Number(id);
    if (!venueId || isNaN(venueId)) {
      return NextResponse.json({ error: "Identificativo struttura non valido." }, { status: 400 });
    }

    const [venue] = await db.select().from(venues).where(eq(venues.id, venueId));
    if (!venue) {
      return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });
    }

    // Controllo integrità contabile e fiscale: verifica transazioni e voucher
    const txCount = (await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.venueId, venueId))).length;
    const voucherCount = (await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.venueId, venueId))).length;
    const selectionCount = (await db.select({ id: voucherSelections.id }).from(voucherSelections).where(eq(voucherSelections.venueId, venueId))).length;
    const bookingCount = (await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.venueId, venueId))).length;

    const totalActiveRecords = txCount + voucherCount + selectionCount + bookingCount;

    if (totalActiveRecords > 0) {
      return NextResponse.json(
        {
          error: `Impossibile eliminare "${venue.name}": sono registrate ${totalActiveRecords} operazioni collegate (${txCount} transazioni contabili, ${voucherCount + selectionCount} voucher welfare, ${bookingCount} prenotazioni). Per integrità fiscale, le strutture con storico operativo non possono essere eliminate.`,
        },
        { status: 400 }
      );
    }

    // Procedi con la cancellazione sicura
    // 1. Rimuovi le offerte collegate
    await db.delete(venueOfferings).where(eq(venueOfferings.venueId, venueId));

    // 2. Disaccoppia eventuali spettacoli teatrali referenziati
    await db.update(grantEvents).set({ venueId: null }).where(eq(grantEvents.venueId, venueId));

    // 3. Raccogli gli utenti gestore collegati alla venue
    const venueUsers = await db.select({ id: users.id }).from(users).where(eq(users.venueId, venueId));

    // 4. Disaccoppia providerUserId sulla venue per rompere il vincolo circolare
    await db.update(venues).set({ providerUserId: null }).where(eq(venues.id, venueId));

    // 5. Cancella la struttura
    await db.delete(venues).where(eq(venues.id, venueId));

    // 6. Rimuovi le sessioni e gli account gestore collegati
    for (const u of venueUsers) {
      await db.delete(sessions).where(eq(sessions.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }

    return NextResponse.json({ ok: true, deletedVenueId: venueId });
  } catch (error) {
    console.error("DELETE /api/promoters/venues/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione della struttura." }, { status: 500 });
  }
}
