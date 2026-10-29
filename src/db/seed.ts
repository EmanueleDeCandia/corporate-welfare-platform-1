import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  certificates,
  companies,
  destinations,
  grantConfirmations,
  grantEvents,
  grantSeats,
  invites,
  matchingGrants,
  notifications,
  shares,
  transactions,
  users,
  venueOfferings,
  venues,
  voucherSelections,
  vouchers,
  welfarePlans,
} from "@/db/schema";
import { badgeForPoints, hashPassword, randomCode } from "@/lib/utils";
import { issueBaseVouchers } from "@/lib/welfare";

const DEMO_PASSWORD = hashPassword("radici2026");

let seedPromise: Promise<void> | null = null;

export function resetSeedCache() {
  seedPromise = null;
}

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

async function seedDatabase() {
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
        fundedAmountCents: 750000,
        impactRating: 94,
        localRedistributionCents: 5000,
        co2SavedKg: 18420,
        description:
          "ACME finanzia un piano welfare territoriale: 1 pernottamento (50 €) e 1 cena KM 0 (25 €) per ogni addetto. Il budget è virtuale fino alla selezione del dipendente.",
        accent: "#1C3A2E",
      },
      {
        name: "Verde Energia Italia",
        slug: "verde-energia",
        vatNumber: "01877654321",
        city: "Bologna",
        sector: "Energie rinnovabili",
        employeesCount: 260,
        fundedAmountCents: 1950000,
        impactRating: 88,
        localRedistributionCents: 0,
        co2SavedKg: 22100,
        description:
          "Utility rinnovabile che converte parte del premio di risultato in soggiorni e cene nei territori degli impianti agrivoltaici.",
        accent: "#3F6B4A",
      },
      {
        name: "Banca Adriatica",
        slug: "banca-adriatica",
        vatNumber: "00445566778",
        city: "Pesaro",
        sector: "Credito cooperativo",
        employeesCount: 710,
        fundedAmountCents: 5325000,
        impactRating: 91,
        localRedistributionCents: 0,
        co2SavedKg: 15640,
        description:
          "Istituto di credito di prossimità. Il piano welfare privilegia agriturismi e teatri storici dell'Adriatico.",
        accent: "#7A2E32",
      },
      {
        name: "Filatura dei Sibillini",
        slug: "filatura-sibillini",
        vatNumber: "01990011223",
        city: "Macerata",
        sector: "Tessile artigianale",
        employeesCount: 95,
        fundedAmountCents: 712500,
        impactRating: 86,
        localRedistributionCents: 0,
        co2SavedKg: 4310,
        description:
          "Manifattura laniera che usa il welfare RADICI per far vivere ai dipendenti le filiere agricole da cui acquista lana e tinture vegetali.",
        accent: "#8A5A2B",
      },
      {
        name: "Adriatica Tech",
        slug: "adriatica-tech",
        vatNumber: "02771122334",
        city: "Milano",
        sector: "Software e dati",
        employeesCount: 180,
        fundedAmountCents: 1350000,
        impactRating: 79,
        localRedistributionCents: 0,
        co2SavedKg: 6120,
        description:
          "Scale-up che ha sostituito i buoni spesa generici con un circuito territoriale su hotel e masserie partner.",
        accent: "#245C6E",
      },
    ])
    .returning();

  const acme = insertedCompanies[0];
  const verde = insertedCompanies[1];

  const insertedDestinations = await db
    .insert(destinations)
    .values([
      {
        name: "Colline Maceratesi",
        slug: "marche",
        region: "Marche",
        tagline: "L'entroterra gentile tra Sibillini e Adriatico",
        description:
          "Casali in pietra, teatri storici e campagne che sanno di visciola e olio. Il cuore operativo del circuito RADICI.",
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
          "Patrimonio UNESCO di Barolo e Barbaresco. Relais e cantine partner accolgono i dipendenti con camere sui filari.",
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
          "Il paesaggio iconico della Toscana rurale. I poderi convenzionati offrono pernottamenti in camere padronali e cene con pecorino e olio nuovo.",
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
          "Masserie fortificate e trulli immersi negli uliveti. Turismo lento fatto di olio, pittule e notti calde.",
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
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
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
        email: "luca.bianchi@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Luca",
        lastName: "Bianchi",
        role: "employee",
        companyId: acme.id,
        impactPoints: 1,
        badgeLevel: badgeForPoints(1).label,
        referralCode: "luca-bianchi",
      },
      {
        email: "anna.greco@acme.it",
        passwordHash: DEMO_PASSWORD,
        firstName: "Anna",
        lastName: "Greco",
        role: "employee",
        companyId: acme.id,
        impactPoints: 2,
        badgeLevel: badgeForPoints(2).label,
        referralCode: "anna-greco",
      },
    ])
    .returning();

  const mario = insertedUsers[1];
  const giulia = insertedUsers[2];
  const sofia = insertedUsers[3];
  const luigi = insertedUsers[4];
  const elena = insertedUsers[5];
  const marco = insertedUsers[6];
  const chiara = insertedUsers[7];
  const paolo = insertedUsers[8];
  const luca = insertedUsers[10];
  const anna = insertedUsers[11];

  await db.update(users).set({ invitedByUserId: mario.id }).where(eq(users.id, luigi.id));

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
          "Casale in pietra sulle colline maceratesi. Pernottamento in camera matrimoniale e cena degustazione con prodotti a KM 0.",
        longDescription:
          "La Valle è una tenuta a conduzione familiare a pochi minuti da Macerata. Le camere padronali guardano i Sibillini, l'orto fornisce la cena e l'olio è spremuto nel frantoio aziendale.",
        lat: 43.287,
        lng: 13.421,
        coverImage: "/images/agriturismo-valle.jpg",
        gallery: [
          "/images/agriturismo-valle.jpg",
          "/images/camera.jpg",
          "/images/aperitivo.jpg",
          "/images/ulivi.jpg",
        ],
        services: [
          "Pernottamento in Camera Matrimoniale",
          "Cena Degustazione KM 0",
          "Colazione con uova e miele aziendali",
          "Visita all'orto e al frantoio",
        ],
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
        description: "Relais tra i filari di nebbiolo. Camere con vista vigneto e cena di formaggi d'alpeggio.",
        longDescription:
          "Un'antica cascina nobiliare trasformata in relais di charme. Il circuito welfare copre la camera superior e una cena in cantina con toma, castelmagno e nocciole delle Langhe.",
        lat: 44.611,
        lng: 7.943,
        coverImage: "/images/langhe.jpg",
        gallery: ["/images/langhe.jpg", "/images/hotel-villa.jpg", "/images/vigne.jpg", "/images/camera.jpg"],
        services: ["Pernottamento in Superior Vigneto", "Cena in cantina", "Degustazione di tre nebbioli"],
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
        description: "Podere sulle crete senesi con camere padronali e cena di pecorino di Pienza.",
        longDescription:
          "Fontebella è un podere del Settecento nel cuore della Val d'Orcia. Cena convenzionata con pecorino di fossa, olio nuovo e un calice di rosso di Montalcino.",
        lat: 43.078,
        lng: 11.678,
        coverImage: "/images/val-dorcia.jpg",
        gallery: ["/images/val-dorcia.jpg", "/images/pienza.jpg", "/images/cipressi.jpg", "/images/camera.jpg"],
        services: ["Pernottamento in camera padronale", "Cena di pecorino e olio nuovo"],
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
        description: "Masseria bianca tra gli ulivi secolari. Suite in pietra e cena di pittule e olio extravergine.",
        longDescription:
          "Le Grazie è una masseria fortificata del XVI secolo. Il voucher RADICI copre la suite e una cena di pittule, bombette e verdure di campo.",
        lat: 40.728,
        lng: 17.577,
        coverImage: "/images/masseria-salento.jpg",
        gallery: ["/images/masseria-salento.jpg", "/images/piscina.jpg", "/images/ulivi.jpg", "/images/camera.jpg"],
        services: ["Pernottamento in suite in pietra", "Cena di pittule e olio EVO"],
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
          "Teatro all'italiana del 1769. Ospita gli eventi del Matching Grant Promotori per chi seleziona il pernottamento.",
        longDescription:
          "Uno dei teatri storici più eleganti delle Marche. I posti del Matching Grant (2 persone, 25 € + 25 €) si confermano a T-7 e si convalidano in botteghino.",
        lat: 43.3008,
        lng: 13.4539,
        coverImage: "/images/lauro-rossi.jpg",
        gallery: ["/images/lauro-rossi.jpg", "/images/teatro.jpg"],
        services: ["Posto in platea", "Programma di sala", "Incontro con gli artisti"],
        checkinCode: "venue-lauro-rossi",
        providerUserId: paolo.id,
        sponsorCompanyId: acme.id,
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
        description: "Osteria di campagna sotto un tiglio centenario. Solo cena KM 0, niente pernottamento.",
        longDescription:
          "Un'unica sala, un camino e un menù che cambia con l'orto. Accetta i voucher cena welfare e i pagamenti consumer degli amici invitati.",
        lat: 43.403,
        lng: 13.549,
        coverImage: "/images/tavola.jpg",
        gallery: ["/images/tavola.jpg", "/images/aperitivo.jpg", "/images/ulivi.jpg"],
        services: ["Cena KM 0", "Cucina di territorio", "Tavoli sotto il tiglio"],
        checkinCode: "venue-tiglio",
        impactPointsGenerated: 1,
        localSupportPercent: 22,
      },
      {
        name: "Palazzo dei Colli",
        slug: "palazzo-dei-colli",
        type: "hotel",
        destinationId: marche.id,
        city: "Urbino",
        province: "PU",
        region: "Marche",
        description: "Palazzo rinascimentale nel centro di Urbino. Solo pernottamento: le cene si fanno in città.",
        longDescription:
          "Un piccolo hotel di charme ricavato da un palazzo gentilizio. Accetta il voucher pernottamento, senza offerta cena in struttura.",
        lat: 43.726,
        lng: 12.636,
        coverImage: "/images/hotel-villa.jpg",
        gallery: ["/images/hotel-villa.jpg", "/images/camera.jpg", "/images/aperitivo.jpg"],
        services: ["Camera affrescata", "Colazione ducale"],
        checkinCode: "venue-palazzo-colli",
        impactPointsGenerated: 1,
        localSupportPercent: 11,
      },
      {
        name: "Tenuta San Felice",
        slug: "tenuta-san-felice",
        type: "agriturismo",
        destinationId: orcia.id,
        city: "Montalcino",
        province: "SI",
        region: "Toscana",
        description: "Tenuta sul confine della Val d'Orcia. Camere sul grano e cena al tramonto.",
        longDescription:
          "Una tenuta agricola ancora produttiva: grano, olio e un piccolo brunello aziendale. Il soggiorno welfare include camera e cena al tramonto sui campi.",
        lat: 43.058,
        lng: 11.489,
        coverImage: "/images/pienza.jpg",
        gallery: ["/images/pienza.jpg", "/images/hero.jpg", "/images/vigne.jpg"],
        services: ["Pernottamento sul grano", "Cena al tramonto", "Visita in cantina"],
        checkinCode: "venue-san-felice",
        impactPointsGenerated: 1,
        localSupportPercent: 17,
      },
      {
        name: "Teatro delle Muse",
        slug: "teatro-delle-muse",
        type: "theater",
        destinationId: marche.id,
        city: "Ancona",
        province: "AN",
        region: "Marche",
        description: "Il grande teatro adriatico. Concerti e prosa del Matching Grant Promotori.",
        longDescription:
          "Tempio della cultura adriatica. I posti omaggio si prenotano dopo la selezione del pernottamento, nei limiti di capienza.",
        lat: 43.618,
        lng: 13.511,
        coverImage: "/images/teatro.jpg",
        gallery: ["/images/teatro.jpg"],
        services: ["Posto in galleria o platea", "Incontro in foyer"],
        checkinCode: "venue-muse",
        impactPointsGenerated: 1,
        localSupportPercent: 14,
      },
      {
        name: "Corte degli Ulivi",
        slug: "corte-degli-ulivi",
        type: "restaurant",
        destinationId: salento.id,
        city: "Lecce",
        province: "LE",
        region: "Puglia",
        description: "Taverna in una corte barocca. Solo cena: crudi e verdure grigliate.",
        longDescription:
          "Una corte nascosta nel barocco leccese. Accetta voucher cena e pagamenti consumer con sconto community.",
        lat: 40.352,
        lng: 18.175,
        coverImage: "/images/aperitivo.jpg",
        gallery: ["/images/aperitivo.jpg", "/images/tavola.jpg", "/images/ulivi.jpg"],
        services: ["Cena in corte", "Cucina salentina", "Vini naturali del Salento"],
        checkinCode: "venue-corte-ulivi",
        impactPointsGenerated: 1,
        localSupportPercent: 19,
      },
      {
        name: "Teatro dell'Aquila",
        slug: "teatro-dell-aquila",
        type: "theater",
        destinationId: marche.id,
        city: "Fermo",
        province: "FM",
        region: "Marche",
        description: "Teatro storico di Fermo. Rassegna di prosa nel circuito Matching Grant.",
        longDescription: "Sipario storico e platea per gli omaggi culturali dei promotori RADICI.",
        lat: 43.1607,
        lng: 13.7185,
        coverImage: "/images/teatro.jpg",
        gallery: ["/images/teatro.jpg"],
        services: ["Posto in platea", "Visita al sipario storico"],
        checkinCode: "venue-aquila",
        impactPointsGenerated: 1,
        localSupportPercent: 16,
      },
    ])
    .returning();

  const laValle = insertedVenues[0];
  const langheOro = insertedVenues[1];
  const fontebella = insertedVenues[2];
  const leGrazie = insertedVenues[3];
  const teatroLauro = insertedVenues[4];
  const tiglio = insertedVenues[5];
  const palazzoColli = insertedVenues[6];
  const sanFelice = insertedVenues[7];
  const teatroMuse = insertedVenues[8];
  const corteUlivi = insertedVenues[9];
  const teatroAquila = insertedVenues[10];

  await db.update(users).set({ venueId: laValle.id }).where(eq(users.id, elena.id));
  await db.update(users).set({ venueId: langheOro.id }).where(eq(users.id, marco.id));
  await db.update(users).set({ venueId: leGrazie.id }).where(eq(users.id, chiara.id));
  await db.update(users).set({ venueId: teatroLauro.id }).where(eq(users.id, paolo.id));

  await db.insert(venueOfferings).values([
    { venueId: laValle.id, benefitType: "overnight", name: "Camera Matrimoniale dei Cipressi", description: "Letto in ferro battuto, travi a vista e finestra sulla valle.", listPriceCents: 5000, acceptsWelfare: true, dailyCapacity: 4 },
    { venueId: laValle.id, benefitType: "overnight", name: "Suite dell'Olivo", description: "Soggiorno indipendente, vasca in pietra e terrazzo privato.", listPriceCents: 7800, acceptsWelfare: false, dailyCapacity: 1 },
    { venueId: laValle.id, benefitType: "dinner", name: "Tagliere dei Sibillini", description: "Ciauscolo, pecorino di fossa, miele di sulla e bruschette all'olio nuovo.", listPriceCents: 2500, acceptsWelfare: true, dailyCapacity: 20 },
    { venueId: laValle.id, benefitType: "dinner", name: "Orto in un boccone", description: "Flan di bietole, stracciatella e pomodoro secco del recanatese.", listPriceCents: 900, acceptsWelfare: false },
    { venueId: langheOro.id, benefitType: "overnight", name: "Superior Vigneto", description: "Vista filari, lino locale e vasca profonda.", listPriceCents: 9000, acceptsWelfare: true, dailyCapacity: 6 },
    { venueId: langheOro.id, benefitType: "dinner", name: "Gran tagliere langarolo", description: "Castelmagno, toma, salame di Patrì e pane alle nocciole.", listPriceCents: 2800, acceptsWelfare: true, dailyCapacity: 24 },
    { venueId: fontebella.id, benefitType: "overnight", name: "Camera delle Crete", description: "Vista Val d'Orcia, caminetto e lino lavato.", listPriceCents: 8500, acceptsWelfare: true, dailyCapacity: 4 },
    { venueId: fontebella.id, benefitType: "dinner", name: "Pecorai di Pienza", description: "Tre stagionature, miele di acacia e pere coscia.", listPriceCents: 2400, acceptsWelfare: true, dailyCapacity: 16 },
    { venueId: leGrazie.id, benefitType: "overnight", name: "Suite della Corte", description: "Volte a stella, letto a baldacchino e patio privato.", listPriceCents: 11000, acceptsWelfare: true, dailyCapacity: 3 },
    { venueId: leGrazie.id, benefitType: "dinner", name: "Pittule e bombette", description: "Frittelle salentine, bombette di capocollo e verdure di campo.", listPriceCents: 2200, acceptsWelfare: true, dailyCapacity: 18 },
    { venueId: tiglio.id, benefitType: "dinner", name: "Aperitivo del Tiglio", description: "Olive, crescia, formaggi e un calice di pecorino marchigiano.", listPriceCents: 1800, acceptsWelfare: true, dailyCapacity: 30 },
    { venueId: palazzoColli.id, benefitType: "overnight", name: "Camera del Duca", description: "Affreschi originali e vista sui tetti di Urbino.", listPriceCents: 9500, acceptsWelfare: true, dailyCapacity: 5 },
    { venueId: sanFelice.id, benefitType: "overnight", name: "Camera del Granaio", description: "Soffitti alti, lino grezzo e luce del tramonto.", listPriceCents: 8000, acceptsWelfare: true, dailyCapacity: 4 },
    { venueId: sanFelice.id, benefitType: "dinner", name: "Tramonto sul grano", description: "Crostini toscani e rosso della tenuta.", listPriceCents: 2300, acceptsWelfare: true, dailyCapacity: 12 },
    { venueId: corteUlivi.id, benefitType: "dinner", name: "Aperitivo della Corte", description: "Puccia, polpo, cicorie e negroamaro fresco.", listPriceCents: 2000, acceptsWelfare: true, dailyCapacity: 22 },
  ]);

  const [acmePlan] = await db
    .insert(welfarePlans)
    .values({
      companyId: acme.id,
      year: 2026,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      eligibleEmployees: 100,
      overnightAmountCents: 5000,
      dinnerAmountCents: 2500,
      status: "active",
    })
    .returning();
  const [verdePlan] = await db
    .insert(welfarePlans)
    .values({
      companyId: verde.id,
      year: 2026,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      eligibleEmployees: 260,
      overnightAmountCents: 5000,
      dinnerAmountCents: 2500,
      status: "active",
    })
    .returning();

  for (const emp of [mario, giulia, luca, anna]) {
    issueBaseVouchers(acmePlan.id, emp.id, acme.id);
  }
  issueBaseVouchers(verdePlan.id, sofia.id, verde.id);

  const allVouchers = await db.select().from(vouchers);
  const marioOvernight = allVouchers.find((v) => v.userId === mario.id && v.benefitType === "overnight")!;
  const annaOvernight = allVouchers.find((v) => v.userId === anna.id && v.benefitType === "overnight")!;
  const lucaDinner = allVouchers.find((v) => v.userId === luca.id && v.benefitType === "dinner")!;
  const offerings = await db.select().from(venueOfferings);
  const valleRoom = offerings.find((o) => o.venueId === laValle.id && o.benefitType === "overnight" && o.acceptsWelfare)!;
  const valleDinner = offerings.find((o) => o.venueId === laValle.id && o.benefitType === "dinner" && o.acceptsWelfare)!;
  const tiglioDinner = offerings.find((o) => o.venueId === tiglio.id && o.benefitType === "dinner")!;
  const palazzoRoom = offerings.find((o) => o.venueId === palazzoColli.id && o.benefitType === "overnight")!;

  const marioSelectedAt = new Date("2026-10-20T10:00:00Z");
  await db.update(vouchers).set({ status: "selected" }).where(eq(vouchers.id, marioOvernight.id));
  const [marioSel] = await db
    .insert(voucherSelections)
    .values({
      voucherId: marioOvernight.id,
      venueId: laValle.id,
      offeringId: valleRoom.id,
      serviceDate: "2026-10-29",
      selectedAt: marioSelectedAt,
      attendanceStatus: "pending",
      qrToken: "sel-mario-valle",
    })
    .returning();
  const [marioTx] = await db
    .insert(transactions)
    .values({
      kind: "welfare_charge",
      status: "confirmed",
      userId: mario.id,
      venueId: laValle.id,
      companyId: acme.id,
      voucherId: marioOvernight.id,
      selectionId: marioSel.id,
      offeringId: valleRoom.id,
      amountCents: 5000,
      discountCents: 0,
      listPriceCents: 5000,
      serviceLabel: "Pernottamento · Camera Matrimoniale dei Cipressi",
      idempotencyKey: `welfare:${marioOvernight.id}`,
      createdAt: marioSelectedAt,
    })
    .returning();

  await db.update(vouchers).set({ status: "selected" }).where(eq(vouchers.id, annaOvernight.id));
  const annaSelectedAt = new Date("2026-10-22T09:00:00Z");
  const [annaSel] = await db
    .insert(voucherSelections)
    .values({
      voucherId: annaOvernight.id,
      venueId: palazzoColli.id,
      offeringId: palazzoRoom.id,
      serviceDate: "2026-11-20",
      selectedAt: annaSelectedAt,
      attendanceStatus: "pending",
      qrToken: "sel-anna-colli",
    })
    .returning();
  await db.insert(transactions).values({
    kind: "welfare_charge",
    status: "confirmed",
    userId: anna.id,
    venueId: palazzoColli.id,
    companyId: acme.id,
    voucherId: annaOvernight.id,
    selectionId: annaSel.id,
    offeringId: palazzoRoom.id,
    amountCents: 5000,
    discountCents: 0,
    listPriceCents: 5000,
    serviceLabel: "Pernottamento · Camera del Duca",
    idempotencyKey: `welfare:${annaOvernight.id}`,
    createdAt: annaSelectedAt,
  });

  await db.update(vouchers).set({ status: "selected" }).where(eq(vouchers.id, lucaDinner.id));
  const lucaSelectedAt = new Date("2026-10-18T19:00:00Z");
  const [lucaSel] = await db
    .insert(voucherSelections)
    .values({
      voucherId: lucaDinner.id,
      venueId: tiglio.id,
      offeringId: tiglioDinner.id,
      serviceDate: "2026-11-02",
      selectedAt: lucaSelectedAt,
      attendanceStatus: "pending",
      qrToken: "sel-luca-tiglio",
    })
    .returning();
  await db.insert(transactions).values({
    kind: "welfare_charge",
    status: "confirmed",
    userId: luca.id,
    venueId: tiglio.id,
    companyId: acme.id,
    voucherId: lucaDinner.id,
    selectionId: lucaSel.id,
    offeringId: tiglioDinner.id,
    amountCents: 2500,
    discountCents: 0,
    listPriceCents: 2500,
    serviceLabel: "Cena KM 0 · Aperitivo del Tiglio",
    idempotencyKey: `welfare:${lucaDinner.id}`,
    createdAt: lucaSelectedAt,
  });

  const insertedGrantEvents = await db
    .insert(grantEvents)
    .values([
      {
        title: "Stagione di Prosa e Visita Esclusiva nel Ridotto",
        category: "teatro",
        venueId: teatroLauro.id,
        description: "Posti riservati per 2 persone nel teatro barocco all'italiana, con introduzione alla stagione e incontro con gli attori.",
        startsAt: new Date("2026-11-05T20:30:00Z"),
        capacity: 40,
        perPersonCents: 2500,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Concerto Sinfonico e Percorso nel Foyer delle Muse",
        category: "musica",
        venueId: teatroMuse.id,
        description: "2 biglietti per la rassegna concertistica serale con brindisi e incontro nel foyer con i musicisti.",
        startsAt: new Date("2026-11-22T21:00:00Z"),
        capacity: 30,
        perPersonCents: 2500,
        artistMeetupIncluded: true,
        active: true,
      },
      {
        title: "Rassegna Teatrale Storica e Incontro con la Compagnia",
        category: "teatro",
        venueId: teatroAquila.id,
        description: "2 ingressi di platea per lo spettacolo di prosa con visita al sipario storico.",
        startsAt: new Date("2026-12-06T20:00:00Z"),
        capacity: 24,
        perPersonCents: 2500,
        artistMeetupIncluded: true,
        active: true,
      },
    ])
    .returning();

  const defaultGrantEvent = insertedGrantEvents[0];
  const [marioGrant] = await db
    .insert(matchingGrants)
    .values({
      voucherId: marioOvernight.id,
      eventId: defaultGrantEvent.id,
      amountCents: 5000,
      seatsRequested: 2,
      status: "confirmation_sent",
      assignedAt: marioSelectedAt,
      qrToken: "grt-mario-lauro",
    })
    .returning();
  await db.insert(grantSeats).values([
    {
      matchingGrantId: marioGrant.id,
      holderRole: "employee",
      holderName: "Mario Rossi",
      holderEmail: mario.email,
      valueCents: 2500,
    },
    {
      matchingGrantId: marioGrant.id,
      holderRole: "companion",
      holderName: "Luigi Bianchi",
      holderEmail: luigi.email,
      valueCents: 2500,
    },
  ]);
  await db.insert(grantConfirmations).values({
    matchingGrantId: marioGrant.id,
    token: "cnf-mario-lauro",
    scheduledFor: new Date("2026-10-29T08:00:00Z"),
    respondBy: new Date("2026-11-02T23:59:00Z"),
    sentAt: new Date("2026-10-29T08:05:00Z"),
    channel: "email",
    deliveryStatus: "logged",
    reminderCount: 0,
  });

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
        acceptedAt: new Date("2026-03-20T10:00:00Z"),
        createdAt: new Date("2026-03-20T10:00:00Z"),
      },
      {
        inviterId: mario.id,
        firstName: "Sara",
        lastName: "Gentili",
        email: "sara.gentili@email.it",
        code: "ref-sara-gentili",
        status: "pending",
        expiresAt: new Date("2026-12-31T23:59:00Z"),
        createdAt: new Date("2026-10-02T09:15:00Z"),
      },
    ])
    .returning();

  const luigiInvite = insertedInvites[0];
  const [friendTx] = await db
    .insert(transactions)
    .values({
      kind: "consumer_payment",
      status: "receipted",
      userId: luigi.id,
      venueId: laValle.id,
      inviteId: luigiInvite.id,
      offeringId: valleDinner.id,
      amountCents: 2250,
      discountCents: 250,
      listPriceCents: 2500,
      serviceLabel: "Cena amico · Tagliere dei Sibillini",
      createdAt: new Date("2026-04-04T19:12:00Z"),
    })
    .returning();

  await db.insert(notifications).values([
    {
      venueId: laValle.id,
      type: "welfare",
      title: "Selezione voucher: Pernottamento",
      body: 'Mario Rossi ha selezionato Pernottamento per il 2026-10-29. Fattura da emettere all\'azienda ACME S.p.A.',
      payload: {
        guest: "Mario Rossi",
        company: "ACME S.p.A.",
        vat: "01234567890",
        amountCents: 5000,
        serviceDate: "2026-10-29",
        invoiceHint: "EMETTI FATTURA DIRETTA A: Impresa Cliente ACME S.p.A. (P.IVA: 01234567890)",
        vatNote: "Importo da fatturare: € 50,00",
        transactionId: marioTx.id,
      },
      read: false,
      transactionId: marioTx.id,
      selectionId: marioSel.id,
      createdAt: marioSelectedAt,
    },
    {
      venueId: laValle.id,
      type: "referral",
      title: "Notifica referral / consumer",
      body: 'L\'utente amico "Luigi Bianchi" (invitato da Mario Rossi) ha concluso il saldo.',
      payload: {
        guest: "Luigi Bianchi",
        inviter: "Mario Rossi",
        amountCents: 2250,
        invoiceHint: "INCASSO RICEVUTO: € 22,50 (pagato direttamente dall'utente via carta)",
        vatNote: "Emettere normale scontrino/corrispettivo fiscale all'ospite.",
        impact: "Assegnato +1 Punto Impatto a Mario Rossi",
        transactionId: friendTx.id,
      },
      read: false,
      transactionId: friendTx.id,
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
      protocolNumber: "RD-ESG-001-2026",
      period: "2026",
      issuedBy: "Comitato ESG RADICI",
    },
    {
      userId: mario.id,
      type: "co2",
      title: "CO2 evitata con filiera corta",
      description:
        "Stima della CO2 non emessa scegliendo prodotti KM 0 e soggiorni in strutture agricole rispetto a una filiera extra-regionale.",
      impactValue: "18,4",
      unitLabel: "kg di CO2eq evitati",
      protocolNumber: "RD-ESG-002-2026",
      period: "2026",
      issuedBy: "Comitato ESG RADICI",
    },
  ]);
}
