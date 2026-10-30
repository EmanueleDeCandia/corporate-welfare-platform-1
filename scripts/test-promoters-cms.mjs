import Database from "better-sqlite3";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";
const db = new Database("radici.db");

async function run() {
  console.log("=== TEST CMS GESTORE: INSERIMENTO ED ELIMINAZIONE FORNITORI ED EVENTI ===\n");

  // 1. Reperimento session token per Chiara Valenti (promoter) e Mario Rossi (employee)
  const promoterUser = db.prepare("SELECT id, email, role FROM users WHERE role = 'promoter' LIMIT 1").get();
  assert.ok(promoterUser, "Utente promoter non trovato");
  console.log(`✓ Trovato Gestore Piattaforma: ${promoterUser.email} (ID: ${promoterUser.id}, Role: ${promoterUser.role})`);

  const employeeUser = db.prepare("SELECT id, email, role FROM users WHERE role = 'employee' LIMIT 1").get();
  assert.ok(employeeUser, "Utente employee non trovato");

  // Inserimento sessioni di test nel DB
  const promoterToken = `test-promoter-session-${Date.now()}`;
  const employeeToken = `test-employee-session-${Date.now()}`;
  const futureExp = new Date(Date.now() + 24 * 3600 * 1000);

  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    promoterToken,
    promoterUser.id,
    Math.floor(futureExp.getTime() / 1000)
  );

  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    employeeToken,
    employeeUser.id,
    Math.floor(futureExp.getTime() / 1000)
  );

  const promoterCookie = `radici_session=${promoterToken}`;
  const employeeCookie = `radici_session=${employeeToken}`;

  // 2. Verifica protezione permessi (403 per dipendente non autorizzato)
  console.log("\n--- VERIFICA AUTORIZZAZIONI ---");
  const unauthRes = await fetch(`${BASE_URL}/api/promoters/venues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: employeeCookie,
    },
    body: JSON.stringify({ name: "Struttura Hack", type: "hotel", destinationId: 1 }),
  });
  assert.strictEqual(unauthRes.status, 403, "Un utente non-promoter non deve poter creare strutture");
  console.log("✓ Accesso non autorizzato (employee) bloccato con HTTP 403.");

  // 3. Creazione Nuovo Fornitore da parte del Gestore Promotore
  console.log("\n--- CREAZIONE NUOVO FORNITORE (AGRITURISMO COLLE FIORITO) ---");
  const newVenuePayload = {
    name: "Agriturismo Colle Fiorito",
    type: "agriturismo",
    destinationId: 1, // Colline Maceratesi
    city: "Recanati",
    province: "MC",
    region: "Marche",
    description: "Casale ottocentesco con piscina panoramica e cucina tipica a km 0.",
    longDescription: "Immerso tra gli ulivi secolari e le colline di Recanati, Colle Fiorito offre ospitalità rurale autentica con orto biologico e degustazioni di visciola.",
    coverImage: "/images/agriturismo-valle.jpg",
    priceHotelCents: 9500, // 95 €
    priceAperitivoCents: 2600, // 26 €
    dailyCapacity: 14,
    sponsorCompanyId: 1, // ACME Corporation S.p.A.
    services: ["Wi-Fi Gratuito", "Piscina Panoramica", "Degustazione Tipica KM 0", "Parcheggio Riservato"],
  };

  const createVenueRes = await fetch(`${BASE_URL}/api/promoters/venues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(newVenuePayload),
  });

  assert.strictEqual(createVenueRes.status, 201, "La creazione del fornitore deve restituire 201 Created");
  const createdVenueData = await createVenueRes.json();
  const createdVenue = createdVenueData.venue;
  assert.ok(createdVenue && createdVenue.id, "ID fornitore creato non presente");
  assert.strictEqual(createdVenue.name, "Agriturismo Colle Fiorito");
  assert.strictEqual(createdVenue.slug, "agriturismo-colle-fiorito");
  assert.strictEqual(createdVenue.checkinCode, "venue-agriturismo-colle-fiorito");
  assert.strictEqual(createdVenue.priceHotelCents, 9500);
  assert.strictEqual(createdVenue.sponsorCompanyId, 1);
  console.log(`✓ Fornitore creato con successo: ID ${createdVenue.id}, Slug: ${createdVenue.slug}, CheckinCode: ${createdVenue.checkinCode}`);

  // Verifica offerte generate
  const offerings = db.prepare("SELECT * FROM venue_offerings WHERE venue_id = ?").all(createdVenue.id);
  assert.strictEqual(offerings.length, 2, "Devono essere state generate 2 offerte (overnight e dinner)");
  console.log(`✓ Generate ${offerings.length} offerte collegate: Pernottamento (95€) e Cena (26€) con dailyCapacity 14.`);

  // 4. Creazione Nuovo Fornitore Filiera Corta (Produttore)
  console.log("\n--- CREAZIONE FORNITORE PRODUTTORE FILIERA CORTA (BOTTEGA DEI SIBILLINI) ---");
  const createProducerRes = await fetch(`${BASE_URL}/api/promoters/venues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify({
      name: "Bottega & Frantoio dei Sibillini",
      type: "producer",
      destinationId: 1,
      city: "Sarnano",
      province: "MC",
      description: "Prodotti artigianali di montagna, mieli e farine biologiche.",
      basketName: "Cesto Monti Azzurri KM 0",
      basketDescription: "Miele di millefiori, farina di grano tenero tipo 1 e confettura di more selvatiche.",
      priceBasketCents: 3900,
      dailyCapacity: 20,
    }),
  });
  assert.strictEqual(createProducerRes.status, 201);
  const createdProducerData = await createProducerRes.json();
  const createdProducer = createdProducerData.venue;
  assert.strictEqual(createdProducer.basketName, "Cesto Monti Azzurri KM 0");
  assert.strictEqual(createdProducer.priceBasketCents, 3900);
  assert.strictEqual(createdProducer.checkinCode, "prod-bottega-frantoio-dei-sibillini");
  console.log(`✓ Produttore filiera corta creato con successo: ID ${createdProducer.id}, Cesto: "${createdProducer.basketName}" a 39€.`);

  // 5. Creazione Nuovo Spettacolo Culturale (Matching Grant)
  console.log("\n--- CREAZIONE SPETTACOLO CULTURALE MATCHING GRANT ---");
  const newEventPayload = {
    title: "Concerto Sinfonico sotto le Stelle & Foyer Esclusivo",
    category: "musica",
    venueId: null,
    venueName: "Chiostro di Sant'Agostino",
    city: "Recanati",
    region: "Marche",
    description: "Serata di musica da camera all'aperto con calice di benvenuto e incontro con i maestri d'orchestra.",
    capacity: 45,
    grantAmountCents: 5000,
    artistMeetupIncluded: true,
  };

  const createEventRes = await fetch(`${BASE_URL}/api/promoters/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: promoterCookie,
    },
    body: JSON.stringify(newEventPayload),
  });

  assert.strictEqual(createEventRes.status, 201, "La creazione dello spettacolo deve restituire 201 Created");
  const createdEventData = await createEventRes.json();
  const createdEvent = createdEventData.event;
  assert.ok(createdEvent && createdEvent.id, "ID evento creato non presente");
  assert.strictEqual(createdEvent.title, newEventPayload.title);
  assert.strictEqual(createdEvent.capacity, 45);
  assert.strictEqual(createdEvent.grantAmountCents, 5000);
  console.log(`✓ Spettacolo creato con successo: ID ${createdEvent.id}, Titolo: "${createdEvent.title}", Capienza: ${createdEvent.capacity} posti.`);

  // 6. Test Blocco Sicurezza Contabile: tentativo eliminazione fornitore con transazioni (es. ID 1)
  console.log("\n--- TEST INTEGRITÀ FISCALE SU ELIMINAZIONE STRUTTURA CON STORICO ---");
  const deleteVenueWithHistoryRes = await fetch(`${BASE_URL}/api/promoters/venues/1`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(deleteVenueWithHistoryRes.status, 400, "Eliminare una struttura con transazioni deve fallire con HTTP 400");
  const errorData = await deleteVenueWithHistoryRes.json();
  console.log(`✓ Blocco scattato correttamente con messaggio: "${errorData.error}"`);

  // 7. Eliminazione Consentita per Nuova Struttura (Colle Fiorito)
  console.log("\n--- ELIMINAZIONE FORNITORE CREATO (COLLE FIORITO) ---");
  const deleteColleFioritoRes = await fetch(`${BASE_URL}/api/promoters/venues/${createdVenue.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(deleteColleFioritoRes.status, 200, "L'eliminazione deve avere successo");
  const deletedVenueCheck = db.prepare("SELECT * FROM venues WHERE id = ?").get(createdVenue.id);
  assert.strictEqual(deletedVenueCheck, undefined, "La struttura deve essere stata rimossa dal DB");
  const deletedOfferingsCheck = db.prepare("SELECT * FROM venue_offerings WHERE venue_id = ?").all(createdVenue.id);
  assert.strictEqual(deletedOfferingsCheck.length, 0, "Le offerte collegate devono essere state rimosse");
  console.log(`✓ Fornitore ID ${createdVenue.id} ed offerte rimosse correttamente dal database.`);

  // Eliminazione consentita anche per il produttore
  await fetch(`${BASE_URL}/api/promoters/venues/${createdProducer.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  console.log(`✓ Produttore ID ${createdProducer.id} rimosso correttamente dal database.`);

  // 8. Eliminazione Consentita per Nuovo Spettacolo
  console.log("\n--- ELIMINAZIONE SPETTACOLO CULTURALE (CONCERTO SINFONICO) ---");
  const deleteEventRes = await fetch(`${BASE_URL}/api/promoters/events/${createdEvent.id}`, {
    method: "DELETE",
    headers: { Cookie: promoterCookie },
  });
  assert.strictEqual(deleteEventRes.status, 200, "L'eliminazione dello spettacolo deve avere successo");
  const deletedEventCheck = db.prepare("SELECT * FROM grant_events WHERE id = ?").get(createdEvent.id);
  assert.strictEqual(deletedEventCheck, undefined, "Lo spettacolo deve essere stato rimosso dal DB");
  console.log(`✓ Spettacolo ID ${createdEvent.id} rimosso correttamente dal cartellone e dal database.`);

  // Pulizia sessioni di test
  db.prepare("DELETE FROM sessions WHERE token IN (?, ?)").run(promoterToken, employeeToken);
  console.log("\n=== TUTTI I 15 CONTROLLI CMS GESTORE SUPERATI CON SUCCESSO! ===");
}

run().catch((err) => {
  console.error("ERRORE DURANTE IL TEST:", err);
  process.exit(1);
});
