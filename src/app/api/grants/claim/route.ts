import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimGrant } from "@/lib/grants";
import { WelfareError } from "@/lib/welfare";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Solo i dipendenti possono prenotare i posti grant." }, { status: 403 });
  }

  const body = (await request.json()) as {
    voucherId?: number;
    eventId?: number;
    seatsRequested?: number;
    companionName?: string;
    companionEmail?: string;
  };

  if (!body.voucherId || !body.eventId) {
    return NextResponse.json({ error: "Seleziona il voucher pernottamento e un evento." }, { status: 400 });
  }

  const seats = body.seatsRequested === 1 ? 1 : 2;

  try {
    const result = claimGrant({
      userId: me.id,
      voucherId: body.voucherId,
      eventId: body.eventId,
      seatsRequested: seats,
      employeeName: `${me.firstName} ${me.lastName}`,
      employeeEmail: me.email,
      companionName: body.companionName,
      companionEmail: body.companionEmail,
    });
    return NextResponse.json({
      success: true,
      ...result,
      message: "Posti Matching Grant prenotati. Confermerai la presenza almeno 3 giorni prima dell'evento.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Prenotazione grant non riuscita." }, { status: 500 });
  }
}
