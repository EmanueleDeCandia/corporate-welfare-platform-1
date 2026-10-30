import Database from "better-sqlite3";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";
const db = new Database("radici.db");

async function run() {
  console.log("=== TEST CMS IMPRESE CSR & FORNITORI CON CREAZIONE CREDENZIALI ACCOUNT ===\n");

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

  // 2. Creazione Nuova Impresa CSR con Credenziali Referente HR
  console.log("\n--- TEST CREAZIONE IMPRESA CSR CON ACCOUNT HR ---");
  const testCompanyEmail = `hr.test${Date.now()}@manifatturepicene.it`;
  const testCompanyPassword = "PasswordSicura123!";

  const companyPayload = {
    name: "Manifatture Picene S.p.A.",
    vatNumber: "02938475610",
    city: "Civitanova Marche",
    sector: "Moda & Manifattura",
    employeesCount: 60,
    fundedAmountCents: 450000, // 4.500 €
    description: "Azienda calzaturiera marchigiana che finanzia soggiorni e cene tipiche per 60 dipendenti.",
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

  assert.ok(createdHrUser && createdHrUser.id, "ID utente HR creato assente");
  assert.strictEqual(createdHrUser.email, testCompanyEmail);
  assert.strictEqual(createdHrUser.role, "csr");
  console.log(`✓ Impresa CSR creata: ID ${createdCompany.id}, Ragione Sociale: "${createdCompany.name}"`);
  console.log(`✓ Account HR creato: ID ${createdHrUser.id}, Email: ${createdHrUser.email}, Ruolo: ${createdHrUser.role}`);

  // Verifica piano welfare 2026 creato nel DB
  const plan = db.prepare("SELECT * FROM welfare_plans WHERE company_id = ?").get(createdCompany.id);
  assert.ok(plan, "Piano welfare attivo non trovato per la nuova impresa");
  assert.strictEqual(plan.eligible_employees, 60);
  console.log(`✓ Piano welfare attivo generato: ${plan.eligible_employees} dipendenti accreditati (50€ notte, 25€ cena).`);

  // 3. Test Login Diretto con le nuove credenziali HR create
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

  // 4. Creazione Fornitore con Credenziali Account Titolare
  console.log("\n--- TEST CREAZIONE FORNITORE CON ACCOUNT GESTORE ---");
  const testVenueEmail = `titolare.test${Date.now()}@casaledeisibillini.it`;
  const testVenuePassword = "PasswordStruttura123!";

  const venuePayload = {
    name: "Casale dei Sibillini",
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
    sponsorCompanyId: createdCompany.id, // Sponsorizzato dalla nuova impresa creata!
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
  assert.strictEqual(createdVenue.sponsorCompanyId, createdCompany.id);

  assert.ok(createdProviderUser && createdProviderUser.id);
  assert.strictEqual(createdProviderUser.email, testVenueEmail);
  assert.strictEqual(createdProviderUser.role, "provider");
  console.log(`✓ Fornitore creato: ID ${createdVenue.id}, Nome: "${createdVenue.name}", Sponsor: ID ${createdCompany.id}`);
  console.log(`✓ Account Titolare Fornitore creato: ID ${createdProviderUser.id}, Email: ${createdProviderUser.email}, Ruolo: ${createdProviderUser.role}`);

  // 5. Test Login Diretto con le nuove credenziali Fornitore create
  console.log("\n--- TEST LOGIN CON ACCOUNT FORNITORE APPENA CREATO ---");
  const loginProviderRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testVenueEmail,
      password: testVenuePassword,
    }),
  });

  assert.strictEqual(loginProviderRes.status, 200, "Login con le credenziali Fornitore create deve restituire 200");
  const loginProviderData = await loginProviderRes.json();
  assert.strictEqual(loginProviderData.ok, true);
  assert.strictEqual(loginProviderData.role, "provider");
  assert.strictEqual(loginProviderData.redirectTo, "/fornitore");
  console.log(`✓ Login Fornitore riuscito al 100%! Ruolo: ${loginProviderData.role}, Redirect: ${loginProviderData.redirectTo}`);

  // 6. Test Blocco Sicurezza Contabile Eliminazione Impresa con Storico (ACME Corporation)
  console.log("\n--- TEST SICUREZZA ELIMINAZIONE IMPRESA CON STORICO ---");
  const deleteAcmeRes = await fetch(`${BASE_URL}/api/promoters/companies/1`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(deleteAcmeRes.status, 400, "Eliminazione impresa con storico deve fallire con HTTP 400");
  const deleteAcmeError = await deleteAcmeRes.json();
  console.log(`✓ Blocco contabile scattato: "${deleteAcmeError.error}"`);

  // 7. Eliminazione Consentita per Nuova Impresa e Nuovo Fornitore di Test
  console.log("\n--- TEST ELIMINAZIONE STRUTTURA ED IMPRESA DI TEST ---");

  // Eliminiamo prima il fornitore (che sponsorizzava l'azienda)
  const delVenueRes = await fetch(`${BASE_URL}/api/promoters/venues/${createdVenue.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(delVenueRes.status, 200, "Eliminazione fornitore deve restituire 200");
  const checkVenue = db.prepare("SELECT * FROM venues WHERE id = ?").get(createdVenue.id);
  assert.strictEqual(checkVenue, undefined, "La venue deve essere eliminata");
  const checkProviderUser = db.prepare("SELECT * FROM users WHERE email = ?").get(testVenueEmail);
  assert.strictEqual(checkProviderUser, undefined, "L'account fornitore deve essere eliminato");
  console.log(`✓ Fornitore ID ${createdVenue.id} ed account ${testVenueEmail} eliminati con successo.`);

  // Ora eliminiamo l'azienda di test (senza più strutture collegate)
  const delCompRes = await fetch(`${BASE_URL}/api/promoters/companies/${createdCompany.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(delCompRes.status, 200, "Eliminazione impresa CSR deve restituire 200");
  const checkCompany = db.prepare("SELECT * FROM companies WHERE id = ?").get(createdCompany.id);
  assert.strictEqual(checkCompany, undefined, "L'azienda deve essere eliminata");
  const checkHrUser = db.prepare("SELECT * FROM users WHERE email = ?").get(testCompanyEmail);
  assert.strictEqual(checkHrUser, undefined, "L'account HR deve essere eliminato");
  console.log(`✓ Impresa ID ${createdCompany.id} ed account HR ${testCompanyEmail} eliminati con successo.`);

  // Pulizia sessione
  db.prepare("DELETE FROM sessions WHERE token = ?").run(promoterToken);
  console.log("\n=== TUTTI I 14 CONTROLLI CMS IMPRESE E CREDENZIALI SUPERATI AL 100%! ===");
}

run().catch((err) => {
  console.error("ERRORE DURANTE IL TEST:", err);
  process.exit(1);
});
