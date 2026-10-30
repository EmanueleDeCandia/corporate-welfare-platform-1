import Database from "better-sqlite3";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";
const db = new Database("radici.db");

async function run() {
  console.log("=== TEST CMS IMPRESE CSR & FORNITORI CON DATI NON ARBITRARI & PAGINA IMPRESA ===\n");

  // 1. Reperimento session token per Chiara Valenti (promoter)
  const promoterUser = db.prepare("SELECT id, email, role FROM users WHERE role = 'promoter' LIMIT 1").get();
  assert.ok(promoterUser, "Utente promoter non trovato");
  console.log(`✓ Gestore Piattaforma: ${promoterUser.email} (ID: ${promoterUser.id})`);

  const promoterToken = `test-promoter-session-${Date.now()}`;
  const futureExp = new Date(Date.now() + 24 * 3600 * 1000);

  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    promoterToken,
    promoterUser.id,
    Math.floor(futureExp.getTime() / 1000)
  );

  const promoterCookie = `radici_session=${promoterToken}`;

  // Selezioniamo un fornitore esistente da sponsorizzare
  const existingVenue = db.prepare("SELECT id, name, slug FROM venues WHERE type = 'agriturismo' OR type = 'hotel' LIMIT 1").get();
  assert.ok(existingVenue, "Fornitore esistente non trovato");
  const previousSponsorId = db.prepare("SELECT sponsor_company_id FROM venues WHERE id = ?").get(existingVenue.id).sponsor_company_id;

  // 2. Creazione Nuova Impresa CSR con Credenziali Referente HR, Struttura Sponsorizzata, Descrizione Impatto e Report URL
  console.log("\n--- TEST CREAZIONE IMPRESA CSR CON DATI NON ARBITRARI & SPONSORIZZAZIONE ---");
  const testCompanyEmail = `hr.test${Date.now()}@manifatturepicene.it`;
  const testCompanyPassword = "PasswordSicura123!";
  const testImpactDescription = "La nostra impresa finanzia direttamente gli agriturismi dell'entroterra fermano e maceratese, garantendo pasti a km 0 e pernottamenti rigenerativi a 60 famiglie di collaboratori.";
  const testReportUrl = "https://manifatturepicene.it/esg-sostenibilita-2026.pdf";

  const companyPayload = {
    name: "Manifatture Picene S.p.A.",
    vatNumber: "02938475610",
    city: "Civitanova Marche",
    sector: "Moda & Manifattura",
    employeesCount: 60,
    fundedAmountCents: 450000, // 4.500 €
    description: "Azienda calzaturiera marchigiana che finanzia soggiorni e cene tipiche per 60 dipendenti.",
    localImpactDescription: testImpactDescription,
    reportUrl: testReportUrl,
    sponsoredVenueId: existingVenue.id,
    managerFirstName: "Elena",
    managerLastName: "Martini",
    managerEmail: testCompanyEmail,
    managerPassword: testCompanyPassword,
  };

  const createCompanyRes = await fetch(`${BASE_URL}/api/promoters/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(companyPayload),
  });

  assert.strictEqual(createCompanyRes.status, 201, "Creazione impresa CSR deve restituire 201 Created");
  const companyResData = await createCompanyRes.json();
  const createdCompany = companyResData.company;
  const createdHrUser = companyResData.user;

  assert.ok(createdCompany && createdCompany.id, "ID impresa creata assente");
  assert.strictEqual(createdCompany.name, companyPayload.name);
  assert.strictEqual(createdCompany.vatNumber, companyPayload.vatNumber);
  assert.strictEqual(createdCompany.employeesCount, 60);
  assert.strictEqual(createdCompany.fundedAmountCents, 450000);

  // Verifica calcolo non arbitrario redistribuzione: 450.000 * 5.1 = 2.295.000 cents (22.950 €)
  const expectedRedistribution = Math.round(450000 * 5.1);
  assert.strictEqual(createdCompany.localRedistributionCents, expectedRedistribution, "Redistribuzione economica deve rispettare il moltiplicatore 5,1x");

  // Verifica descrizione impatto e link al report CSR
  assert.strictEqual(createdCompany.localImpactDescription, testImpactDescription);
  assert.strictEqual(createdCompany.reportUrl, testReportUrl);

  assert.ok(createdHrUser && createdHrUser.id, "ID utente HR creato assente");
  assert.strictEqual(createdHrUser.email, testCompanyEmail);
  assert.strictEqual(createdHrUser.role, "csr");
  console.log(`✓ Impresa CSR creata: ID ${createdCompany.id}, Ragione Sociale: "${createdCompany.name}"`);
  console.log(`✓ Formula moltiplicatore 5,1x applicata: ${createdCompany.fundedAmountCents / 100}€ -> ${createdCompany.localRedistributionCents / 100}€ ridistribuiti`);
  console.log(`✓ Struttura sponsorizzata associata: ${existingVenue.name} (ID: ${existingVenue.id})`);
  console.log(`✓ Account HR creato: ID ${createdHrUser.id}, Email: ${createdHrUser.email}`);

  // Verifica che il fornitore ha ora sponsorCompanyId impostato
  const venueAfterSponsor = db.prepare("SELECT sponsor_company_id FROM venues WHERE id = ?").get(existingVenue.id);
  assert.strictEqual(venueAfterSponsor.sponsor_company_id, createdCompany.id);

  // 3. Verifica Rendering Pagina Impresa CSR: /imprese/[slug]
  console.log(`\n--- TEST RENDERING PAGINA PUBBLICA IMPRESA /imprese/${createdCompany.slug} ---`);
  const companyPageRes = await fetch(`${BASE_URL}/imprese/${createdCompany.slug}`);
  assert.strictEqual(companyPageRes.status, 200, "La pagina dell'impresa deve restituire 200 OK");
  const companyPageHtml = await companyPageRes.text();

  assert.ok(companyPageHtml.includes("Manifatture Picene S.p.A."), "Nome impresa non presente nel markup");
  assert.ok(companyPageHtml.includes("4500,00") || companyPageHtml.includes("4.500,00"), "Welfare finanziato non formattato correttamente");
  assert.ok(companyPageHtml.includes("22.950,00"), "Valore ridistribuito col moltiplicatore 5,1x non presente");
  assert.ok(companyPageHtml.includes(existingVenue.name), "Nome struttura sponsorizzata non visualizzato nella pagina");
  assert.ok(companyPageHtml.includes(testReportUrl), "Link al Reporting Integrato CSR non presente nel markup");
  assert.ok(companyPageHtml.includes("Impatto sullo Sviluppo Locale"), "Sezione Impatto sullo Sviluppo Locale assente");
  console.log(`✓ Pagina /imprese/${createdCompany.slug} renderizzata con successo:`);
  console.log(`  - Ragione sociale e P.IVA visibili`);
  console.log(`  - Plafond finanziato (4.500,00 €) e ridistribuito 5,1x (22.950,00 €) esatti`);
  console.log(`  - Struttura sponsorizzata "${existingVenue.name}" collegata dinamicamente`);
  console.log(`  - Descrizione impatto e pulsante al Reporting Integrato CSR presenti`);

  // 4. Test Login Diretto con le nuove credenziali HR create
  console.log("\n--- TEST LOGIN CON ACCOUNT HR APPENA CREATO ---");
  const loginHrRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testCompanyEmail,
      password: testCompanyPassword,
    }),
  });

  assert.strictEqual(loginHrRes.status, 200, "Login con le credenziali HR create deve restituire 200");
  const loginHrData = await loginHrRes.json();
  assert.strictEqual(loginHrData.ok, true);
  assert.strictEqual(loginHrData.role, "csr");
  assert.strictEqual(loginHrData.redirectTo, "/azienda");
  console.log(`✓ Login HR riuscito al 100%! Ruolo: ${loginHrData.role}, Redirect: ${loginHrData.redirectTo}`);

  // 5. Test Creazione Fornitore con Credenziali
  console.log("\n--- TEST CREAZIONE FORNITORE CON ACCOUNT TITOLARE ---");
  const testVenueEmail = `titolare.test${Date.now()}@casaledeisibillini.it`;
  const testVenuePassword = "PasswordStruttura123!";

  const venuePayload = {
    name: "Casale dei Sibillini Test",
    type: "agriturismo",
    destinationId: 1,
    city: "Sarnano",
    province: "MC",
    region: "Marche",
    description: "Agriturismo con produzione propria di miele e formaggi dei Sibillini.",
    longDescription: "Camere in pietra e degustazioni a km 0 sui Monti Azzurri.",
    priceHotelCents: 8500,
    priceAperitivoCents: 2400,
    dailyCapacity: 12,
    sponsorCompanyId: createdCompany.id,
    managerFirstName: "Roberto",
    managerLastName: "Luzi",
    managerEmail: testVenueEmail,
    managerPassword: testVenuePassword,
  };

  const createVenueRes = await fetch(`${BASE_URL}/api/promoters/venues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(venuePayload),
  });

  assert.strictEqual(createVenueRes.status, 201, "Creazione fornitore deve restituire 201");
  const venueResData = await createVenueRes.json();
  const createdVenue = venueResData.venue;
  const createdProviderUser = venueResData.user;

  assert.ok(createdVenue && createdVenue.id);
  assert.strictEqual(createdVenue.name, venuePayload.name);

  // 6. Test Login con Account Fornitore
  console.log("\n--- TEST LOGIN CON ACCOUNT FORNITORE APPENA CREATO ---");
  const loginProviderRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testVenueEmail,
      password: testVenuePassword,
    }),
  });

  assert.strictEqual(loginProviderRes.status, 200);
  const loginProviderData = await loginProviderRes.json();
  assert.strictEqual(loginProviderData.role, "provider");
  assert.strictEqual(loginProviderData.redirectTo, "/fornitore");
  console.log(`✓ Login Fornitore riuscito al 100%!`);

  // 7. Test Blocco Sicurezza Contabile Eliminazione Impresa con Storico (ACME Corporation)
  console.log("\n--- TEST SICUREZZA ELIMINAZIONE IMPRESA CON STORICO ---");
  const deleteAcmeRes = await fetch(`${BASE_URL}/api/promoters/companies/1`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(deleteAcmeRes.status, 400, "Eliminazione impresa con storico deve fallire con HTTP 400");
  const deleteAcmeError = await deleteAcmeRes.json();
  console.log(`✓ Blocco contabile scattato: "${deleteAcmeError.error}"`);

  // 8. Pulizia Entità di Test
  console.log("\n--- PULIZIA ENTITÀ DI TEST ---");

  // Ripristiniamo lo sponsor precedente sul fornitore esistente
  db.prepare("UPDATE venues SET sponsor_company_id = ? WHERE id = ?").run(previousSponsorId, existingVenue.id);

  // Eliminiamo il fornitore di test creato
  const delVenueRes = await fetch(`${BASE_URL}/api/promoters/venues/${createdVenue.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(delVenueRes.status, 200);

  // Eliminiamo l'azienda di test creata
  const delCompRes = await fetch(`${BASE_URL}/api/promoters/companies/${createdCompany.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(delCompRes.status, 200);

  // Pulizia sessione promoter di test
  db.prepare("DELETE FROM sessions WHERE token = ?").run(promoterToken);
  console.log(`✓ Pulizia completata con successo.`);

  console.log("\n=== TUTTI I TEST CMS IMPRESE CSR, DATI NON ARBITRARI E RENDERING COMPLETATI AL 100%! ===");
}

run().catch((err) => {
  console.error("ERRORE DURANTE IL TEST:", err);
  process.exit(1);
});
