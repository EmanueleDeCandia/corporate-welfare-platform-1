import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, vouchers, welfarePlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { badgeForPoints, hashPassword, randomCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "csr" && me.role !== "admin") || !me.companyId) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  };

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() || "radici2026";

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Compila nome, cognome ed email del lavoratore." }, { status: 400 });
  }

  // Verifica esistenza utente
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Esiste già un dipendente registrato con questa email." }, { status: 409 });
  }

  // Inserimento utente dipendente collegato all'azienda corrente
  const [newEmployee] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      role: "employee",
      companyId: me.companyId,
      impactPoints: 0,
      badgeLevel: badgeForPoints(0).label,
      referralCode: randomCode("welfare"),
    })
    .returning();

  // Recupera piano welfare attivo
  const [plan] = await db
    .select()
    .from(welfarePlans)
    .where(and(eq(welfarePlans.companyId, me.companyId), eq(welfarePlans.status, "active")))
    .limit(1);

  // Assegna automaticamente i 2 voucher welfare standard (1 Notte + 1 Cena)
  await db.insert(vouchers).values([
    {
      planId: plan?.id ?? null,
      userId: newEmployee.id,
      companyId: me.companyId,
      type: "hotel",
      status: "available",
      origin: "base",
      slotIndex: 1,
      amountCents: plan?.overnightAmountCents ?? 5000,
    },
    {
      planId: plan?.id ?? null,
      userId: newEmployee.id,
      companyId: me.companyId,
      type: "aperitivo",
      status: "available",
      origin: "base",
      slotIndex: 1,
      amountCents: plan?.dinnerAmountCents ?? 2500,
    },
  ]);

  return NextResponse.json({
    ok: true,
    vouchersCreated: 2,
    message: `Dipendente ${firstName} ${lastName} registrato con successo con 2 voucher welfare attivi.`,
    employee: {
      id: newEmployee.id,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
    },
  }, { status: 201 });
}
