import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addCompanyEmployee, WelfareError } from "@/lib/welfare";
import { hashPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "csr" || !me.companyId) {
    return NextResponse.json({ error: "Accesso riservato al CSR dell'impresa." }, { status: 403 });
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  };
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Inserisci nome, cognome e email." }, { status: 400 });
  }

  try {
    const userId = addCompanyEmployee({
      companyId: me.companyId,
      actorUserId: me.id,
      firstName,
      lastName,
      email,
      passwordHash: hashPassword(body.password && body.password.length >= 6 ? body.password : "radici2026"),
    });
    return NextResponse.json({
      ok: true,
      userId,
      message: "Dipendente aggiunto. Emessi 1 pernottamento e 1 cena sul piano attivo.",
    });
  } catch (error) {
    if (error instanceof WelfareError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Inserimento dipendente non riuscito." }, { status: 500 });
  }
}
