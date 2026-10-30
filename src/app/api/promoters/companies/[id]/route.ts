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
