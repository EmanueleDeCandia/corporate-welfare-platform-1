import { desc, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  companies,
  transactions,
  users,
  venues,
  vouchers,
} from "@/db/schema";

export async function getCompanyDashboardData(companyId: number) {
  await initDb();

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  // Dipendenti dell'azienda (escluso il CSR manager)
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

  // Fornitori convenzionati di ospitalità (Agriturismi e Hotel con camere e cene)
  const allVenues = await db.select().from(venues);
  const hospitalityVenues = allVenues.filter(
    (v) => v.type === "hotel" || v.type === "agriturismo"
  );

  // Calcoli metriche a numero addetti
  // 100 addetti => 200 voucher teorici (2 per addetto a scelta tra pernottamento e aperitivo/cena)
  const totalEmployeesCount = company.employeesCount || employees.length || 100;
  const totalVouchersPlafond = totalEmployeesCount * 2;

  // Voucher riscattati (Pernottamento vs Cena)
  const redeemedHotel = companyVouchers.filter((v) => v.type === "hotel" && v.status === "redeemed").length;
  const redeemedAperitivo = companyVouchers.filter((v) => v.type === "aperitivo" && v.status === "redeemed").length;
  const totalRedeemed = redeemedHotel + redeemedAperitivo;
  const availableVouchers = Math.max(0, totalVouchersPlafond - totalRedeemed);
  const usageRate = totalVouchersPlafond > 0 ? Number(((totalRedeemed / totalVouchersPlafond) * 100).toFixed(1)) : 0;

  // Matching Grant generato dai Promotori: 50€ per ciascun voucher pernottamento
  const matchingGrantCents = redeemedHotel * 5000;

  // Mappa per ogni dipendente: quanti voucher ha riscattato e quali
  const employeeUsage = employees.map((emp) => {
    const empVouchers = companyVouchers.filter((v) => v.userId === emp.id);
    const empRedeemed = empVouchers.filter((v) => v.status === "redeemed");
    const hotelCount = empRedeemed.filter((v) => v.type === "hotel").length;
    const aperitivoCount = empRedeemed.filter((v) => v.type === "aperitivo").length;
    const totalCount = hotelCount + aperitivoCount;

    return {
      user: emp,
      totalRedeemed: totalCount,
      hotelCount,
      aperitivoCount,
      hasMatchingGrant: hotelCount > 0,
      canRedeemMore: totalCount < 2 && availableVouchers > 0,
    };
  });

  return {
    company,
    totalEmployeesCount,
    totalVouchersPlafond,
    redeemedHotel,
    redeemedAperitivo,
    totalRedeemed,
    availableVouchers,
    usageRate,
    matchingGrantCents,
    employees: employeeUsage,
    transactions: txRows,
    venues: hospitalityVenues,
  };
}
