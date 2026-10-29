import { desc, eq } from "drizzle-orm";
import { db, initDb, sqlite } from "@/db";
import { companies, transactions, users, venues, vouchers } from "@/db/schema";
import { extraEligibleUserIds, getPlanBudget } from "@/lib/welfare";
import { offeringFlags } from "@/lib/data";
import { venueOfferings } from "@/db/schema";

export async function getCompanyDashboardData(companyId: number) {
  await initDb();

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  const budget = getPlanBudget(companyId);

  const allEmployees = await db.select().from(users).where(eq(users.companyId, companyId));
  const employees = allEmployees.filter((u) => u.role === "employee");

  const companyVouchers = await db.select().from(vouchers).where(eq(vouchers.companyId, companyId));

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

  const allVenues = await db.select().from(venues);
  const allOfferings = await db.select().from(venueOfferings);
  const hospitalityVenues = allVenues
    .map((venue) => {
      const offerings = allOfferings.filter((item) => item.venueId === venue.id);
      return { venue, flags: offeringFlags(offerings), offerings };
    })
    .filter((row) => row.flags.offersOvernight || row.flags.offersDinner);

  const grantsByUser = sqlite
    .prepare(
      `SELECT v.user_id AS userId, COUNT(*) AS n
       FROM matching_grants g
       JOIN vouchers v ON v.id = g.voucher_id
       WHERE v.company_id = ?
       GROUP BY v.user_id`,
    )
    .all(companyId) as Array<{ userId: number; n: number }>;
  const grantMap = new Map(grantsByUser.map((row) => [row.userId, row.n]));

  const attendanceRows = sqlite
    .prepare(
      `SELECT v.user_id AS userId, s.attendance_status AS status, COUNT(*) AS n
       FROM voucher_selections s
       JOIN vouchers v ON v.id = s.voucher_id
       WHERE v.company_id = ?
       GROUP BY v.user_id, s.attendance_status`,
    )
    .all(companyId) as Array<{ userId: number; status: string; n: number }>;

  const employeeUsage = employees.map((emp) => {
    const empVouchers = companyVouchers.filter((v) => v.userId === emp.id);
    const selectedLike = (type: "overnight" | "dinner") =>
      empVouchers.filter(
        (v) => v.benefitType === type && ["selected", "attended", "no_show"].includes(v.status),
      ).length;
    const assigned = (type: "overnight" | "dinner") =>
      empVouchers.filter((v) => v.benefitType === type && v.status === "assigned").length;
    const overnightSelected = selectedLike("overnight");
    const dinnerSelected = selectedLike("dinner");
    const att = attendanceRows.filter((row) => row.userId === emp.id);
    return {
      user: emp,
      overnightSelected,
      dinnerSelected,
      overnightAssigned: assigned("overnight"),
      dinnerAssigned: assigned("dinner"),
      totalSelected: overnightSelected + dinnerSelected,
      hasMatchingGrant: (grantMap.get(emp.id) ?? 0) > 0,
      attended: att.find((row) => row.status === "attended")?.n ?? 0,
      noShow: att.find((row) => row.status === "no_show")?.n ?? 0,
      pending: att.find((row) => row.status === "pending")?.n ?? 0,
    };
  });

  const extraOvernightIds = budget ? extraEligibleUserIds(budget.plan_id, "overnight") : [];
  const extraDinnerIds = budget ? extraEligibleUserIds(budget.plan_id, "dinner") : [];

  return {
    company,
    budget,
    totalEmployeesCount: budget?.eligible_employees ?? company.employeesCount,
    employees: employeeUsage,
    extraEligible: {
      overnight: employees.filter((emp) => extraOvernightIds.includes(emp.id)),
      dinner: employees.filter((emp) => extraDinnerIds.includes(emp.id)),
    },
    transactions: txRows.filter((row) => row.transaction.kind === "welfare_charge"),
    venues: hospitalityVenues,
  };
}
