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

        CREATE TABLE IF NOT EXISTS welfare_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL REFERENCES companies(id),
          year INTEGER NOT NULL,
          valid_from INTEGER NOT NULL,
          valid_until INTEGER NOT NULL,
          eligible_employees INTEGER NOT NULL DEFAULT 0,
          overnight_amount_cents INTEGER NOT NULL DEFAULT 5000,
          dinner_amount_cents INTEGER NOT NULL DEFAULT 2500,
          overnight_extra_threshold_bps INTEGER NOT NULL DEFAULT 2000,
          overnight_extra_cap_bps INTEGER NOT NULL DEFAULT 2000,
          dinner_extra_threshold_bps INTEGER NOT NULL DEFAULT 2000,
          dinner_extra_cap_bps INTEGER NOT NULL DEFAULT 2000,
          status TEXT NOT NULL DEFAULT 'active',
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          UNIQUE(company_id, year)
        );

        CREATE TABLE IF NOT EXISTS plan_extra_allocations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id INTEGER NOT NULL REFERENCES welfare_plans(id),
          benefit_type TEXT NOT NULL,
          created_by_user_id INTEGER REFERENCES users(id),
          selected_at_time INTEGER NOT NULL,
          available_at_time INTEGER NOT NULL,
          vouchers_granted INTEGER NOT NULL,
          note TEXT,
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
          badge_level TEXT NOT NULL DEFAULT 'Esploratore',
          referral_code TEXT NOT NULL UNIQUE,
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

        CREATE TABLE IF NOT EXISTS venue_offerings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venue_id INTEGER NOT NULL REFERENCES venues(id),
          benefit_type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          list_price_cents INTEGER NOT NULL DEFAULT 0,
          accepts_welfare INTEGER NOT NULL DEFAULT 1,
          daily_capacity INTEGER DEFAULT 10,
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          UNIQUE(venue_id, benefit_type, name)
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
          starts_at INTEGER,
          capacity INTEGER NOT NULL DEFAULT 50,
          grant_amount_cents INTEGER NOT NULL DEFAULT 5000,
          confirmation_send_days INTEGER NOT NULL DEFAULT 7,
          confirmation_deadline_days INTEGER NOT NULL DEFAULT 3,
          artist_meetup_included INTEGER NOT NULL DEFAULT 1,
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS vouchers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id INTEGER REFERENCES welfare_plans(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          company_id INTEGER NOT NULL REFERENCES companies(id),
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          origin TEXT NOT NULL DEFAULT 'base',
          extra_allocation_id INTEGER REFERENCES plan_extra_allocations(id),
          slot_index INTEGER NOT NULL DEFAULT 1,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          venue_id INTEGER REFERENCES venues(id),
          theater_venue_id INTEGER REFERENCES venues(id),
          grant_event_id INTEGER REFERENCES grant_events(id),
          redeemed_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS voucher_selections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          voucher_id INTEGER NOT NULL UNIQUE REFERENCES vouchers(id),
          venue_id INTEGER NOT NULL REFERENCES venues(id),
          offering_id INTEGER REFERENCES venue_offerings(id),
          service_date TEXT NOT NULL,
          selected_at INTEGER NOT NULL DEFAULT (unixepoch()),
          attendance_status TEXT NOT NULL DEFAULT 'pending',
          checked_in_at INTEGER,
          checked_in_by_user_id INTEGER REFERENCES users(id),
          notes TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS matching_grants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          voucher_id INTEGER NOT NULL UNIQUE REFERENCES vouchers(id),
          event_id INTEGER NOT NULL REFERENCES grant_events(id),
          amount_cents INTEGER NOT NULL DEFAULT 5000,
          seats_requested INTEGER NOT NULL DEFAULT 2,
          status TEXT NOT NULL DEFAULT 'assigned',
          assigned_at INTEGER NOT NULL DEFAULT (unixepoch()),
          confirmed_at INTEGER,
          attended_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS grant_seats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          matching_grant_id INTEGER NOT NULL REFERENCES matching_grants(id),
          holder_role TEXT NOT NULL,
          holder_name TEXT,
          holder_email TEXT,
          value_cents INTEGER NOT NULL DEFAULT 2500,
          attended INTEGER NOT NULL DEFAULT 0,
          checked_in_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS grant_confirmations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          matching_grant_id INTEGER NOT NULL REFERENCES matching_grants(id),
          token TEXT NOT NULL UNIQUE,
          scheduled_for INTEGER NOT NULL,
          respond_by INTEGER NOT NULL,
          sent_at INTEGER,
          response TEXT,
          responded_at INTEGER,
          reminder_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS invites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inviter_id INTEGER NOT NULL REFERENCES users(id),
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
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

      // Migrations per tabelle esistenti
      try {
        const vCols = sqlite.prepare("PRAGMA table_info(vouchers)").all() as Array<{ name: string }>;
        if (!vCols.some((col) => col.name === "plan_id")) {
          sqlite.exec("ALTER TABLE vouchers ADD COLUMN plan_id INTEGER REFERENCES welfare_plans(id);");
        }
        if (!vCols.some((col) => col.name === "origin")) {
          sqlite.exec("ALTER TABLE vouchers ADD COLUMN origin TEXT NOT NULL DEFAULT 'base';");
        }
        if (!vCols.some((col) => col.name === "extra_allocation_id")) {
          sqlite.exec("ALTER TABLE vouchers ADD COLUMN extra_allocation_id INTEGER REFERENCES plan_extra_allocations(id);");
        }
      } catch (e) {
        console.warn("Migration vouchers warning:", e);
      }

      try {
        const geCols = sqlite.prepare("PRAGMA table_info(grant_events)").all() as Array<{ name: string }>;
        if (!geCols.some((col) => col.name === "starts_at")) {
          sqlite.exec("ALTER TABLE grant_events ADD COLUMN starts_at INTEGER;");
        }
        if (!geCols.some((col) => col.name === "capacity")) {
          sqlite.exec("ALTER TABLE grant_events ADD COLUMN capacity INTEGER NOT NULL DEFAULT 50;");
        }
        if (!geCols.some((col) => col.name === "confirmation_send_days")) {
          sqlite.exec("ALTER TABLE grant_events ADD COLUMN confirmation_send_days INTEGER NOT NULL DEFAULT 7;");
        }
        if (!geCols.some((col) => col.name === "confirmation_deadline_days")) {
          sqlite.exec("ALTER TABLE grant_events ADD COLUMN confirmation_deadline_days INTEGER NOT NULL DEFAULT 3;");
        }
      } catch (e) {
        console.warn("Migration grant_events warning:", e);
      }

      // Safe index creation
      try {
        sqlite.exec(`
          CREATE INDEX IF NOT EXISTS ix_vouchers_user ON vouchers(user_id, status);
          CREATE INDEX IF NOT EXISTS ix_vouchers_plan ON vouchers(plan_id, status);
          CREATE INDEX IF NOT EXISTS ix_tx_venue ON transactions(venue_id, created_at);
          CREATE INDEX IF NOT EXISTS ix_notifications_venue ON notifications(venue_id, read);
          CREATE INDEX IF NOT EXISTS ix_sessions_user ON sessions(user_id);
          CREATE INDEX IF NOT EXISTS ix_offerings_venue ON venue_offerings(venue_id, benefit_type);
        `);
      } catch (e) {
        console.warn("Index creation warning:", e);
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
