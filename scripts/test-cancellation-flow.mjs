import assert from "node:assert";
import Database from "better-sqlite3";

const BASE_URL = "http://localhost:3000";

async function login(email, password = "radici2026") {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(res.ok, `Login fallito per ${email}`);
  const cookie = res.headers.get("set-cookie");
  return cookie;
}

async function runTest() {
  console.log("=== TEST AUTOMATICO SINCRONIZZAZIONE ANNULLAMENTO LATO SERVER ===");

  const db = new Database("radici.db");

  // 1. Reset voucher 1 di Mario Rossi per test pulito
  db.prepare(`
    UPDATE vouchers 
    SET status = 'available', venue_id = NULL, theater_venue_id = NULL, grant_event_id = NULL, redeemed_at = NULL 
    WHERE id = 1
  `).run();
  db.prepare(`DELETE FROM voucher_selections WHERE voucher_id = 1`).run();
  db.prepare(`DELETE FROM grant_confirmations WHERE matching_grant_id IN (SELECT id FROM matching_grants WHERE voucher_id = 1)`).run();
  db.prepare(`DELETE FROM grant_seats WHERE matching_grant_id IN (SELECT id FROM matching_grants WHERE voucher_id = 1)`).run();
  db.prepare(`DELETE FROM matching_grants WHERE voucher_id = 1`).run();
  db.prepare(`DELETE FROM bookings WHERE voucher_id = 1`).run();
  db.prepare(`
    UPDATE transactions 
    SET status = 'cancelled', payment_status = 'cancelled' 
    WHERE voucher_id = 1 AND type = 'welfare_redeem'
  `).run();

  const marioCookie = await login("mario.rossi@acme.it");
  console.log("  [PASS] Login Mario Rossi");

  // 2. Mario seleziona Agriturismo La Valle (venueId = 1)
  const redeemRes = await fetch(`${BASE_URL}/api/vouchers/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: marioCookie,
    },
    body: JSON.stringify({
      voucherId: 1,
      venueId: 1,
      offeringId: 1,
      serviceDate: "2026-11-10",
      grantSeatsCount: 2,
    }),
  });
  const redeemJson = await redeemRes.json();
  assert(redeemRes.ok, `Redeem fallito: ${JSON.stringify(redeemJson)}`);
  console.log("  [PASS] Mario ha selezionato Agriturismo La Valle (Voucher 1)");

  // Verifica nel DB che la transazione sia attiva
  const txActive = db.prepare(`
    SELECT id, status, payment_status, voucher_id FROM transactions 
    WHERE voucher_id = 1 AND type = 'welfare_redeem' AND status != 'cancelled'
  `).get();
  assert(txActive, "Transazione welfare attiva attesa");
  console.log(`  [PASS] Transazione ${txActive.id} creata come attiva (status: ${txActive.status})`);

  // 3. Mario annulla la selezione del voucher
  const cancelRes = await fetch(`${BASE_URL}/api/vouchers/cancel-selection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: marioCookie,
    },
    body: JSON.stringify({ voucherId: 1 }),
  });
  const cancelJson = await cancelRes.json();
  assert(cancelRes.ok, `Annullamento fallito: ${JSON.stringify(cancelJson)}`);
  console.log("  [PASS] Mario ha annullato la selezione del voucher 1");

  // 4. Verifiche DB post-annullamento:
  // 4a. Voucher ripristinato
  const voucherRow = db.prepare("SELECT status, venue_id FROM vouchers WHERE id = 1").get();
  assert(voucherRow.status === "available", `Stato atteso 'available', trovato: ${voucherRow.status}`);
  assert(voucherRow.venue_id === null, "venue_id deve essere null");
  console.log("  [PASS] Voucher 1 ripristinato a 'available' con venueId nullo");

  // 4b. Transazione B2B marcata cancelled
  const txCancelled = db.prepare(`
    SELECT status, payment_status, payment_notes FROM transactions WHERE id = ?
  `).get(txActive.id);
  assert(txCancelled.status === "cancelled", `Stato tx atteso 'cancelled', trovato: ${txCancelled.status}`);
  assert(txCancelled.payment_status === "cancelled", `Payment status atteso 'cancelled'`);
  console.log("  [PASS] Transazione B2B annullata e debito revocato");

  // 4c. Notifiche per la struttura aggiornate con revoca
  const notif = db.prepare(`
    SELECT title, body, payload FROM notifications 
    WHERE venue_id = 1 AND (title LIKE '%[ANNULLAT%' OR payload LIKE '%cancelled%')
    ORDER BY id DESC LIMIT 1
  `).get();
  assert(notif, "Notifica di annullamento attesa per la struttura");
  assert(notif.title.includes("ANNULLAT"), `Titolo notifica deve contenere ANNULLAT, trovato: ${notif.title}`);
  const notifPayload = JSON.parse(notif.payload);
  assert(notifPayload.cancelled === true, "Payload deve avere cancelled: true");
  assert(notifPayload.invoiceHint.includes("ANNULLATA"), "invoiceHint deve indicare annullamento");
  console.log("  [PASS] Notifiche struttura sincronizzate: divieto di fatturazione e avviso esplicito");

  // 4d. Prenotazioni collegate annullate
  const bookingRows = db.prepare("SELECT status FROM bookings WHERE voucher_id = 1").all();
  for (const b of bookingRows) {
    assert(b.status === "cancelled", `Booking status deve essere cancelled, trovato: ${b.status}`);
  }
  console.log("  [PASS] Tutte le prenotazioni collegate marcate come 'cancelled'");

  console.log("\n========================================================");
  console.log("RISULTATO TEST ANNULLAMENTO: TUTTI I 7 CONTROLLI SUPERATI!");
  console.log("========================================================\n");
}

runTest().catch((e) => {
  console.error("ERRORE TEST:", e);
  process.exit(1);
});
