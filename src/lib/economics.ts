/**
 * Motore economico deterministico della DEMO RADICI.
 *
 * Funzioni pure, nessun dato casuale: a parità di input gli output sono identici.
 * Tutte le stime sono "dimostrative" e derivano esclusivamente dagli input dichiarati.
 *
 * Regole di business recepite (vedi Doc/skills/innovation-review/SKILL.md, sezione 1):
 * - R2: il Voucher Pernottamento vale per una persona, ma circa il 90% dei pernottamenti è in due.
 * - R3: Matching Grant 25 euro a persona; costo di cassa Startup max 15 euro (biglietto),
 *   i restanti 10 euro sono un buono su servizi propri della Startup (costo opportunità).
 * - R4: percentuali di convenzione tra 10% e 30% per ogni accordo.
 * - Nessun prelievo sui produttori Km 0.
 */

export const ECONOMIC_PARAMS = {
  overnightVoucherEuros: 50,
  dinnerVoucherEuros: 25,
  plafondPerEmployeeEuros: 75,
  localMultiplier: 5.1,
  friendDiscountRate: 0.1,
  grantValuePerPersonEuros: 25,
} as const;

export type SimInputs = {
  // Rete
  companies: number;
  employeesPerCompany: number;
  // Conversione voucher
  overnightConversionPct: number;
  dinnerConversionPct: number;
  overnightDoublePct: number;
  extraDinnersPerDiner: number;
  // Referral
  referralRate: number;
  referralConversionPct: number;
  friendOvernightPct: number;
  // Km 0
  km0BuyerPct: number;
  km0PurchasesPerBuyer: number;
  km0BasketEuros: number;
  km0DeliveryKm: number;
  km0BatchesPerCompany: number;
  km0ProducersPerBatch: number;
  co2KgPerKm: number;
  // Valori
  overnightVoucherEuros: number;
  dinnerVoucherEuros: number;
  grantTicketCostEuros: number;
  grantServiceCouponEuros: number;
  // Margini e convenzioni
  hotelCommissionPct: number;
  dinnerFoodCostEuros: number;
  dinnerHostingPct: number;
  // Capacità
  showsPerYear: number;
  bedsPerShow: number;
  // Torneo
  tournamentTicketsPerEdition: number;
  tournamentEditionsPerYear: number;
  // Costi e moltiplicatore
  startupCostEuros: number;
  localMultiplier: number;
};

export type SimField = {
  key: keyof SimInputs;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  unit: "n" | "%" | "€" | "km" | "kg/km";
};

export type SimGroup = { title: string; description?: string; fields: SimField[] };

export const SIM_DEFAULTS: SimInputs = {
  companies: 100,
  employeesPerCompany: 50,
  overnightConversionPct: 20,
  dinnerConversionPct: 30,
  overnightDoublePct: 90,
  extraDinnersPerDiner: 0.5,
  referralRate: 3,
  referralConversionPct: 15,
  friendOvernightPct: 10,
  km0BuyerPct: 10,
  km0PurchasesPerBuyer: 6,
  km0BasketEuros: 40,
  km0DeliveryKm: 50,
  km0BatchesPerCompany: 6,
  km0ProducersPerBatch: 3,
  co2KgPerKm: 0.25,
  overnightVoucherEuros: 50,
  dinnerVoucherEuros: 25,
  grantTicketCostEuros: 15,
  grantServiceCouponEuros: 10,
  hotelCommissionPct: 20,
  dinnerFoodCostEuros: 5,
  dinnerHostingPct: 10,
  showsPerYear: 20,
  bedsPerShow: 150,
  tournamentTicketsPerEdition: 40,
  tournamentEditionsPerYear: 4,
  startupCostEuros: 50000,
  localMultiplier: 5.1,
};

export const SIM_GROUPS: SimGroup[] = [
  {
    title: "Rete aderente",
    fields: [
      { key: "companies", label: "Imprese aderenti", min: 1, max: 100, step: 1, unit: "n" },
      { key: "employeesPerCompany", label: "Addetti per impresa", min: 10, max: 1000, step: 10, unit: "n" },
    ],
  },
  {
    title: "Conversione dei voucher",
    description: "Ogni voucher è legato a uno spettacolo. Un addetto ha un solo voucher per tipo.",
    fields: [
      { key: "overnightConversionPct", label: "Addetti che convertono il Voucher Pernottamento", min: 0, max: 100, step: 1, unit: "%" },
      { key: "dinnerConversionPct", label: "Addetti che convertono il Voucher Aperitivo-Cena", min: 0, max: 100, step: 1, unit: "%" },
      {
        key: "overnightDoublePct",
        label: "Pernottamenti con persona invitata",
        hint: "Il voucher è per una persona ma circa il 90% dei pernottamenti è in due.",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      { key: "extraDinnersPerDiner", label: "Cene aggiuntive per addetto convertito (ricorrenza)", min: 0, max: 5, step: 0.25, unit: "n" },
    ],
  },
  {
    title: "Referral e community",
    fields: [
      { key: "referralRate", label: "Tasso di referral (inviti per addetto)", min: 0, max: 10, step: 0.1, unit: "n" },
      { key: "referralConversionPct", label: "Conversioni da referral (amici che acquistano)", min: 0, max: 100, step: 1, unit: "%" },
      { key: "friendOvernightPct", label: "Amici convertiti che pernottano", min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    title: "Prodotti Km 0 consegnati in sede",
    fields: [
      { key: "km0BuyerPct", label: "Addetti e amici che acquistano prodotti Km 0", min: 0, max: 100, step: 1, unit: "%" },
      { key: "km0PurchasesPerBuyer", label: "Acquisti per conversione", min: 0, max: 12, step: 0.5, unit: "n" },
      { key: "km0BasketEuros", label: "Valore medio per acquisto (ricavo produttori)", min: 10, max: 150, step: 1, unit: "€" },
      { key: "km0DeliveryKm", label: "Distanza media delle spedizioni", hint: "Intervallo operativo 30-70 km.", min: 30, max: 70, step: 1, unit: "km" },
      { key: "km0BatchesPerCompany", label: "Consegne in sede per impresa all'anno", min: 1, max: 52, step: 1, unit: "n" },
      { key: "km0ProducersPerBatch", label: "Produttori serviti per consegna", min: 1, max: 6, step: 1, unit: "n" },
      { key: "co2KgPerKm", label: "Fattore emissivo del furgone (stima modificabile)", min: 0.1, max: 0.6, step: 0.01, unit: "kg/km" },
    ],
  },
  {
    title: "Valori e Matching Grant",
    fields: [
      { key: "overnightVoucherEuros", label: "Valore Voucher Pernottamento", min: 20, max: 150, step: 5, unit: "€" },
      { key: "dinnerVoucherEuros", label: "Valore Voucher Aperitivo-Cena", min: 10, max: 80, step: 1, unit: "€" },
      {
        key: "grantTicketCostEuros",
        label: "Costo Startup del biglietto per persona (massimo)",
        hint: "Matching Grant di 25 euro a persona: massimo 15 euro di biglietto.",
        min: 0,
        max: 25,
        step: 1,
        unit: "€",
      },
      {
        key: "grantServiceCouponEuros",
        label: "Buono su servizi della Startup per persona (costo opportunità)",
        hint: "Incontro con gli artisti e spettacolo ancillare: rinuncia a ricavi propri, non è un esborso.",
        min: 0,
        max: 25,
        step: 1,
        unit: "€",
      },
    ],
  },
  {
    title: "Margini e convenzioni",
    fields: [
      {
        key: "hotelCommissionPct",
        label: "Percentuale di convenzione sul ricavo hotel",
        hint: "Accordi di convenzione tra 10% e 30%.",
        min: 10,
        max: 30,
        step: 1,
        unit: "%",
      },
      { key: "dinnerFoodCostEuros", label: "Costo materie prime per Aperitivo-Cena", hint: "Da 5 a 10 euro (10 = cessione agevolata massima).", min: 5, max: 10, step: 0.5, unit: "€" },
      { key: "dinnerHostingPct", label: "Quota di ospitalità riconosciuta al ristorante partner", min: 0, max: 30, step: 1, unit: "%" },
    ],
  },
  {
    title: "Capacità locale",
    fields: [
      { key: "showsPerYear", label: "Spettacoli collegati all'anno", min: 4, max: 120, step: 1, unit: "n" },
      { key: "bedsPerShow", label: "Presenze locali: posti letto disponibili per spettacolo", min: 10, max: 500, step: 5, unit: "n" },
    ],
  },
  {
    title: "Torneo dei Trailer",
    description: "Premi in biglietti omaggio della Startup, distinti dal Matching Grant.",
    fields: [
      { key: "tournamentTicketsPerEdition", label: "Biglietti omaggio per edizione", hint: "10 all'impresa prima più 2 a ciascuna delle altre 9 prime 10 = 28.", min: 0, max: 100, step: 1, unit: "n" },
      { key: "tournamentEditionsPerYear", label: "Edizioni all'anno", min: 0, max: 12, step: 1, unit: "n" },
    ],
  },
  {
    title: "Struttura costi e moltiplicatore",
    fields: [
      { key: "startupCostEuros", label: "Costo unitario per Rassegna Startup (6 eventi / mese)", min: 30000, max: 100000, step: 1000, unit: "€" },
      { key: "localMultiplier", label: "Moltiplicatore economico locale", min: 1, max: 8, step: 0.1, unit: "n" },
    ],
  },
];

export type SimResult = {
  // Rete
  employees: number;
  fundedEuros: number;
  totalPlafondEuros: number;
  redistributedEuros: number;
  // Volumi
  overnightVouchers: number;
  overnightPersons: number;
  guestsAccompanying: number;
  dinnersVoucher: number;
  dinnersExtra: number;
  dinnersFriends: number;
  dinnersTotal: number;
  friendConverts: number;
  theatreAttendance: number;
  // Ricavi dei partner
  hotelRevenueEuros: number;
  restaurantRevenueEuros: number;
  km0RevenueEuros: number;
  // Ricavi e margini Startup
  hotelCommissionEuros: number;
  dinnerMarginPerUnitEuros: number;
  dinnerMarginPct: number;
  dinnerMarginEuros: number;
  startupGrossMarginEuros: number;
  // Costi
  grantCashCostEuros: number;
  grantOpportunityCostEuros: number;
  tournamentTickets: number;
  tournamentCostEuros: number;
  startupCostEuros: number;
  netResultEuros: number;
  // Sostenibilità
  grantCoverageRatio: number;
  dinnersPerGrantBreakEven: number;
  breakEvenEmployees: number | null;
  breakEvenMonths: number | null;
  // Margini percentuali per soggetto (quota del ricavo che resta al soggetto)
  hotelRetainedPct: number;
  restaurantRetainedPct: number;
  producersRetainedPct: number;
  // Capacità
  personsPerShow: number;
  bedsSaturationPct: number;
  saturation: "ok" | "warning" | "over";
  // Ambiente
  km0Deliveries: number;
  kmAvoided: number;
  co2AvoidedKg: number;
};

const round = (n: number, d = 0) => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

export function computeImpact(i: SimInputs): SimResult {
  const employees = i.companies * i.employeesPerCompany;
  const totalPlafondEuros = employees * (i.overnightVoucherEuros + i.dinnerVoucherEuros);

  // Volumi voucher convertiti dagli addetti
  const overnightVouchers = Math.round(employees * (i.overnightConversionPct / 100));
  const double = i.overnightDoublePct / 100;
  const guestsAccompanying = Math.round(overnightVouchers * double);
  const employeeOvernightPersons = overnightVouchers + guestsAccompanying;
  const dinnersVoucher = Math.round(employees * (i.dinnerConversionPct / 100));
  const dinnersExtra = Math.round(dinnersVoucher * i.extraDinnersPerDiner);

  // Welfare Finanziato: moltiplicazione addetti che riscattano i due tipi di voucher
  // (es. 5000 addetti, 20% pernottamenti = 1000 * 50€ = 50.000€; 20% cene = 1000 * 25€ = 25.000€ -> Totale = 75.000€ = 0.20 * 5000 * 75€)
  const fundedEuros =
    overnightVouchers * i.overnightVoucherEuros + dinnersVoucher * i.dinnerVoucherEuros;

  // Ridistribuito sul territorio: totale voucher riscattati * 5,1 (Moltiplicatore 5,1x Studio Fattibilità)
  const redistributedEuros = fundedEuros * i.localMultiplier;

  // Referral e Community
  const friendConverts = Math.round(employees * i.referralRate * (i.referralConversionPct / 100));
  const friendNightPersons = Math.round(friendConverts * (i.friendOvernightPct / 100));
  const dinnersFriends = friendConverts;
  const dinnersTotal = dinnersVoucher + dinnersExtra + dinnersFriends;
  const overnightPersons = employeeOvernightPersons + friendNightPersons;

  // Matching Grant: persone effettivamente ospitate dal voucher pernottamento dell'addetto
  const theatreAttendance = employeeOvernightPersons;
  const grantCashCostEuros = theatreAttendance * i.grantTicketCostEuros;
  const grantOpportunityCostEuros = theatreAttendance * i.grantServiceCouponEuros;

  // Ricavi dei partner
  const friendPrice = 1 - ECONOMIC_PARAMS.friendDiscountRate;
  const hotelRevenueEuros =
    overnightVouchers * i.overnightVoucherEuros +
    guestsAccompanying * i.overnightVoucherEuros +
    friendNightPersons * i.overnightVoucherEuros * friendPrice;
  const restaurantRevenueEuros =
    (dinnersVoucher + dinnersExtra) * i.dinnerVoucherEuros +
    dinnersFriends * i.dinnerVoucherEuros * friendPrice;
  const km0Buyers = Math.round(employees * (i.km0BuyerPct / 100) + friendConverts * (i.km0BuyerPct / 100));
  const km0RevenueEuros = km0Buyers * i.km0PurchasesPerBuyer * i.km0BasketEuros;

  // Margini Startup
  const hotelCommissionEuros = hotelRevenueEuros * (i.hotelCommissionPct / 100);
  const hostingPct = i.dinnerHostingPct / 100;
  const dinnerMarginPerUnitEuros =
    i.dinnerVoucherEuros - i.dinnerFoodCostEuros - i.dinnerVoucherEuros * hostingPct;
  const dinnerMarginPct = i.dinnerVoucherEuros > 0 ? (dinnerMarginPerUnitEuros / i.dinnerVoucherEuros) * 100 : 0;
  const friendDinnerMargin = i.dinnerVoucherEuros * friendPrice - i.dinnerFoodCostEuros - i.dinnerVoucherEuros * friendPrice * hostingPct;
  const dinnerMarginEuros =
    (dinnersVoucher + dinnersExtra) * dinnerMarginPerUnitEuros + dinnersFriends * friendDinnerMargin;
  // Nessun prelievo sui produttori Km 0 (regola di modello)
  const startupGrossMarginEuros = hotelCommissionEuros + dinnerMarginEuros;

  // Costi
  const tournamentTickets = i.tournamentTicketsPerEdition * i.tournamentEditionsPerYear;
  const tournamentCostEuros = tournamentTickets * i.grantTicketCostEuros;
  const fixedCostEuros = i.startupCostEuros + tournamentCostEuros;
  const netResultEuros = startupGrossMarginEuros - grantCashCostEuros - fixedCostEuros;

  // Sostenibilità
  const grantCoverageRatio = grantCashCostEuros > 0 ? dinnerMarginEuros / grantCashCostEuros : 0;
  const grantCashPerOvernighter = overnightVouchers > 0 ? grantCashCostEuros / overnightVouchers : 0;
  const dinnersPerGrantBreakEven =
    dinnerMarginPerUnitEuros > 0 ? grantCashPerOvernighter / dinnerMarginPerUnitEuros : 0;
  const contribution = startupGrossMarginEuros - grantCashCostEuros;
  const contributionPerEmployee = employees > 0 ? contribution / employees : 0;
  const breakEvenEmployees =
    contributionPerEmployee > 0 ? Math.ceil(fixedCostEuros / contributionPerEmployee) : null;
  const breakEvenMonths = contribution > 0 ? (12 * fixedCostEuros) / contribution : null;

  // Capacità
  const personsPerShow = i.showsPerYear > 0 ? overnightPersons / i.showsPerYear : 0;
  const bedsSaturationPct = i.bedsPerShow > 0 ? (personsPerShow / i.bedsPerShow) * 100 : 0;
  const saturation: SimResult["saturation"] =
    bedsSaturationPct > 100 ? "over" : bedsSaturationPct >= 80 ? "warning" : "ok";

  // Ambiente
  const km0Deliveries = i.companies * i.km0BatchesPerCompany;
  const kmAvoided = km0Deliveries * i.km0ProducersPerBatch * i.km0DeliveryKm * 2;
  const co2AvoidedKg = kmAvoided * i.co2KgPerKm;

  return {
    employees,
    fundedEuros,
    totalPlafondEuros: round(totalPlafondEuros),
    redistributedEuros,
    overnightVouchers: round(overnightVouchers),
    overnightPersons: round(overnightPersons),
    guestsAccompanying: round(guestsAccompanying),
    dinnersVoucher: round(dinnersVoucher),
    dinnersExtra: round(dinnersExtra),
    dinnersFriends: round(dinnersFriends),
    dinnersTotal: round(dinnersTotal),
    friendConverts: round(friendConverts),
    theatreAttendance: round(theatreAttendance),
    hotelRevenueEuros: round(hotelRevenueEuros),
    restaurantRevenueEuros: round(restaurantRevenueEuros),
    km0RevenueEuros: round(km0RevenueEuros),
    hotelCommissionEuros: round(hotelCommissionEuros),
    dinnerMarginPerUnitEuros: round(dinnerMarginPerUnitEuros, 2),
    dinnerMarginPct: round(dinnerMarginPct, 1),
    dinnerMarginEuros: round(dinnerMarginEuros),
    startupGrossMarginEuros: round(startupGrossMarginEuros),
    grantCashCostEuros: round(grantCashCostEuros),
    grantOpportunityCostEuros: round(grantOpportunityCostEuros),
    tournamentTickets,
    tournamentCostEuros: round(tournamentCostEuros),
    startupCostEuros: i.startupCostEuros,
    netResultEuros: round(netResultEuros),
    grantCoverageRatio: round(grantCoverageRatio, 2),
    dinnersPerGrantBreakEven: round(dinnersPerGrantBreakEven, 2),
    breakEvenEmployees,
    breakEvenMonths: breakEvenMonths === null ? null : round(breakEvenMonths, 1),
    hotelRetainedPct: round(100 - i.hotelCommissionPct, 1),
    restaurantRetainedPct: round(i.dinnerHostingPct, 1),
    producersRetainedPct: 100,
    personsPerShow: round(personsPerShow, 1),
    bedsSaturationPct: round(bedsSaturationPct, 1),
    saturation,
    km0Deliveries,
    kmAvoided: round(kmAvoided),
    co2AvoidedKg: round(co2AvoidedKg),
  };
}

/** Scenari predefiniti (F-03): variazioni sul valore predefinito. */
export type SimScenario = { id: string; label: string; description: string; overrides: Partial<SimInputs> };

export const SIM_SCENARIOS: SimScenario[] = [
  {
    id: "prudente",
    label: "Prudente",
    description: "Rete ridotta a 50 imprese (1.500 addetti), tasso di conversione prudente (15% notti, 20% cene) e convenzione al 15%.",
    overrides: {
      companies: 50,
      employeesPerCompany: 30,
      overnightConversionPct: 15,
      dinnerConversionPct: 20,
      extraDinnersPerDiner: 0.25,
      referralRate: 1.5,
      referralConversionPct: 10,
      hotelCommissionPct: 15,
      dinnerFoodCostEuros: 6,
    },
  },
  {
    id: "base",
    label: "Base",
    description: "Scenario standard di riferimento: 100 imprese (5.000 addetti), 20% notti, 30% cene, referral 3x e convenzione al 20%.",
    overrides: {},
  },
  {
    id: "ambizioso",
    label: "Ambizioso",
    description: "Espansione a 150 imprese (9.000 addetti), conversione al 30-40%, referral a 4x e convenzione al 25%.",
    overrides: {
      companies: 150,
      employeesPerCompany: 60,
      overnightConversionPct: 30,
      dinnerConversionPct: 40,
      extraDinnersPerDiner: 1,
      referralRate: 4,
      referralConversionPct: 20,
      hotelCommissionPct: 25,
      dinnerFoodCostEuros: 5,
      showsPerYear: 30,
      bedsPerShow: 200,
    },
  },
];

export function scenarioInputs(s: SimScenario): SimInputs {
  return { ...SIM_DEFAULTS, ...s.overrides };
}

/** Serializza solo gli input diversi dal valore predefinito (per il link condivisibile). */
export function inputsToQuery(inputs: SimInputs): string {
  const params = new URLSearchParams();
  (Object.keys(SIM_DEFAULTS) as Array<keyof SimInputs>).forEach((k) => {
    if (inputs[k] !== SIM_DEFAULTS[k]) params.set(k, String(inputs[k]));
  });
  return params.toString();
}

export function inputsFromQuery(query: string): SimInputs {
  const params = new URLSearchParams(query);
  const next = { ...SIM_DEFAULTS };
  (Object.keys(SIM_DEFAULTS) as Array<keyof SimInputs>).forEach((k) => {
    const raw = params.get(k);
    if (raw === null) return;
    const n = Number(raw);
    if (Number.isFinite(n)) next[k] = n;
  });
  return next;
}
