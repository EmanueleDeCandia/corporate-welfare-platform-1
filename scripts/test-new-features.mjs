// scripts/test-new-features.mjs
import Database from 'better-sqlite3';

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {}

  const cookieHeader = res.headers.get('set-cookie');
  return { status: res.status, headers: res.headers, text, json, cookie: cookieHeader };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function login(email, password = 'radici2026') {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 200 && res.cookie) {
    const match = res.cookie.match(/radici_session=([^;]+)/);
    return match ? match[1] : null;
  }
  return null;
}

async function run() {
  console.log('=== VERIFICA NUOVE FUNZIONALITA RADICI ===\n');

  const db = new Database('radici.db');

  // 0. Verifica Paolo Luzi & Teatro Lauro Rossi (NON fornitore, MA Promotore Culturale del Matching Grant)
  console.log('--- 0. Verifica Ruolo Paolo Luzi e Teatro Lauro Rossi ---');
  const paoloUser = db.prepare("SELECT id, email, role, venue_id FROM users WHERE email = 'paolo@teatrolauro.it'").get();
  assert(paoloUser && paoloUser.role === 'promoter', `Paolo Luzi ha ruolo '${paoloUser?.role}' (ATTESO: promoter)`);

  const teatroVenue = db.prepare("SELECT id, name, type, provider_user_id, sponsor_company_id FROM venues WHERE id = 5").get();
  assert(teatroVenue && teatroVenue.type === 'theater', `Teatro Lauro Rossi è di tipo '${teatroVenue?.type}'`);
  assert(teatroVenue.sponsor_company_id === null, 'Teatro Lauro Rossi non è sponsorizzato da impresa CSR (finanziato dai Promotori)');

  const paoloCookie = await login('paolo@teatrolauro.it');
  assert(!!paoloCookie, 'Login Paolo Luzi effettuato');
  const paoloPromRes = await request('/promotori', { headers: { Cookie: `radici_session=${paoloCookie}` } });
  assert(paoloPromRes.status === 200, 'Paolo Luzi accede a /promotori (Control Room Matching Grant)');
  const paoloFornRes = await request('/fornitore', { headers: { Cookie: `radici_session=${paoloCookie}` } });
  assert(paoloFornRes.status === 307 || paoloFornRes.status === 302, 'Paolo Luzi correttamente reindirizzato da /fornitore');

  // 1. Verifica 6 Produttori Filiera Corta
  console.log('\n--- 1. Verifica Database Produttori Filiera Corta ---');
  const producers = db.prepare("SELECT id, name, city, basket_name, price_basket_cents FROM venues WHERE type = 'producer'").all();
  assert(producers.length === 6, `Trovati ${producers.length} produttori filiera corta (attesi 6)`);
  for (const p of producers) {
    assert(p.basket_name && p.price_basket_cents > 0, `Produttore "${p.name}" ha cesto "${p.basket_name}" (€${p.price_basket_cents / 100})`);
  }

  // 2. Login Mario Rossi (Dipendente Welfare)
  console.log('\n--- 2. Login Mario Rossi (Dipendente Welfare) ---');
  const marioCookie = await login('mario.rossi@acme.it');
  assert(!!marioCookie, 'Login Mario Rossi effettuato');

  // Reset demo vouchers per partire puliti
  const resetRes = await request('/api/vouchers/reset-demo', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
  });
  assert(resetRes.status === 200, 'Reset demo vouchers Mario completato');

  // Seleziona un voucher hotel
  const availableVoucher = db.prepare("SELECT id FROM vouchers WHERE user_id = 2 AND type = 'hotel' AND status = 'available'").get();
  assert(!!availableVoucher, `Voucher hotel disponibile id=${availableVoucher?.id}`);

  console.log('\n--- 3. Selezione Struttura + Spettacolo Matching Grant ---');
  const redeemRes = await request('/api/vouchers/redeem', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({
      voucherId: availableVoucher.id,
      venueId: 2, // Agriturismo
      grantEventId: 1, // Teatro Lauro Rossi
    }),
  });
  assert(redeemRes.status === 200, 'Voucher selezionato con successo (status=selected)');

  const voucherAfter = db.prepare("SELECT status, venue_id, grant_event_id FROM vouchers WHERE id = ?").get(availableVoucher.id);
  assert(voucherAfter.status === 'selected', `Voucher status è '${voucherAfter.status}'`);

  const grantAfter = db.prepare("SELECT id, status, seats_requested FROM matching_grants WHERE voucher_id = ?").get(availableVoucher.id);
  assert(!!grantAfter && grantAfter.status === 'assigned', `Matching grant assegnato (status=${grantAfter?.status}, seats=${grantAfter?.seats_requested})`);

  // Verifica creazione prenotazioni gemelle in bookings per Mario (come gli amici!)
  const marioBookings = db.prepare("SELECT id, booking_type, voucher_id, final_price_cents, party_size FROM bookings WHERE user_id = 2 AND voucher_id = ?").all(availableVoucher.id);
  assert(marioBookings.length === 2, `Create ${marioBookings.length} prenotazioni in 'bookings' per Mario (hotel e teatro)`);
  const bHotel = marioBookings.find(b => b.booking_type === 'hospitality');
  const bTheater = marioBookings.find(b => b.booking_type === 'theater_event');
  assert(!!bHotel && bHotel.final_price_cents === 0, 'Prenotazione hotel presente in bookings con 0€ da pagare (coperto da welfare)');
  assert(!!bTheater && bTheater.final_price_cents === 0 && bTheater.party_size === 2, 'Prenotazione spettacolo teatro presente in bookings con 2 posti omaggio');

  // 4. Test Azioni Mario su Prenotazioni (Come un Amico: Riconferma Presenza)
  console.log('\n--- 4. Mario riconferma presenza su soggiorno e teatro ---');
  const confPresRes = await request('/api/bookings/status', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({ bookingId: bHotel.id, status: 'presence_confirmed' }),
  });
  assert(confPresRes.status === 200, 'Mario ha riconfermato la presenza per il soggiorno');

  const confTheaterRes = await request('/api/bookings/status', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({ bookingId: bTheater.id, status: 'presence_confirmed' }),
  });
  assert(confTheaterRes.status === 200, 'Mario ha riconfermato la presenza per lo spettacolo a teatro');

  // 5. Test Annullamento Prenotazione / Cambio Fornitore
  console.log('\n--- 5. Test Annullamento e Cambio Fornitore da parte di Mario ---');
  const cancelBookingRes = await request('/api/bookings/status', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({ bookingId: bHotel.id, status: 'cancelled' }),
  });
  assert(cancelBookingRes.status === 200, 'Mario annulla la prenotazione dal pannello');

  const voucherReverted = db.prepare("SELECT status, venue_id, grant_event_id FROM vouchers WHERE id = ?").get(availableVoucher.id);
  assert(voucherReverted.status === 'available' && voucherReverted.venue_id === null, 'Voucher ritornato available nel portafoglio di Mario');

  const grantCleaned = db.prepare("SELECT id FROM matching_grants WHERE voucher_id = ?").get(availableVoucher.id);
  assert(!grantCleaned, 'Matching grant e posti teatro eliminati e liberati per la capienza');

  // 6. Test Acquisto Cesto Filiera Corta da parte di Mario Rossi (Dipendente -> ZERO SCONTI)
  console.log('\n--- 6. Ordine Cesto Filiera Corta: Mario Rossi (0% Sconto) ---');
  const frantoio = producers.find(p => p.name.includes('Frantoio'));
  const marioOrderRes = await request('/api/bookings', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({
      venueId: frantoio.id,
      bookingType: 'local_basket',
      bookingDate: '2026-11-10',
      timeSlot: 'Spedizione a domicilio',
      partySize: 2, // 2 cesti
      notes: 'Via Matteotti 12, Ancona - lasciare al portiere',
    }),
  });
  assert(marioOrderRes.status === 201, 'Ordine cesto registrato da Mario Rossi');
  assert(marioOrderRes.json.booking.discountPercent === 0, `Sconto dipendente applicato: ${marioOrderRes.json.booking.discountPercent}% (ATTESO: 0%)`);
  assert(marioOrderRes.json.booking.discountCents === 0, `Sconto in centesimi: ${marioOrderRes.json.booking.discountCents} (ATTESO: 0)`);
  assert(marioOrderRes.json.booking.finalPriceCents === frantoio.price_basket_cents * 2, `Prezzo pieno applicato: €${marioOrderRes.json.booking.finalPriceCents / 100}`);

  // 7. Test Acquisto Cesto Filiera Corta da parte di Luigi Bianchi (Amico Referral -> 10% SCONTO)
  console.log('\n--- 7. Ordine Cesto Filiera Corta: Luigi Bianchi (10% Sconto Community) ---');
  const luigiCookie = await login('luigi.bianchi@email.it');
  assert(!!luigiCookie, 'Login Luigi Bianchi (amico invitato)');

  const cantina = producers.find(p => p.name.includes('Moroder'));
  const luigiOrderRes = await request('/api/bookings', {
    method: 'POST',
    headers: { Cookie: `radici_session=${luigiCookie}` },
    body: JSON.stringify({
      venueId: cantina.id,
      bookingType: 'local_basket',
      bookingDate: '2026-11-12',
      timeSlot: 'Ritiro in cantina',
      partySize: 1, // 1 cesto
      notes: 'Ritiro di persona sabato mattina',
    }),
  });
  assert(luigiOrderRes.status === 201, 'Ordine cesto registrato da Luigi Bianchi');
  assert(luigiOrderRes.json.booking.discountPercent === 10, `Sconto amico applicato: ${luigiOrderRes.json.booking.discountPercent}% (ATTESO: 10%)`);
  const expectedDiscount = Math.round((cantina.price_basket_cents * 10) / 100);
  assert(luigiOrderRes.json.booking.discountCents === expectedDiscount, `Sconto applicato di €${expectedDiscount / 100}`);
  assert(luigiOrderRes.json.booking.finalPriceCents === cantina.price_basket_cents - expectedDiscount, `Prezzo finale scontato: €${luigiOrderRes.json.booking.finalPriceCents / 100}`);

  // 8. Test Conferma Ricezione / Riconferma Presenza
  console.log('\n--- 8. Conferma Presenza / Ricezione Cesto ---');
  const bookingId = luigiOrderRes.json.booking.id;
  const statusRes = await request('/api/bookings/status', {
    method: 'POST',
    headers: { Cookie: `radici_session=${luigiCookie}` },
    body: JSON.stringify({ bookingId, status: 'presence_confirmed' }),
  });
  assert(statusRes.status === 200, 'Stato ordine aggiornato a presence_confirmed');

  console.log(`\n========================================`);
  console.log(`RISULTATO FINALE: ${passed} PASSATI, ${failed} FALLITI`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
