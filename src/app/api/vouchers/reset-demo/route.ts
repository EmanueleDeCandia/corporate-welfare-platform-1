import { NextResponse } from "next/server";
import { sqlite } from "@/db";
import { DROP_ALL_SQL } from "@/db/bootstrap";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getCurrentUser();
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Reset demo disabilitato." }, { status: 403 });
  }
  if (!me || (me.role !== "admin" && me.role !== "promoter" && me.role !== "csr")) {
    return NextResponse.json({ error: "Reset demo riservato a CSR, promotori o admin." }, { status: 403 });
  }

  try {
    sqlite.exec(DROP_ALL_SQL);
    sqlite.pragma("foreign_keys = ON");
    const { BOOTSTRAP_SQL, SCHEMA_VERSION } = await import("@/db/bootstrap");
    sqlite.exec(BOOTSTRAP_SQL);
    sqlite
      .prepare(
        "INSERT INTO app_settings (key, value_json) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json",
      )
      .run(JSON.stringify(SCHEMA_VERSION));
    const { ensureSeeded, resetSeedCache } = await import("@/db/seed");
    resetSeedCache();
    await ensureSeeded();
    sqlite
      .prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
         VALUES (?, 'demo.reset', 'database', 'radici', '{}', unixepoch())`,
      )
      .run(me.id);
    return NextResponse.json({
      success: true,
      message: "Dati demo ripristinati. Piani, voucher e selezioni sono tornati allo stato iniziale.",
    });
  } catch (error) {
    console.error("Global reset error:", error);
    return NextResponse.json({ error: "Errore durante il ripristino dei dati demo." }, { status: 500 });
  }
}
