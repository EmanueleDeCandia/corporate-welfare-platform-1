import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  certificates,
  companies,
  destinations,
  invites,
  notifications,
  shares,
  transactions,
  users,
  venues,
  vouchers,
  grantEvents,
  welfarePlans,
  venueOfferings,
  voucherSelections,
  matchingGrants,
  grantSeats,
  grantConfirmations,
  bookings,
} from "@/db/schema";
import { badgeForPoints, hashPassword } from "@/lib/utils";

const DEMO_PASSWORD = hashPassword("radici2026");

let seedPromise: Promise<void> | null = null;

export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function seedIfEmpty() {
  const existing = await db.select({ id: companies.id }).from(companies).limit(1);
  if (existing.length > 0) return;
  await seedDatabase();
}

export async function seedDatabase() {
  const insertedCompanies = await db
    .insert(companies)
    .values([
      {
        name: "ACME S.p.A.",
        slug: "acme",
        vatNumber: "01234567890",
        city: "Ancona",
        sector: "Manifattura e design",
        employeesCount: 100,
        fundedAmountCents: 18600000,
        impactRating: 94,
        localRedistributionCents: 12840000,
        co2SavedKg: 18420,
        description:
          "ACME finanzia un piano welfare territoriale per i propri dipendenti: quattro notti e quattro aperitivi KM 0 all'anno, più omaggi culturali. Il rating misura capitale lasciato alle filiere agricole delle Marche e del Centro Italia.",
        accent: "#1C3A2E",
      },
      {
        name: "Verde Energia Italia",
        slug: "verde-energia",
        vatNumber: "01877654321",
        city: "Bologna",
        sector: "Energie rinnovabili",
        employeesCount: 260,
        fundedAmountCents: 9800000,
        impactRating: 88,
        localRedistributionCents: 6420000,
        co2SavedKg: 22100,
        description:
          "Utility rinnovabile che converte parte del premio di risultato in soggiorni e spettacoli nei territori dove sorgono i propri impianti agrivoltaici.",
        accent: "#3F6B4A",
      },
    ])
    .returning();

  const acme = insertedCompanies[0];
  const verde = insertedCompanies[1];

  // POPOLAMENTO PIANI WELFARE AZIENDALI
  const insertedPlans = await db
    .insert(welfarePlans)
    .values([
      {
        companyId: acme.id,
        year: 2026,
        validFrom: new Date("2026-01-01T00:00:00Z"),
        validUntil: new Date("2026-12-31T23:59:59Z"),
        eligibleEmployees: acme.employeesCount || 100,
        overnightAmountCents: 5000,
        dinnerAmountCents: 2500,
        overnightExtraThresholdBps: 2000, // 20%
        overnightExtraCapBps: 2000,       // 20%
        dinnerExtraThresholdBps: 2000,   // 20%
        dinnerExtraCapBps: 2000,         // 20%
        status: "active",
      },
      {
        companyId: verde.id,
        year: 2026,
        validFrom: new Date("2026-01-01T00:00:00Z"),
        validUntil: new Date("2026-12-31T23:59:59Z"),
        eligibleEmployees: verde.employeesCount || 260,
        overnightAmountCents: 5000,
        dinnerAmountCents: 2500,
        overnightExtraThresholdBps: 2000,
        overnightExtraCapBps: 2000,
        dinnerExtraThresholdBps: 2000,
        dinnerExtraCapBps: 2000,
        status: "active",
      },
    ])
    .returning();

  const acmePlan = insertedPlans[0];
  const verdePlan = insertedPlans[1];

  const insertedDestinations = await db
    .insert(destinations)
    .values([
      {
        name: "Colline Maceratesi",
        slug: "marche",
        region: "Marche",
        tagline: "L'entroterra gentile tra Sibillini e Adriatico",
        description:
          "Casali in pietra, teatri storici e campagne che sanno di visciola e olio. Il cuore operativo del circuito RADICI, dove il welfare aziendale finanzia agriturismi a conduzione familiare.",
        lat: 43.3002,
        lng: 13.4532,
        coverImage: "/images/marche.jpg",
        highlight: "Agriturismi KM 0 e teatri all'italiana",
      },
      {
        name: "Langhe",
        slug: "langhe",
        region: "Piemonte",
        tagline: "Vigne, nebbiolo e relais tra i filari",
        description:
          "Patrimonio UNESCO di Barolo e Barbaresco. Relais e cantine partner accolgono i dipendenti con camere sui filari e aperitivi di formaggi d'alpeggio.",
        lat: 44.609,
        lng: 7.993,
        coverImage: "/images/langhe.jpg",
        highlight: "Relais vinicoli e degustazioni",
      },
      {
        name: "Val d'Orcia",
        slug: "val-dorcia",
        region: "Toscana",
        tagline: "Cipressi, poderi e crete senesi",
        description:
          "Il paesaggio iconico della Toscana rurale. I poderi convenzionati offrono pernottamenti in camere padronali e aperitivi con pecorino e olio nuovo.",
        lat: 43.066,
        lng: 11.616,
        coverImage: "/images/val-dorcia.jpg",
        highlight: "Poderi storici e paesaggio UNESCO",
      },
      {
        name: "Salento",
        slug: "salento",
        region: "Puglia",
        tagline: "Masserie bianche, ulivi e luce del Sud",
        description:
          "Masserie fortificate e trulli immersi negli uliveti. Il circuito porta i dipendenti verso un turismo lento fatto di olio, pittule e notti calde.",
        lat: 40.147,
        lng: 18.171,
        coverImage: "/images/masseria-salento.jpg",
        highlight: "Masserie, olio e cucina povera nobile",
      },
    ])
    .returning();

  const marche = insertedDestinations[0];
  const langhe = insertedDestinations[1];
  const orcia = insertedDestinations[2];
  const salento = insertedDestinations[3];

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: "elena.martini@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Elena",
        lastName: "Martini",
        role: "csr",
        companyId: acme.id,
        impactPoints: 0,
        badgeLevel: "CSR Manager",
        referralCode: "elena-martini",
      },
      {
        email: "mario.rossi@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Mario",
        lastName: "Rossi",
        role: "employee",
        companyId: acme.id,
        impactPoints: 6,
        badgeLevel: badgeForPoints(6).label,
        referralCode: "mario-rossi",
      },
      {
        email: "giulia.verdi@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Giulia",
        lastName: "Verdi",
        role: "employee",
        companyId: acme.id,
        impactPoints: 1,
        badgeLevel: badgeForPoints(1).label,
        referralCode: "giulia-verdi",
      },
      {
        email: "sofia.neri@verdeenergia.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Sofia",
        lastName: "Neri",
        role: "employee",
        companyId: verde.id,
        impactPoints: 3,
        badgeLevel: badgeForPoints(3).label,
        referralCode: "sofia-neri",
      },
      {
        email: "luigi.bianchi@email.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Luigi",
        lastName: "Bianchi",
        role: "friend",
        impactPoints: 0,
        badgeLevel: badgeForPoints(0).label,
        referralCode: "luigi-bianchi",
        invitedByUserId: 1,
      },
      {
        email: "elena@lavalle.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Elena",
        lastName: "Conti",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "elena-conti",
      },
      {
        email: "marco@langheoro.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Marco",
        lastName: "Aliberti",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "marco-aliberti",
      },
      {
        email: "chiara@masseria.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Chiara",
        lastName: "Greco",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "chiara-greco",
      },
      {
        email: "paolo@teatrolauro.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Paolo",
        lastName: "Luzi",
        role: "theater",
        impactPoints: 0,
        badgeLevel: "Direzione Artistica · Teatro Lauro Rossi",
        referralCode: "paolo-luzi",
      },
          {
        email: "chiara.promotori@radici.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Chiara",
        lastName: "Valenti",
        role: "promoter",
        impactPoints: 0,
        badgeLevel: "Promotori RADICI",
        referralCode: "chiara-promotori",
      },
      {
        email: "alberto.bianchi@verdeenergia.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Alberto",
        lastName: "Bianchi",
        role: "csr",
        companyId: verde.id,
        impactPoints: 0,
        badgeLevel: "CSR Manager",
        referralCode: "alberto-bianchi",
      },
      {
        email: "matteo@osteriadeltiglio.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Matteo",
        lastName: "Sereni",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "matteo-sereni",
      },
      {
        email: "davide.ferri@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Davide",
        lastName: "Ferri",
        role: "employee",
        companyId: acme.id,
        impactPoints: 0,
        badgeLevel: badgeForPoints(0).label,
        referralCode: "davide-ferri",
      },
      {
        email: "francesca.romani@email.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Francesca",
        lastName: "Romani",
        role: "friend",
        impactPoints: 0,
        badgeLevel: badgeForPoints(0).label,
        referralCode: "francesca-romani",
      },
      {
        email: "giovanni@fontebella.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Giovanni",
        lastName: "Neri",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "giovanni-neri",
      },
      {
        email: "filiera@km0.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Sara",
        lastName: "Campo",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner Filiera Corta",
        referralCode: "sara-campo",
      },
      {
        email: "marco@frantoioconero.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Marco",
        lastName: "Silvestri",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner Filiera Corta",
        referralCode: "marco-silvestri",
      },
      {
        email: "sandro@agriturismocolle.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Sandro",
        lastName: "Conti",
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner Locale",
        referralCode: "sandro-conti",
      },
    ])
    .returning();

  const elenaMartini = insertedUsers[0];
  const mario = insertedUsers[1];
  const giulia = insertedUsers[2];
  const sofia = insertedUsers[3];
  const luigi = insertedUsers[4];
  const elena = insertedUsers[5];
  const marco = insertedUsers[6];
  const chiara = insertedUsers[7];
  const paolo = insertedUsers[8];
  const chiaraPromotori = insertedUsers[9];
  const alberto = insertedUsers[10];
  const matteo = insertedUsers[11];
  const davide = insertedUsers[12];
  const francesca = insertedUsers[13];
  const giovanni = insertedUsers[14];
  const saraCaseificio = insertedUsers[15];
  const marcoFrantoio = insertedUsers[16];
  const sandroColle = insertedUsers[17];

  await db
    .update(users)
    .set({ invitedByUserId: mario.id })
    .where(eq(users.id, luigi.id));

  await db
    .update(users)
    .set({ invitedByUserId: giulia.id })
    .where(eq(users.id, francesca.id));

  const insertedVenues = await db
    .insert(venues)
    .values([
      {
        name: "Agriturismo La Valle",
        slug: "agriturismo-la-valle",
        type: "agriturismo",
        destinationId: marche.id,
        city: "Macerata",
        province: "MC",
        region: "Marche",
        description:
          "Casale in pietra sulle colline maceratesi. Pernottamento in camera matrimoniale e aperitivo degustazione con prodotti a KM 0.",
        longDescription:
          "La Valle è una tenuta a conduzione familiare a pochi minuti da Macerata. Le camere padronali guardano i Sibillini, l'orto fornisce l'aperitivo e l'olio è spremuto nel frantoio aziendale. Ogni soggiorno RADICI finanzia direttamente la filiera agricola locale: il 15% del valore resta a ortolani, casari e vignaioli del comprensorio.",
        lat: 43.287,
        lng: 13.421,
        coverImage: "/images/struttura-la-valle-cover.jpg",
        gallery: [
          "/images/struttura-la-valle-cover.jpg",
          "/images/struttura-la-valle-camera.jpg",
          "/images/dettaglio-degustazione.jpg",
          "/images/dettaglio-tavola.jpg",
        ],
        services: [
          "Pernottamento in Camera Matrimoniale",
          "Aperitivo Degustazione con Prodotti a KM 0",
          "Colazione con uova e miele aziendali",
          "Visita all'orto e al frantoio",
        ],
        aperitivoMenu: [
          {
            name: "Tagliere dei Sibillini",
            description: "Ciauscolo, pecorino di fossa, miele di sulla e bruschette all'olio nuovo",
            priceCents: 2500,
          },
          {
            name: "Calice di Visner e olive ascolane",
            description: "Vino alle visciole della casa e olive fritte secondo la ricetta fermana",
            priceCents: 1200,
          },
          {
            name: "Orto in un boccone",
            description: "Flan di bietole, stracciatella e pomodoro secco del recanatese",
            priceCents: 900,
          },
        ],
        rooms: [
          {
            name: "Camera Singola (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto. Prezzo convenzionato 50,00 € coperto al 100% da 1 Voucher Welfare aziendale nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto nel casale rustico in pietra con travi a vista. Camera matrimoniale accogliente con bagno privato e vista sulla vallata.",
            capacity: 2,
            priceCents: 10000,
          },
        ],
        priceHotelCents: 5000,
        priceAperitivoCents: 2500,
        priceShowCents: 0,
        checkinCode: "venue-la-valle",
        providerUserId: elena.id,
        sponsorCompanyId: acme.id,
        impactPointsGenerated: 1,
        localSupportPercent: 15,
      },
      {
        name: "Relais Langhe Oro",
        slug: "relais-langhe-oro",
        type: "hotel",
        destinationId: langhe.id,
        city: "Barolo",
        province: "CN",
        region: "Piemonte",
        description:
          "Relais tra i filari di nebbiolo. Camere con vista vigneto e aperitivo di formaggi d'alpeggio.",
        longDescription:
          "Un'antica cascina nobiliare trasformata in relais di charme. Il circuito welfare copre la camera superior e un aperitivo in cantina con toma, castelmagno e nocciole delle Langhe. Ogni prenotazione RADICI sostiene i piccoli vignaioli del comune di Barolo.",
        lat: 44.611,
        lng: 7.943,
        coverImage: "/images/langhe.jpg",
        gallery: ["/images/langhe.jpg", "/images/hotel-villa.jpg", "/images/vigne.jpg", "/images/camera.jpg"],
        services: [
          "Pernottamento in Superior Vigneto",
          "Aperitivo in cantina",
          "Degustazione di tre nebbioli",
          "Colazione con nocciole IGP",
        ],
        aperitivoMenu: [
          {
            name: "Gran tagliere langarolo",
            description: "Castelmagno, toma, salame di Patrì e pane alle nocciole",
            priceCents: 2800,
          },
          {
            name: "Calice di Dolcetto e tartare di fassona",
            description: "Battuta al coltello e olio ligure a crudo",
            priceCents: 1800,
          },
        ],
        rooms: [
          {
            name: "Camera Singola Vigneto (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto tra i filari di Barolo. Prezzo convenzionato 50,00 € coperto al 100% da 1 Voucher Welfare nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia Superior Vigneto (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto tra i filari con vista panoramica sulle colline delle Langhe. Ampia camera matrimoniale con balcone panoramico.",
            capacity: 2,
            priceCents: 10000,
          },
        ],
        priceHotelCents: 5000,
        priceAperitivoCents: 2800,
        priceShowCents: 0,
        checkinCode: "venue-langhe-oro",
        providerUserId: marco.id,
        sponsorCompanyId: verde.id,
        impactPointsGenerated: 1,
        localSupportPercent: 12,
      },
      {
        name: "Podere Fontebella",
        slug: "podere-fontebella",
        type: "agriturismo",
        destinationId: orcia.id,
        city: "Pienza",
        province: "SI",
        region: "Toscana",
        description:
          "Podere sulle crete senesi con camere padronali e aperitivo di pecorino di Pienza.",
        longDescription:
          "Fontebella è un podere del Settecento nel cuore della Val d'Orcia. Le stanze hanno affreschi sbiaditi e letti in ferro. L'aperitivo convenzionato è un rito: pecorino di fossa, olio nuovo e un calice di rosso di Montalcino della cantina amica.",
        lat: 43.078,
        lng: 11.678,
        coverImage: "/images/struttura-fontebella-cover.webp",
        gallery: [
          "/images/struttura-fontebella-cover.webp",
          "/images/struttura-fontebella-cover-galleria.jpg",
          "/images/struttura-fontebella-cover-galleria-1.jpg",
          "/images/struttura-fontebella-cover-galleria-2.jpg",
        ],
        services: [
          "Pernottamento in camera padronale",
          "Aperitivo di pecorino e olio nuovo",
          "Passeggiata tra i cipressi",
          "Colazione con ricotta fresca",
        ],
        aperitivoMenu: [
          {
            name: "Pecorai di Pienza",
            description: "Tre stagionature, miele di acacia e pere coscia",
            priceCents: 2400,
          },
          {
            name: "Bruschetta all'olio nuovo",
            description: "Filone toscato e olio del podere spremuto a freddo",
            priceCents: 800,
          },
        ],
        rooms: [
          {
            name: "Camera Singola delle Crete (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto nel casale storico della Val d'Orcia. Prezzo convenzionato 50,00 € coperto al 100% da Voucher Welfare (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia delle Crete (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto con caminetto e lino lavato nel casale storico della Val d'Orcia.",
            capacity: 2,
            priceCents: 10000,
          },
        ],
        priceHotelCents: 5000,
        priceAperitivoCents: 2400,
        priceShowCents: 0,
        checkinCode: "venue-fontebella",
        impactPointsGenerated: 1,
        localSupportPercent: 16,
      },
      {
        name: "Masseria Le Grazie",
        slug: "masseria-le-grazie",
        type: "agriturismo",
        destinationId: salento.id,
        city: "Ostuni",
        province: "BR",
        region: "Puglia",
        description:
          "Masseria bianca tra gli ulivi secolari. Suite in pietra e aperitivo di pittule e olio extravergine.",
        longDescription:
          "Le Grazie è una masseria fortificata del XVI secolo. Le volte a stella, la corte degli ulivi e la cucina di terra e mare raccontano il Salento lento. Il voucher RADICI copre la suite e un aperitivo di pittule, bombette e verdure di campo.",
        lat: 40.728,
        lng: 17.577,
        coverImage: "/images/masseria-salento.jpg",
        gallery: [
          "/images/masseria-salento.jpg",
          "/images/piscina.jpg",
          "/images/ulivi.jpg",
          "/images/camera.jpg",
        ],
        services: [
          "Pernottamento in suite in pietra",
          "Aperitivo di pittule e olio EVO",
          "Bagno in piscina tra gli ulivi",
          "Visita al frantoio ipogeo",
        ],
        aperitivoMenu: [
          {
            name: "Pittule e bombette",
            description: "Frittelle salentine, bombette di capocollo e verdure di campo",
            priceCents: 2200,
          },
          {
            name: "Olio nuovo e pane di Laterza",
            description: "Tre extravergini monocultivar in degustazione",
            priceCents: 1000,
          },
        ],
        rooms: [
          {
            name: "Camera Singola della Corte (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto tra gli ulivi secolari di Ostuni con volte in pietra. Prezzo convenzionato 50,00 € coperto al 100% da Voucher Welfare nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia Suite della Corte (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto con patio privato tra gli ulivi secolari di Ostuni con volte in pietra a vista.",
            capacity: 2,
            priceCents: 10000,
          },
        ],
        priceHotelCents: 5000,
        priceAperitivoCents: 2200,
        priceShowCents: 0,
        checkinCode: "venue-le-grazie",
        providerUserId: chiara.id,
        impactPointsGenerated: 1,
        localSupportPercent: 18,
      },
      {
        name: "Teatro Lauro Rossi",
        slug: "teatro-lauro-rossi",
        type: "theater",
        destinationId: marche.id,
        city: "Macerata",
        province: "MC",
        region: "Marche",
        description:
          "Teatro all'italiana del 1769, sede delle rappresentazioni storiche e del Matching Grant promosso da RADICI.",
        longDescription:
          "Uno dei teatri storici più eleganti delle Marche. Il Matching Grant RADICI è un omaggio culturale erogato e finanziato dai Promotori della startup territoriale (non dalle imprese CSR): garantisce 2 posti riservati in platea con incontro esclusivo con gli attori a fine spettacolo per tutti gli ospiti che soggiornano nei borghi.",
        lat: 43.3008,
        lng: 13.4539,
        coverImage: "/images/teatro-lauro-rossi-cover.jpg",
        gallery: [
          "/images/teatro-lauro-rossi-cover.jpg",
          "/images/teatro-lauro-rossi-sala.jpeg",
        ],
        services: ["Posto in platea omaggio", "Programma di sala", "Guardaroba incluso", "Incontro con gli artisti"],
        aperitivoMenu: [],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 0,
        priceShowCents: 5000,
        checkinCode: "venue-lauro-rossi",
        impactPointsGenerated: 1,
        localSupportPercent: 20,
      },
      {
        name: "Teatro dell'Aquila",
        slug: "teatro-dellaquila",
        type: "theater",
        destinationId: marche.id,
        city: "Fermo",
        province: "FM",
        region: "Marche",
        description:
          "Uno dei teatri storici più prestigiosi delle Marche: sala all'italiana con 124 palchi a cinque ordini e soffitto affrescato.",
        longDescription:
          "Inaugurato nel 1790, il Teatro dell'Aquila di Fermo è celebre per l'eccezionale acustica e il monumentale sipario storico dipinto dal Cochetti. Attraverso il Matching Grant dei Promotori RADICI, gli ospiti dei soggiorni nei borghi accedono a 2 posti riservati in platea per la stagione di prosa con visita guidata alle sale storiche.",
        lat: 43.161,
        lng: 13.718,
        coverImage: "/images/teatro-aquila-cover.webp",
        gallery: [
          "/images/teatro-aquila-cover.webp",
          "/images/teatro-aquila-sipario.webp",
        ],
        services: ["Posto in platea / palchi riservato", "Visita al sipario storico", "Guardaroba incluso", "Incontro con la compagnia"],
        aperitivoMenu: [],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 0,
        priceShowCents: 5000,
        checkinCode: "venue-teatro-aquila",
        impactPointsGenerated: 1,
        localSupportPercent: 20,
      },
      {
        name: "Teatro delle Muse",
        slug: "teatro-delle-muse",
        type: "theater",
        destinationId: marche.id,
        city: "Ancona",
        province: "AN",
        region: "Marche",
        description:
          "Il massimo teatro delle Marche: maestosa facciata neoclassica, sala moderna da oltre mille posti e sipario tagliafuoco di Arnaldo Pomodoro.",
        longDescription:
          "Situato a pochi passi dal porto di Ancona, il Teatro delle Muse ospita le principali stagioni liriche, sinfoniche e concertistiche della regione. Con il Matching Grant dei Promotori RADICI, ogni ospite gode di 2 ingressi riservati per le serate concertistiche con brindisi di benvenuto e incontro esclusivo nel Foyer delle Muse.",
        lat: 43.619,
        lng: 13.511,
        coverImage: "/images/teatro-muse-cover.jpg",
        gallery: [
          "/images/teatro-muse-cover.jpg",
          "/images/teatro-muse-foyer.jpg",
        ],
        services: ["2 Biglietti rassegna concertistica/lirica", "Brindisi nel Foyer d'onore", "Programma di sala", "Incontro con gli artisti"],
        aperitivoMenu: [],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 0,
        priceShowCents: 5000,
        checkinCode: "venue-teatro-muse",
        impactPointsGenerated: 1,
        localSupportPercent: 20,
      },
      {
        name: "Osteria del Tiglio",
        slug: "osteria-del-tiglio",
        type: "restaurant",
        destinationId: marche.id,
        city: "Recanati",
        province: "MC",
        region: "Marche",
        description:
          "Osteria di campagna sotto un tiglio centenario. Aperitivo e cucina di territorio per i voucher gusto.",
        longDescription:
          "Un'unica sala, un camino e un menù che cambia con l'orto. L'osteria accetta i voucher aperitivo welfare e i pagamenti consumer degli amici invitati, con micro-sconto di community.",
        lat: 43.403,
        lng: 13.549,
        coverImage: "/images/struttura-tiglio-cover.jpg",
        gallery: [
          "/images/struttura-tiglio-cover.jpg",
          "/images/struttura-tiglio-cover-galleria.jpg",
          "/images/struttura-tiglio-cover-galleria-1.jpg",
          "/images/struttura-tiglio-cover-galleria-2.jpg",
        ],
        services: ["Aperitivo KM 0", "Cucina di territorio", "Tavoli sotto il tiglio"],
        aperitivoMenu: [
          {
            name: "Aperitivo del Tiglio",
            description: "Olive, crescia, formaggi e un calice di pecorino marchigiano",
            priceCents: 1800,
          },
        ],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 1800,
        priceShowCents: 0,
        checkinCode: "venue-tiglio",
        impactPointsGenerated: 1,
        localSupportPercent: 22,
      },
      {
        name: "Frantoio del Conero",
        slug: "frantoio-del-conero",
        type: "producer",
        destinationId: marche.id,
        city: "Sirolo",
        province: "AN",
        region: "Marche",
        description: "Frantoio storico alle pendici del Monte Conero specializzato in Olio Extravergine Biologico da cultivar autoctone marchigiane (Raggia e Leccino).",
        longDescription: "Il Frantoio del Conero produce olio EVO biologico certificato a filiera cortissima. Le olive vengono raccolte a mano negli uliveti di Sirolo e Numana e molite a freddo entro 6 ore per preservare polifenoli e aromi erbacei. Acquistabile liberamente da tutti i membri della community con consegna garantita.",
        lat: 43.52,
        lng: 13.61,
        coverImage: "/images/produttore-conero-frantoio.jpg",
        gallery: [
          "/images/produttore-conero-frantoio.jpg",
          "/images/produttore-conero-cesto.jpg",
          "/images/olio.jpg",
        ],
        services: ["Vendita diretta", "Degustazione olio", "Consegna a domicilio"],
        basketName: "Cesto Conero Oro Verde",
        basketDescription: "3 Bottiglie Olio EVO Monocultivar Raggia Bio (3x750ml) + Patè artigianale di olive nere e Carciofini sott'olio KM 0.",
        priceBasketCents: 3800,
        checkinCode: "prod-frantoio-conero",
        impactPointsGenerated: 2,
        localSupportPercent: 20,
      },
      {
        name: "Caseificio Bio dei Sibillini",
        slug: "caseificio-bio-sibillini",
        type: "producer",
        destinationId: marche.id,
        city: "Amandola",
        province: "FM",
        region: "Marche",
        description: "Piccolo caseificio d'alta quota che trasforma esclusivamente latte crudo biologico di pecore e capre al pascolo nei Monti Sibillini.",
        longDescription: "Filiera circolare e sostenibile: i formaggi sono affinati con erbe spontanee di montagna, fieno e stagionatura in antiche grotte tufacee. Un presidio di biodiversità che sostiene i giovani allevatori locali.",
        lat: 42.98,
        lng: 13.35,
        coverImage: "/images/produttore-sibillini-casaro.jpg",
        gallery: [
          "/images/produttore-sibillini-casaro.jpg",
          "/images/produttore-sibillini-cesto.avif",
          "/images/dettaglio-tavola.jpg",
          "/images/cestino-misto.jpg",
        ],
        services: ["Formaggi a latte crudo", "Confezionamento sottovuoto", "Prodotti d'alpeggio"],
        basketName: "Cesto Casaro dei Monti Azzurri",
        basketDescription: "Pecorino dei Sibillini semistagionato (800g), Caciotta fresca alle noci dell'alta valle e vasetto di Miele di Melata bio.",
        priceBasketCents: 4200,
        checkinCode: "prod-caseificio-sibillini",
        impactPointsGenerated: 2,
        localSupportPercent: 20,
      },
      {
        name: "Agriturismo Colle",
        slug: "agriturismo-colle",
        type: "agriturismo",
        destinationId: marche.id,
        city: "Caldarola",
        province: "MC",
        region: "Marche",
        description:
          "Antico casale rurale sui colli di Caldarola, nel cuore dei Monti Azzurri. Camere rustiche con vista, piscina e cucina autentica dell'entroterra a KM 0.",
        longDescription:
          "Nel suggestivo entroterra maceratese, ai piedi dei Sibillini e a pochi passi dal Castello Pallotta di Caldarola, l'Agriturismo Colle incarna la vocazione rurale e la resilienza delle aree interne marchigiane. La tenuta è circondata da uliveti secolari della pregiata cultivar Coroncina e da coltivazioni biologiche. I dipendenti delle imprese CSR e gli ospiti della community godono di un'ospitalità familiare a ritmo lento, con colazioni casalinghe e degustazioni di salumi tipici dei Sibillini, formaggi d'alpeggio e vini del comprensorio montano.",
        lat: 43.1388,
        lng: 13.2261,
        coverImage: "/image/agriturismo-colle-di-caldarola.jpg",
        gallery: [
          "/image/agriturismo-colle-di-caldarola.jpg",
          "/image/agriturismo-colle-di-caldarola-galleria.jpg",
          "/image/agriturismo-colle-di-caldarola-galleria-1.jpg",
          "/image/agriturismo-colle-di-caldarola-interni.webp",
          "/image/agriturismo-colle-di-caldarola-interni-galleria-3.webp",
        ],
        services: [
          "Pernottamento in Camera Rustica Panoramica",
          "Cucina Contadina e Degustazione KM 0",
          "Piscina Panoramica tra i Colli Maceratesi",
          "Degustazione Olio Monovarietale Coroncina di Caldarola",
          "Orto Biologico e Frutteto Antico",
          "Noleggio E-bike per i sentieri dei Monti Sibillini",
        ],
        aperitivoMenu: [
          {
            name: "Tagliere dei Monti Azzurri",
            description: "Ciauscolo morbido IGP di Caldarola, pecorino semistagionato dei Sibillini, focaccia calda e miele biologico.",
            priceCents: 2400,
          },
          {
            name: "Crescia Marchigiana e Salumi di Collina",
            description: "Crescia sfogliata cotta su pietra con lonzino marinato alle erbe e pecorino fresco con marmellata di fichi.",
            priceCents: 1800,
          },
          {
            name: "Bruschette all'Olio Monocultivar Coroncina",
            description: "Pane di grani antichi tostato a legna, olio extravergine Coroncina e calice di Ribona Colli Maceratesi DOC.",
            priceCents: 1200,
          },
        ],
        rooms: [
          {
            name: "Camera Singola Panoramica (Convenzione Welfare Aziendale · 1 Persona)",
            description:
              "1 Posto letto con vista sui colli di Caldarola. Prezzo convenzionato 50,00 € coperto al 100% da 1 Voucher Welfare nominativo (Art. 51 TUIR). Se l'addetto prenota per 2 persone/posti letto, il prezzo per l'altra persona è la differenza tra il prezzo esposto e 50 € del voucher.",
            capacity: 1,
            priceCents: 5000,
          },
          {
            name: "Camera Doppia Panoramica (1 Quota Welfare + 1 Quota Accompagnatore)",
            description:
              "2 Posti letto con prima colazione artigianale dell'orto e splendida vista panoramica sulle colline e sui monti Sibillini.",
            capacity: 2,
            priceCents: 10000,
          },
        ],
        priceHotelCents: 5000,
        priceAperitivoCents: 2400,
        priceShowCents: 0,
        basketName: "Cesto delle Aree Interne di Caldarola",
        basketDescription: "Selezione artigianale: Olio Monovarietale Coroncina (500ml), Ciauscolo marchigiano IGP, Composta biologica di mele rosa dei Sibillini e biscotti della tradizione.",
        priceBasketCents: 3500,
        checkinCode: "venue-agriturismo-colle",
        providerUserId: sandroColle.id,
        sponsorCompanyId: acme.id,
        impactPointsGenerated: 1,
        localSupportPercent: 18,
      },
    ])
    .returning();

  const laValle = insertedVenues.find((v) => v.slug === "agriturismo-la-valle")!;
  const relaisLanghe = insertedVenues.find((v) => v.slug === "relais-langhe-oro")!;
  const podereFonte = insertedVenues.find((v) => v.slug === "podere-fontebella")!;
  const masseriaGrazie = insertedVenues.find((v) => v.slug === "masseria-le-grazie")!;
  const teatroLauro = insertedVenues.find((v) => v.slug === "teatro-lauro-rossi")!;
  const teatroAquila = insertedVenues.find((v) => v.slug === "teatro-dellaquila")!;
  const teatroMuse = insertedVenues.find((v) => v.slug === "teatro-delle-muse")!;
  const osteriaTiglio = insertedVenues.find((v) => v.slug === "osteria-del-tiglio")!;
  const frantoioConero = insertedVenues.find((v) => v.slug === "frantoio-del-conero")!;
  const caseificioSibillini = insertedVenues.find((v) => v.slug === "caseificio-bio-sibillini")!;
  const agriturismoColle = insertedVenues.find((v) => v.slug === "agriturismo-colle")!;

  await db.update(users).set({ venueId: laValle.id }).where(eq(users.id, elena.id));
  await db.update(users).set({ venueId: relaisLanghe.id }).where(eq(users.id, marco.id));
  await db.update(users).set({ venueId: podereFonte.id }).where(eq(users.id, giovanni.id));
  await db.update(users).set({ venueId: masseriaGrazie.id }).where(eq(users.id, chiara.id));
  await db.update(users).set({ venueId: teatroLauro.id }).where(eq(users.id, paolo.id));
  await db.update(users).set({ venueId: osteriaTiglio.id }).where(eq(users.id, matteo.id));
  await db.update(users).set({ venueId: frantoioConero.id }).where(eq(users.id, marcoFrantoio.id));
  await db.update(users).set({ venueId: caseificioSibillini.id }).where(eq(users.id, saraCaseificio.id));
  await db.update(users).set({ venueId: agriturismoColle.id }).where(eq(users.id, sandroColle.id));

  await db.update(venues).set({ providerUserId: elena.id }).where(eq(venues.id, laValle.id));
  await db.update(venues).set({ providerUserId: marco.id }).where(eq(venues.id, relaisLanghe.id));
  await db.update(venues).set({ providerUserId: giovanni.id }).where(eq(venues.id, podereFonte.id));
  await db.update(venues).set({ providerUserId: chiara.id }).where(eq(venues.id, masseriaGrazie.id));
  await db.update(venues).set({ providerUserId: paolo.id }).where(eq(venues.id, teatroLauro.id));
  await db.update(venues).set({ providerUserId: matteo.id }).where(eq(venues.id, osteriaTiglio.id));
  await db.update(venues).set({ providerUserId: marcoFrantoio.id }).where(eq(venues.id, frantoioConero.id));
  await db.update(venues).set({ providerUserId: saraCaseificio.id }).where(eq(venues.id, caseificioSibillini.id));
  await db.update(venues).set({ providerUserId: sandroColle.id }).where(eq(venues.id, agriturismoColle.id));

  // POPOLAMENTO OFFERTE SERVIZI STRUTTURE (PERNOTTAMENTO SINGOLA 50€, DOPPIA 100€, CENA KM 0)
  const insertedOfferings = await db
    .insert(venueOfferings)
    .values([
      // Agriturismo La Valle
      {
        venueId: laValle.id,
        benefitType: "overnight",
        name: "Camera Singola (Convenzione Welfare Aziendale)",
        description: "1 Posto letto. Prezzo 50,00 € coperto al 100% da 1 voucher welfare (Art. 51 TUIR). Se si prenota per 2 posti letto, il prezzo per l'altra persona è identico (50,00 €).",
        listPriceCents: 5000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: laValle.id,
        benefitType: "overnight",
        name: "Camera Doppia (1 Persona Welfare + 1 Accompagnatore)",
        description: "2 Posti letto. Prezzo 100,00 €: la quota lavoratore (50,00 €) è coperta da voucher welfare; la quota accompagnatore (50,00 €) è pagabile con carta personale.",
        listPriceCents: 10000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: laValle.id,
        benefitType: "dinner",
        name: "Aperitivo Degustazione & Cena KM 0",
        description: "Tagliere dei Sibillini con ciauscolo, pecorino di fossa e calice di Visner.",
        listPriceCents: 2500,
        acceptsWelfare: true,
        dailyCapacity: 20,
      },

      // Relais Langhe Oro
      {
        venueId: relaisLanghe.id,
        benefitType: "overnight",
        name: "Camera Singola Vigneto (Convenzione Welfare)",
        description: "1 Posto letto tra i filari di Barolo. Prezzo convenzionato 50,00 € coperto al 100% da voucher welfare nominativo.",
        listPriceCents: 5000,
        acceptsWelfare: true,
        dailyCapacity: 5,
      },
      {
        venueId: relaisLanghe.id,
        benefitType: "overnight",
        name: "Camera Doppia Superior Vigneto (Welfare + Accompagnatore)",
        description: "2 Posti letto tra i filari. Prezzo 100,00 €: 50,00 € coperti da voucher welfare + 50,00 € a carico della seconda persona con carta personale.",
        listPriceCents: 10000,
        acceptsWelfare: true,
        dailyCapacity: 5,
      },
      {
        venueId: relaisLanghe.id,
        benefitType: "dinner",
        name: "Cena & Gran Tagliere Langarolo",
        description: "Castelmagno d'alpeggio, toma, tartare di fassona e calice di nebbiolo.",
        listPriceCents: 2800,
        acceptsWelfare: true,
        dailyCapacity: 15,
      },

      // Podere Fontebella
      {
        venueId: podereFonte.id,
        benefitType: "overnight",
        name: "Camera Singola delle Crete (Convenzione Welfare)",
        description: "1 Posto letto nel casale storico toscano. Prezzo convenzionato 50,00 € coperto al 100% da voucher welfare.",
        listPriceCents: 5000,
        acceptsWelfare: true,
        dailyCapacity: 3,
      },
      {
        venueId: podereFonte.id,
        benefitType: "overnight",
        name: "Camera Doppia delle Crete (Welfare + Accompagnatore)",
        description: "2 Posti letto con caminetto e vista Val d'Orcia. Prezzo 100,00 €: 50,00 € welfare + 50,00 € accompagnatore con carta personale.",
        listPriceCents: 10000,
        acceptsWelfare: true,
        dailyCapacity: 3,
      },
      {
        venueId: podereFonte.id,
        benefitType: "dinner",
        name: "Degustazione Pecorai di Pienza",
        description: "Pecorini stagionati, miele d'acacia e bruschetta all'olio nuovo franto.",
        listPriceCents: 2400,
        acceptsWelfare: true,
        dailyCapacity: 12,
      },

      // Masseria Le Grazie
      {
        venueId: masseriaGrazie.id,
        benefitType: "overnight",
        name: "Camera Singola della Corte (Convenzione Welfare)",
        description: "1 Posto letto con volte in pietra a Ostuni. Prezzo convenzionato 50,00 € coperto da voucher welfare nominativo.",
        listPriceCents: 5000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: masseriaGrazie.id,
        benefitType: "overnight",
        name: "Camera Doppia Suite della Corte (Welfare + Accompagnatore)",
        description: "2 Posti letto con patio privato tra gli ulivi. Prezzo 100,00 €: 50,00 € welfare + 50,00 € accompagnatore con carta personale.",
        listPriceCents: 10000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: masseriaGrazie.id,
        benefitType: "dinner",
        name: "Cena Tradizionale di Pittule e Bombette",
        description: "Bombette di capocollo, verdure di campo e olio extravergine monocultivar.",
        listPriceCents: 2200,
        acceptsWelfare: true,
        dailyCapacity: 18,
      },

      // Osteria del Tiglio: SOLO CENA
      {
        venueId: osteriaTiglio.id,
        benefitType: "dinner",
        name: "Cena di Campagna sotto il Tiglio",
        description: "Crescia sfogliata recanatese, pecorino marchigiano e verdure di stagione.",
        listPriceCents: 2500,
        acceptsWelfare: true,
        dailyCapacity: 25,
      },

      // Agriturismo Colle
      {
        venueId: agriturismoColle.id,
        benefitType: "overnight",
        name: "Camera Singola Panoramica (Convenzione Welfare)",
        description: "1 Posto letto sui colli di Caldarola con prima colazione. Prezzo 50,00 € coperto da voucher welfare.",
        listPriceCents: 5000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: agriturismoColle.id,
        benefitType: "overnight",
        name: "Camera Doppia Panoramica (Welfare + Accompagnatore)",
        description: "2 Posti letto con vista Sibillini. Prezzo 100,00 €: 50,00 € voucher welfare + 50,00 € accompagnatore con carta personale.",
        listPriceCents: 10000,
        acceptsWelfare: true,
        dailyCapacity: 4,
      },
      {
        venueId: agriturismoColle.id,
        benefitType: "dinner",
        name: "Degustazione dei Monti Azzurri & Cena Tipica",
        description: "Menu tradizionale dell'entroterra con salumi dei Sibillini, pecorino di fossa, pasta fresca al matterello e vino locale.",
        listPriceCents: 2400,
        acceptsWelfare: true,
        dailyCapacity: 16,
      },
    ])
    .returning();

  const defaultOvernightOffering = insertedOfferings.find(
    (o) => o.venueId === laValle.id && o.benefitType === "overnight"
  )!;
  const defaultDinnerOffering = insertedOfferings.find(
    (o) => o.venueId === laValle.id && o.benefitType === "dinner"
  )!;


  // POPOLAMENTO EVENTI E SPETTACOLI DEL MATCHING GRANT PROMOTORI (CON DATE E CAPIENZA POSTI)
  const insertedGrantEvents = await db
    .insert(grantEvents)
    .values([
      {
        title: "Stagione di Prosa e Visita Esclusiva nel Ridotto",
        category: "teatro",
        venueId: teatroLauro.id,
        venueName: "Teatro Lauro Rossi",
        city: "Macerata",
        region: "Marche",
        description: "Posti riservati per 2 persone nel teatro barocco all'italiana, con introduzione alla stagione e incontro con gli attori.",
        startsAt: new Date("2026-05-15T20:30:00Z"),
        capacity: 40,
        grantAmountCents: 5000,
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Concerto Sinfonico e Percorso nel Foyer delle Muse",
        category: "musica",
        venueId: teatroMuse.id,
        venueName: "Teatro delle Muse",
        city: "Ancona",
        region: "Marche",
        description: "2 biglietti per la rassegna concertistica serale con brindisi e incontro nel foyer con i musicisti.",
        startsAt: new Date("2026-05-22T21:00:00Z"),
        capacity: 50,
        grantAmountCents: 5000,
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Rassegna Teatrale Storica e Incontro con la Compagnia",
        category: "teatro",
        venueId: teatroAquila.id,
        venueName: "Teatro dell'Aquila",
        city: "Fermo",
        region: "Marche",
        description: "2 ingressi di platea per lo spettacolo di prosa con visita al sipario storico e colloquio a fine spettacolo.",
        startsAt: new Date("2026-06-05T20:45:00Z"),
        capacity: 35,
        grantAmountCents: 5000,
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Notte d'Opera e Percorso Architettonico",
        category: "musica",
        venueId: null,
        venueName: "Arena Sferisterio",
        city: "Macerata",
        region: "Marche",
        description: "Omaggio per 2 persone per l'opera lirica all'aperto nello storico monumento neoclassico con introduzione critica.",
        startsAt: new Date("2026-07-10T21:15:00Z"),
        capacity: 60,
        grantAmountCents: 5000,
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Festival di Musica Antica e Visita alle Sale Rinascimentali",
        category: "arte_cultura",
        venueId: null,
        venueName: "Palazzo Ducale & Teatro Sanzio",
        city: "Urbino",
        region: "Marche",
        description: "Visita serale riservata e concerto di musica rinascimentale per 2 persone nel cuore dell'arte italiana.",
        startsAt: new Date("2026-06-20T19:30:00Z"),
        capacity: 30,
        grantAmountCents: 5000,
        confirmationSendDays: 7,
        confirmationDeadlineDays: 3,
        artistMeetupIncluded: true,
        active: true,
      },
    ])
    .returning();

  const defaultGrantEvent = insertedGrantEvents[0];

  const employeeSeeds = [
    { user: mario, companyId: acme.id, planId: acmePlan.id, hotelRedeemed: false },
    { user: giulia, companyId: acme.id, planId: acmePlan.id, hotelRedeemed: false },
    { user: sofia, companyId: verde.id, planId: verdePlan.id, hotelRedeemed: false },
    { user: davide, companyId: acme.id, planId: acmePlan.id, hotelRedeemed: false },
  ];

  let marioOvernightVoucherId = 1;

  for (const employee of employeeSeeds) {
    const hotelAmount = 5000; // 50 €
    const aperitivoAmount = 2500; // 25 €

    // ESATTAMENTE 2 VOUCHER BASE PER DIPENDENTE (1 Notte + 1 Cena)
    const [insertedHotelVoucher] = await db
      .insert(vouchers)
      .values({
        planId: employee.planId,
        userId: employee.user.id,
        companyId: employee.companyId,
        type: "hotel",
        status: employee.hotelRedeemed ? "redeemed" : "available",
        origin: "base",
        slotIndex: 1,
        amountCents: hotelAmount,
        venueId: employee.hotelRedeemed ? laValle.id : null,
        theaterVenueId: employee.hotelRedeemed ? teatroLauro.id : null,
        grantEventId: employee.hotelRedeemed ? defaultGrantEvent.id : null,
        redeemedAt: employee.hotelRedeemed ? new Date("2026-03-12T18:40:00Z") : null,
      })
      .returning();

    if (employee.hotelRedeemed && employee.user.id === mario.id) {
      marioOvernightVoucherId = insertedHotelVoucher.id;

      // Creazione selezione puntuale e tracciamento presenza per Mario
      await db.insert(voucherSelections).values({
        voucherId: insertedHotelVoucher.id,
        venueId: laValle.id,
        offeringId: defaultOvernightOffering.id,
        serviceDate: "2026-03-12",
        selectedAt: new Date("2026-03-12T18:40:00Z"),
        attendanceStatus: "attended",
        checkedInAt: new Date("2026-03-12T19:00:00Z"),
        checkedInByUserId: elena.id,
        notes: "Check-in confermato con successo da Agriturismo La Valle.",
      });

      // Creazione Matching Grant riservato a chi seleziona Pernottamento
      const [insertedGrant] = await db
        .insert(matchingGrants)
        .values({
          voucherId: insertedHotelVoucher.id,
          eventId: defaultGrantEvent.id,
          amountCents: 5000,
          seatsRequested: 2,
          status: "confirmed",
          assignedAt: new Date("2026-03-12T18:40:00Z"),
          confirmedAt: new Date("2026-05-10T11:00:00Z"),
        })
        .returning();

      // 2 Posti: Dipendente + Accompagnatore
      await db.insert(grantSeats).values([
        {
          matchingGrantId: insertedGrant.id,
          holderRole: "employee",
          holderName: `${mario.firstName} ${mario.lastName}`,
          holderEmail: mario.email,
          valueCents: 2500,
          attended: false,
        },
        {
          matchingGrantId: insertedGrant.id,
          holderRole: "companion",
          holderName: "Ospite Accompagnatore",
          holderEmail: null,
          valueCents: 2500,
          attended: false,
        },
      ]);

      // Registro conferma email (finestra T-7 con scadenza T-3)
      await db.insert(grantConfirmations).values({
        matchingGrantId: insertedGrant.id,
        token: "conf-mario-rossi-grant-2026",
        scheduledFor: new Date("2026-05-08T09:00:00Z"), // T-7 rispetto al 15 Maggio
        respondBy: new Date("2026-05-12T23:59:59Z"),    // T-3 rispetto al 15 Maggio
        sentAt: new Date("2026-05-08T09:05:00Z"),
        response: "confirmed",
        respondedAt: new Date("2026-05-10T11:00:00Z"),
        reminderCount: 0,
      });
    }

    await db.insert(vouchers).values({
      planId: employee.planId,
      userId: employee.user.id,
      companyId: employee.companyId,
      type: "aperitivo",
      status: "available",
      origin: "base",
      slotIndex: 1,
      amountCents: aperitivoAmount,
    });
  }

  const insertedInvites = await db
    .insert(invites)
    .values([
      {
        inviterId: mario.id,
        firstName: "Luigi",
        lastName: "Bianchi",
        email: "luigi.bianchi@email.it",
        code: "ref-luigi-bianchi",
        status: "converted",
        friendUserId: luigi.id,
        createdAt: new Date("2026-03-20T10:00:00Z"),
      },
      {
        inviterId: mario.id,
        firstName: "Anna",
        lastName: "Greco",
        email: "anna.greco@email.it",
        code: "ref-anna-greco",
        status: "pending",
        createdAt: new Date("2026-04-02T09:15:00Z"),
      },
      {
        inviterId: giulia.id,
        firstName: "Francesca",
        lastName: "Romani",
        email: "francesca.romani@email.it",
        code: "ref-francesca-romani",
        status: "converted",
        friendUserId: francesca.id,
        createdAt: new Date("2026-03-25T14:30:00Z"),
      },
    ])
    .returning();

  const luigiInvite = insertedInvites[0];

  const insertedTx = await db
    .insert(transactions)
    .values([
      // Transazione privata community: Luigi Bianchi (amico invitato, paga quota propria)
      {
        type: "consumer_payment",
        status: "receipted",
        userId: luigi.id,
        venueId: laValle.id,
        inviteId: luigiInvite.id,
        amountCents: 4500,
        discountCents: 500,
        listPriceCents: 5000,
        serviceLabel: "Soggiorno amico · Camera Matrimoniale",
        paymentStatus: "settled",
        commissionBps: 1000,
        commissionAmountCents: 450,
        providerNetCents: 4050,
        createdAt: new Date("2026-04-04T19:12:00Z"),
      },
    ])
    .returning();

  await db.insert(notifications).values([
    {
      venueId: laValle.id,
      type: "referral",
      title: "Notifica referral / consumer",
      body: 'L\'utente amico "Luigi Bianchi" (invitato da Mario Rossi) ha concluso il saldo.',
      payload: {
        guest: "Luigi Bianchi",
        inviter: "Mario Rossi",
        amountCents: 4500,
        invoiceHint: "INCASSO RICEVUTO: € 45,00 (pagato direttamente dall'utente via carta)",
        vatNote: "Emettere normale scontrino/corrispettivo fiscale all'ospite.",
        impact: "Assegnato +1 Punto Impatto a Mario Rossi",
        transactionId: insertedTx[0].id,
      },
      read: false,
      createdAt: new Date("2026-04-04T19:12:00Z"),
    },
  ]);

  await db.insert(shares).values({
    userId: mario.id,
    venueId: laValle.id,
    caption:
      "Questo soggiorno ha sostenuto l'economia agricola locale del 15% — Certificato da RADICI. #RadiciWelfare #ImpattoSociale #Marche #KM0",
    createdAt: new Date("2026-03-13T09:00:00Z"),
  });

  await db.insert(certificates).values([
    {
      userId: mario.id,
      type: "economic",
      title: "Capitale ridistribuito sul territorio",
      description:
        "Attesta il valore economico lasciato a strutture agricole e culturali grazie ai consumi welfare e al referral degli amici.",
      impactValue: "65,00",
      unitLabel: "euro netti sul territorio",
    },
    {
      userId: mario.id,
      type: "co2",
      title: "CO₂ evitata con filiera corta",
      description:
        "Stima della CO₂ non emessa scegliendo prodotti KM 0 e soggiorni in strutture agricole rispetto a una filiera extra-regionale.",
      impactValue: "18,4",
      unitLabel: "kg di CO₂eq evitati",
    },
  ]);

  // Prenotazioni dimostrative per l'Ospite Community (Luigi Bianchi)
  await db.insert(bookings).values([
    {
      userId: luigi.id,
      venueId: osteriaTiglio.id, // Osteria del Tiglio
      bookingType: "dinner",
      bookingDate: "2026-11-21",
      timeSlot: "20:30",
      partySize: 2,
      discountPercent: 10,
      totalAmountCents: 6000,
      discountCents: 600,
      finalPriceCents: 5400,
      status: "presence_confirmed",
      confirmationToken: "bkg-luigi-cena-001",
      guestName: "Luigi Bianchi",
      guestEmail: "luigi.bianchi@email.it",
      guestPhone: "+39 333 4455667",
      notes: "Tavolo all'aperto se possibile. Arrivo previsto per le 20:30.",
    },
    {
      userId: luigi.id,
      venueId: teatroLauro.id,
      grantEventId: insertedGrantEvents[0].id, // Spettacolo Teatro Lauro Rossi
      bookingType: "theater_event",
      bookingDate: "2026-11-28",
      timeSlot: "21:00",
      partySize: 2,
      discountPercent: 10,
      totalAmountCents: 5000,
      discountCents: 500,
      finalPriceCents: 4500,
      status: "confirmed",
      confirmationToken: "bkg-luigi-teatro-002",
      guestName: "Luigi Bianchi",
      guestEmail: "luigi.bianchi@email.it",
      guestPhone: "+39 333 4455667",
      notes: "Due posti vicini.",
    },
    // Ordini Filiera Corta KM 0 (12 ordini attivi + 1 annullato = 13 ordini)
    // Dimostrazione reale Business Rule 10:1: 10 cesti acquistati dal Frantoio maturano 1 cesto omaggio agli addetti ACME,
    // più 1 ulteriore acquisto che avvia il contatore verso il secondo omaggio (1/10).
    {
      userId: mario.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-01",
      timeSlot: "11:00",
      partySize: 2,
      discountPercent: 0,
      totalAmountCents: 7600,
      discountCents: 0,
      finalPriceCents: 7600,
      status: "presence_confirmed",
      confirmationToken: "bkg-mario-cesto-001",
      guestName: "Mario Rossi",
      guestEmail: "mario.rossi@acme.it",
      guestPhone: "+39 333 1122334",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: luigi.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-03",
      timeSlot: "10:30",
      partySize: 1,
      discountPercent: 10,
      totalAmountCents: 3800,
      discountCents: 380,
      finalPriceCents: 3420,
      status: "attended",
      confirmationToken: "bkg-luigi-cesto-002",
      guestName: "Luigi Bianchi",
      guestEmail: "luigi.bianchi@email.it",
      guestPhone: "+39 333 4455667",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: giulia.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-05",
      timeSlot: "12:00",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "attended",
      confirmationToken: "bkg-giulia-cesto-003",
      guestName: "Giulia Verdi",
      guestEmail: "giulia.verdi@acme.it",
      guestPhone: "+39 334 5566778",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: davide.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-06",
      timeSlot: "16:00",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "attended",
      confirmationToken: "bkg-davide-cesto-004",
      guestName: "Davide Ferri",
      guestEmail: "davide.ferri@acme.it",
      guestPhone: "+39 331 8899001",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: elenaMartini.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-08",
      timeSlot: "11:30",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "attended",
      confirmationToken: "bkg-elena-cesto-005",
      guestName: "Elena Martini",
      guestEmail: "elena.martini@acme.it",
      guestPhone: "+39 335 1234567",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: luigi.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-10",
      timeSlot: "14:30",
      partySize: 1,
      discountPercent: 10,
      totalAmountCents: 3800,
      discountCents: 380,
      finalPriceCents: 3420,
      status: "attended",
      confirmationToken: "bkg-luigi-cesto-006",
      guestName: "Luigi Bianchi",
      guestEmail: "luigi.bianchi@email.it",
      guestPhone: "+39 333 4455667",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: giulia.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-12",
      timeSlot: "10:00",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "attended",
      confirmationToken: "bkg-giulia-cesto-007",
      guestName: "Giulia Verdi",
      guestEmail: "giulia.verdi@acme.it",
      guestPhone: "+39 334 5566778",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: davide.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-14",
      timeSlot: "17:30",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "attended",
      confirmationToken: "bkg-davide-cesto-008",
      guestName: "Davide Ferri",
      guestEmail: "davide.ferri@acme.it",
      guestPhone: "+39 331 8899001",
      notes: "ritiro in sede aziendale",
    },
    {
      userId: mario.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-15",
      timeSlot: "11:00",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 3800,
      discountCents: 0,
      finalPriceCents: 3800,
      status: "presence_confirmed",
      confirmationToken: "bkg-mario-cesto-009",
      guestName: "Mario Rossi",
      guestEmail: "mario.rossi@acme.it",
      guestPhone: "+39 333 1122334",
      notes: "ritiro in sede aziendale",
    },
    // Raggiunti 10 cesti venduti -> Maturato 1° Cesto Omaggio 10:1 consegnato in azienda ad ACME
    {
      userId: mario.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-16",
      timeSlot: "11:30",
      partySize: 1,
      discountPercent: 100,
      totalAmountCents: 3800,
      discountCents: 3800,
      finalPriceCents: 0,
      isFreeGift: true,
      giftRecipientCompanyId: acme.id,
      status: "attended",
      confirmationToken: "bkg-acme-gift-cesto-010",
      guestName: "Mario Rossi",
      guestEmail: "mario.rossi@acme.it",
      guestPhone: "+39 333 1122334",
      notes: "ritiro in sede aziendale",
    },
    // 11° cesto acquistato: avvia il nuovo ciclo per il secondo omaggio (1/10)
    {
      userId: luigi.id,
      venueId: frantoioConero.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-18",
      timeSlot: "15:00",
      partySize: 1,
      discountPercent: 10,
      totalAmountCents: 3800,
      discountCents: 380,
      finalPriceCents: 3420,
      status: "confirmed",
      confirmationToken: "bkg-luigi-cesto-011",
      guestName: "Luigi Bianchi",
      guestEmail: "luigi.bianchi@email.it",
      guestPhone: "+39 333 4455667",
      notes: "ritiro in sede aziendale",
    },
    // Ordine Verde Energia al Caseificio Bio
    {
      userId: sofia.id,
      venueId: caseificioSibillini.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-12",
      timeSlot: "16:30",
      partySize: 1,
      discountPercent: 0,
      totalAmountCents: 4200,
      discountCents: 0,
      finalPriceCents: 4200,
      status: "attended",
      confirmationToken: "bkg-sofia-cesto-012",
      guestName: "Sofia Neri",
      guestEmail: "sofia.neri@verdeenergia.it",
      guestPhone: "+39 338 2233445",
      notes: "ritiro in sede aziendale",
    },
    // Ordine annullato da Francesca Romani (0€ addebito)
    {
      userId: francesca.id,
      venueId: caseificioSibillini.id,
      bookingType: "local_basket",
      bookingDate: "2026-11-20",
      timeSlot: "15:00",
      partySize: 1,
      discountPercent: 10,
      totalAmountCents: 4200,
      discountCents: 420,
      finalPriceCents: 3780,
      status: "cancelled",
      confirmationToken: "bkg-francesca-cesto-013",
      guestName: "Francesca Romani",
      guestEmail: "francesca.romani@email.it",
      guestPhone: "+39 339 9988776",
      notes: "ritiro in sede aziendale",
    },
  ]);
}