import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { voucherSelections, vouchers, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "provider" && me.role !== "admin")) {
    return NextResponse.json(
      { error: "Accesso consentito solo ai gestori delle strutture convenzionate." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    selectionId?: number;
    voucherId?: number;
    status?: "attended" | "no_show";
    notes?: string;
  };

  if (!body.status || (!body.selectionId && !body.voucherId)) {
    return NextResponse.json(
      { error: "Dati mancanti: specifica selezione o voucher e stato (attended/no_show)." },
      { status: 400 }
    );
  }

  const now = new Date();
  let voucherId = body.voucherId;
  let targetVenueId = me.venueId;

  let [selection] = body.selectionId
    ? await db.select().from(voucherSelections).where(eq(voucherSelections.id, body.selectionId)).limit(1)
    : body.voucherId
      ? await db.select().from(voucherSelections).where(eq(voucherSelections.voucherId, body.voucherId)).limit(1)
      : [];

  if (selection) {
    voucherId = selection.voucherId;
    targetVenueId = selection.venueId;
  } else if (body.voucherId) {
    // Se la selezione non esiste ancora, recuperiamo il voucher
    const [v] = await db.select().from(vouchers).where(eq(vouchers.id, body.voucherId)).limit(1);
    if (!v) {
      return NextResponse.json({ error: "Voucher non trovato." }, { status: 404 });
    }
    if (!v.venueId) {
      return NextResponse.json(
        { error: "Questo voucher non è stato ancora selezionato per una struttura." },
        { status: 400 }
      );
    }
    targetVenueId = v.venueId;

    if (me.role === "provider" && me.venueId && me.venueId !== targetVenueId) {
      return NextResponse.json(
        { error: "Non sei autorizzato a modificare la presenza per questa struttura." },
        { status: 403 }
      );
    }

    // Crea la selezione puntuale
    const [newSel] = await db
      .insert(voucherSelections)
      .values({
        voucherId: v.id,
        venueId: targetVenueId,
        serviceDate: new Date().toISOString().split("T")[0],
        selectedAt: now,
        attendanceStatus: body.status,
        checkedInAt: body.status === "attended" ? now : null,
        checkedInByUserId: me.id,
        notes: body.notes ?? (body.status === "attended" ? "Presenza registrata dal fornitore." : "Segnalato mancato arrivo (no-show)."),
      })
      .returning();

    selection = newSel;
  }

  // Verifica che il fornitore sia titolare della venue corrispondente (salvo admin)
  if (me.role === "provider" && me.venueId && targetVenueId && me.venueId !== targetVenueId) {
    return NextResponse.json(
      { error: "Non sei autorizzato a modificare la presenza per questa struttura." },
      { status: 403 }
    );
  }

  if (selection) {
    await db
      .update(voucherSelections)
      .set({
        attendanceStatus: body.status,
        checkedInAt: body.status === "attended" ? now : null,
        checkedInByUserId: me.id,
        notes: body.notes ?? (body.status === "attended" ? "Presenza registrata dal fornitore." : "Segnalato mancato arrivo (no-show)."),
      })
      .where(eq(voucherSelections.id, selection.id));
  }

  // Sincronizza lo stato anche sulla tabella vouchers
  if (voucherId) {
    await db
      .update(vouchers)
      .set({
        status: body.status === "attended" ? "attended" : "no_show",
      })
      .where(eq(vouchers.id, voucherId));
  }

  return NextResponse.json({
    ok: true,
    status: body.status,
    attendanceStatus: body.status,
    message:
      body.status === "attended"
        ? "Presenza ospite CONVALIDATA nel database."
        : "No-show registrato nel database. Il compenso welfare resta comunque dovuto.",
  });
}
