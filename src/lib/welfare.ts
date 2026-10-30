import { sqlite } from "@/db";
import type { BenefitType } from "@/db/schema";
import { commissionBpsFor, splitPlatformFee } from "@/lib/settlement";
import { badgeForPoints, randomCode, unixSeconds } from "@/lib/utils";

export class WelfareError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type PlanBudgetRow = {
  plan_id: number;
  company_id: number;
  year: number;
  status: string;
  eligible_employees: number;
  valid_until: string;
  extra_window_days: number;
  overnight_amount_cents: number;
  dinner_amount_cents: number;
  overnight_base: number;
  dinner_base: number;
  vouchers_available: number;
  virtual_budget_cents: number;
  overnight_base_selected: number;
  dinner_base_selected: number;
  overnight_selected: number;
  dinner_selected: number;
  real_budget_cents: number;
  overnight_extra_granted: number;
  dinner_extra_granted: number;
  overnight_extra_threshold_bps: number;
  overnight_extra_cap_bps: number;
  dinner_extra_threshold_bps: number;
  dinner_extra_cap_bps: number;
};

export type PlanBudget = PlanBudgetRow & {
  extraWindowOpen: boolean;
  extraOpensOn: string;
  overnightUnused: number;
  dinnerUnused: number;
  overnightExtraAllowed: boolean;
  dinnerExtraAllowed: boolean;
  overnightExtraRemaining: number;
  dinnerExtraRemaining: number;
  overnightSelectionRate: number;
  dinnerSelectionRate: number;
};

export function extraWindowOpen(validUntil: string, windowDays: number, now = new Date()) {
  const until = new Date(`${validUntil}T23:59:59`);
  if (Number.isNaN(until.getTime())) return false;
  const start = new Date(`${validUntil}T00:00:00`);
  start.setDate(start.getDate() - Math.max(0, windowDays));
  return now >= start && now <= until;
}

export function extraOpensOn(validUntil: string, windowDays: number) {
  const until = new Date(`${validUntil}T00:00:00`);
  if (Number.isNaN(until.getTime())) return validUntil;
  until.setDate(until.getDate() - Math.max(0, windowDays));
  return until.toISOString().slice(0, 10);
}

function leftoverExtraRule(input: {
  base: number;
  baseSelected: number;
  extraGranted: number;
  thresholdBps: number;
  capBps: number;
  nearDeadline: boolean;
}) {
  const unused = Math.max(0, input.base - input.baseSelected);
  const minUnused = Math.floor((input.base * input.thresholdBps) / 10000);
  const cap = Math.floor((unused * input.capBps) / 10000);
  const remaining = Math.max(0, cap - input.extraGranted);
  return {
    unused,
    minUnused,
    cap,
    remaining,
    allowed: input.nearDeadline && unused >= minUnused && remaining > 0,
  };
}

export function getActivePlan(companyId: number) {
  return sqlite
    .prepare(
      `SELECT * FROM welfare_plans WHERE company_id = ? AND status = 'active' ORDER BY year DESC LIMIT 1`,
    )
    .get(companyId) as
    | {
        id: number;
        company_id: number;
        year: number;
        valid_from: string;
        valid_until: string;
        eligible_employees: number;
        overnight_amount_cents: number;
        dinner_amount_cents: number;
        overnight_extra_threshold_bps: number;
        overnight_extra_cap_bps: number;
        dinner_extra_threshold_bps: number;
        dinner_extra_cap_bps: number;
        extra_window_days: number;
        status: string;
      }
    | undefined;
}

export function getPlanBudget(companyId: number): PlanBudget | null {
  const row = sqlite
    .prepare(`SELECT * FROM v_plan_budget WHERE company_id = ? ORDER BY year DESC LIMIT 1`)
    .get(companyId) as PlanBudgetRow | undefined;
  if (!row) return null;
  const nearDeadline = extraWindowOpen(row.valid_until, row.extra_window_days);
  const overnight = leftoverExtraRule({
    base: row.overnight_base,
    baseSelected: row.overnight_base_selected,
    extraGranted: row.overnight_extra_granted,
    thresholdBps: row.overnight_extra_threshold_bps,
    capBps: row.overnight_extra_cap_bps,
    nearDeadline,
  });
  const dinner = leftoverExtraRule({
    base: row.dinner_base,
    baseSelected: row.dinner_base_selected,
    extraGranted: row.dinner_extra_granted,
    thresholdBps: row.dinner_extra_threshold_bps,
    capBps: row.dinner_extra_cap_bps,
    nearDeadline,
  });
  return {
    ...row,
    extraWindowOpen: nearDeadline,
    extraOpensOn: extraOpensOn(row.valid_until, row.extra_window_days),
    overnightUnused: overnight.unused,
    dinnerUnused: dinner.unused,
    overnightExtraAllowed: overnight.allowed,
    dinnerExtraAllowed: dinner.allowed,
    overnightExtraRemaining: overnight.remaining,
    dinnerExtraRemaining: dinner.remaining,
    overnightSelectionRate:
      row.overnight_base > 0 ? Number(((row.overnight_base_selected / row.overnight_base) * 100).toFixed(1)) : 0,
    dinnerSelectionRate:
      row.dinner_base > 0 ? Number(((row.dinner_base_selected / row.dinner_base) * 100).toFixed(1)) : 0,
  };
}

export function issueBaseVouchers(planId: number, userId: number, companyId: number) {
  const plan = sqlite.prepare(`SELECT * FROM welfare_plans WHERE id = ?`).get(planId) as
    | { overnight_amount_cents: number; dinner_amount_cents: number }
    | undefined;
  if (!plan) throw new WelfareError("Piano welfare non trovato.", 404);

  const insert = sqlite.prepare(`
    INSERT OR IGNORE INTO vouchers (plan_id, user_id, company_id, benefit_type, origin, extra_allocation_id, amount_cents, status, created_at)
    VALUES (?, ?, ?, ?, 'base', NULL, ?, 'assigned', ?)
  `);
  const now = unixSeconds();
  insert.run(planId, userId, companyId, "overnight", plan.overnight_amount_cents, now);
  insert.run(planId, userId, companyId, "dinner", plan.dinner_amount_cents, now);
}

export function addCompanyEmployee(input: {
  companyId: number;
  actorUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}) {
  return sqlite.transaction(() => {
    const existing = sqlite.prepare(`SELECT id FROM users WHERE email = ?`).get(input.email) as
      | { id: number }
      | undefined;
    if (existing) throw new WelfareError("Esiste già un account con questa email.", 409);

    const info = sqlite
      .prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, impact_points, badge_level, referral_code, created_at)
         VALUES (?, ?, ?, ?, 'employee', ?, 0, ?, ?, ?)`,
      )
      .run(
        input.email,
        input.passwordHash,
        input.firstName,
        input.lastName,
        input.companyId,
        badgeForPoints(0).label,
        randomCode("dip"),
        unixSeconds(),
      );
    const userId = Number(info.lastInsertRowid);
    const plan = getActivePlan(input.companyId);
    if (plan) issueBaseVouchers(plan.id, userId, input.companyId);
    sqlite
      .prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
         VALUES (?, 'employee.add', 'users', ?, ?, ?)`,
      )
      .run(input.actorUserId, String(userId), JSON.stringify({ email: input.email }), unixSeconds());
    return userId;
  })();
}

export function extraEligibleUserIds(planId: number, benefitType: BenefitType) {
  const rows = sqlite
    .prepare(
      `SELECT DISTINCT v.user_id AS userId
       FROM vouchers v
       WHERE v.plan_id = ?
         AND v.benefit_type = ?
         AND v.origin = 'base'
         AND v.status IN ('selected','attended','no_show')
         AND NOT EXISTS (
           SELECT 1 FROM vouchers e
           WHERE e.plan_id = v.plan_id
             AND e.user_id = v.user_id
             AND e.benefit_type = v.benefit_type
             AND e.origin = 'extra'
         )`,
    )
    .all(planId, benefitType) as Array<{ userId: number }>;
  return rows.map((row) => row.userId);
}

export function allocateExtra(input: {
  companyId: number;
  actorUserId: number;
  benefitType: BenefitType;
  userIds: number[];
}) {
  const uniqueIds = [...new Set(input.userIds)];
  if (uniqueIds.length === 0) throw new WelfareError("Seleziona almeno un dipendente.");

  return sqlite.transaction(() => {
    const budget = getPlanBudget(input.companyId);
    const plan = getActivePlan(input.companyId);
    if (!budget || !plan) throw new WelfareError("Piano welfare non trovato.", 404);

    const remaining =
      input.benefitType === "overnight" ? budget.overnightExtraRemaining : budget.dinnerExtraRemaining;
    const allowed = input.benefitType === "overnight" ? budget.overnightExtraAllowed : budget.dinnerExtraAllowed;
    if (!allowed) {
      if (!budget.extraWindowOpen) {
        throw new WelfareError(
          `Gli extra si aprono a ridosso della scadenza, dal ${budget.extraOpensOn}. Ogni addetto resta su 1 pernottamento e 1 cena fino ad allora.`,
        );
      }
      throw new WelfareError(
        "Extra non consentiti: i voucher non selezionati sono sotto il 20%, oppure il tetto del 20% dei residui è esaurito.",
      );
    }
    if (uniqueIds.length > remaining) {
      throw new WelfareError(`Puoi assegnare al massimo ${remaining} voucher extra di questo tipo.`);
    }

    const eligible = new Set(extraEligibleUserIds(plan.id, input.benefitType));
    for (const userId of uniqueIds) {
      if (!eligible.has(userId)) {
        throw new WelfareError(
          "Gli extra si assegnano solo a chi ha già terminato il voucher base dello stesso tipo e non ne ha già uno extra.",
        );
      }
      const belongs = sqlite
        .prepare(`SELECT id FROM users WHERE id = ? AND company_id = ? AND role = 'employee'`)
        .get(userId, input.companyId);
      if (!belongs) throw new WelfareError("Dipendente non valido per questa impresa.");
    }

    const amount =
      input.benefitType === "overnight" ? plan.overnight_amount_cents : plan.dinner_amount_cents;
    const selectedAtTime =
      input.benefitType === "overnight" ? budget.overnight_base_selected : budget.dinner_base_selected;
    const unusedAtTime = input.benefitType === "overnight" ? budget.overnightUnused : budget.dinnerUnused;

    const alloc = sqlite
      .prepare(
        `INSERT INTO plan_extra_allocations (plan_id, created_by_user_id, benefit_type, selected_at_time, available_at_time, vouchers_granted, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        plan.id,
        input.actorUserId,
        input.benefitType,
        selectedAtTime,
        unusedAtTime,
        uniqueIds.length,
        unixSeconds(),
      );
    const allocationId = Number(alloc.lastInsertRowid);
    const insertVoucher = sqlite.prepare(
      `INSERT INTO vouchers (plan_id, user_id, company_id, benefit_type, origin, extra_allocation_id, amount_cents, status, created_at)
       VALUES (?, ?, ?, ?, 'extra', ?, ?, 'assigned', ?)`,
    );
    const now = unixSeconds();
    for (const userId of uniqueIds) {
      insertVoucher.run(plan.id, userId, input.companyId, input.benefitType, allocationId, amount, now);
    }
    sqlite
      .prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
         VALUES (?, 'extra.allocate', 'plan_extra_allocations', ?, ?, ?)`,
      )
      .run(
        input.actorUserId,
        String(allocationId),
        JSON.stringify({ benefitType: input.benefitType, userIds: uniqueIds }),
        now,
      );
    return allocationId;
  })();
}

export function selectVoucher(input: {
  userId: number;
  companyId: number;
  companyName: string;
  vatNumber: string;
  guestName: string;
  voucherId: number;
  venueId: number;
  offeringId: number;
  serviceDate: string;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.serviceDate)) {
    throw new WelfareError("Indica la data del servizio (AAAA-MM-GG).");
  }

  return sqlite.transaction(() => {
    const voucher = sqlite
      .prepare(`SELECT * FROM vouchers WHERE id = ? AND user_id = ?`)
      .get(input.voucherId, input.userId) as
      | {
          id: number;
          status: string;
          benefit_type: BenefitType;
          amount_cents: number;
          company_id: number;
          plan_id: number;
        }
      | undefined;
    if (!voucher) throw new WelfareError("Voucher non trovato.", 404);
    if (voucher.status !== "assigned") throw new WelfareError("Questo voucher non è più selezionabile.");

    const offering = sqlite
      .prepare(
        `SELECT * FROM venue_offerings WHERE id = ? AND venue_id = ? AND active = 1 AND accepts_welfare = 1`,
      )
      .get(input.offeringId, input.venueId) as
      | { id: number; venue_id: number; benefit_type: string; name: string; list_price_cents: number }
      | undefined;
    if (!offering) throw new WelfareError("Offerta non disponibile per questa struttura.");
    if (offering.benefit_type !== voucher.benefit_type) {
      throw new WelfareError("L'offerta scelta non corrisponde al tipo di voucher.");
    }

    const venue = sqlite.prepare(`SELECT id, name FROM venues WHERE id = ?`).get(input.venueId) as
      | { id: number; name: string }
      | undefined;
    if (!venue) throw new WelfareError("Struttura non trovata.", 404);

    const upd = sqlite
      .prepare(`UPDATE vouchers SET status = 'selected' WHERE id = ? AND status = 'assigned'`)
      .run(voucher.id);
    if (upd.changes !== 1) throw new WelfareError("Il voucher è già stato selezionato.");

    const qrToken = randomCode("sel");
    const now = unixSeconds();
    const sel = sqlite
      .prepare(
        `INSERT INTO voucher_selections (voucher_id, venue_id, offering_id, service_date, selected_at, attendance_status, qr_token)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      )
      .run(voucher.id, venue.id, offering.id, input.serviceDate, now, qrToken);
    const selectionId = Number(sel.lastInsertRowid);

    const label = voucher.benefit_type === "overnight" ? "Pernottamento" : "Cena KM 0";
    const fee = splitPlatformFee(voucher.amount_cents, commissionBpsFor(voucher.benefit_type));
    const tx = sqlite
      .prepare(
        `INSERT INTO transactions (
           kind, status, user_id, venue_id, company_id, voucher_id, selection_id, offering_id,
           amount_cents, discount_cents, list_price_cents, service_label,
           invoice_number, invoice_date, payment_status, commission_bps, commission_cents, provider_net_cents,
           idempotency_key, created_at
         ) VALUES (
           'welfare_charge', 'confirmed', ?, ?, ?, ?, ?, ?,
           ?, 0, ?, ?,
           NULL, NULL, 'pending', ?, ?, ?,
           ?, ?
         )`,
      )
      .run(
        input.userId,
        venue.id,
        input.companyId,
        voucher.id,
        selectionId,
        offering.id,
        voucher.amount_cents,
        voucher.amount_cents,
        `${label} · ${offering.name}`,
        fee.commissionBps,
        fee.commissionCents,
        fee.providerNetCents,
        `welfare:${voucher.id}`,
        now,
      );
    const txId = Number(tx.lastInsertRowid);
    const euro = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

    sqlite
      .prepare(
        `INSERT INTO notifications (venue_id, type, title, body, payload, read, transaction_id, selection_id, created_at)
         VALUES (?, 'welfare', ?, ?, ?, 0, ?, ?, ?)`,
      )
      .run(
        venue.id,
        `Prospetto fattura: ${label}`,
        `${input.guestName} ha selezionato ${label} per il ${input.serviceDate}. Committente ${input.companyName} · Art. 51 TUIR · ${euro(voucher.amount_cents)} € da fatturare. Fee RADICI ${euro(fee.commissionCents)} € · netto struttura ${euro(fee.providerNetCents)} €.`,
        JSON.stringify({
          guest: input.guestName,
          company: input.companyName,
          vat: input.vatNumber,
          amountCents: voucher.amount_cents,
          commissionCents: fee.commissionCents,
          providerNetCents: fee.providerNetCents,
          serviceDate: input.serviceDate,
          causale: "Welfare aziendale Art. 51 TUIR",
          invoiceHint: `Fattura B2B intestata a ${input.companyName} P.IVA ${input.vatNumber} · Art. 51 TUIR`,
          vatNote: `Lordo ${euro(voucher.amount_cents)} € · Fee RADICI ${euro(fee.commissionCents)} € · Netto ${euro(fee.providerNetCents)} €`,
          transactionId: txId,
        }),
        txId,
        selectionId,
        now,
      );

    awardImpactSync(input.userId, 1, "selection", "voucher", String(voucher.id));
    sqlite
      .prepare(`UPDATE companies SET local_redistribution_cents = local_redistribution_cents + ? WHERE id = ?`)
      .run(voucher.amount_cents, input.companyId);

    return {
      selectionId,
      qrToken,
      benefitType: voucher.benefit_type,
      amountCents: voucher.amount_cents,
    };
  })();
}

export function markSelectionAttendance(input: {
  selectionId: number;
  venueId: number;
  actorUserId: number;
  status: "attended" | "no_show";
}) {
  return sqlite.transaction(() => {
    const selection = sqlite
      .prepare(`SELECT * FROM voucher_selections WHERE id = ? AND venue_id = ?`)
      .get(input.selectionId, input.venueId) as
      | { id: number; voucher_id: number; attendance_status: string }
      | undefined;
    if (!selection) throw new WelfareError("Selezione non trovata.", 404);
    if (selection.attendance_status !== "pending") {
      throw new WelfareError("La presenza è già stata registrata.");
    }
    const now = unixSeconds();
    if (input.status === "attended") {
      sqlite
        .prepare(
          `UPDATE voucher_selections SET attendance_status = 'attended', checked_in_at = ?, checked_in_by_user_id = ? WHERE id = ? AND attendance_status = 'pending'`,
        )
        .run(now, input.actorUserId, selection.id);
      sqlite.prepare(`UPDATE vouchers SET status = 'attended' WHERE id = ? AND status = 'selected'`).run(selection.voucher_id);
    } else {
      sqlite
        .prepare(
          `UPDATE voucher_selections SET attendance_status = 'no_show', no_show_marked_at = ?, checked_in_by_user_id = ? WHERE id = ? AND attendance_status = 'pending'`,
        )
        .run(now, input.actorUserId, selection.id);
      sqlite.prepare(`UPDATE vouchers SET status = 'no_show' WHERE id = ? AND status = 'selected'`).run(selection.voucher_id);
    }
    return true;
  })();
}

export function awardImpactSync(
  userId: number,
  points: number,
  reason: string,
  refType: string,
  refId: string,
) {
  const inserted = sqlite
    .prepare(
      `INSERT OR IGNORE INTO impact_ledger (user_id, reason, points, ref_type, ref_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, reason, points, refType, refId, unixSeconds());
  if (inserted.changes !== 1) return null;
  sqlite.prepare(`UPDATE users SET impact_points = impact_points + ? WHERE id = ?`).run(points, userId);
  const user = sqlite.prepare(`SELECT impact_points FROM users WHERE id = ?`).get(userId) as {
    impact_points: number;
  };
  const badge = badgeForPoints(user.impact_points).label;
  sqlite.prepare(`UPDATE users SET badge_level = ? WHERE id = ?`).run(badge, userId);
  return { impactPoints: user.impact_points, badgeLevel: badge };
}

export function venueOfferFlags(venueId: number) {
  return sqlite.prepare(`SELECT * FROM v_venue_offer_filter WHERE venue_id = ?`).get(venueId) as
    | { venue_id: number; offers_overnight: number; offers_dinner: number; offers_both: number }
    | undefined;
}
