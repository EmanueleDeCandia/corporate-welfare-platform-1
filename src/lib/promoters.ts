import { db, initDb, sqlite } from "@/db";
import { destinations, users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGrantPipeline, listGrantEvents } from "@/lib/grants";

export type PromoterGrantRow = {
  grantId: number;
  voucherId: number;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  venueName: string;
  venueCity: string;
  eventTitle: string;
  eventCategory: string;
  eventLocation: string;
  theaterName: string;
  status: string;
  seatsRequested: number;
  assignedAt: Date | null;
  confirmationToken: string | null;
};

export type PromoterEconomics = {
  gmvCents: number;
  commissionCents: number;
  providerNetCents: number;
  pendingCents: number;
  settledCents: number;
  pendingCount: number;
  settledCount: number;
  overnightGmvCents: number;
  dinnerGmvCents: number;
  overnightCommissionCents: number;
  dinnerCommissionCents: number;
  consumerGmvCents: number;
};

export type PromoterCompanyRow = {
  id: number;
  name: string;
  city: string;
  employeesCount: number;
  eligibleEmployees: number;
  virtualBudgetCents: number;
  realBudgetCents: number;
  overnightSelected: number;
  dinnerSelected: number;
  overnightBase: number;
  dinnerBase: number;
  overnightRate: number;
  dinnerRate: number;
};

export type PromoterProviderRow = {
  id: number;
  name: string;
  city: string;
  type: string;
  selections: number;
  attended: number;
  noShow: number;
  gmvCents: number;
  commissionCents: number;
  pendingCents: number;
};

export type PromoterVoucherFunnel = {
  assigned: number;
  selected: number;
  attended: number;
  noShow: number;
  expired: number;
  extraGranted: number;
  overnightAssigned: number;
  dinnerAssigned: number;
};

export type PromoterLedgerRow = {
  id: number;
  createdAt: Date;
  companyName: string | null;
  venueName: string;
  guestName: string;
  serviceLabel: string;
  benefitType: string | null;
  amountCents: number;
  commissionCents: number;
  providerNetCents: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  paymentStatus: string;
};

export type PromoterDashboardData = {
  promoterUser: typeof users.$inferSelect;
  economics: PromoterEconomics;
  companies: PromoterCompanyRow[];
  providers: PromoterProviderRow[];
  voucherFunnel: PromoterVoucherFunnel;
  ledger: PromoterLedgerRow[];
  pipeline: ReturnType<typeof getGrantPipeline>;
  eventsCount: number;
  theatersCount: number;
  promotedDestinationsCount: number;
  grants: PromoterGrantRow[];
  events: Array<{
    id: number;
    title: string;
    category: string;
    venueName: string;
    city: string;
    startsAt: Date;
    capacity: number;
    seatsOccupied: number;
    seatsFree: number;
    grantsGeneratedCount: number;
  }>;
  theaters: Array<{
    id: number;
    name: string;
    city: string;
    region: string;
    grantsGeneratedCount: number;
  }>;
};

function num(value: unknown) {
  return Number(value ?? 0);
}

export async function getPromotersDashboardData(promoterUserId: number): Promise<PromoterDashboardData | null> {
  await initDb();

  const [promoterUser] = await db.select().from(users).where(eq(users.id, promoterUserId)).limit(1);
  if (!promoterUser || (promoterUser.role !== "promoter" && promoterUser.role !== "admin")) {
    return null;
  }

  const pipeline = getGrantPipeline();
  const eventRows = listGrantEvents();
  const allVenues = await db.select().from(venues);
  const theaterVenues = allVenues.filter((v) => v.type === "theater" || v.type === "show_venue");
  const allDestinations = await db.select().from(destinations);

  const eco = sqlite
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' THEN t.amount_cents END), 0) AS gmv,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' THEN t.commission_cents END), 0) AS commission,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' THEN t.provider_net_cents END), 0) AS provider_net,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND t.payment_status = 'pending' THEN t.amount_cents END), 0) AS pending,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND t.payment_status = 'settled' THEN t.amount_cents END), 0) AS settled,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND t.payment_status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_n,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND t.payment_status = 'settled' THEN 1 ELSE 0 END), 0) AS settled_n,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND v.benefit_type = 'overnight' THEN t.amount_cents END), 0) AS overnight_gmv,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND v.benefit_type = 'dinner' THEN t.amount_cents END), 0) AS dinner_gmv,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND v.benefit_type = 'overnight' THEN t.commission_cents END), 0) AS overnight_fee,
         COALESCE(SUM(CASE WHEN t.kind = 'welfare_charge' AND v.benefit_type = 'dinner' THEN t.commission_cents END), 0) AS dinner_fee,
         COALESCE(SUM(CASE WHEN t.kind = 'consumer_payment' THEN t.amount_cents END), 0) AS consumer_gmv
       FROM transactions t
       LEFT JOIN vouchers v ON v.id = t.voucher_id`,
    )
    .get() as Record<string, number>;

  const economics: PromoterEconomics = {
    gmvCents: num(eco.gmv),
    commissionCents: num(eco.commission),
    providerNetCents: num(eco.provider_net),
    pendingCents: num(eco.pending),
    settledCents: num(eco.settled),
    pendingCount: num(eco.pending_n),
    settledCount: num(eco.settled_n),
    overnightGmvCents: num(eco.overnight_gmv),
    dinnerGmvCents: num(eco.dinner_gmv),
    overnightCommissionCents: num(eco.overnight_fee),
    dinnerCommissionCents: num(eco.dinner_fee),
    consumerGmvCents: num(eco.consumer_gmv),
  };

  const companyRows = sqlite
    .prepare(
      `SELECT c.id, c.name, c.city, c.employees_count,
              b.eligible_employees, b.virtual_budget_cents, b.real_budget_cents,
              b.overnight_base_selected, b.dinner_base_selected, b.overnight_base, b.dinner_base
       FROM companies c
       JOIN v_plan_budget b ON b.company_id = c.id
       ORDER BY c.name`,
    )
    .all() as Array<{
    id: number;
    name: string;
    city: string;
    employees_count: number;
    eligible_employees: number;
    virtual_budget_cents: number;
    real_budget_cents: number;
    overnight_base_selected: number;
    dinner_base_selected: number;
    overnight_base: number;
    dinner_base: number;
  }>;

  const companies: PromoterCompanyRow[] = companyRows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    employeesCount: row.employees_count,
    eligibleEmployees: row.eligible_employees,
    virtualBudgetCents: row.virtual_budget_cents,
    realBudgetCents: row.real_budget_cents,
    overnightSelected: row.overnight_base_selected,
    dinnerSelected: row.dinner_base_selected,
    overnightBase: row.overnight_base,
    dinnerBase: row.dinner_base,
    overnightRate: row.overnight_base > 0 ? Number(((row.overnight_base_selected / row.overnight_base) * 100).toFixed(1)) : 0,
    dinnerRate: row.dinner_base > 0 ? Number(((row.dinner_base_selected / row.dinner_base) * 100).toFixed(1)) : 0,
  }));

  const providerRows = sqlite
    .prepare(
      `SELECT v.id, v.name, v.city, v.type,
              (SELECT COUNT(*) FROM voucher_selections s WHERE s.venue_id = v.id) AS selections,
              (SELECT COUNT(*) FROM voucher_selections s WHERE s.venue_id = v.id AND s.attendance_status = 'attended') AS attended,
              (SELECT COUNT(*) FROM voucher_selections s WHERE s.venue_id = v.id AND s.attendance_status = 'no_show') AS no_show,
              COALESCE((SELECT SUM(t.amount_cents) FROM transactions t WHERE t.venue_id = v.id AND t.kind = 'welfare_charge'), 0) AS gmv,
              COALESCE((SELECT SUM(t.commission_cents) FROM transactions t WHERE t.venue_id = v.id AND t.kind = 'welfare_charge'), 0) AS commission,
              COALESCE((SELECT SUM(t.amount_cents) FROM transactions t WHERE t.venue_id = v.id AND t.kind = 'welfare_charge' AND t.payment_status = 'pending'), 0) AS pending
       FROM venues v
       WHERE v.type NOT IN ('theater', 'show_venue')
       ORDER BY gmv DESC, v.name`,
    )
    .all() as Array<{
    id: number;
    name: string;
    city: string;
    type: string;
    selections: number;
    attended: number;
    no_show: number;
    gmv: number;
    commission: number;
    pending: number;
  }>;

  const providers: PromoterProviderRow[] = providerRows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    type: row.type,
    selections: row.selections,
    attended: row.attended,
    noShow: row.no_show,
    gmvCents: row.gmv,
    commissionCents: row.commission,
    pendingCents: row.pending,
  }));

  const funnel = sqlite
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END), 0) AS assigned,
         COALESCE(SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END), 0) AS selected,
         COALESCE(SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END), 0) AS attended,
         COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0) AS no_show,
         COALESCE(SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END), 0) AS expired,
         COALESCE(SUM(CASE WHEN origin = 'extra' THEN 1 ELSE 0 END), 0) AS extra_granted,
         COALESCE(SUM(CASE WHEN benefit_type = 'overnight' THEN 1 ELSE 0 END), 0) AS overnight_assigned,
         COALESCE(SUM(CASE WHEN benefit_type = 'dinner' THEN 1 ELSE 0 END), 0) AS dinner_assigned
       FROM vouchers`,
    )
    .get() as Record<string, number>;

  const voucherFunnel: PromoterVoucherFunnel = {
    assigned: num(funnel.assigned),
    selected: num(funnel.selected),
    attended: num(funnel.attended),
    noShow: num(funnel.no_show),
    expired: num(funnel.expired),
    extraGranted: num(funnel.extra_granted),
    overnightAssigned: num(funnel.overnight_assigned),
    dinnerAssigned: num(funnel.dinner_assigned),
  };

  const ledgerRows = sqlite
    .prepare(
      `SELECT t.id, t.created_at, t.service_label, t.amount_cents, t.commission_cents, t.provider_net_cents,
              t.invoice_number, t.invoice_date, t.payment_status,
              c.name AS company_name, vn.name AS venue_name,
              u.first_name, u.last_name, v.benefit_type
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       JOIN venues vn ON vn.id = t.venue_id
       LEFT JOIN companies c ON c.id = t.company_id
       LEFT JOIN vouchers v ON v.id = t.voucher_id
       WHERE t.kind = 'welfare_charge'
       ORDER BY t.created_at DESC`,
    )
    .all() as Array<{
    id: number;
    created_at: number;
    service_label: string;
    amount_cents: number;
    commission_cents: number;
    provider_net_cents: number;
    invoice_number: string | null;
    invoice_date: string | null;
    payment_status: string;
    company_name: string | null;
    venue_name: string;
    first_name: string;
    last_name: string;
    benefit_type: string | null;
  }>;

  const ledger: PromoterLedgerRow[] = ledgerRows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at * 1000),
    companyName: row.company_name,
    venueName: row.venue_name,
    guestName: `${row.first_name} ${row.last_name}`,
    serviceLabel: row.service_label,
    benefitType: row.benefit_type,
    amountCents: row.amount_cents,
    commissionCents: row.commission_cents,
    providerNetCents: row.provider_net_cents,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    paymentStatus: row.payment_status,
  }));

  const grantRows = sqlite
    .prepare(
      `SELECT g.id AS grant_id, g.voucher_id, g.status, g.seats_requested, g.assigned_at,
              u.first_name, u.last_name, u.email,
              c.name AS company_name,
              hv.name AS venue_name, hv.city AS venue_city,
              e.title AS event_title, e.category AS event_category,
              tv.name AS theater_name, tv.city AS theater_city,
              conf.token AS confirmation_token
       FROM matching_grants g
       JOIN vouchers v ON v.id = g.voucher_id
       JOIN users u ON u.id = v.user_id
       JOIN companies c ON c.id = v.company_id
       JOIN grant_events e ON e.id = g.event_id
       JOIN venues tv ON tv.id = e.venue_id
       LEFT JOIN voucher_selections s ON s.voucher_id = v.id
       LEFT JOIN venues hv ON hv.id = s.venue_id
       LEFT JOIN grant_confirmations conf ON conf.matching_grant_id = g.id
       ORDER BY g.assigned_at DESC`,
    )
    .all() as Array<{
    grant_id: number;
    voucher_id: number;
    status: string;
    seats_requested: number;
    assigned_at: number;
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
    venue_name: string | null;
    venue_city: string | null;
    event_title: string;
    event_category: string;
    theater_name: string;
    theater_city: string;
    confirmation_token: string | null;
  }>;

  const grants: PromoterGrantRow[] = grantRows.map((row) => ({
    grantId: row.grant_id,
    voucherId: row.voucher_id,
    employeeName: `${row.first_name} ${row.last_name}`,
    employeeEmail: row.email,
    companyName: row.company_name,
    venueName: row.venue_name ?? "Struttura ricettiva",
    venueCity: row.venue_city ?? "Territorio",
    eventTitle: row.event_title,
    eventCategory: row.event_category,
    eventLocation: `${row.theater_name} (${row.theater_city})`,
    theaterName: row.theater_name,
    status: row.status,
    seatsRequested: row.seats_requested,
    assignedAt: row.assigned_at ? new Date(row.assigned_at * 1000) : null,
    confirmationToken: row.confirmation_token,
  }));

  const events = eventRows.map((ge) => ({
    id: ge.id,
    title: ge.title,
    category: ge.category,
    venueName: ge.venue_name,
    city: ge.venue_city,
    startsAt: new Date(ge.starts_at * 1000),
    capacity: ge.capacity,
    seatsOccupied: ge.seats_occupied,
    seatsFree: ge.seats_free,
    grantsGeneratedCount: grantRows.filter((row) => row.event_title === ge.title).length,
  }));

  const theaters = theaterVenues.map((th) => ({
    id: th.id,
    name: th.name,
    city: th.city,
    region: th.region,
    grantsGeneratedCount: grantRows.filter((row) => row.theater_name === th.name).length,
  }));

  return {
    promoterUser,
    economics,
    companies,
    providers,
    voucherFunnel,
    ledger,
    pipeline,
    eventsCount: eventRows.length,
    theatersCount: theaterVenues.length,
    promotedDestinationsCount: allDestinations.length,
    grants,
    events,
    theaters,
  };
}
