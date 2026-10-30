import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { grantConfirmations, matchingGrants, vouchers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    voucherId?: number;
    grantId?: number;
    action?: "confirmed" | "declined";
  };

  const action = body.action === "declined" ? "declined" : "confirmed";
  const now = new Date();

  // Trova il matching grant collegato
  let grant: typeof matchingGrants.$inferSelect | null = null;

  if (body.grantId) {
    const [row] = await db
      .select({
        grant: matchingGrants,
        voucher: vouchers,
      })
      .from(matchingGrants)
      .innerJoin(vouchers, eq(matchingGrants.voucherId, vouchers.id))
      .where(and(eq(matchingGrants.id, body.grantId), eq(vouchers.userId, me.id)))
      .limit(1);
    if (row) grant = row.grant;
  } else if (body.voucherId) {
    const [row] = await db
      .select({
        grant: matchingGrants,
        voucher: vouchers,
      })
      .from(matchingGrants)
      .innerJoin(vouchers, eq(matchingGrants.voucherId, vouchers.id))
      .where(and(eq(matchingGrants.voucherId, body.voucherId), eq(vouchers.userId, me.id)))
      .limit(1);
    if (row) grant = row.grant;
  }

  if (!grant) {
    return NextResponse.json({ error: "Spettacolo teatrale o Matching Grant non trovato." }, { status: 404 });
  }

  // Aggiorna lo stato del Matching Grant
  await db
    .update(matchingGrants)
    .set({
      status: action,
      confirmedAt: action === "confirmed" ? now : null,
    })
    .where(eq(matchingGrants.id, grant.id));

  // Aggiorna anche grantConfirmations se esiste
  await db
    .update(grantConfirmations)
    .set({
      response: action,
      respondedAt: now,
    })
    .where(eq(grantConfirmations.matchingGrantId, grant.id));

  return NextResponse.json({
    ok: true,
    status: action,
    message:
      action === "confirmed"
        ? "Presenza per lo spettacolo confermata! I tuoi 2 posti a sedere sono garantiti."
        : "Hai rinunciato ai biglietti omaggio. I posti sono stati liberati per evitare overbooking.",
  });
}
