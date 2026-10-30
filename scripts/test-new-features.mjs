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

  // 0. Verifica Separazione Netta: Startup Promotrice vs Teatri & Eventi vs Fornitori
  console.log('--- 0. Verifica Separazione Ruoli: Startup Promotrice vs Teatri ed Eventi ---');
  const paoloUser = db.prepare("SELECT id, email, role, venue_id FROM users WHERE email = 'paolo@teatrolauro.it'").get();
  assert(paoloUser && paoloUser.role === 'theater', `Paolo Luzi ha ruolo '${paoloUser?.role}' (ATTESO: theater)`);
  assert(paoloUser.venue_id === 5, `Paolo Luzi è associato al Teatro Lauro Rossi (venue_id=5)`);

  const chiaraUser = db.prepare("SELECT id, email, role FROM users WHERE email = 'chiara.promotori@radici.it'").get();
  assert(chiaraUser && chiaraUser.role === 'promoter', `Chiara Valenti ha ruolo '${chiaraUser?.role}' (ATTESO: promoter - Startup RADICI)`);

  const teatroVenue = db.prepare("SELECT id, name, type, provider_user_id, sponsor_company_id FROM venues WHERE id = 5").get();
  assert(teatroVenue && teatroVenue.type === 'theater', `Teatro Lauro Rossi è di tipo '${teatroVenue?.type}'`);
  assert(teatroVenue.sponsor_company_id === null, 'Teatro Lauro Rossi non è sponsorizzato da impresa CSR (omaggi finanziati dai Promotori)');

  const paoloCookie = await login('paolo@teatrolauro.it');
  assert(!!paoloCookie, 'Login Paolo Luzi effettuato');
  
  // Paolo accede a /teatro
  const paoloTeatroRes = await request('/teatro', { headers: { Cookie: `radici_session=${paoloCookie}` } });
  assert(paoloTeatroRes.status === 200, 'Paolo Luzi accede a /teatro (Cruscotto Teatrale & Botteghino)');

  // Paolo NON accede né a /promotori né a /fornitore (rigorosamente separati)
  const paoloPromRes = await request('/promotori', { headers: { Cookie: `radici_session=${paoloCookie}` } });
  assert(paoloPromRes.status === 307 || paoloPromRes.status === 302, 'Paolo Luzi reindirizzato da /promotori (riservato a Startup RADICI)');

  const paoloFornRes = await request('/fornitore', { headers: { Cookie: `radici_session=${paoloCookie}` } });
  assert(paoloFornRes.status === 307 || paoloFornRes.status === 302, 'Paolo Luzi reindirizzato da /fornitore (riservato ai fornitori welfare)');

  // Chiara Valenti (Startup RADICI) accede a /promotori
  const chiaraCookie = await login('chiara.promotori@radici.it');
  assert(!!chiaraCookie, 'Login Chiara Valenti effettuato');
  const chiaraPromRes = await request('/promotori', { headers: { Cookie: `radici_session=${chiaraCookie}` } });
  assert(chiaraPromRes.status === 200, 'Chiara Valenti accede a /promotori (Startup RADICI)');

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

  console.log('\n--- 3. Selezione Struttura + Spettacolo Matching Grant (Scelta 2 Persone: 25€ + 25€ = 50€) ---');
  const redeemRes = await request('/api/vouchers/redeem', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({
      voucherId: availableVoucher.id,
      venueId: 2, // Agriturismo
      grantEventId: 1, // Teatro Lauro Rossi
      grantSeatsCount: 2, // Scelta utente: 2 persone (50€ Matching Grant)
    }),
  });
  assert(redeemRes.status === 200, 'Voucher selezionato con successo (status=selected, grantSeatsCount=2)');

  const voucherAfter = db.prepare("SELECT status, venue_id, grant_event_id FROM vouchers WHERE id = ?").get(availableVoucher.id);
  assert(voucherAfter.status === 'selected', `Voucher status è '${voucherAfter.status}'`);

  const grantAfter = db.prepare("SELECT id, status, seats_requested, amount_cents FROM matching_grants WHERE voucher_id = ?").get(availableVoucher.id);
  assert(!!grantAfter && grantAfter.status === 'assigned' && grantAfter.seats_requested === 2 && grantAfter.amount_cents === 5000, `Matching grant assegnato a Mario per 2 persone (seats=2, amount=€50)`);

  const seatsRows = db.prepare("SELECT holder_role, value_cents FROM grant_seats WHERE matching_grant_id = ?").all(grantAfter.id);
  assert(seatsRows.length === 2, `Creati 2 posti in grant_seats (dipendente 25€ + accompagnatore 25€)`);

  // Verifica prenotazioni gemelle in bookings per Mario:
  // Hotel: 1 persona (quota welfare dipendente Art. 51 TUIR)
  // Spettacolo teatro: 2 posti (Matching Grant dei Promotori per 2 persone)
  const marioBookings = db.prepare("SELECT id, booking_type, voucher_id, final_price_cents, party_size FROM bookings WHERE user_id = 2 AND voucher_id = ?").all(availableVoucher.id);
  assert(marioBookings.length === 2, `Create ${marioBookings.length} prenotazioni in 'bookings' per Mario (hotel e teatro)`);
  const bHotel = marioBookings.find(b => b.booking_type === 'hospitality');
  const bTheater = marioBookings.find(b => b.booking_type === 'theater_event');
  assert(!!bHotel && bHotel.final_price_cents === 0 && bHotel.party_size === 1, 'Prenotazione hotel in bookings: esattamente 1 persona (quota welfare 50€)');
  assert(!!bTheater && bTheater.final_price_cents === 0 && bTheater.party_size === 2, 'Prenotazione teatro in bookings: esattamente 2 posti omaggio promotori scelti');

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

  // 5b. Mario riseleziona il voucher scegliendo di andare da solo (1 Persona: 25€)
  console.log('\n--- 5b. Test Selezione Mario con 1 Persona (25€ Matching Grant) ---');
  const redeem1Res = await request('/api/vouchers/redeem', {
    method: 'POST',
    headers: { Cookie: `radici_session=${marioCookie}` },
    body: JSON.stringify({
      voucherId: availableVoucher.id,
      venueId: 2,
      grantEventId: 1,
      grantSeatsCount: 1, // Scelta: 1 persona da solo
    }),
  });
  assert(redeem1Res.status === 200, 'Mario riscatta con 1 posto teatro (grantSeatsCount=1)');
  const grant1 = db.prepare("SELECT seats_requested, amount_cents FROM matching_grants WHERE voucher_id = ?").get(availableVoucher.id);
  assert(grant1 && grant1.seats_requested === 1 && grant1.amount_cents === 2500, 'Matching grant registrato con 1 posto e 25€');
  const theater1Bkg = db.prepare("SELECT party_size, final_price_cents FROM bookings WHERE user_id = 2 AND booking_type = 'theater_event' AND voucher_id = ? AND status != 'cancelled' ORDER BY id DESC").get(availableVoucher.id);
  assert(theater1Bkg && theater1Bkg.party_size === 1, 'Prenotazione a teatro creata esattamente per 1 posto');

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

  // 9. Botteghino Teatro: Convalida Ingresso Spettatore
  console.log('\n--- 9. Botteghino Teatro: Convalida Ingresso Spettatore ---');
  const attendRes = await request('/api/theater/attendance', {
    method: 'POST',
    headers: { Cookie: `radici_session=${paoloCookie}` },
    body: JSON.stringify({ bookingId, attendanceStatus: 'attended' }),
  });
  assert(attendRes.status === 200, 'Botteghino teatro: ingresso spettatore convalidato con successo');

  // 10. Test Scelta Posti (1, 2, 3, 4, 5) & Separazione Netta Mario (Welfare) vs Moglie/Accompagnatrice (Community Privata)
  console.log('\n--- 10. Test Scelta Posti (1, 2, 3, 4, 5) & Separazione Fiscale Mario vs Moglie ---');
  const francescaCookie = await login('francesca.romani@email.it');
  assert(!!francescaCookie, 'Login Francesca Romani (moglie/accompagnatrice con profilo Community separato)');

  // Francesca prenota 1 posto presso la stessa struttura (Agriturismo La Valle)
  const bkg1Res = await request('/api/bookings', {
    method: 'POST',
    headers: { Cookie: `radici_session=${francescaCookie}` },
    body: JSON.stringify({
      venueId: 2,
      bookingType: 'hospitality',
      bookingDate: '2026-11-20',
      partySize: 1, // Scelta esatta 1 posto
      notes: 'Soggiorno con mio marito Mario Rossi (lui ha quota welfare propria)',
    }),
  });
  assert(bkg1Res.status === 201, 'Francesca ha prenotato 1 posto separatamente da Mario');
  assert(bkg1Res.json.booking.partySize === 1, 'Posti registrati per Francesca: 1 (ATTESO: 1)');
  assert(bkg1Res.json.booking.discountPercent === 10, 'Sconto community applicato a Francesca: 10%');
  assert(bkg1Res.json.booking.voucherId === null, 'La prenotazione di Francesca non tocca il voucher welfare aziendale');

  // Francesca prenota anche per 3 posti (test selettore 1, 2, 3, 4, 5) per una cena
  const bkg3Res = await request('/api/bookings', {
    method: 'POST',
    headers: { Cookie: `radici_session=${francescaCookie}` },
    body: JSON.stringify({
      venueId: 2,
      bookingType: 'dinner',
      bookingDate: '2026-11-20',
      partySize: 3, // Scelta esatta 3 posti
      notes: 'Tavolo per 3 persone',
    }),
  });
  assert(bkg3Res.status === 201, 'Francesca ha prenotato 3 posti per la cena');
  assert(bkg3Res.json.booking.partySize === 3, 'Posti registrati per Francesca: 3 (ATTESO: 3)');
  const venue2 = db.prepare("SELECT price_aperitivo_cents FROM venues WHERE id = 2").get();
  const unitPrice = venue2?.price_aperitivo_cents || 2800;
  const expectedCenaListino = unitPrice * 3;
  const expectedCenaDiscount = Math.round((expectedCenaListino * 10) / 100);
  assert(bkg3Res.json.booking.totalAmountCents === expectedCenaListino, `Listino calcolato esattamente per 3 posti: €${expectedCenaListino / 100}`);
  assert(bkg3Res.json.booking.discountCents === expectedCenaDiscount, `Sconto calcolato esattamente per 3 posti: €${expectedCenaDiscount / 100}`);
  assert(bkg3Res.json.booking.finalPriceCents === expectedCenaListino - expectedCenaDiscount, `Netto calcolato per 3 posti: €${(expectedCenaListino - expectedCenaDiscount) / 100}`);

  // Verifica nel Database: separazione Mario (welfare ACME) vs Francesca (privato)
  const bkgMario = db.prepare("SELECT user_id, voucher_id, party_size, final_price_cents FROM bookings WHERE user_id = 2 AND booking_type = 'hospitality'").get();
  const bkgFrancesca = db.prepare("SELECT user_id, voucher_id, party_size, final_price_cents FROM bookings WHERE user_id = ? AND booking_type = 'hospitality'").get(bkg1Res.json.booking.userId);
  assert(bkgMario && bkgMario.party_size === 1 && bkgMario.final_price_cents === 0 && bkgMario.voucher_id !== null, 'Mario: 1 persona, 0€ a carico, voucher welfare ACME registrato');
  assert(bkgFrancesca && bkgFrancesca.party_size === 1 && bkgFrancesca.final_price_cents > 0 && bkgFrancesca.voucher_id === null, 'Francesca: 1 persona, paga quota propria separata con sconto 10%');

  console.log(`\n========================================`);
  console.log(`RISULTATO FINALE: ${passed} PASSATI, ${failed} FALLITI`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
