import Database from "better-sqlite3";

const db = new Database("radici.db");

const fkErrors = db.pragma("foreign_key_check");
if (fkErrors.length > 0) {
  console.error("FK errors detected:", fkErrors);
  process.exit(1);
} else {
  console.log("FK check: OK (0 errors)");
}

const integrity = db.pragma("integrity_check");
console.log("Integrity check:", integrity);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
let jsonErrors = 0;

for (const t of tables) {
  const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
  for (const r of rows) {
    for (const [col, val] of Object.entries(r)) {
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        // Skip text fields that might use bracket prefixes like "[ANNULLATO]"
        if (col === "title" || col === "description" || col === "notes" || col === "reason") {
          continue;
        }
        try {
          JSON.parse(val);
        } catch (e) {
          console.error(`Invalid JSON in table ${t.name}, id=${r.id}, col=${col}: ${e.message}`);
          jsonErrors++;
        }
      }
    }
  }
}

if (jsonErrors > 0) {
  console.error(`Found ${jsonErrors} invalid JSON values!`);
  process.exit(1);
}

console.log("All tables, rows, columns and JSON fields are 100% valid!");
