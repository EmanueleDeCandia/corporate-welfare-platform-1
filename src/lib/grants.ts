import { sqlite } from "@/db";
import { WelfareError } from "@/lib/welfare";
import { randomCode, unixSeconds } from "@/lib/utils";

const HOLDING_STATUSES = "('assigned','confirmation_sent','confirmed','attended')";

export function eventSeats(eventId: number) {
  return sqlite.prepare(`SELECT * FROM v_event_seats WHERE event_id = ?`).get(eventId) as
    | {
        event_id: number;
        title: string;
        venue_id: number;
        capacity: number;
        starts_at: number;
        seats_occupied: number;
        seats_free: number;
      }
    | undefined;
}

export function listGrantEvents() {
  return sqlite
    .prepare(
      `SELECT e.*, v.name AS venue_name, v.city AS venue_city, v.region AS venue_region,
              s.seats_occupied, s.seats_free
       FROM grant_events e
       JOIN venues v ON v.id = e.venue_id
       JOIN v_event_seats s ON s.event_id = e.id
       WHERE e.active = 1
       ORDER BY e.starts_at ASC`,
    )
    .all() as Array<{
    id: number;
    title: string;
    category: string;
    venue_id: number;
    description: string;
    starts_at: number;
    capacity: number;
    per_person_cents: number;
    confirmation_send_days: number;
    confirmation_deadline_days: number;
    artist_meetup_included: number;
    active: number;
    venue_name: string;
    venue_city: string;
    venue_region: string;
    seats_occupied: number;
    seats_free: number;
  }>;
}

export function claimGrant(input: {
  userId: number;
  voucherId: number;
  eventId: number;
  seatsRequested: 1 | 2;
  employeeName: string;
  employeeEmail: string;
  companionName?: string;
  companionEmail?: string;
}) {
  if (input.seatsRequested !== 1 && input.seatsRequested !== 2) {
    throw new WelfareError("Puoi richiedere 1 o 2 posti.");
  }
  if (input.seatsRequested === 2 && !input.companionName?.trim()) {
    throw new WelfareError("Indica il nome dell'accompagnatore per il secondo posto.");
  }

  return sqlite.transaction(() => {
    const voucher = sqlite
      .prepare(`SELECT * FROM vouchers WHERE id = ? AND user_id = ?`)
      .get(input.voucherId, input.userId) as
      | { id: number; benefit_type: string; status: string }
      | undefined;
    if (!voucher) throw new WelfareError("Voucher non trovato.", 404);
    if (voucher.benefit_type !== "overnight") {
      throw new WelfareError("Il Matching Grant spetta solo a chi seleziona il pernottamento.");
    }
    if (!["selected", "attended", "no_show"].includes(voucher.status)) {
      throw new WelfareError("Seleziona prima il pernottamento, poi l'evento culturale.");
    }
    const existing = sqlite
      .prepare(`SELECT id FROM matching_grants WHERE voucher_id = ?`)
      .get(voucher.id);
    if (existing) throw new WelfareError("Hai già prenotato i posti per questo voucher.");

    const event = sqlite
      .prepare(`SELECT * FROM grant_events WHERE id = ? AND active = 1`)
      .get(input.eventId) as
      | {
          id: number;
          starts_at: number;
          capacity: number;
          confirmation_send_days: number;
          confirmation_deadline_days: number;
        }
      | undefined;
    if (!event) throw new WelfareError("Evento non disponibile.", 404);

    const occupiedRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(seats_requested), 0) AS occupied
         FROM matching_grants
         WHERE event_id = ? AND status IN ${HOLDING_STATUSES}`,
      )
      .get(event.id) as { occupied: number };
    if (occupiedRow.occupied + input.seatsRequested > event.capacity) {
      throw new WelfareError("Non ci sono abbastanza posti per questo evento.");
    }

    const now = unixSeconds();
    const qrToken = randomCode("grt");
    const grant = sqlite
      .prepare(
        `INSERT INTO matching_grants (voucher_id, event_id, amount_cents, seats_requested, status, assigned_at, qr_token)
         VALUES (?, ?, 5000, ?, 'assigned', ?, ?)`,
      )
      .run(voucher.id, event.id, input.seatsRequested, now, qrToken);
    const grantId = Number(grant.lastInsertRowid);

    sqlite
      .prepare(
        `INSERT INTO grant_seats (matching_grant_id, holder_role, holder_name, holder_email, value_cents, attended)
         VALUES (?, 'employee', ?, ?, 2500, 0)`,
      )
      .run(grantId, input.employeeName, input.employeeEmail);
    if (input.seatsRequested === 2) {
      sqlite
        .prepare(
          `INSERT INTO grant_seats (matching_grant_id, holder_role, holder_name, holder_email, value_cents, attended)
           VALUES (?, 'companion', ?, ?, 2500, 0)`,
        )
        .run(grantId, input.companionName!.trim(), input.companionEmail?.trim() || null);
    }

    const scheduledFor = event.starts_at - event.confirmation_send_days * 24 * 60 * 60;
    const respondBy = event.starts_at - event.confirmation_deadline_days * 24 * 60 * 60;
    sqlite
      .prepare(
        `INSERT INTO grant_confirmations (matching_grant_id, token, scheduled_for, respond_by, channel, delivery_status, reminder_count)
         VALUES (?, ?, ?, ?, 'email', 'pending', 0)`,
      )
      .run(grantId, randomCode("cnf"), scheduledFor, respondBy);

    return { grantId, qrToken };
  })();
}

export function respondGrantConfirmation(token: string, response: "confirmed" | "declined") {
  return sqlite.transaction(() => {
    const row = sqlite
      .prepare(
        `SELECT c.*, g.id AS grant_id, g.status AS grant_status
         FROM grant_confirmations c
         JOIN matching_grants g ON g.id = c.matching_grant_id
         WHERE c.token = ?`,
      )
      .get(token) as
      | {
          id: number;
          grant_id: number;
          grant_status: string;
          respond_by: number;
          response: string | null;
        }
      | undefined;
    if (!row) throw new WelfareError("Link di conferma non valido.", 404);
    if (row.response) throw new WelfareError("Hai già risposto a questa conferma.");
    if (!["assigned", "confirmation_sent"].includes(row.grant_status)) {
      throw new WelfareError("Questa prenotazione non è più modificabile.");
    }
    const now = unixSeconds();
    if (now > row.respond_by) {
      sqlite
        .prepare(`UPDATE matching_grants SET status = 'expired' WHERE id = ?`)
        .run(row.grant_id);
      throw new WelfareError("Il termine per confermare è scaduto. I posti sono stati liberati.");
    }
    sqlite
      .prepare(`UPDATE grant_confirmations SET response = ?, responded_at = ? WHERE id = ?`)
      .run(response, now, row.id);
    if (response === "confirmed") {
      sqlite
        .prepare(`UPDATE matching_grants SET status = 'confirmed', confirmed_at = ? WHERE id = ?`)
        .run(now, row.grant_id);
    } else {
      sqlite.prepare(`UPDATE matching_grants SET status = 'declined' WHERE id = ?`).run(row.grant_id);
    }
    return { grantId: row.grant_id, response };
  })();
}

export function processGrantConfirmations(now = unixSeconds()) {
  const due = sqlite
    .prepare(
      `SELECT c.id AS confirmation_id, c.matching_grant_id, g.status
       FROM grant_confirmations c
       JOIN matching_grants g ON g.id = c.matching_grant_id
       WHERE g.status = 'assigned' AND c.scheduled_for <= ? AND c.sent_at IS NULL`,
    )
    .all(now) as Array<{ confirmation_id: number; matching_grant_id: number }>;

  for (const item of due) {
    sqlite
      .prepare(
        `UPDATE grant_confirmations SET sent_at = ?, delivery_status = 'logged' WHERE id = ?`,
      )
      .run(now, item.confirmation_id);
    sqlite
      .prepare(`UPDATE matching_grants SET status = 'confirmation_sent' WHERE id = ? AND status = 'assigned'`)
      .run(item.matching_grant_id);
  }

  const expired = sqlite
    .prepare(
      `SELECT c.id AS confirmation_id, c.matching_grant_id
       FROM grant_confirmations c
       JOIN matching_grants g ON g.id = c.matching_grant_id
       WHERE g.status = 'confirmation_sent' AND c.respond_by < ? AND c.response IS NULL`,
    )
    .all(now) as Array<{ confirmation_id: number; matching_grant_id: number }>;

  for (const item of expired) {
    sqlite
      .prepare(`UPDATE matching_grants SET status = 'expired' WHERE id = ? AND status = 'confirmation_sent'`)
      .run(item.matching_grant_id);
  }

  const pastEvents = sqlite
    .prepare(
      `SELECT g.id
       FROM matching_grants g
       JOIN grant_events e ON e.id = g.event_id
       WHERE e.starts_at < ? AND g.status = 'confirmed'`,
    )
    .all(now) as Array<{ id: number }>;
  for (const grant of pastEvents) {
    const attended = sqlite
      .prepare(`SELECT COUNT(*) AS n FROM grant_seats WHERE matching_grant_id = ? AND attended = 1`)
      .get(grant.id) as { n: number };
    sqlite
      .prepare(`UPDATE matching_grants SET status = ? WHERE id = ? AND status = 'confirmed'`)
      .run(attended.n > 0 ? "attended" : "no_show", grant.id);
  }

  return { sent: due.length, expired: expired.length, closed: pastEvents.length };
}

export function markGrantAttendance(input: {
  grantId: number;
  venueId: number;
  actorUserId: number;
  seatIds?: number[];
  present: boolean;
}) {
  return sqlite.transaction(() => {
    const grant = sqlite
      .prepare(
        `SELECT g.* FROM matching_grants g
         JOIN grant_events e ON e.id = g.event_id
         WHERE g.id = ? AND e.venue_id = ?`,
      )
      .get(input.grantId, input.venueId) as { id: number; status: string } | undefined;
    if (!grant) throw new WelfareError("Grant non trovato per questo teatro.", 404);
    if (!["confirmed", "confirmation_sent", "assigned", "attended"].includes(grant.status)) {
      throw new WelfareError("Questo grant non può essere convalidato.");
    }
    const now = unixSeconds();
    if (input.present) {
      if (input.seatIds && input.seatIds.length > 0) {
        const upd = sqlite.prepare(
          `UPDATE grant_seats SET attended = 1, attended_at = ? WHERE id = ? AND matching_grant_id = ?`,
        );
        for (const seatId of input.seatIds) upd.run(now, seatId, grant.id);
      } else {
        sqlite
          .prepare(`UPDATE grant_seats SET attended = 1, attended_at = ? WHERE matching_grant_id = ?`)
          .run(now, grant.id);
      }
      sqlite
        .prepare(`UPDATE matching_grants SET status = 'attended', attended_at = ? WHERE id = ?`)
        .run(now, grant.id);
    } else {
      sqlite.prepare(`UPDATE matching_grants SET status = 'no_show' WHERE id = ?`).run(grant.id);
    }
    sqlite
      .prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
         VALUES (?, 'grant.attendance', 'matching_grants', ?, ?, ?)`,
      )
      .run(input.actorUserId, String(grant.id), JSON.stringify({ present: input.present }), now);
    return true;
  })();
}

export function getGrantPipeline() {
  const counts = sqlite
    .prepare(
      `SELECT status, COUNT(*) AS n, COALESCE(SUM(seats_requested), 0) AS seats
       FROM matching_grants GROUP BY status`,
    )
    .all() as Array<{ status: string; n: number; seats: number }>;
  const map = Object.fromEntries(counts.map((row) => [row.status, row]));
  const overnightSelected = sqlite
    .prepare(
      `SELECT COUNT(*) AS n FROM vouchers WHERE benefit_type = 'overnight' AND status IN ('selected','attended','no_show')`,
    )
    .get() as { n: number };
  const overnightWithoutGrant = sqlite
    .prepare(
      `SELECT COUNT(*) AS n
       FROM vouchers v
       LEFT JOIN matching_grants g ON g.voucher_id = v.id
       WHERE v.benefit_type = 'overnight'
         AND v.status IN ('selected','attended','no_show')
         AND g.id IS NULL`,
    )
    .get() as { n: number };
  return {
    overnightSelected: overnightSelected.n,
    overnightWithoutGrant: overnightWithoutGrant.n,
    assigned: map.assigned?.n ?? 0,
    confirmationSent: map.confirmation_sent?.n ?? 0,
    confirmed: map.confirmed?.n ?? 0,
    declined: map.declined?.n ?? 0,
    expired: map.expired?.n ?? 0,
    attended: map.attended?.n ?? 0,
    noShow: map.no_show?.n ?? 0,
    seatsHeld:
      (map.assigned?.seats ?? 0) +
      (map.confirmation_sent?.seats ?? 0) +
      (map.confirmed?.seats ?? 0) +
      (map.attended?.seats ?? 0),
  };
}
