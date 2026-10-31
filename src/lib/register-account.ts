import { sqlite } from "@/db";
import type { UserRole } from "@/db/schema";
import type { RegisterableRole } from "@/lib/register-types";
import { WelfareError, getActivePlan, issueBaseVouchers } from "@/lib/welfare";
import { badgeForPoints, hashPassword, randomCode, unixSeconds } from "@/lib/utils";

export type { RegisterableRole } from "@/lib/register-types";
export { isRegisterableRole, REGISTERABLE_ROLES } from "@/lib/register-types";

function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "radici"}-${randomCode("id").slice(-6)}`;
}

function insertUser(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number | null;
  venueId: number | null;
  invitedByUserId: number | null;
}) {
  const prefix = input.role === "employee" ? "dip" : input.role === "csr" ? "csr" : input.role === "provider" ? "for" : input.role === "promoter" ? "pro" : "amico";
  const info = sqlite
    .prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, venue_id, impact_points, badge_level, referral_code, invited_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    )
    .run(
      input.email,
      input.passwordHash,
      input.firstName,
      input.lastName,
      input.role,
      input.companyId,
      input.venueId,
      badgeForPoints(0).label,
      randomCode(prefix),
      input.invitedByUserId,
      unixSeconds(),
    );
  return Number(info.lastInsertRowid);
}

function createCompany(input: { name: string; vatNumber: string; city: string }) {
  const slug = slugify(input.name);
  const info = sqlite
    .prepare(
      `INSERT INTO companies (name, slug, vat_number, city, sector, employees_count, funded_amount_cents, impact_rating, local_redistribution_cents, co2_saved_kg, description, accent, created_at)
       VALUES (?, ?, ?, ?, 'Welfare territoriale', 0, 0, 60, 0, 0, ?, '#1C3A2E', ?)`,
    )
    .run(
      input.name,
      slug,
      input.vatNumber,
      input.city,
      `Piano welfare RADICI per ${input.name}.`,
      unixSeconds(),
    );
  const companyId = Number(info.lastInsertRowid);
  sqlite
    .prepare(
      `INSERT INTO welfare_plans (company_id, year, valid_from, valid_until, eligible_employees, overnight_amount_cents, dinner_amount_cents, extra_window_days, status, created_at)
       VALUES (?, 2026, '2026-01-01', '2026-12-31', 10, 5000, 2500, 30, 'active', ?)`,
    )
    .run(companyId, unixSeconds());
  return companyId;
}

function createVenue(input: { name: string; destinationId: number; type: string; city: string; providerUserId: number }) {
  const dest = sqlite.prepare(`SELECT * FROM destinations WHERE id = ?`).get(input.destinationId) as
    | { id: number; name: string; region: string; lat: number; lng: number; cover_image: string }
    | undefined;
  if (!dest) throw new WelfareError("Destinazione non valida.");
  const slug = slugify(input.name);
  const info = sqlite
    .prepare(
      `INSERT INTO venues (name, slug, type, destination_id, city, province, region, description, long_description, lat, lng, cover_image, gallery, services, checkin_code, provider_user_id, impact_points_generated, local_support_percent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?, ?, 1, 10, ?)`,
    )
    .run(
      input.name,
      slug,
      input.type,
      dest.id,
      input.city || dest.name,
      dest.region,
      dest.region,
      `Struttura del circuito RADICI a ${input.city || dest.name}.`,
      `Accoglie i voucher welfare (pernottamento e/o cena) e gli ospiti consumer del circuito.`,
      dest.lat,
      dest.lng,
      dest.cover_image,
      randomCode("chk"),
      input.providerUserId,
      unixSeconds(),
    );
  const venueId = Number(info.lastInsertRowid);
  sqlite
    .prepare(
      `INSERT INTO venue_offerings (venue_id, benefit_type, name, description, list_price_cents, accepts_welfare, friend_discount_bps, active)
       VALUES (?, 'overnight', 'Camera del circuito', 'Pernottamento convenzionato RADICI', 5000, 1, 1000, 1)`,
    )
    .run(venueId);
  sqlite
    .prepare(
      `INSERT INTO venue_offerings (venue_id, benefit_type, name, description, list_price_cents, accepts_welfare, friend_discount_bps, active)
       VALUES (?, 'dinner', 'Cena KM 0', 'Cena territoriale convenzionata RADICI', 2500, 1, 1000, 1)`,
    )
    .run(venueId);
  return venueId;
}

export function listRegisterCatalog() {
  const companies = sqlite
    .prepare(`SELECT id, name, city FROM companies ORDER BY name`)
    .all() as Array<{ id: number; name: string; city: string }>;
  const destinations = sqlite
    .prepare(`SELECT id, name, region FROM destinations ORDER BY name`)
    .all() as Array<{ id: number; name: string; region: string }>;
  const venues = sqlite
    .prepare(`SELECT id, name, city, type FROM venues WHERE provider_user_id IS NULL ORDER BY name`)
    .all() as Array<{ id: number; name: string; city: string; type: string }>;
  return { companies, destinations, venues };
}

function isExpired(value: number | null | undefined) {
  if (!value) return false;
  const ms = value < 1e12 ? value * 1000 : value;
  return ms < Date.now();
}

export function registerAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RegisterableRole;
  inviteCode?: string;
  companyId?: number;
  companyName?: string;
  vatNumber?: string;
  city?: string;
  venueId?: number;
  venueName?: string;
  venueType?: string;
  destinationId?: number;
}) {
  const passwordHash = hashPassword(input.password);
  try {
    return sqlite.transaction(() => {
    const existing = sqlite.prepare(`SELECT id FROM users WHERE email = ?`).get(input.email) as { id: number } | undefined;
    if (existing) throw new WelfareError("Esiste già un account con questa email.", 409);

    let invite: { id: number; inviter_id: number; status: string; expires_at: number | null } | undefined;
    if (input.inviteCode) {
      invite = sqlite.prepare(`SELECT id, inviter_id, status, expires_at FROM invites WHERE code = ?`).get(input.inviteCode) as typeof invite;
    }
    if (!invite) {
      invite = sqlite.prepare(`SELECT id, inviter_id, status, expires_at FROM invites WHERE email = ?`).get(input.email) as typeof invite;
    }
    if (isExpired(invite?.expires_at ?? null)) {
      invite = undefined;
    }

    let companyId: number | null = null;
    let venueId: number | null = null;
    const invitedBy = invite?.inviter_id ?? null;

    if (input.role === "employee") {
      if (!input.companyId) throw new WelfareError("Seleziona l'impresa di appartenenza.");
      const company = sqlite.prepare(`SELECT id FROM companies WHERE id = ?`).get(input.companyId) as { id: number } | undefined;
      if (!company) throw new WelfareError("Impresa non trovata.", 404);
      companyId = company.id;
    }

    if (input.role === "csr") {
      if (input.companyId) {
        const company = sqlite.prepare(`SELECT id FROM companies WHERE id = ?`).get(input.companyId) as { id: number } | undefined;
        if (!company) throw new WelfareError("Impresa non trovata.", 404);
        companyId = company.id;
      } else {
        const name = input.companyName?.trim();
        const vat = input.vatNumber?.trim();
        const city = input.city?.trim();
        if (!name || !vat || !city) throw new WelfareError("Per una nuova impresa indica ragione sociale, P.IVA e città.");
        companyId = createCompany({ name, vatNumber: vat, city });
      }
    }

    if (input.role === "provider" && input.venueId) {
      const venue = sqlite.prepare(`SELECT id, provider_user_id FROM venues WHERE id = ?`).get(input.venueId) as
        | { id: number; provider_user_id: number | null }
        | undefined;
      if (!venue) throw new WelfareError("Struttura non trovata.", 404);
      if (venue.provider_user_id) throw new WelfareError("Questa struttura ha già un account fornitore.");
      venueId = venue.id;
    }

    const userId = insertUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      companyId,
      venueId,
      invitedByUserId: input.role === "friend" ? invitedBy : null,
    });

    if (input.role === "employee" && companyId) {
      const plan = getActivePlan(companyId);
      if (plan) issueBaseVouchers(plan.id, userId, companyId);
      sqlite.prepare(`UPDATE companies SET employees_count = employees_count + 1 WHERE id = ?`).run(companyId);
    }

    if (input.role === "provider") {
      if (venueId) {
        sqlite.prepare(`UPDATE venues SET provider_user_id = ? WHERE id = ?`).run(userId, venueId);
        sqlite.prepare(`UPDATE users SET venue_id = ? WHERE id = ?`).run(venueId, userId);
      } else {
        const name = input.venueName?.trim();
        const destinationId = Number(input.destinationId);
        const type = input.venueType === "restaurant" || input.venueType === "hotel" ? input.venueType : "agriturismo";
        if (!name || !destinationId) throw new WelfareError("Indica il nome della struttura e la destinazione.");
        const createdId = createVenue({
          name,
          destinationId,
          type,
          city: input.city?.trim() || "",
          providerUserId: userId,
        });
        sqlite.prepare(`UPDATE users SET venue_id = ? WHERE id = ?`).run(createdId, userId);
      }
    }

    if (input.role === "friend" && invite && invite.status === "pending") {
      sqlite
        .prepare(`UPDATE invites SET status = 'registered', friend_user_id = ?, accepted_at = ? WHERE id = ?`)
        .run(userId, unixSeconds(), invite.id);
    }

    return { userId, role: input.role as UserRole };
  })();
  } catch (error) {
    if (error instanceof WelfareError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") && message.toLowerCase().includes("email")) {
      throw new WelfareError("Esiste già un account con questa email.", 409);
    }
    if (message.includes("UNIQUE") && message.toLowerCase().includes("slug")) {
      throw new WelfareError("Questo nome è già usato nel circuito. Scegline un altro.");
    }
    throw error;
  }
}
