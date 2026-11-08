import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { impactShortlinks, sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    const { doc, channel = "direct" } = body;

    if (!doc || !doc.id) {
      return NextResponse.json({ error: "Documento non valido o ID mancante" }, { status: 400 });
    }

    const code = String(doc.id).trim();
    const docPayload = JSON.stringify(doc);

    // Cerca se l'utente corrente è autenticato tramite cookie di sessione
    const sessionToken = request.cookies.get("radici_session")?.value;
    let userId: number | null = null;
    let companyId: number | null = null;

    if (sessionToken) {
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, sessionToken))
        .get();

      if (session) {
        userId = session.userId;
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .get();
        if (user) {
          companyId = user.companyId || null;
        }
      }
    }

    // Inserisci o aggiorna il record dello shortlink
    const existing = await db
      .select()
      .from(impactShortlinks)
      .where(eq(impactShortlinks.code, code))
      .get();

    if (existing) {
      await db
        .update(impactShortlinks)
        .set({
          docPayload,
          channel,
          ...(userId ? { userId, companyId } : {}),
        })
        .where(eq(impactShortlinks.code, code))
        .run();
    } else {
      await db
        .insert(impactShortlinks)
        .values({
          code,
          userId,
          companyId,
          channel,
          docPayload,
          viewsCount: 0,
        })
        .run();
    }

    const origin = request.nextUrl.origin;
    const shortUrl = `${origin}/c/${encodeURIComponent(code)}`;

    return NextResponse.json({
      success: true,
      code,
      shortUrl,
    });
  } catch (error) {
    console.error("Errore salvataggio shortlink certificato:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
