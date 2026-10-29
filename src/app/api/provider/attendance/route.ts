import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markSelectionAttendance, WelfareError } from "@/lib/welfare";
import { markGrantAttendance } from "@/lib/grants";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "provider" && me.role !== "promoter" && me.role !== "admin") || (me.role === "provider" && !me.venueId)) {
    return NextResponse.json({ error: "Accesso riservato al fornitore." }, { status: 403 });
  }

  const body = (await request.json()) as {
    kind?: "selection" | "grant";
    selectionId?: number;
    grantId?: number;
    seatIds?: number[];
    status?: "attended" | "no_show";
    venueId?: number;
  };

  const venueId = me.role === "provider" ? me.venueId! : body.venueId;
  if (!venueId) {
    return NextResponse.json({ error: "Struttura mancante." }, { status: 400 });
  }

  try {
    if (body.kind === "grant" && body.grantId) {
      markGrantAttendance({
        grantId: body.grantId,
        venueId,
        actorUserId: me.id,
        seatIds: body.seatIds,
        present: body.status !== "no_show",
      });
      return NextResponse.json({ ok: true, message: body.status === "no_show" ? "Assenza registrata." : "Presenza teatro registrata." });
    }
    if (!body.selectionId || (body.status !== "attended" && body.status !== "no_show")) {
      return NextResponse.json({ error: "Indica la selezione e lo stato di presenza." }, { status: 400 });
    }
    markSelectionAttendance({
      selectionId: body.selectionId,
      venueId,
      actorUserId: me.id,
      status: body.status,
    });
    return NextResponse.json({
      ok: true,
      message: body.status === "attended" ? "Presenza registrata." : "Non presentato registrato. L'addebito all'impresa resta valido.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Aggiornamento presenza non riuscito." }, { status: 500 });
  }
}
