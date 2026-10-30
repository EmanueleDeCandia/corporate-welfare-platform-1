import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, welfarePlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "csr" && me.role !== "admin") || !me.companyId) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    vatNumber?: string;
    city?: string;
    sector?: string;
    employeesCount?: number;
    fundedAmountEuro?: number;
    description?: string;
    accent?: string;
  };

  const updates: Partial<typeof companies.$inferInsert> = {};

  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.vatNumber?.trim()) updates.vatNumber = body.vatNumber.trim();
  if (body.city?.trim()) updates.city = body.city.trim();
  if (body.sector?.trim()) updates.sector = body.sector.trim();
  if (body.description?.trim()) updates.description = body.description.trim();
  if (body.accent?.trim()) updates.accent = body.accent.trim();

  if (body.employeesCount !== undefined) {
    const count = Math.max(1, parseInt(String(body.employeesCount), 10) || 1);
    updates.employeesCount = count;

    // Sincronizza anche sul piano welfare attivo
    await db
      .update(welfarePlans)
      .set({ eligibleEmployees: count })
      .where(eq(welfarePlans.companyId, me.companyId));
  }

  if (body.fundedAmountEuro !== undefined) {
    const cents = Math.max(0, Math.round(parseFloat(String(body.fundedAmountEuro)) * 100));
    updates.fundedAmountCents = cents;
  }

  const [updated] = await db
    .update(companies)
    .set(updates)
    .where(eq(companies.id, me.companyId))
    .returning();

  return NextResponse.json({
    ok: true,
    message: "Dati aziendali aggiornati con successo nel database.",
    company: updated,
  });
}
