import { desc, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  companies,
  transactions,
  users,
  venues,
  vouchers,
  voucherSelections,
  welfarePlans,
  planExtraAllocations,
  venueOfferings,
} from "@/db/schema";

export async function getCompanyDashboardData(companyId: number) {
  await initDb();

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  // Piano welfare aziendale attivo
  const [activePlan] = await db
    .select()
    .from(welfarePlans)
    .where(eq(welfarePlans.companyId, companyId))
    .limit(1);

  // Dipendenti dell'azienda (ruolo employee)
  const allEmployees = await db
    .select()
    .from(users)
    .where(eq(users.companyId, companyId));

  const employees = allEmployees.filter((u) => u.role === "employee");

  // Tutti i voucher associati all'azienda
  const companyVouchers = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.companyId, companyId));

  // Transazioni welfare B2B dell'azienda (con fornitore e utente)
  const txRows = await db
    .select({
      transaction: transactions,
      user: users,
      venue: venues,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .innerJoin(venues, eq(transactions.venueId, venues.id))
    .where(eq(transactions.companyId, companyId))
    .orderBy(desc(transactions.createdAt));

  // Tutte le selezioni effettuate dai dipendenti dell'azienda
  const allSelections = await db
    .select({
      selection: voucherSelections,
      voucher: vouchers,
      venue: venues,
    })
    .from(voucherSelections)
    .innerJoin(vouchers, eq(voucherSelections.voucherId, vouchers.id))
    .innerJoin(venues, eq(voucherSelections.venueId, venues.id))
    .where(eq(vouchers.companyId, companyId))
    .orderBy(desc(voucherSelections.selectedAt));

  // Fornitori che offrono servizi attivi convenzionati
  const offerings = await db
    .select({
      offering: venueOfferings,
      venue: venues,
    })
    .from(venueOfferings)
    .innerJoin(venues, eq(venueOfferings.venueId, venues.id))
    .where(eq(venueOfferings.acceptsWelfare, true));

  // Raggruppa strutture con le relative tipologie di offerta disponibili
  const venueMap = new Map<number, typeof venues.$inferSelect & { hasOvernight: boolean; hasDinner: boolean }>();
  for (const { offering, venue } of offerings) {
    if (!venueMap.has(venue.id)) {
      venueMap.set(venue.id, { ...venue, hasOvernight: false, hasDinner: false });
    }
    const entry = venueMap.get(venue.id)!;
    if (offering.benefitType === "overnight") entry.hasOvernight = true;
    if (offering.benefitType === "dinner") entry.hasDinner = true;
  }
  const hospitalityVenues = Array.from(venueMap.values());

  // Allocazioni Extra già deliberate
  const extraAllocations = activePlan
    ? await db
        .select()
        .from(planExtraAllocations)
        .where(eq(planExtraAllocations.planId, activePlan.id))
        .orderBy(desc(planExtraAllocations.createdAt))
    : [];

  // Calcoli metriche dal Piano Welfare (R1, R2, R5)
  const eligibleEmployeesCount = activePlan?.eligibleEmployees || company.employeesCount || employees.length;
  const overnightUnitAmount = activePlan?.overnightAmountCents ?? 5000;
  const dinnerUnitAmount = activePlan?.dinnerAmountCents ?? 2500;

  // Base voucher per tipo: 1 pernottamento + 1 cena a dipendente
  const baseOvernightCount = eligibleEmployeesCount;
  const baseDinnerCount = eligibleEmployeesCount;
  const totalBaseVouchers = baseOvernightCount + baseDinnerCount;

  // Budget Virtuale = addetti * (50€ + 25€)
  const virtualBudgetCents = eligibleEmployeesCount * (overnightUnitAmount + dinnerUnitAmount);

  // Voucher selezionati/riscattati distinti per tipo
  const isSelectedOrRedeemed = (status: string) =>
    status === "selected" || status === "redeemed" || status === "attended" || status === "no_show";

  const selectedOvernight = companyVouchers.filter(
    (v) => (v.type === "hotel" || v.type === "overnight") && isSelectedOrRedeemed(v.status)
  ).length;

  const selectedDinner = companyVouchers.filter(
    (v) => (v.type === "aperitivo" || v.type === "dinner") && isSelectedOrRedeemed(v.status)
  ).length;

  const totalSelected = selectedOvernight + selectedDinner;

  // Budget Reale: somma effettiva dell'impegno economico generato dalle selezioni (irrevocabile B2B)
  const realBudgetCents = companyVouchers
    .filter((v) => isSelectedOrRedeemed(v.status))
    .reduce((sum, v) => sum + (v.amountCents || 0), 0);

  // Monitoraggio presenze effettive vs no-show
  const attendedCount = allSelections.filter((s) => s.selection.attendanceStatus === "attended").length;
  const noShowCount = allSelections.filter((s) => s.selection.attendanceStatus === "no_show").length;
  const pendingAttendanceCount = allSelections.filter((s) => s.selection.attendanceStatus === "pending").length;

  // REGOLE RIASSEGNAZIONE EXTRA INDIPENDENTI AL 20% (R5)
  const overnightThresholdBps = activePlan?.overnightExtraThresholdBps ?? 2000; // 20%
  const overnightCapBps = activePlan?.overnightExtraCapBps ?? 2000;             // 20%
  const dinnerThresholdBps = activePlan?.dinnerExtraThresholdBps ?? 2000;       // 20%
  const dinnerCapBps = activePlan?.dinnerExtraCapBps ?? 2000;                   // 20%

  const overnightMaxExtra = Math.floor((baseOvernightCount * overnightCapBps) / 10000);
  const dinnerMaxExtra = Math.floor((baseDinnerCount * dinnerCapBps) / 10000);

  const overnightExtraGranted = extraAllocations
    .filter((a) => a.benefitType === "overnight")
    .reduce((sum, a) => sum + a.vouchersGranted, 0);

  const dinnerExtraGranted = extraAllocations
    .filter((a) => a.benefitType === "dinner")
    .reduce((sum, a) => sum + a.vouchersGranted, 0);

  // Soglia attiva: consentita solo se selezionati < 20% dei base
  const overnightExtraAllowed =
    selectedOvernight < (baseOvernightCount * overnightThresholdBps) / 10000 &&
    overnightExtraGranted < overnightMaxExtra;

  const dinnerExtraAllowed =
    selectedDinner < (baseDinnerCount * dinnerThresholdBps) / 10000 &&
    dinnerExtraGranted < dinnerMaxExtra;

  // Matching Grant generato dai Promotori (50€ per ogni pernottamento selezionato)
  const matchingGrantCents = selectedOvernight * 5000;

  // Mappa per ogni dipendente
  const employeeUsage = employees.map((emp) => {
    const empVouchers = companyVouchers.filter((v) => v.userId === emp.id);
    const empSelected = empVouchers.filter((v) => isSelectedOrRedeemed(v.status));
    const hotelCount = empSelected.filter((v) => v.type === "hotel" || v.type === "overnight").length;
    const dinnerCount = empSelected.filter((v) => v.type === "aperitivo" || v.type === "dinner").length;
    const totalCount = hotelCount + dinnerCount;

    const canRedeemMore = (hotelCount === 0 || dinnerCount === 0) && totalCount < 2;

    return {
      user: emp,
      totalRedeemed: totalCount,
      hotelCount,
      aperitivoCount: dinnerCount,
      hasMatchingGrant: hotelCount > 0,
      canRedeemMore,
      canRedeemOvernight: hotelCount === 0,
      canRedeemDinner: dinnerCount === 0,
    };
  });

  return {
    company,
    activePlan,
    totalEmployeesCount: eligibleEmployeesCount,
    totalVouchersPlafond: totalBaseVouchers,
    virtualBudgetCents,
    realBudgetCents,
    redeemedHotel: selectedOvernight,
    redeemedAperitivo: selectedDinner,
    totalRedeemed: totalSelected,
    availableVouchers: Math.max(0, totalBaseVouchers - totalSelected),
    usageRate: totalBaseVouchers > 0 ? Number(((totalSelected / totalBaseVouchers) * 100).toFixed(1)) : 0,
    matchingGrantCents,
    attendance: {
      attendedCount,
      noShowCount,
      pendingAttendanceCount,
    },
    extraThresholds: {
      overnight: {
        allowed: overnightExtraAllowed,
        maxExtra: overnightMaxExtra,
        granted: overnightExtraGranted,
        remaining: Math.max(0, overnightMaxExtra - overnightExtraGranted),
      },
      dinner: {
        allowed: dinnerExtraAllowed,
        maxExtra: dinnerMaxExtra,
        granted: dinnerExtraGranted,
        remaining: Math.max(0, dinnerMaxExtra - dinnerExtraGranted),
      },
    },
    employees: employeeUsage,
    transactions: txRows,
    selections: allSelections,
    venues: hospitalityVenues,
  };
}
