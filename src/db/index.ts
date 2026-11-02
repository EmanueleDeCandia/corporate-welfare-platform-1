import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import { BOOTSTRAP_SQL, DROP_ALL_SQL, SCHEMA_VERSION } from "@/db/bootstrap";

const globalForDb = globalThis as typeof globalThis & {
  __radiciSqlite?: Database.Database;
  __radiciDb?: ReturnType<typeof drizzle<typeof schema>>;
  __dbInitPromise?: Promise<void>;
};

function getSqlite(): Database.Database {
  if (!globalForDb.__radiciSqlite) {
    const sqlite = new Database("radici.db");
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    globalForDb.__radiciSqlite = sqlite;
  }
  return globalForDb.__radiciSqlite;
}

export const sqlite = getSqlite();
export const db =
  globalForDb.__radiciDb ?? (globalForDb.__radiciDb = drizzle(sqlite, { schema }));

function tableExists(name: string) {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

function currentSchemaVersion(): number {
  if (!tableExists("app_settings")) return 0;
  try {
    const row = sqlite
      .prepare("SELECT value_json FROM app_settings WHERE key = 'schema_version'")
      .get() as { value_json: string } | undefined;
    if (!row) return 0;
    return Number(JSON.parse(row.value_json));
  } catch {
    return 0;
  }
}

function applySchema() {
  sqlite.exec(BOOTSTRAP_SQL);
  sqlite
    .prepare(
      "INSERT INTO app_settings (key, value_json) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json",
    )
    .run(JSON.stringify(SCHEMA_VERSION));
}

function countRows(table: string): number {
  if (!tableExists(table)) return 0;
  try {
    const row = sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number } | undefined;
    return Number(row?.c ?? 0);
  } catch {
    return 0;
  }
}

/** Ricostruisce schema e dati da zero (usato dal reset demo e dalle migrazioni). */
function rebuildFromScratch() {
  sqlite.exec(DROP_ALL_SQL);
  sqlite.pragma("foreign_keys = ON");
  applySchema();
}

/**
 * Un seed interrotto (es. reset demo fallito a metà) lascia il DB popolato solo in parte:
 * imprese e strutture presenti, ma nessun piano welfare e nessun voucher. In quello stato
 * `seedIfEmpty` non riseminerebbe mai perché trova le imprese, e l'app resterebbe senza
 * dati (niente budget, niente voucher, nessun addebito). Qui lo rileviamo e ripariamo.
 */
function isPartiallySeeded(): boolean {
  const companiesCount = countRows("companies");
  const plansCount = countRows("welfare_plans");
  const vouchersCount = countRows("vouchers");
  return companiesCount > 0 && plansCount === 0 && vouchersCount === 0;
}

export async function initDb() {
  if (!globalForDb.__dbInitPromise) {
    globalForDb.__dbInitPromise = (async () => {
      const version = currentSchemaVersion();
      const hasLegacyVouchers = tableExists("vouchers") && !tableExists("welfare_plans");
      if (version !== SCHEMA_VERSION || hasLegacyVouchers) {
        rebuildFromScratch();
      } else if (!tableExists("welfare_plans")) {
        applySchema();
      }

      const { ensureSeeded, resetSeedCache } = await import("@/db/seed");
      await ensureSeeded();

      if (isPartiallySeeded()) {
        console.warn("Database parzialmente popolato: ricostruzione completa del seed demo.");
        resetSeedCache();
        rebuildFromScratch();
        await ensureSeeded();
      }

      // Compatta il WAL nel file principale: in un container il DB resta autoconsistente
      // anche se il file -wal non viene conservato.
      try {
        sqlite.pragma("wal_checkpoint(TRUNCATE)");
      } catch {
        /* checkpoint non critico */
      }
    })().catch((err) => {
      globalForDb.__dbInitPromise = undefined;
      console.error("Database initialization failed:", err);
      throw err;
    });
  }
  return globalForDb.__dbInitPromise;
}

initDb().catch((err) => {
  console.error("Database initialization failed:", err);
});
