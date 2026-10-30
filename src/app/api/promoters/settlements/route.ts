import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markPaymentSettled, SettlementError } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "promoter" && me.role !== "admin")) {
    return NextResponse.json({ error: "Accesso riservato alla Startup RADICI." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    transactionId?: number;
  };
  const transactionId = Number(body.transactionId);
  if (!transactionId) {
    return NextResponse.json({ error: "Indica il movimento." }, { status: 400 });
  }

  try {
    const result = markPaymentSettled({
      transactionId,
      actorUserId: me.id,
    });
    return NextResponse.json({
      ...result,
      message: "Pagamento segnato come saldato.",
    });
  } catch (error) {
    if (error instanceof SettlementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Operazione non riuscita." }, { status: 500 });
  }
}
