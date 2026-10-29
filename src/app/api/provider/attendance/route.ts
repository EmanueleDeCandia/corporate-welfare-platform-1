import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { voucherSelections, vouchers, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "provider" && me.role !== "admin")) {
    return NextResponse.json({ error: "Accesso consentito solo ai gestori delle strutture convenzionate." }, { status: 403 });
  }

  const body = (await request.json()) as {
    selectionId?: number;
    voucherId?: number;
    status?: "attended" | "no_show";
    notes?: string;
  };

  if (!body.status || (!body.selectionId && !body.voucherId)) {
    return NextResponse.json({ error: "Dati mancanti: specifica selezione e stato (attended/no_show)." }, { status: 400 });
  }

  let selection: typeof voucherSelections.$inferSelect | undefined;

  if (body.selectionId) {
    [selection] = await db
      .select()
      .from(voucherSelections)
      .where(eq(voucherSelections.id, body.selectionId))
      .limit(1);
  } else if (body.voucherId) {
    [selection] = await db
      .select()
      .from(voucherSelections)
      .where(eq(voucherSelections.voucherId, body.voucherId))
      .limit(1);
  }

  if (!selection) {
    return NextResponse.json({ error: "Selezione voucher non trovata." }, { status: 404 });
  }

  // Verifica che il fornitore sia titolare della venue corrispondente (salvo admin)
  if (me.role === "provider" && me.venueId !== selection.venueId) {
    return NextResponse.json({ error: "Non sei autorizzato a modificare la presenza per questa struttura." }, { status: 403 });
  }

  const now = new Date();
  await db
    .update(voucherSelections)
    .set({
      attendanceStatus: body.status,
      checkedInAt: body.status === "attended" ? now : null,
      checkedInByUserId: me.id,
      notes: body.notes ?? (body.status === "attended" ? "Presenza registrata dal fornitore." : "Segnalato mancato arrivo (no-show)."),
    })
    .where(eq(voucherSelections.id, selection.id));

  // Sincronizza lo stato anche sul voucher
  await db
    .update(vouchers)
    .set({
      status: body.status === "attended" ? "attended" : "no_show",
    })
    .where(eq(vouchers.id, selection.voucherId));

  return NextResponse.json({
    ok: true,
    message: body.status === "attended" ? "Presenza ospite registrata con successo." : "No-show registrato con successo. L'addebito welfare rimane valido a tuo favore.",
  });
}

