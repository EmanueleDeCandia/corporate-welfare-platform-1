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

export async function initDb() {
  if (!globalForDb.__dbInitPromise) {
    globalForDb.__dbInitPromise = (async () => {
      const version = currentSchemaVersion();
      const hasLegacyVouchers = tableExists("vouchers") && !tableExists("welfare_plans");
      if (version !== SCHEMA_VERSION || hasLegacyVouchers) {
        sqlite.exec(DROP_ALL_SQL);
        sqlite.pragma("foreign_keys = ON");
        applySchema();
      } else if (!tableExists("welfare_plans")) {
        applySchema();
      }

      const { ensureSeeded } = await import("@/db/seed");
      await ensureSeeded();
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
