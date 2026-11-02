import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "theater" && me.role !== "promoter" && me.role !== "admin")) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      venueId?: number;
      priceShowCents?: number;
    };

    const targetVenueId = body.venueId ?? me.venueId;
    if (!targetVenueId) {
      return NextResponse.json({ error: "ID del teatro non trovato." }, { status: 400 });
    }

    if (me.role === "theater" && me.venueId !== targetVenueId) {
      return NextResponse.json({ error: "Non sei autorizzato a modificare questo teatro." }, { status: 403 });
    }

    const priceShowCents = Math.max(0, Math.round(Number(body.priceShowCents) || 0));

    await db
      .update(venues)
      .set({ priceShowCents })
      .where(eq(venues.id, targetVenueId));

    return NextResponse.json({
      success: true,
      message: "Prezzo dello spettacolo aggiornato con successo.",
      priceShowCents,
    });
  } catch (error) {
    console.error("Errore aggiornamento prezzo spettacolo:", error);
    return NextResponse.json({ error: "Errore interno durante il salvataggio." }, { status: 500 });
  }
}
