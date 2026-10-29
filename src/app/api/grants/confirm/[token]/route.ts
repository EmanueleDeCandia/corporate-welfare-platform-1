import { NextResponse } from "next/server";
import { respondGrantConfirmation } from "@/lib/grants";
import { WelfareError } from "@/lib/welfare";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { response?: string };
  if (body.response !== "confirmed" && body.response !== "declined") {
    return NextResponse.json({ error: "Risposta non valida." }, { status: 400 });
  }
  try {
    const result = respondGrantConfirmation(token, body.response);
    return NextResponse.json({
      success: true,
      ...result,
      message:
        body.response === "confirmed"
          ? "Presenza confermata. Mostra il QR in botteghino."
          : "Hai rinunciato. I posti sono stati liberati.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Conferma non riuscita." }, { status: 500 });
  }
}
