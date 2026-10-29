import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { grantConfirmations, matchingGrants } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "confirmed" | "declined";
    companionName?: string;
  };

  const [confirmation] = await db
    .select()
    .from(grantConfirmations)
    .where(eq(grantConfirmations.token, token))
    .limit(1);

  if (!confirmation) {
    return NextResponse.json({ error: "Invito o token di conferma non valido." }, { status: 404 });
  }

  const action = body.action || "confirmed";
  const now = new Date();

  await db
    .update(grantConfirmations)
    .set({
      response: action,
      respondedAt: now,
    })
    .where(eq(grantConfirmations.id, confirmation.id));

  // Aggiorna lo stato del matching grant
  await db
    .update(matchingGrants)
    .set({
      status: action === "confirmed" ? "confirmed" : "declined",
      confirmedAt: action === "confirmed" ? now : null,
    })
    .where(eq(matchingGrants.id, confirmation.matchingGrantId));

  return NextResponse.json({
    ok: true,
    status: action,
    message:
      action === "confirmed"
        ? "Presenza per lo spettacolo confermata! I tuoi 2 posti a sedere sono garantiti."
        : "Hai rinunciato ai biglietti omaggio. I posti sono stati liberati a favore di altri spettatori.",
  });
}

