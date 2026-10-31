import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markPaymentSettled, recordSupplierInvoice, SettlementError } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "provider" || !me.venueId) {
    return NextResponse.json({ error: "Accesso riservato al fornitore." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    transactionId?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
  };
  const transactionId = Number(body.transactionId);
  if (!transactionId) {
    return NextResponse.json({ error: "Indica il movimento." }, { status: 400 });
  }

  try {
    if (body.action === "settle") {
      const result = markPaymentSettled({
        transactionId,
        venueId: me.venueId,
        actorUserId: me.id,
      });
      return NextResponse.json({
        ...result,
        message: "Pagamento segnato come ricevuto / saldato.",
      });
    }

    const result = recordSupplierInvoice({
      transactionId,
      venueId: me.venueId,
      actorUserId: me.id,
      invoiceNumber: body.invoiceNumber ?? "",
      invoiceDate: body.invoiceDate ?? "",
    });
    return NextResponse.json({
      ...result,
      message: "Estremi fattura registrati. Il documento resta nel tuo gestionale.",
    });
  } catch (error) {
    if (error instanceof SettlementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Operazione non riuscita." }, { status: 500 });
  }
}
