import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  companies,
  sessions,
  transactions,
  users,
  venues,
  vouchers,
  welfarePlans,
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
    const companyId = Number(id);
    if (!companyId || isNaN(companyId)) {
      return NextResponse.json({ error: "Identificativo azienda non valido." }, { status: 400 });
    }

    const [existingCompany] = await db.select().from(companies).where(eq(companies.id, companyId));
    if (!existingCompany) {
      return NextResponse.json({ error: "Impresa non trovata." }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      vatNumber,
      city,
      sector,
      employeesCount,
      fundedAmountCents,
      description,
      localImpactDescription,
      reportUrl,
      sponsoredVenueId,
      accent,
    } = body;

    const updates: Partial<typeof companies.$inferInsert> = {};

    if (name && typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (vatNumber && typeof vatNumber === "string" && vatNumber.trim()) {
      updates.vatNumber = vatNumber.trim().toUpperCase();
    }
    if (city && typeof city === "string" && city.trim()) {
      updates.city = city.trim();
    }
    if (sector && typeof sector === "string" && sector.trim()) {
      updates.sector = sector.trim();
    }
    if (description !== undefined && typeof description === "string") {
      updates.description = description.trim();
    }
    if (localImpactDescription !== undefined) {
      updates.localImpactDescription =
        typeof localImpactDescription === "string" && localImpactDescription.trim()
          ? localImpactDescription.trim()
          : null;
    }
    if (reportUrl !== undefined) {
      updates.reportUrl =
        typeof reportUrl === "string" && reportUrl.trim() ? reportUrl.trim() : null;
    }
    if (accent && typeof accent === "string") {
      updates.accent = accent;
    }

    let numEmployees = existingCompany.employeesCount;
    if (employeesCount !== undefined) {
      numEmployees = Math.max(1, Number(employeesCount) || existingCompany.employeesCount);
      updates.employeesCount = numEmployees;
      // Stima aggiornata CO2 basata sui dipendenti
      updates.co2SavedKg = Math.round(numEmployees * 15);
      // Aggiorna anche il piano welfare attivo per l'anno in corso
      await db
        .update(welfarePlans)
        .set({ eligibleEmployees: numEmployees })
        .where(eq(welfarePlans.companyId, companyId));
    }

    if (fundedAmountCents !== undefined) {
      const numFunded = Math.max(0, Number(fundedAmountCents) || 0);
      updates.fundedAmountCents = numFunded;
      // Ricalcolo non arbitrario della redistribuzione economica sul territorio (moltiplicatore 5,1x)
      updates.localRedistributionCents = Math.round(numFunded * 5.1);
    }

    // Esegui aggiornamento azienda
    const [updatedCompany] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, companyId))
      .returning();

    // Gestione della struttura sponsorizzata (se inviata nel payload)
    if (sponsoredVenueId !== undefined) {
      // Disaccoppia prima eventuali strutture già sponsorizzate da questa azienda
      await db
        .update(venues)
        .set({ sponsorCompanyId: null })
        .where(eq(venues.sponsorCompanyId, companyId));

      if (sponsoredVenueId && typeof sponsoredVenueId === "number" && sponsoredVenueId > 0) {
        await db
          .update(venues)
          .set({ sponsorCompanyId: companyId })
          .where(eq(venues.id, sponsoredVenueId));
      }
    }

    return NextResponse.json({
      ok: true,
      company: updatedCompany,
    });
  } catch (error) {
    console.error("PATCH /api/promoters/companies/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento dell'impresa CSR." }, { status: 500 });
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
    const companyId = Number(id);
    if (!companyId || isNaN(companyId)) {
      return NextResponse.json({ error: "Identificativo azienda non valido." }, { status: 400 });
    }

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
    if (!company) {
      return NextResponse.json({ error: "Impresa non trovata." }, { status: 404 });
    }

    // Controllo integrità contrattuale e contabile
    const voucherCount = (await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.companyId, companyId))).length;
    const txCount = (await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.companyId, companyId))).length;
    const employeeCount = (
      await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.companyId, companyId), eq(users.role, "employee")))
    ).length;
    const sponsorCount = (await db.select({ id: venues.id }).from(venues).where(eq(venues.sponsorCompanyId, companyId))).length;

    const totalActiveRecords = voucherCount + txCount + employeeCount + sponsorCount;

    if (totalActiveRecords > 0) {
      return NextResponse.json(
        {
          error: `Impossibile eliminare "${company.name}": sono registrate ${totalActiveRecords} operazioni collegate (${voucherCount} voucher welfare emessi, ${txCount} transazioni contabili, ${employeeCount} dipendenti a carico, ${sponsorCount} strutture convenzionate sponsorizzate). Per conformità contrattuale e fiscale, l'impresa non può essere eliminata.`,
        },
        { status: 400 }
      );
    }

    // 1. Elimina i piani welfare associati
    await db.delete(welfarePlans).where(eq(welfarePlans.companyId, companyId));

    // 2. Trova e rimuovi gli account referente HR (ruolo 'csr') e relative sessioni
    const csrUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.role, "csr")));

    for (const u of csrUsers) {
      await db.delete(sessions).where(eq(sessions.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }

    // 3. Elimina la scheda impresa
    await db.delete(companies).where(eq(companies.id, companyId));

    return NextResponse.json({ ok: true, deletedCompanyId: companyId });
  } catch (error) {
    console.error("DELETE /api/promoters/companies/[id] error:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione dell'impresa CSR." }, { status: 500 });
  }
}
