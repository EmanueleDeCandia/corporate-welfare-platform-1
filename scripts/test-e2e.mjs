// scripts/test-e2e.mjs
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

  // Extract set-cookie if any
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

async function testPublicPages() {
  console.log('\n--- Test 1: Pagine Pubbliche ---');
  for (const p of ['/', '/esplora', '/strutture', '/come-funziona', '/login', '/registrati']) {
    const res = await request(p);
    assert(res.status === 200, `GET ${p} -> HTTP ${res.status}`);
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

async function testLoginsAndRoles() {
  console.log('\n--- Test 2: Autenticazione e Accesso Ruoli ---');
  
  const accounts = [
    { role: 'promoter', email: 'chiara.promotori@radici.it', target: '/promotori' },
    { role: 'csr', email: 'elena.martini@acme.it', target: '/azienda' },
    { role: 'provider', email: 'elena@lavalle.it', target: '/fornitore' },
    { role: 'employee', email: 'mario.rossi@acme.it', target: '/account' },
    { role: 'friend', email: 'luigi.bianchi@email.it', target: '/account' },
  ];

  for (const acc of accounts) {
    const token = await login(acc.email);
    assert(!!token, `Login per ${acc.role} (${acc.email})`);
    if (token) {
      const pageRes = await request(acc.target, {
        headers: { Cookie: `radici_session=${token}` },
      });
      assert(pageRes.status === 200, `Accesso ${acc.target} con ruolo ${acc.role} -> HTTP ${pageRes.status}`);
    }
  }
}

async function testCompanyFeatures() {
  console.log('\n--- Test 3: Gestione Impresa CSR (Dati & Onboarding Dipendenti) ---');
  const token = await login('elena.martini@acme.it');
  assert(!!token, 'Login CSR ACME');
  if (!token) return;

  const cookieHeader = { Cookie: `radici_session=${token}` };

  // 1. Aggiornamento Dati Impresa
  const updateRes = await request('/api/company/update', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      name: 'ACME Corporation S.p.A.',
      legalAddress: 'Via Roma 100, Ancona (AN)',
      sdiCode: 'SUBM70N',
      employeesCount: 135,
      fundedAmountEuro: 67500,
    }),
  });
  assert(updateRes.status === 200 && updateRes.json?.ok === true, 'Aggiornamento dati impresa (135 addetti, 67.500 € plafond)');

  // 2. Verifica che /azienda rifletta l'aggiornamento
  const dashboardRes = await request('/azienda', { headers: cookieHeader });
  assert(
    dashboardRes.status === 200 && dashboardRes.text.includes('135') && dashboardRes.text.includes('67.500'),
    'Dashboard /azienda mostra 135 addetti e plafond aggiornato a 67.500 €'
  );

  // 3. Onboarding di un nuovo dipendente
  const randomSuffix = Math.floor(Math.random() * 10000);
  const newEmpEmail = `test.dipendente${randomSuffix}@acme.it`;
  const empRes = await request('/api/company/employees', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      firstName: 'Federico',
      lastName: 'Test',
      email: newEmpEmail,
    }),
  });
  assert(
    empRes.status === 201 && empRes.json?.ok === true && empRes.json?.vouchersCreated === 2,
    `Onboarding dipendente ${newEmpEmail} con 2 voucher welfare creati (Status: ${empRes.status})`
  );

  // 4. Test login del nuovo dipendente creato
  const empToken = await login(newEmpEmail);
  assert(!!empToken, `Login del nuovo dipendente creato (${newEmpEmail})`);
  if (empToken) {
    const empAccountRes = await request('/account', { headers: { Cookie: `radici_session=${empToken}` } });
    assert(
      empAccountRes.status === 200 && empAccountRes.text.includes('Federico'),
      'Area personale del nuovo dipendente accessibile con nome Federico'
    );
  }
}

async function testProviderAttendanceAndInvoice() {
  console.log('\n--- Test 4: Fornitore (Presenza/Assenza e Fatturazione) ---');
  const token = await login('elena@lavalle.it');
  assert(!!token, 'Login Fornitore Elena La Valle');
  if (!token) return;

  const cookieHeader = { Cookie: `radici_session=${token}` };

  // Recupera la pagina fornitore
  const pageRes = await request('/fornitore', { headers: cookieHeader });
  assert(pageRes.status === 200, 'Accesso cruscotto fornitore');

  const db = new Database('radici.db');

  // Assicuriamo una selezione per un'altra struttura (venue 2) per testare la protezione 403
  db.prepare("INSERT OR IGNORE INTO voucher_selections (id, voucher_id, venue_id, service_date, selected_at, attendance_status) VALUES (999, 5, 2, '2026-11-01', ?, 'pending')")
    .run(Math.floor(Date.now() / 1000));
  db.prepare("UPDATE vouchers SET venue_id = 2 WHERE id = 5").run();

  // Test di sicurezza: tentativo di modificare voucher di un'altra struttura (voucherId 5 appartiene a venue 2)
  const forbiddenRes = await request('/api/provider/attendance', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      voucherId: 5,
      status: 'attended',
    }),
  });
  assert(
    forbiddenRes.status === 403,
    `Sicurezza: tentativo di modificare voucher di altro fornitore correttamente respinto con HTTP 403`
  );

  // Test assegnazione presenza su voucher di competenza (voucherId 2 appartiene a La Valle del Vento, venueId 1)
  const attRes = await request('/api/provider/attendance', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      voucherId: 2,
      status: 'attended',
    }),
  });
  assert(
    attRes.status === 200 && attRes.json?.status === 'attended',
    `Fornitore segna PRESENZA convalidata su voucher 2 (Status: ${attRes.status})`
  );

  // Test rettifica in no-show
  const noShowRes = await request('/api/provider/attendance', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      voucherId: 2,
      status: 'no_show',
    }),
  });
  assert(
    noShowRes.status === 200 && noShowRes.json?.status === 'no_show',
    `Fornitore aggiorna stato in NO-SHOW su voucher 2 (Status: ${noShowRes.status})`
  );

  // Test registrazione fattura su transazione di Elena (venue 1)
  const txVenue1 = db.prepare("SELECT id FROM transactions WHERE venue_id = 1 LIMIT 1").get();
  const targetTxId = txVenue1 ? txVenue1.id : 3;
  const invoiceRes = await request('/api/provider/invoices', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      transactionId: targetTxId,
      invoiceNumber: 'FAT-2026-099',
      invoiceDate: '2026-10-30',
      paymentStatus: 'settled',
      paymentNotes: 'Pagata a 30gg',
    }),
  });
  assert(
    invoiceRes.status === 200 && invoiceRes.json?.ok === true && invoiceRes.json?.transaction?.paymentStatus === 'settled',
    `Registrazione N° fattura gestionale su transazione ${targetTxId} (Status: ${invoiceRes.status}, PaymentStatus: ${invoiceRes.json?.transaction?.paymentStatus})`
  );
}

async function testNewRegistrations() {
  console.log('\n--- Test 5: Registrazione Nuova Impresa e Nuovo Fornitore ---');
  const rand = Math.floor(Math.random() * 9000 + 1000);

  // 1. Nuova Impresa con numero addetti e plafond personalizzati
  const compRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'csr',
      firstName: 'Marco',
      lastName: 'Verdi',
      email: `csr${rand}@biotechmarche.it`,
      password: 'password123',
      companyName: `BioTech Marche ${rand}`,
      companyVat: `IT${rand}0000000`.slice(0, 13),
      companyAddress: 'Via E. Mattei 12, Jesi (AN)',
      companySdi: 'M5UXCR1',
      companyEmployeesCount: 88,
      companyFundedAmountEuro: 44000,
    }),
  });
  assert(
    compRes.status === 201 && compRes.json?.user?.companyId,
    `Registrazione nuova impresa con 88 addetti e plafond 44.000 € (Status: ${compRes.status})`
  );

  // Verifica login della nuova impresa
  const newCompToken = await login(`csr${rand}@biotechmarche.it`, 'password123');
  assert(!!newCompToken, 'Login della nuova impresa registrata');
  if (newCompToken) {
    const compDash = await request('/azienda', { headers: { Cookie: `radici_session=${newCompToken}` } });
    assert(
      compDash.status === 200 && compDash.text.includes('88') && compDash.text.includes('44.000'),
      'Dashboard /azienda della nuova impresa mostra 88 dipendenti e 44.000 € di plafond'
    );
  }

  // 2. Nuovo Fornitore
  const provRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'provider',
      firstName: 'Sandro',
      lastName: 'Conti',
      email: `info${rand}@casaleconero.it`,
      password: 'password123',
      venueName: `Casale del Conero ${rand}`,
      venueType: 'agriturismo',
      venueCity: 'Sirolo',
      venueProvince: 'AN',
      venueRegion: 'Marche',
    }),
  });
  assert(
    provRes.status === 201 && provRes.json?.user?.venueId,
    `Registrazione nuovo fornitore struttura ricettiva (Status: ${provRes.status})`
  );

  const newProvToken = await login(`info${rand}@casaleconero.it`, 'password123');
  assert(!!newProvToken, 'Login del nuovo fornitore registrato');
  if (newProvToken) {
    const provDash = await request('/fornitore', { headers: { Cookie: `radici_session=${newProvToken}` } });
    assert(provDash.status === 200, 'Accesso pannello /fornitore del nuovo fornitore');
  }
}

async function testEmployeeVoucherRedeem() {
  console.log('\n--- Test 6: Riscatto Voucher Dipendente & Creazione Matching Grant ---');
  
  // Ripristina voucher 3 come available per idempotenza del test
  try {
    const db = new Database('radici.db');
    db.prepare("UPDATE vouchers SET status = 'available', venue_id = NULL WHERE id = 3").run();
    db.prepare("DELETE FROM grant_confirmations WHERE matching_grant_id IN (SELECT id FROM matching_grants WHERE voucher_id = 3)").run();
    db.prepare("DELETE FROM grant_seats WHERE matching_grant_id IN (SELECT id FROM matching_grants WHERE voucher_id = 3)").run();
    db.prepare("DELETE FROM matching_grants WHERE voucher_id = 3").run();
    db.prepare("DELETE FROM voucher_selections WHERE voucher_id = 3").run();
    db.close();
  } catch (e) {}

  const token = await login('giulia.verdi@acme.it');
  assert(!!token, 'Login Giulia Verdi (dipendente con voucher disponibili)');
  if (!token) return;

  const cookieHeader = { Cookie: `radici_session=${token}` };

  // Giulia seleziona il voucher 3 (pernottamento) presso la struttura 1 (La Valle del Vento)
  const redeemRes = await request('/api/vouchers/redeem', {
    method: 'POST',
    headers: cookieHeader,
    body: JSON.stringify({
      voucherId: 3,
      venueId: 1,
      serviceDate: '2026-11-15',
    }),
  });

  assert(
    redeemRes.status === 200 && redeemRes.json?.success === true,
    `Riscatto voucher 3 con attivazione Matching Grant (Status: ${redeemRes.status}, Msg: "${redeemRes.json?.message?.slice(0, 40)}...")`
  );

  // Verifichiamo che ora il fornitore Elena La Valle vede la nuova prestazione
  const provToken = await login('elena@lavalle.it');
  const provPage = await request('/fornitore', { headers: { Cookie: `radici_session=${provToken}` } });
  assert(
    provPage.status === 200 && provPage.text.includes('Giulia Verdi'),
    'Cruscotto fornitore visualizza la nuova prenotazione di Giulia Verdi con distinta da fatturare'
  );
}

async function testCommunityBookingsAndOverbookingPrevention() {
  console.log('\n--- Test 7: Prenotazioni Amico Community, Riconferma Presenza & Anti-Overbooking ---');
  
  // 1. Login Luigi Bianchi (Amico Community da Referral)
  const friendToken = await login('luigi.bianchi@email.it');
  assert(!!friendToken, 'Login Luigi Bianchi (Ospite Community)');
  if (!friendToken) return;

  const friendHeaders = { Cookie: `radici_session=${friendToken}` };

  // 2. Controllo che l'area /account mostri il tab Prenotazioni & Sconti e le prenotazioni attive
  const accountRes = await request('/account', { headers: friendHeaders });
  assert(
    accountRes.status === 200 &&
      accountRes.text.includes('Prenotazioni') &&
      accountRes.text.includes('Sconti') &&
      accountRes.text.includes('Osteria del Tiglio'),
    'Area personale di Luigi Bianchi mostra il tab "Prenotazioni & Sconti" con le prenotazioni e sconto 10%'
  );

  // 3. Luigi Bianchi riconferma la presenza sulla sua prenotazione (booking id: 1)
  const confirmPresRes = await request('/api/bookings/status', {
    method: 'POST',
    headers: friendHeaders,
    body: JSON.stringify({
      bookingId: 1,
      status: 'presence_confirmed',
    }),
  });
  assert(
    confirmPresRes.status === 200 && confirmPresRes.json?.ok === true && confirmPresRes.json?.booking?.status === 'presence_confirmed',
    'Luigi Bianchi riconferma la sua presenza per rassicurare la struttura (Status: presence_confirmed)'
  );

  // 4. Creazione nuova prenotazione convenzionata presso agriturismo con sconto 10%
  const newBookingRes = await request('/api/bookings', {
    method: 'POST',
    headers: friendHeaders,
    body: JSON.stringify({
      venueId: 1,
      bookingType: 'hospitality',
      bookingDate: '2026-11-25',
      timeSlot: 'Check-in 15:00',
      partySize: 2,
      guestPhone: '+39 347 1122334',
      notes: 'Camera con vista panoramica',
    }),
  });
  assert(
    newBookingRes.status === 201 &&
      newBookingRes.json?.ok === true &&
      newBookingRes.json?.booking?.discountPercent === 10,
    `Nuova prenotazione completata con sconto convenzione 10% (Prezzo netto: € ${(newBookingRes.json?.booking?.finalPriceCents / 100).toFixed(2)})`
  );

  // 5. Test ANTI-OVERBOOKING per Spettacoli Teatrali a Posti Limitati
  const overbookingRes = await request('/api/bookings', {
    method: 'POST',
    headers: friendHeaders,
    body: JSON.stringify({
      venueId: 11,
      grantEventId: 1, // Spettacolo con capienza 50
      bookingType: 'theater_event',
      bookingDate: '2026-12-10',
      partySize: 150, // Richiesta assurda oltre capienza
    }),
  });
  assert(
    overbookingRes.status === 400 && overbookingRes.json?.error?.includes('Posti insufficienti per lo spettacolo'),
    'Anti-Overbooking: richiesta di 150 posti respinta con HTTP 400 e blocco overbooking'
  );

  // 6. Monitoraggio da parte della Startup Promotrice (/promotori)
  const promoterToken = await login('chiara.promotori@radici.it');
  const promoterPage = await request('/promotori', { headers: { Cookie: `radici_session=${promoterToken}` } });
  assert(
    promoterPage.status === 200 &&
      promoterPage.text.includes('Prenotazioni') &&
      promoterPage.text.includes('Overbooking Teatri'),
    'Cruscotto Promotori /promotori include la sezione e il tab per la gestione Prenotazioni & Overbooking Teatri'
  );

  // 7. Cruscotto Fornitore (/fornitore)
  const provToken = await login('elena@lavalle.it');
  const provPage = await request('/fornitore', { headers: { Cookie: `radici_session=${provToken}` } });
  assert(
    provPage.status === 200 &&
      provPage.text.includes('Prenotazioni Community') &&
      provPage.text.includes('Luigi Bianchi'),
    'Cruscotto fornitore /fornitore mostra il tab dedicato alle prenotazioni community e la nuova prenotazione di Luigi Bianchi'
  );
}

async function runAll() {
  console.log('=== AVVIO TEST INTEGRATI E2E RADICI SU HTTP://LOCALHOST:3000 ===');
  await testPublicPages();
  await testLoginsAndRoles();
  await testCompanyFeatures();
  await testProviderAttendanceAndInvoice();
  await testNewRegistrations();
  await testEmployeeVoucherRedeem();
  await testCommunityBookingsAndOverbookingPrevention();

  console.log('\n======================================================');
  console.log(`RISULTATI FINALI: ${passed} PASSATI, ${failed} FALLITI`);
  console.log('======================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal error during tests:', err);
  process.exit(1);
});
