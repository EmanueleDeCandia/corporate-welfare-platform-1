import { NextResponse } from "next/server";
import { initDb } from "@/db";
import { processGrantConfirmations } from "@/lib/grants";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  await initDb();
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  if (secret && header === secret) {
    const result = processGrantConfirmations();
    return NextResponse.json({ ok: true, ...result });
  }
  const me = await getCurrentUser();
  if (isDemoMode() && me && (me.role === "promoter" || me.role === "admin" || me.role === "csr")) {
    const result = processGrantConfirmations();
    return NextResponse.json({ ok: true, ...result });
  }
  return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
}

export async function POST(request: Request) {
  return run(request);
}

export async function GET(request: Request) {
  return run(request);
}
