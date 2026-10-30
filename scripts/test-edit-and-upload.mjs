import Database from "better-sqlite3";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const db = new Database("radici.db");

async function run() {
  console.log("=== TEST FUNZIONALITÀ MODIFICA (IMPRESE & FORNITORI) & CARICAMENTO FOTO ===\n");

  // 1. Sessione Promoter (Chiara Valenti)
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

  // 2. TEST CARICAMENTO FOTO REALE DAL COMPUTER (POST /api/upload)
  console.log("\n--- TEST 1: CARICAMENTO FOTO (UPLOAD FILE) ---");

  // Creiamo un piccolo buffer di test per simulare un file JPEG valido
  const dummyImageBytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0xff, 0xd9
  ]);

  const formData = new FormData();
  const blob = new Blob([dummyImageBytes], { type: "image/jpeg" });
  formData.append("file", blob, "foto-agriturismo-reale.jpg");

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      Cookie: promoterCookie,
    },
    body: formData,
  });

  assert.strictEqual(uploadRes.status, 200, "Upload foto deve restituire HTTP 200");
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadData.ok, true);
  assert.ok(uploadData.url.startsWith("/uploads/struttura-"), "URL upload deve iniziare con /uploads/struttura-");
  console.log(`✓ Foto caricata con successo! URL restituito: ${uploadData.url}`);

  // Verifica fisica su disco
  const diskPath = path.join(process.cwd(), "public", uploadData.url.replace(/^\//, ""));
  assert.ok(fs.existsSync(diskPath), `Il file salvato deve esistere su disco: ${diskPath}`);
  console.log(`✓ File verificato fisicamente nella cartella public/uploads: ${uploadData.filename}`);

  // 3. TEST MODIFICA STRUTTURA / FORNITORE (PATCH /api/promoters/venues/[id])
  console.log("\n--- TEST 2: MODIFICA DATI E FOTO STRUTTURA / FORNITORE ---");

  // Selezioniamo una struttura da modificare (es. Casale del Conero 1 o altra)
  const targetVenue = db.prepare("SELECT id, name, slug, price_hotel_cents, price_aperitivo_cents, cover_image FROM venues ORDER BY id DESC LIMIT 1").get();
  assert.ok(targetVenue, "Nessuna venue trovata nel database");
  console.log(`Struttura selezionata per modifica: ID ${targetVenue.id} ("${targetVenue.name}")`);

  const updatedVenuePayload = {
    name: `${targetVenue.name} - Ristrutturato & Bio`,
    type: "agriturismo",
    destinationId: 1,
    city: "Sirolo",
    province: "AN",
    region: "Marche",
    description: "Agriturismo biologico completamente rinnovato con piscina panoramica e uliveto storico.",
    longDescription: "Esperienza immersiva nella natura marchigiana con cucina a km zero ed escursioni.",
    coverImage: uploadData.url, // Usiamo la foto appena caricata!
    priceHotelCents: 9800, // 98,00 €
    priceAperitivoCents: 2900, // 29,00 €
    dailyCapacity: 16,
    services: ["Wi-Fi Gratuito", "Piscina Panoramica", "Degustazione Tipica KM 0", "Visita Guidata Cantina"],
  };

  const patchVenueRes = await fetch(`${BASE_URL}/api/promoters/venues/${targetVenue.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(updatedVenuePayload),
  });

  assert.strictEqual(patchVenueRes.status, 200, "Modifica struttura deve restituire HTTP 200");
  const patchVenueData = await patchVenueRes.json();
  assert.strictEqual(patchVenueData.ok, true);
  assert.strictEqual(patchVenueData.venue.name, updatedVenuePayload.name);
  assert.strictEqual(patchVenueData.venue.coverImage, uploadData.url);
  assert.strictEqual(patchVenueData.venue.priceHotelCents, 9800);
  assert.strictEqual(patchVenueData.venue.priceAperitivoCents, 2900);
  console.log(`✓ Struttura ID ${targetVenue.id} modificata con successo nel DB!`);
  console.log(`  - Nuovo Nome: "${patchVenueData.venue.name}"`);
  console.log(`  - Nuova Foto: "${patchVenueData.venue.coverImage}"`);
  console.log(`  - Nuovi Prezzi: Hotel ${patchVenueData.venue.priceHotelCents / 100}€, Degustazione ${patchVenueData.venue.priceAperitivoCents / 100}€`);

  // Verifica offerte sincronizzate in venue_offerings
  const offerings = db.prepare("SELECT benefit_type, list_price_cents FROM venue_offerings WHERE venue_id = ?").all(targetVenue.id);
  const overnight = offerings.find((o) => o.benefit_type === "overnight");
  const dinner = offerings.find((o) => o.benefit_type === "dinner");
  if (overnight) assert.strictEqual(overnight.list_price_cents, 9800);
  if (dinner) assert.strictEqual(dinner.list_price_cents, 2900);
  console.log(`✓ Offerte convenzionate sincronizzate con i nuovi prezzi in venue_offerings.`);

  // Verifica visualizzazione scheda pubblica struttura
  const publicVenueRes = await fetch(`${BASE_URL}/strutture/${targetVenue.slug}`);
  assert.strictEqual(publicVenueRes.status, 200, "Scheda pubblica struttura deve restituire HTTP 200");
  const publicVenueHtml = await publicVenueRes.text();
  assert.ok(publicVenueHtml.includes("Ristrutturato &amp; Bio") || publicVenueHtml.includes("Ristrutturato & Bio"));
  assert.ok(publicVenueHtml.includes(uploadData.url), "La nuova foto caricata deve apparire nella scheda pubblica");
  console.log(`✓ Scheda pubblica /strutture/${targetVenue.slug} aggiornata con la nuova foto e dati.`);

  // 4. TEST MODIFICA IMPRESA CSR (PATCH /api/promoters/companies/[id])
  console.log("\n--- TEST 3: MODIFICA DATI IMPRESA CSR & RICALCOLO 5,1x ---");

  // Selezioniamo un'impresa CSR (es. ACME)
  const targetCompany = db.prepare("SELECT id, name, slug, employees_count, funded_amount_cents, local_redistribution_cents FROM companies LIMIT 1").get();
  assert.ok(targetCompany, "Nessuna impresa trovata nel database");
  console.log(`Impresa selezionata per modifica: ID ${targetCompany.id} ("${targetCompany.name}")`);

  const updatedCompanyPayload = {
    name: `${targetCompany.name} - Gruppo Sostenibilità`,
    vatNumber: "01928374650",
    city: "Ancona",
    sector: "Innovazione & Servizi ESG",
    employeesCount: 75,
    fundedAmountCents: 562500, // 5.625,00 € (75 * 75€)
    description: "Impresa leader impegnata nel rilancio economico dei borghi e dell'entroterra.",
    localImpactDescription: "Fondi welfare destinati a sostenere le filiere locali del Conero e dei Sibillini con attestato RADICI.",
    reportUrl: "https://acme-sostenibilita.it/bilancio-integrato-2026.pdf",
    sponsoredVenueId: targetVenue.id, // Colleghiamo come sponsor della struttura modificata
  };

  const patchCompRes = await fetch(`${BASE_URL}/api/promoters/companies/${targetCompany.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(updatedCompanyPayload),
  });

  assert.strictEqual(patchCompRes.status, 200, "Modifica impresa CSR deve restituire HTTP 200");
  const patchCompData = await patchCompRes.json();
  assert.strictEqual(patchCompData.ok, true);
  assert.strictEqual(patchCompData.company.name, updatedCompanyPayload.name);
  assert.strictEqual(patchCompData.company.employeesCount, 75);
  assert.strictEqual(patchCompData.company.fundedAmountCents, 562500);

  // Verifica ricalcolo moltiplicatore economico 5,1x: 562.500 * 5.1 = 2.868.750 cents (28.687,50 €)
  const expectedRedistribution = Math.round(562500 * 5.1);
  assert.strictEqual(patchCompData.company.localRedistributionCents, expectedRedistribution);
  console.log(`✓ Impresa ID ${targetCompany.id} modificata con successo:`);
  console.log(`  - Nuovo Nome: "${patchCompData.company.name}"`);
  console.log(`  - Nuovi Addetti: ${patchCompData.company.employeesCount}`);
  console.log(`  - Nuovo Welfare Finanziato: ${patchCompData.company.fundedAmountCents / 100} €`);
  console.log(`  - Ricalcolo automatico 5,1x: ${patchCompData.company.localRedistributionCents / 100} € ridistribuiti sui borghi`);

  // Verifica collegamento struttura sponsorizzata
  const venueSponsorCheck = db.prepare("SELECT sponsor_company_id FROM venues WHERE id = ?").get(targetVenue.id);
  assert.strictEqual(venueSponsorCheck.sponsor_company_id, targetCompany.id);
  console.log(`✓ Struttura ID ${targetVenue.id} ora mostra l'impresa ID ${targetCompany.id} come sponsor.`);

  // Verifica pagina pubblica impresa
  const publicCompRes = await fetch(`${BASE_URL}/imprese/${targetCompany.slug}`);
  assert.strictEqual(publicCompRes.status, 200);
  const publicCompHtml = await publicCompRes.text();
  assert.ok(publicCompHtml.includes("Gruppo Sostenibilit"), "Nome aggiornato presente nella pagina");
  assert.ok(publicCompHtml.includes("28.687,50"), "Valore ridistribuito ricalcolato col 5,1x presente");
  assert.ok(publicCompHtml.includes("acme-sostenibilita.it/bilancio-integrato-2026.pdf"), "URL report integrato presente");
  console.log(`✓ Pagina /imprese/${targetCompany.slug} renderizzata con i dati modificati e ricalcolati!`);

  // 5. Ripristino Dati Demo e Pulizia
  console.log("\n--- RIPRISTINO DATI DEMO & PULIZIA ---");
  db.prepare("UPDATE venues SET name = ?, price_hotel_cents = ?, price_aperitivo_cents = ?, cover_image = ? WHERE id = ?").run(
    targetVenue.name,
    targetVenue.price_hotel_cents,
    targetVenue.price_aperitivo_cents,
    targetVenue.cover_image,
    targetVenue.id
  );
  db.prepare("UPDATE companies SET name = ?, employees_count = ?, funded_amount_cents = ?, local_redistribution_cents = ? WHERE id = ?").run(
    targetCompany.name,
    targetCompany.employees_count,
    targetCompany.funded_amount_cents,
    targetCompany.local_redistribution_cents,
    targetCompany.id
  );

  // Rimuovi file caricato di test da public/uploads
  if (fs.existsSync(diskPath)) {
    fs.unlinkSync(diskPath);
    console.log(`✓ File di test temporaneo rimosso da public/uploads.`);
  }

  // Pulizia sessione
  db.prepare("DELETE FROM sessions WHERE token = ?").run(promoterToken);
  console.log(`✓ Ripristino dati completato.`);

  console.log("\n=== TUTTI I TEST MODIFICA (IMPRESE & STRUTTURE) E CARICAMENTO FOTO SUPERATI AL 100%! ===");
}

run().catch((err) => {
  console.error("ERRORE DURANTE IL TEST:", err);
  process.exit(1);
});
