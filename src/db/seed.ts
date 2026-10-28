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
      {
        name: "Banca Adriatica",
        slug: "banca-adriatica",
        vatNumber: "00445566778",
        city: "Pesaro",
        sector: "Credito cooperativo",
        employeesCount: 710,
        fundedAmountCents: 24500000,
        impactRating: 91,
        localRedistributionCents: 17300000,
        co2SavedKg: 15640,
        description:
          "Istituto di credito di prossimità. Il piano welfare privilegia agriturismi e teatri storici dell'Adriatico per tenere il valore nei comuni interni.",
        accent: "#7A2E32",
      },
      {
        name: "Filatura dei Sibillini",
        slug: "filatura-sibillini",
        vatNumber: "01990011223",
        city: "Macerata",
        sector: "Tessile artigianale",
        employeesCount: 95,
        fundedAmountCents: 3200000,
        impactRating: 86,
        localRedistributionCents: 2480000,
        co2SavedKg: 4310,
        description:
          "Manifattura laniera che usa il welfare RADICI per far vivere ai dipendenti le stesse filiere agricole da cui acquista lana e tinture vegetali.",
        accent: "#8A5A2B",
      },
      {
        name: "Adriatica Tech",
        slug: "adriatica-tech",
        vatNumber: "02771122334",
        city: "Milano",
        sector: "Software e dati",
        employeesCount: 180,
        fundedAmountCents: 6400000,
        impactRating: 79,
        localRedistributionCents: 3900000,
        co2SavedKg: 6120,
        description:
          "Scale-up che ha sostituito i buoni spesa generici con un circuito pay-per-use su hotel e masserie partner, misurando l'impatto ESG trimestre per trimestre.",
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
        role: "provider",
        impactPoints: 0,
        badgeLevel: "Partner",
        referralCode: "paolo-luzi",
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

  await db
    .update(users)
    .set({ invitedByUserId: mario.id })
    .where(eq(users.id, luigi.id));

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
        coverImage: "/images/agriturismo-valle.jpg",
        gallery: [
          "/images/agriturismo-valle.jpg",
          "/images/camera.jpg",
          "/images/aperitivo.jpg",
          "/images/ulivi.jpg",
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
            name: "Camera Matrimoniale dei Cipressi",
            description: "Letto in ferro battuto, travi a vista e finestra sulla valle.",
            capacity: 2,
            priceCents: 5000,
          },
          {
            name: "Suite dell'Olivo",
            description: "Soggiorno indipendente, vasca in pietra e terrazzo privato.",
            capacity: 2,
            priceCents: 7800,
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
            name: "Superior Vigneto",
            description: "Vista filari, lino locale e vasca profonda.",
            capacity: 2,
            priceCents: 9000,
          },
        ],
        priceHotelCents: 9000,
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
        coverImage: "/images/val-dorcia.jpg",
        gallery: ["/images/val-dorcia.jpg", "/images/pienza.jpg", "/images/cipressi.jpg", "/images/camera.jpg"],
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
            name: "Camera delle Crete",
            description: "Vista Val d'Orcia, caminetto e lino lavato.",
            capacity: 2,
            priceCents: 8500,
          },
        ],
        priceHotelCents: 8500,
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
            name: "Suite della Corte",
            description: "Volte a stella, letto a baldacchino e patio privato.",
            capacity: 2,
            priceCents: 11000,
          },
        ],
        priceHotelCents: 11000,
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
          "Teatro all'italiana del 1769. I buoni spettacolo loyalty da 15€ aprono la stagione di prosa e opera.",
        longDescription:
          "Uno dei teatri storici più eleganti delle Marche. Il buono loyalty RADICI da 15€ è un omaggio aziendale distinto dal cassetto welfare: copre un posto in platea o l'integrazione su un abbonamento della stagione.",
        lat: 43.3008,
        lng: 13.4539,
        coverImage: "/images/lauro-rossi.jpg",
        gallery: ["/images/lauro-rossi.jpg", "/images/teatro.jpg"],
        services: ["Posto in platea", "Programma di sala", "Guardaroba incluso"],
        aperitivoMenu: [],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 0,
        priceShowCents: 1500,
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
        description:
          "Osteria di campagna sotto un tiglio centenario. Aperitivo e cucina di territorio per i voucher gusto.",
        longDescription:
          "Un'unica sala, un camino e un menù che cambia con l'orto. L'osteria accetta i voucher aperitivo welfare e i pagamenti consumer degli amici invitati, con micro-sconto di community.",
        lat: 43.403,
        lng: 13.549,
        coverImage: "/images/tavola.jpg",
        gallery: ["/images/tavola.jpg", "/images/aperitivo.jpg", "/images/ulivi.jpg"],
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
        name: "Palazzo dei Colli",
        slug: "palazzo-dei-colli",
        type: "hotel",
        destinationId: marche.id,
        city: "Urbino",
        province: "PU",
        region: "Marche",
        description:
          "Palazzo rinascimentale nel centro di Urbino. Camere affrescate e aperitivo in corte.",
        longDescription:
          "Un piccolo hotel di charme ricavato da un palazzo gentilizio. Perfetto per i dipendenti che vogliono unire il voucher hotel a una visita al Palazzo Ducale.",
        lat: 43.726,
        lng: 12.636,
        coverImage: "/images/hotel-villa.jpg",
        gallery: ["/images/hotel-villa.jpg", "/images/camera.jpg", "/images/aperitivo.jpg"],
        services: ["Camera affrescata", "Aperitivo in corte", "Colazione ducale"],
        aperitivoMenu: [
          {
            name: "Aperitivo in corte",
            description: "Casciotta d'Urbino, crescia sfogliata e verdicchio",
            priceCents: 2000,
          },
        ],
        rooms: [
          {
            name: "Camera del Duca",
            description: "Affreschi originali e vista sui tetti di Urbino.",
            capacity: 2,
            priceCents: 9500,
          },
        ],
        priceHotelCents: 9500,
        priceAperitivoCents: 2000,
        priceShowCents: 0,
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
        description:
          "Tenuta sul confine della Val d'Orcia. Camere sul grano e calice di rosso della casa.",
        longDescription:
          "Una tenuta agricola ancora produttiva: grano, olio e un piccolo brunello aziendale. Il soggiorno welfare include la camera e un aperitivo al tramonto sui campi.",
        lat: 43.058,
        lng: 11.489,
        coverImage: "/images/pienza.jpg",
        gallery: ["/images/pienza.jpg", "/images/hero.jpg", "/images/vigne.jpg"],
        services: ["Pernottamento sul grano", "Aperitivo al tramonto", "Visita in cantina"],
        aperitivoMenu: [
          {
            name: "Tramonto sul grano",
            description: "Crostini toscani e rosso della tenuta",
            priceCents: 2300,
          },
        ],
        rooms: [
          {
            name: "Camera del Granaio",
            description: "Soffitti alti, lino grezzo e luce del tramonto.",
            capacity: 2,
            priceCents: 8000,
          },
        ],
        priceHotelCents: 8000,
        priceAperitivoCents: 2300,
        priceShowCents: 0,
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
        description:
          "Il grande teatro adriatico. I buoni loyalty da 15€ valgono su prosa, danza e concerti.",
        longDescription:
          "Tempio della cultura adriatica. I voucher spettacolo del cassetto omaggi RADICI si usano in biglietteria o via check-in QR il giorno dello spettacolo.",
        lat: 43.618,
        lng: 13.511,
        coverImage: "/images/teatro.jpg",
        gallery: ["/images/teatro.jpg"],
        services: ["Posto in galleria o platea", "Integrazione su abbonamento"],
        aperitivoMenu: [],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 0,
        priceShowCents: 1500,
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
        description:
          "Taverna in una corte barocca. Aperitivo di crudi e verdure grigliate per gli amici del circuito.",
        longDescription:
          "Una corte nascosta nel barocco leccese. Accetta voucher aperitivo e pagamenti consumer con sconto community, perfetta per il ciclo referral pay-local.",
        lat: 40.352,
        lng: 18.175,
        coverImage: "/images/aperitivo.jpg",
        gallery: ["/images/aperitivo.jpg", "/images/tavola.jpg", "/images/ulivi.jpg"],
        services: ["Aperitivo in corte", "Cucina salentina", "Vini naturali del Salento"],
        aperitivoMenu: [
          {
            name: "Aperitivo della Corte",
            description: "Puccia, polpo, cicorie e negroamaro fresco",
            priceCents: 2000,
          },
        ],
        rooms: [],
        priceHotelCents: 0,
        priceAperitivoCents: 2000,
        priceShowCents: 0,
        checkinCode: "venue-corte-ulivi",
        impactPointsGenerated: 1,
        localSupportPercent: 19,
      },
    ])
    .returning();

  const laValle = insertedVenues[0];
  const teatroLauro = insertedVenues[4];

  await db.update(users).set({ venueId: laValle.id }).where(eq(users.id, elena.id));
  await db.update(users).set({ venueId: insertedVenues[1].id }).where(eq(users.id, marco.id));
  await db.update(users).set({ venueId: insertedVenues[3].id }).where(eq(users.id, chiara.id));
  await db.update(users).set({ venueId: teatroLauro.id }).where(eq(users.id, paolo.id));

  const employeeSeeds = [
    { user: mario, companyId: acme.id, hotelRedeemed: true, theaterRedeemed: false },
    { user: giulia, companyId: acme.id, hotelRedeemed: false, theaterRedeemed: false },
    { user: sofia, companyId: verde.id, hotelRedeemed: false, theaterRedeemed: false },
  ];

  for (const employee of employeeSeeds) {
    const hotelAmount = 5000;
    const aperitivoAmount = 2500;
    const theaterAmount = 1500;
    const hotelVouchers = [1, 2, 3, 4].map((slot) => ({
      userId: employee.user.id,
      companyId: employee.companyId,
      type: "hotel" as const,
      status:
        employee.hotelRedeemed && slot === 1 ? ("redeemed" as const) : ("available" as const),
      slotIndex: slot,
      amountCents: hotelAmount,
      venueId: employee.hotelRedeemed && slot === 1 ? laValle.id : null,
      redeemedAt: employee.hotelRedeemed && slot === 1 ? new Date("2026-03-12T18:40:00Z") : null,
    }));
    const aperitivoVouchers = [1, 2, 3, 4].map((slot) => ({
      userId: employee.user.id,
      companyId: employee.companyId,
      type: "aperitivo" as const,
      status: "available" as const,
      slotIndex: slot,
      amountCents: aperitivoAmount,
    }));
    const theaterVouchers = [1, 2].map((slot) => ({
      userId: employee.user.id,
      companyId: employee.companyId,
      type: "theater" as const,
      status:
        employee.theaterRedeemed && slot === 1 ? ("redeemed" as const) : ("available" as const),
      slotIndex: slot,
      amountCents: theaterAmount,
      venueId: employee.theaterRedeemed && slot === 1 ? teatroLauro.id : null,
      redeemedAt: employee.theaterRedeemed && slot === 1 ? new Date("2026-02-20T20:00:00Z") : null,
    }));
    await db.insert(vouchers).values([...hotelVouchers, ...aperitivoVouchers, ...theaterVouchers]);
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
    ])
    .returning();

  const luigiInvite = insertedInvites[0];

  const insertedTx = await db
    .insert(transactions)
    .values([
      {
        type: "welfare_redeem",
        status: "completed",
        userId: mario.id,
        venueId: laValle.id,
        companyId: acme.id,
        voucherId: 1,
        amountCents: 5000,
        discountCents: 0,
        listPriceCents: 5000,
        serviceLabel: "Pernottamento in Camera Matrimoniale",
        createdAt: new Date("2026-03-12T18:40:00Z"),
      },
      {
        type: "welfare_redeem",
        status: "completed",
        userId: mario.id,
        venueId: teatroLauro.id,
        companyId: null,
        amountCents: 1500,
        discountCents: 0,
        listPriceCents: 1500,
        serviceLabel: "Buono Spettacolo · platea",
        createdAt: new Date("2026-02-20T20:00:00Z"),
      },
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
        createdAt: new Date("2026-04-04T19:12:00Z"),
      },
    ])
    .returning();

  await db.insert(notifications).values([
    {
      venueId: laValle.id,
      type: "welfare",
      title: "Notifica welfare · riscatto istantaneo",
      body: 'L\'utente dipendente "Mario Rossi" ha appena cliccato RISCATTA.',
      payload: {
        guest: "Mario Rossi",
        company: "ACME S.p.A.",
        vat: "01234567890",
        amountCents: 5000,
        invoiceHint: "EMETTI FATTURA DIRETTA A: Impresa Cliente ACME S.p.A. (P.IVA: 01234567890)",
        vatNote: "Importo da fatturare: € 50,00 (IVA 10% inclusa)",
        transactionId: insertedTx[0].id,
      },
      read: false,
      createdAt: new Date("2026-03-12T18:40:00Z"),
    },
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
        transactionId: insertedTx[2].id,
      },
      read: false,
      createdAt: new Date("2026-04-04T19:12:00Z"),
    },
    {
      venueId: teatroLauro.id,
      type: "welfare",
      title: "Buono spettacolo riscattato",
      body: 'Mario Rossi ha usato un omaggio loyalty da 15€ per la stagione di prosa.',
      payload: {
        guest: "Mario Rossi",
        company: "ACME S.p.A.",
        vat: "01234567890",
        amountCents: 1500,
        invoiceHint: "OMAGGIO PROMOTORI: Biglietto Spettacolo (Non fatturabile all'azienda)",
        vatNote: "Importo da fatturare: € 15,00",
        transactionId: insertedTx[1].id,
      },
      read: true,
      createdAt: new Date("2026-02-20T20:00:00Z"),
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
}