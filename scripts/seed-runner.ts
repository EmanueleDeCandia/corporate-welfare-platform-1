import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "radici.db");

console.log("1. Resetting database tables...");
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = OFF");

const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r: any) => r.name);

for (const t of tables) {
  try {
    sqlite.exec(`DELETE FROM ${t};`);
    sqlite.exec(`DELETE FROM sqlite_sequence WHERE name='${t}';`);
  } catch (e) {
    // Ignore sequence errors
  }
}
sqlite.pragma("foreign_keys = ON");
sqlite.close();

console.log("2. Running seed...");
async function run() {
  const { seedDatabase } = await import("@/db/seed");
  await seedDatabase();

  console.log("3. Verifying seeded row counts...");
  const verifyDb = new Database(dbPath);
  for (const t of tables) {
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
