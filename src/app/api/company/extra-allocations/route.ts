import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allocateExtra, WelfareError } from "@/lib/welfare";
import { isBenefitType } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "csr" || !me.companyId) {
    return NextResponse.json({ error: "Accesso riservato al CSR dell'impresa." }, { status: 403 });
  }

  const body = (await request.json()) as { benefitType?: string; userIds?: number[] };
  if (!body.benefitType || !isBenefitType(body.benefitType)) {
    return NextResponse.json({ error: "Indica la tipologia (pernottamento o cena)." }, { status: 400 });
  }

  try {
    const id = allocateExtra({
      companyId: me.companyId,
      actorUserId: me.id,
      benefitType: body.benefitType,
      userIds: body.userIds ?? [],
    });
    return NextResponse.json({
      ok: true,
      allocationId: id,
      message: "Voucher extra assegnati. Il dipendente potrà selezionarli dal portafoglio.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Assegnazione extra non riuscita." }, { status: 500 });
  }
}
