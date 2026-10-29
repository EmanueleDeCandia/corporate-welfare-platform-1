import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

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
  globalForDb.__radiciDb ??
  (globalForDb.__radiciDb = drizzle(sqlite, { schema }));

export async function initDb() {
  if (!globalForDb.__dbInitPromise) {
    globalForDb.__dbInitPromise = (async () => {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          vat_number TEXT NOT NULL,
          city TEXT NOT NULL,
          sector TEXT NOT NULL,
          employees_count INTEGER NOT NULL DEFAULT 0,
          funded_amount_cents INTEGER NOT NULL DEFAULT 0,
          impact_rating INTEGER NOT NULL DEFAULT 0,
          local_redistribution_cents INTEGER NOT NULL DEFAULT 0,
          co2_saved_kg INTEGER NOT NULL DEFAULT 0,
          description TEXT NOT NULL,
          accent TEXT NOT NULL DEFAULT '#1C3A2E',
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS destinations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          region TEXT NOT NULL,
          tagline TEXT NOT NULL,
          description TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          cover_image TEXT NOT NULL,
          highlight TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee',
          company_id INTEGER REFERENCES companies(id),
          venue_id INTEGER,
          impact_points INTEGER NOT NULL DEFAULT 0,
          badge_level TEXT NOT NULL DEFAULT 'Germoglio',
          referral_code TEXT,
          invited_by_user_id INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS venues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          destination_id INTEGER NOT NULL REFERENCES destinations(id),
          city TEXT NOT NULL,
          province TEXT NOT NULL,
          region TEXT NOT NULL,
          description TEXT NOT NULL,
          long_description TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          cover_image TEXT NOT NULL,
          gallery TEXT DEFAULT '[]',
          services TEXT DEFAULT '[]',
          aperitivo_menu TEXT DEFAULT '[]',
          rooms TEXT DEFAULT '[]',
          price_hotel_cents INTEGER NOT NULL DEFAULT 0,
          price_aperitivo_cents INTEGER NOT NULL DEFAULT 0,
          price_show_cents INTEGER NOT NULL DEFAULT 0,
          checkin_code TEXT NOT NULL UNIQUE,
          provider_user_id INTEGER REFERENCES users(id),
          sponsor_company_id INTEGER REFERENCES companies(id),
          impact_points_generated INTEGER NOT NULL DEFAULT 1,
          local_support_percent INTEGER NOT NULL DEFAULT 10,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        
        CREATE TABLE IF NOT EXISTS grant_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'teatro',
          venue_id INTEGER REFERENCES venues(id),
          venue_name TEXT NOT NULL,
          city TEXT NOT NULL,
          region TEXT NOT NULL,
          description TEXT NOT NULL,
          grant_amount_cents INTEGER NOT NULL DEFAULT 5000,
          artist_meetup_included INTEGER NOT NULL DEFAULT 1,
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS vouchers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          company_id INTEGER NOT NULL REFERENCES companies(id),
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          slot_index INTEGER NOT NULL DEFAULT 1,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          venue_id INTEGER REFERENCES venues(id),
          theater_venue_id INTEGER REFERENCES venues(id),
          grant_event_id INTEGER REFERENCES grant_events(id),
          redeemed_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS invites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inviter_id INTEGER NOT NULL REFERENCES users(id),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          friend_user_id INTEGER REFERENCES users(id),
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed',
          user_id INTEGER NOT NULL REFERENCES users(id),
          venue_id INTEGER NOT NULL REFERENCES venues(id),
          company_id INTEGER REFERENCES companies(id),
          invite_id INTEGER REFERENCES invites(id),
          voucher_id INTEGER REFERENCES vouchers(id),
          amount_cents INTEGER NOT NULL,
          discount_cents INTEGER NOT NULL DEFAULT 0,
          list_price_cents INTEGER NOT NULL,
          service_label TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venue_id INTEGER NOT NULL REFERENCES venues(id),
          type TEXT NOT NULL DEFAULT 'welfare',
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          payload TEXT NOT NULL DEFAULT '{}',
          read INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS shares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          venue_id INTEGER REFERENCES venues(id),
          caption TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS certificates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          impact_value TEXT NOT NULL,
          unit_label TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT NOT NULL UNIQUE,
          user_id INTEGER NOT NULL REFERENCES users(id),
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);

      // Safe migration for users table
      try {
        const userCols = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
        if (!userCols.some((col) => col.name === "referral_code")) {
          sqlite.exec("ALTER TABLE users ADD COLUMN referral_code TEXT;");
        }
        if (!userCols.some((col) => col.name === "invited_by_user_id")) {
          sqlite.exec("ALTER TABLE users ADD COLUMN invited_by_user_id INTEGER;");
        }
      } catch (e) {
        console.warn("Migration users warning:", e);
      }

      // Safe migration in case vouchers table already exists without theater_venue_id
      try {
        const columns = sqlite.prepare("PRAGMA table_info(vouchers)").all() as Array<{ name: string }>;
        const hasTheater = columns.some((col) => col.name === "theater_venue_id");
        
        if (!columns.some((col) => col.name === "grant_event_id")) {
          sqlite.exec("ALTER TABLE vouchers ADD COLUMN grant_event_id INTEGER REFERENCES grant_events(id);");
        }
        if (!hasTheater) {
          sqlite.exec("ALTER TABLE vouchers ADD COLUMN theater_venue_id INTEGER REFERENCES venues(id);");
        }
      } catch (e) {
        console.warn("Migration theater_venue_id warning:", e);
      }

      // Run seeding
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

// Auto-initialize
initDb().catch((err) => {
  console.error("Database initialization failed:", err);
});
