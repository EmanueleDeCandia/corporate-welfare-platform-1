import { sqlite } from "@/db";
import type { BenefitType } from "@/db/schema";
import { unixSeconds } from "@/lib/utils";

export class SettlementError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "SettlementError";
    this.status = status;
  }
}

/** Fee piattaforma: 20% sul pernottamento (50 → 10 + 40), 60% sulla cena (25 → 15 + 10). */
export const PLATFORM_COMMISSION_BPS: Record<BenefitType, number> = {
  overnight: 2000,
  dinner: 6000,
};

export function splitPlatformFee(amountCents: number, bps: number) {
  const commissionCents = Math.floor((amountCents * Math.max(0, bps)) / 10000);
  return {
    commissionBps: bps,
    commissionCents,
    providerNetCents: amountCents - commissionCents,
  };
}

export function commissionBpsFor(benefitType: BenefitType) {
  return PLATFORM_COMMISSION_BPS[benefitType];
}

type TxRow = {
  id: number;
  kind: string;
  status: string;
  venue_id: number;
  invoice_number: string | null;
  invoice_date: string | null;
  payment_status: string;
};

function getTx(id: number) {
  return sqlite.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as TxRow | undefined;
}

export function recordSupplierInvoice(input: {
  transactionId: number;
  venueId?: number;
  actorUserId: number;
  invoiceNumber: string;
  invoiceDate: string;
}) {
  const number = input.invoiceNumber.trim();
  const date = input.invoiceDate.trim();
  if (!number) throw new SettlementError("Indica il numero del documento emesso nel tuo gestionale.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new SettlementError("Indica la data fattura (AAAA-MM-GG).");
  }

  const tx = getTx(input.transactionId);
  if (!tx) throw new SettlementError("Movimento non trovato.", 404);
  if (tx.kind !== "welfare_charge") {
    throw new SettlementError("Gli estremi fattura valgono solo per gli addebiti welfare B2B.");
  }
  if (input.venueId && tx.venue_id !== input.venueId) {
    throw new SettlementError("Questo movimento non appartiene alla tua struttura.", 403);
  }
  if (tx.payment_status === "settled") {
    throw new SettlementError("Il movimento è già saldato: gli estremi non si modificano.");
  }

  const now = unixSeconds();
  sqlite
    .prepare(
      `UPDATE transactions
       SET invoice_number = ?, invoice_date = ?, invoice_recorded_at = ?, status = 'invoiced'
       WHERE id = ?`,
    )
    .run(number, date, now, tx.id);
  sqlite
    .prepare(
      `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
       VALUES (?, 'tx.invoice', 'transactions', ?, ?, ?)`,
    )
    .run(input.actorUserId, String(tx.id), JSON.stringify({ invoiceNumber: number, invoiceDate: date }), now);
  return { ok: true as const, transactionId: tx.id };
}

export function markPaymentSettled(input: {
  transactionId: number;
  venueId?: number;
  actorUserId: number;
}) {
  const tx = getTx(input.transactionId);
  if (!tx) throw new SettlementError("Movimento non trovato.", 404);
  if (tx.kind !== "welfare_charge") {
    throw new SettlementError("Il saldo si registra solo sugli addebiti welfare B2B.");
  }
  if (input.venueId && tx.venue_id !== input.venueId) {
    throw new SettlementError("Questo movimento non appartiene alla tua struttura.", 403);
  }
  if (tx.payment_status === "settled") {
    return { ok: true as const, transactionId: tx.id, already: true };
  }
  if (!tx.invoice_number || !tx.invoice_date) {
    throw new SettlementError("Prima registra numero e data della fattura emessa nel gestionale.");
  }

  const now = unixSeconds();
  sqlite
    .prepare(
      `UPDATE transactions
       SET payment_status = 'settled', payment_settled_at = ?, status = 'paid'
       WHERE id = ?`,
    )
    .run(now, tx.id);
  sqlite
    .prepare(
      `INSERT INTO audit_log (actor_user_id, action, entity, entity_id, data_json, created_at)
       VALUES (?, 'tx.settle', 'transactions', ?, ?, ?)`,
    )
    .run(input.actorUserId, String(tx.id), JSON.stringify({}), now);
  return { ok: true as const, transactionId: tx.id, already: false };
}
