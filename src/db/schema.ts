import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export type UserRole = "employee" | "friend" | "provider" | "csr" | "promoter" | "admin";
export type BenefitType = "overnight" | "dinner";
export type VoucherOrigin = "base" | "extra";
export type VoucherStatus = "assigned" | "selected" | "attended" | "no_show" | "expired";
export type AttendanceStatus = "pending" | "attended" | "no_show";
export type PlanStatus = "draft" | "active" | "closed";
export type TransactionKind = "welfare_charge" | "consumer_payment";
export type TransactionStatus = "pending" | "confirmed" | "invoiced" | "paid" | "refunded" | "receipted";
export type GrantStatus =
  | "assigned"
  | "confirmation_sent"
  | "confirmed"
  | "declined"
  | "expired"
  | "attended"
  | "no_show";
export type GrantEventCategory = "teatro" | "musica" | "arte_cultura" | "natura_laboratorio";
export type HolderRole = "employee" | "companion";
export type VenueType = "hotel" | "agriturismo" | "restaurant" | "theater" | "show_venue";

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  vatNumber: text("vat_number").notNull(),
  city: text("city").notNull(),
  sector: text("sector").notNull(),
  employeesCount: integer("employees_count").notNull().default(0),
  fundedAmountCents: integer("funded_amount_cents").notNull().default(0),
  impactRating: integer("impact_rating").notNull().default(0),
  localRedistributionCents: integer("local_redistribution_cents").notNull().default(0),
  co2SavedKg: integer("co2_saved_kg").notNull().default(0),
  description: text("description").notNull(),
  accent: text("accent").notNull().default("#1C3A2E"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const destinations = sqliteTable("destinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  region: text("region").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  coverImage: text("cover_image").notNull(),
  highlight: text("highlight").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: text("role").$type<UserRole>().notNull().default("employee"),
    companyId: integer("company_id").references(() => companies.id),
    venueId: integer("venue_id"),
    impactPoints: integer("impact_points").notNull().default(0),
    badgeLevel: text("badge_level").notNull().default("Esploratore"),
    referralCode: text("referral_code").notNull().unique(),
    invitedByUserId: integer("invited_by_user_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    referralIdx: uniqueIndex("ux_users_referral").on(table.referralCode),
  }),
);

export const venues = sqliteTable("venues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").$type<VenueType>().notNull(),
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinations.id),
  city: text("city").notNull(),
  province: text("province").notNull(),
  region: text("region").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  coverImage: text("cover_image").notNull(),
  gallery: text("gallery", { mode: "json" }).$type<string[]>().default([]),
  services: text("services", { mode: "json" }).$type<string[]>().default([]),
  checkinCode: text("checkin_code").notNull().unique(),
  providerUserId: integer("provider_user_id").references(() => users.id),
  sponsorCompanyId: integer("sponsor_company_id").references(() => companies.id),
  impactPointsGenerated: integer("impact_points_generated").notNull().default(1),
  localSupportPercent: integer("local_support_percent").notNull().default(10),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const welfarePlans = sqliteTable(
  "welfare_plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    year: integer("year").notNull(),
    validFrom: text("valid_from").notNull(),
    validUntil: text("valid_until").notNull(),
    eligibleEmployees: integer("eligible_employees").notNull(),
    overnightAmountCents: integer("overnight_amount_cents").notNull().default(5000),
    dinnerAmountCents: integer("dinner_amount_cents").notNull().default(2500),
    overnightExtraThresholdBps: integer("overnight_extra_threshold_bps").notNull().default(2000),
    overnightExtraCapBps: integer("overnight_extra_cap_bps").notNull().default(2000),
    dinnerExtraThresholdBps: integer("dinner_extra_threshold_bps").notNull().default(2000),
    dinnerExtraCapBps: integer("dinner_extra_cap_bps").notNull().default(2000),
    extraWindowDays: integer("extra_window_days").notNull().default(30),
    status: text("status").$type<PlanStatus>().notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    uxCompanyYear: uniqueIndex("ux_plan_company_year").on(table.companyId, table.year),
  }),
);

export const planExtraAllocations = sqliteTable(
  "plan_extra_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => welfarePlans.id),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    benefitType: text("benefit_type").$type<BenefitType>().notNull(),
    selectedAtTime: integer("selected_at_time").notNull(),
    availableAtTime: integer("available_at_time").notNull(),
    vouchersGranted: integer("vouchers_granted").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixPlanType: index("ix_extra_plan_type").on(table.planId, table.benefitType),
  }),
);

export const venueOfferings = sqliteTable(
  "venue_offerings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venues.id),
    benefitType: text("benefit_type").$type<BenefitType>().notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    listPriceCents: integer("list_price_cents").notNull(),
    acceptsWelfare: integer("accepts_welfare", { mode: "boolean" }).notNull().default(true),
    dailyCapacity: integer("daily_capacity"),
    friendDiscountBps: integer("friend_discount_bps").notNull().default(1000),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => ({
    uxOffering: uniqueIndex("ux_venue_offering").on(table.venueId, table.benefitType, table.name),
    ixVenueType: index("ix_offering_venue").on(table.venueId, table.benefitType),
  }),
);

export const grantEvents = sqliteTable(
  "grant_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    category: text("category").$type<GrantEventCategory>().notNull().default("teatro"),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venues.id),
    description: text("description").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    capacity: integer("capacity").notNull(),
    perPersonCents: integer("per_person_cents").notNull().default(2500),
    confirmationSendDays: integer("confirmation_send_days").notNull().default(7),
    confirmationDeadlineDays: integer("confirmation_deadline_days").notNull().default(3),
    artistMeetupIncluded: integer("artist_meetup_included", { mode: "boolean" }).notNull().default(true),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixStarts: index("ix_grant_events_starts").on(table.startsAt),
    ixVenue: index("ix_grant_events_venue").on(table.venueId),
  }),
);

export const vouchers = sqliteTable(
  "vouchers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => welfarePlans.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    benefitType: text("benefit_type").$type<BenefitType>().notNull(),
    origin: text("origin").$type<VoucherOrigin>().notNull().default("base"),
    extraAllocationId: integer("extra_allocation_id").references(() => planExtraAllocations.id),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").$type<VoucherStatus>().notNull().default("assigned"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixUserStatus: index("ix_vouchers_user").on(table.userId, table.status),
    ixPlanStatus: index("ix_vouchers_plan").on(table.planId, table.status),
  }),
);

export const voucherSelections = sqliteTable(
  "voucher_selections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    voucherId: integer("voucher_id")
      .notNull()
      .unique()
      .references(() => vouchers.id),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venues.id),
    offeringId: integer("offering_id")
      .notNull()
      .references(() => venueOfferings.id),
    serviceDate: text("service_date").notNull(),
    selectedAt: integer("selected_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    attendanceStatus: text("attendance_status").$type<AttendanceStatus>().notNull().default("pending"),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
    checkedInByUserId: integer("checked_in_by_user_id").references(() => users.id),
    noShowMarkedAt: integer("no_show_marked_at", { mode: "timestamp" }),
    qrToken: text("qr_token").notNull().unique(),
  },
  (table) => ({
    ixVenueDate: index("ix_selections_venue_date").on(table.venueId, table.serviceDate),
  }),
);

export const matchingGrants = sqliteTable(
  "matching_grants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    voucherId: integer("voucher_id")
      .notNull()
      .unique()
      .references(() => vouchers.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => grantEvents.id),
    amountCents: integer("amount_cents").notNull().default(5000),
    seatsRequested: integer("seats_requested").notNull().default(2),
    status: text("status").$type<GrantStatus>().notNull().default("assigned"),
    assignedAt: integer("assigned_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
    attendedAt: integer("attended_at", { mode: "timestamp" }),
    qrToken: text("qr_token").notNull().unique(),
  },
  (table) => ({
    ixEventStatus: index("ix_grants_event").on(table.eventId, table.status),
  }),
);

export const grantSeats = sqliteTable(
  "grant_seats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchingGrantId: integer("matching_grant_id")
      .notNull()
      .references(() => matchingGrants.id),
    holderRole: text("holder_role").$type<HolderRole>().notNull(),
    holderName: text("holder_name").notNull(),
    holderEmail: text("holder_email"),
    valueCents: integer("value_cents").notNull().default(2500),
    attended: integer("attended", { mode: "boolean" }).notNull().default(false),
    attendedAt: integer("attended_at", { mode: "timestamp" }),
  },
  (table) => ({
    uxGrantRole: uniqueIndex("ux_grant_seat_role").on(table.matchingGrantId, table.holderRole),
  }),
);

export const grantConfirmations = sqliteTable("grant_confirmations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchingGrantId: integer("matching_grant_id")
    .notNull()
    .references(() => matchingGrants.id),
  token: text("token").notNull().unique(),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
  respondBy: integer("respond_by", { mode: "timestamp" }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  channel: text("channel").notNull().default("email"),
  deliveryStatus: text("delivery_status").notNull().default("pending"),
  response: text("response"),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  reminderCount: integer("reminder_count").notNull().default(0),
});

export const invites = sqliteTable(
  "invites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inviterId: integer("inviter_id")
      .notNull()
      .references(() => users.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull().default("pending"),
    friendUserId: integer("friend_user_id").references(() => users.id),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    acceptedAt: integer("accepted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    uxInviterEmail: uniqueIndex("ux_invite").on(table.inviterId, table.email),
  }),
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind").$type<TransactionKind>().notNull(),
    status: text("status").$type<TransactionStatus>().notNull().default("confirmed"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venues.id),
    companyId: integer("company_id").references(() => companies.id),
    inviteId: integer("invite_id").references(() => invites.id),
    voucherId: integer("voucher_id").references(() => vouchers.id),
    selectionId: integer("selection_id").references(() => voucherSelections.id),
    offeringId: integer("offering_id").references(() => venueOfferings.id),
    amountCents: integer("amount_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    listPriceCents: integer("list_price_cents").notNull(),
    serviceLabel: text("service_label").notNull(),
    idempotencyKey: text("idempotency_key").unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixVenueCreated: index("ix_tx_venue").on(table.venueId, table.createdAt),
  }),
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venues.id),
    type: text("type").notNull().default("welfare"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    payload: text("payload", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    transactionId: integer("transaction_id").references(() => transactions.id),
    selectionId: integer("selection_id").references(() => voucherSelections.id),
    recipientUserId: integer("recipient_user_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixVenueRead: index("ix_notifications_venue").on(table.venueId, table.read),
  }),
);

export const shares = sqliteTable("shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  venueId: integer("venue_id").references(() => venues.id),
  caption: text("caption").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const certificates = sqliteTable("certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impactValue: text("impact_value").notNull(),
  unitLabel: text("unit_label").notNull(),
  protocolNumber: text("protocol_number").notNull().unique(),
  period: text("period").notNull().default("2026"),
  calculationJson: text("calculation_json", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  issuedBy: text("issued_by").notNull().default("Comitato ESG RADICI"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    token: text("token").notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ixUser: index("ix_sessions_user").on(table.userId),
  }),
);

export const impactLedger = sqliteTable(
  "impact_ledger",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    points: integer("points").notNull(),
    refType: text("ref_type").notNull(),
    refId: text("ref_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    uxIdempotent: uniqueIndex("ux_impact_idempotent").on(table.reason, table.refType, table.refId, table.userId),
    ixUser: index("ix_impact_user").on(table.userId),
  }),
);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorUserId: integer("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  dataJson: text("data_json", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const SCHEMA_VERSION = 3;

export type Company = typeof companies.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type WelfarePlan = typeof welfarePlans.$inferSelect;
export type PlanExtraAllocation = typeof planExtraAllocations.$inferSelect;
export type VenueOffering = typeof venueOfferings.$inferSelect;
export type GrantEvent = typeof grantEvents.$inferSelect;
export type NewGrantEvent = typeof grantEvents.$inferInsert;
export type Voucher = typeof vouchers.$inferSelect;
export type VoucherSelection = typeof voucherSelections.$inferSelect;
export type MatchingGrant = typeof matchingGrants.$inferSelect;
export type GrantSeat = typeof grantSeats.$inferSelect;
export type GrantConfirmation = typeof grantConfirmations.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Share = typeof shares.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Session = typeof sessions.$inferSelect;

/** @deprecated use BenefitType */
export type VoucherType = BenefitType;
/** @deprecated use TransactionKind */
export type TransactionType = TransactionKind;

void sql;
