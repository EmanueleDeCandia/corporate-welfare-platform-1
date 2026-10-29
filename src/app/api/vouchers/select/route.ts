import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { selectVoucher, WelfareError } from "@/lib/welfare";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "employee") {
    return NextResponse.json({ error: "Solo i dipendenti possono selezionare i voucher welfare." }, { status: 403 });
  }
  if (!me.companyId || !me.company) {
    return NextResponse.json({ error: "Account dipendente senza impresa associata." }, { status: 400 });
  }

  const body = (await request.json()) as {
    voucherId?: number;
    venueId?: number;
    offeringId?: number;
    serviceDate?: string;
  };

  if (!body.voucherId || !body.venueId || !body.offeringId || !body.serviceDate) {
    return NextResponse.json(
      { error: "Seleziona voucher, struttura, offerta e data del servizio." },
      { status: 400 },
    );
  }

  try {
    const result = selectVoucher({
      userId: me.id,
      companyId: me.companyId,
      companyName: me.company.name,
      vatNumber: me.company.vatNumber,
      guestName: `${me.firstName} ${me.lastName}`,
      voucherId: body.voucherId,
      venueId: body.venueId,
      offeringId: body.offeringId,
      serviceDate: body.serviceDate,
    });
    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.benefitType === "overnight"
          ? "Pernottamento selezionato. L'impresa è addebitata da ora, anche in caso di assenza. Puoi ora scegliere l'evento del Matching Grant."
          : "Cena selezionata. L'impresa è addebitata da ora, anche in caso di assenza.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Selezione non riuscita." }, { status: 500 });
  }
}
