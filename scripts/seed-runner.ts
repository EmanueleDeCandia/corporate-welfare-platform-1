import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "radici.db");

console.log("1. Resetting database tables and views...");
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = OFF");

const views = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='view'")
  .all()
  .map((r: any) => r.name);
for (const v of views) {
  try {
    sqlite.exec(`DROP VIEW IF EXISTS "${v}";`);
  } catch (e) {}
}

const triggers = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='trigger'")
  .all()
  .map((r: any) => r.name);
for (const trg of triggers) {
  try {
    sqlite.exec(`DROP TRIGGER IF EXISTS "${trg}";`);
  } catch (e) {}
}

const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r: any) => r.name);

for (const t of tables) {
  try {
    sqlite.exec(`DROP TABLE IF EXISTS "${t}";`);
  } catch (e) {}
}
sqlite.pragma("foreign_keys = ON");
sqlite.close();

console.log("2. Running initDb and seed...");
async function run() {
  const { initDb } = await import("@/db");
  await initDb();

  console.log("3. Verifying seeded row counts...");
  const verifyDb = new Database(dbPath);
  const currentTables = verifyDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r: any) => r.name);
  for (const t of currentTables) {
    const count = (verifyDb.prepare(`SELECT count(*) as c FROM ${t}`).get() as any).c;
    console.log(`  - ${t}: ${count} rows`);
  }

  console.log("\n4. Stampando tutti gli utenti generati con ruolo e credenziali:");
  const usersList = verifyDb.prepare("SELECT id, email, first_name, last_name, role, company_id, venue_id FROM users").all();
  console.table(usersList);

  verifyDb.close();
  console.log("Seed completato con successo!");
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
