import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type UserRole = "employee" | "friend" | "provider" | "csr" | "promoter" | "admin";
export type BenefitType = "overnight" | "dinner";
export type VoucherType = "hotel" | "aperitivo" | "theater" | "overnight" | "dinner";
export type VoucherStatus = "available" | "assigned" | "selected" | "redeemed" | "attended" | "no_show" | "expired";
export type VoucherOrigin = "base" | "extra";
export type TransactionType = "welfare_redeem" | "welfare_charge" | "consumer_payment" | "grant_settlement";
export type AttendanceStatus = "pending" | "attended" | "no_show";
export type GrantStatus = "assigned" | "confirmation_sent" | "confirmed" | "declined" | "expired" | "attended" | "no_show";
export type GrantEventCategory = "teatro" | "musica" | "arte_cultura" | "natura_laboratorio";

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

export const welfarePlans = sqliteTable("welfare_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  year: integer("year").notNull(),
  validFrom: integer("valid_from", { mode: "timestamp" }).notNull(),
  validUntil: integer("valid_until", { mode: "timestamp" }).notNull(),
  eligibleEmployees: integer("eligible_employees").notNull().default(0),
  overnightAmountCents: integer("overnight_amount_cents").notNull().default(5000),
  dinnerAmountCents: integer("dinner_amount_cents").notNull().default(2500),
  overnightExtraThresholdBps: integer("overnight_extra_threshold_bps").notNull().default(2000), // 20%
  overnightExtraCapBps: integer("overnight_extra_cap_bps").notNull().default(2000),             // 20%
  dinnerExtraThresholdBps: integer("dinner_extra_threshold_bps").notNull().default(2000),       // 20%
  dinnerExtraCapBps: integer("dinner_extra_cap_bps").notNull().default(2000),                   // 20%
  status: text("status").notNull().default("active"), // 'draft' | 'active' | 'closed'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const planExtraAllocations = sqliteTable("plan_extra_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id")
    .notNull()
    .references(() => welfarePlans.id),
  benefitType: text("benefit_type").$type<BenefitType>().notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  selectedAtTime: integer("selected_at_time").notNull(),
  availableAtTime: integer("available_at_time").notNull(),
  vouchersGranted: integer("vouchers_granted").notNull(),
  note: text("note"),
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

export const users = sqliteTable("users", {
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
});

export const venues = sqliteTable("venues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // 'hotel' | 'agriturismo' | 'theater' | 'restaurant'
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
  aperitivoMenu: text("aperitivo_menu", { mode: "json" })
    .$type<Array<{ name: string; description: string; priceCents: number }>>()
    .default([]),
  rooms: text("rooms", { mode: "json" })
    .$type<
      Array<{
        name: string;
        description: string;
        capacity: number;
        priceCents: number;
      }>
    >()
    .default([]),
  priceHotelCents: integer("price_hotel_cents").notNull().default(0),
  priceAperitivoCents: integer("price_aperitivo_cents").notNull().default(0),
  priceShowCents: integer("price_show_cents").notNull().default(0),
  checkinCode: text("checkin_code").notNull().unique(),
  providerUserId: integer("provider_user_id").references(() => users.id),
  sponsorCompanyId: integer("sponsor_company_id").references(() => companies.id),
  impactPointsGenerated: integer("impact_points_generated").notNull().default(1),
  localSupportPercent: integer("local_support_percent").notNull().default(10),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const venueOfferings = sqliteTable("venue_offerings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id),
  benefitType: text("benefit_type").$type<BenefitType>().notNull(), // 'overnight' | 'dinner'
  name: text("name").notNull(),
  description: text("description"),
  listPriceCents: integer("list_price_cents").notNull().default(0),
  acceptsWelfare: integer("accepts_welfare", { mode: "boolean" }).notNull().default(true),
  dailyCapacity: integer("daily_capacity").default(10),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const grantEvents = sqliteTable("grant_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  category: text("category").$type<GrantEventCategory>().notNull().default("teatro"),
  venueId: integer("venue_id").references(() => venues.id),
  venueName: text("venue_name").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(),
  description: text("description").notNull(),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  capacity: integer("capacity").notNull().default(50),
  grantAmountCents: integer("grant_amount_cents").notNull().default(5000),
  confirmationSendDays: integer("confirmation_send_days").notNull().default(7),
  confirmationDeadlineDays: integer("confirmation_deadline_days").notNull().default(3),
  artistMeetupIncluded: integer("artist_meetup_included", { mode: "boolean" }).default(true),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const vouchers = sqliteTable("vouchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").references(() => welfarePlans.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  type: text("type").$type<VoucherType>().notNull(), // 'overnight' | 'dinner' (compat: 'hotel' | 'aperitivo' | 'theater')
  status: text("status").$type<VoucherStatus>().notNull().default("available"),
  origin: text("origin").$type<VoucherOrigin>().notNull().default("base"),
  extraAllocationId: integer("extra_allocation_id").references(() => planExtraAllocations.id),
  slotIndex: integer("slot_index").notNull().default(1),
  amountCents: integer("amount_cents").notNull().default(0),
  venueId: integer("venue_id").references(() => venues.id),
  theaterVenueId: integer("theater_venue_id").references(() => venues.id),
  grantEventId: integer("grant_event_id").references(() => grantEvents.id),
  redeemedAt: integer("redeemed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const voucherSelections = sqliteTable("voucher_selections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voucherId: integer("voucher_id")
    .notNull()
    .unique()
    .references(() => vouchers.id),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id),
  offeringId: integer("offering_id").references(() => venueOfferings.id),
  serviceDate: text("service_date").notNull(), // YYYY-MM-DD
  selectedAt: integer("selected_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  attendanceStatus: text("attendance_status").$type<AttendanceStatus>().notNull().default("pending"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
  checkedInByUserId: integer("checked_in_by_user_id").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const matchingGrants = sqliteTable("matching_grants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voucherId: integer("voucher_id")
    .notNull()
    .unique()
    .references(() => vouchers.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => grantEvents.id),
  amountCents: integer("amount_cents").notNull().default(5000), // 50€ totale
  seatsRequested: integer("seats_requested").notNull().default(2), // 1 o 2
  status: text("status").$type<GrantStatus>().notNull().default("assigned"),
  assignedAt: integer("assigned_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  attendedAt: integer("attended_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const grantSeats = sqliteTable("grant_seats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchingGrantId: integer("matching_grant_id")
    .notNull()
    .references(() => matchingGrants.id),
  holderRole: text("holder_role").$type<"employee" | "companion">().notNull(),
  holderName: text("holder_name"),
  holderEmail: text("holder_email"),
  valueCents: integer("value_cents").notNull().default(2500),
  attended: integer("attended", { mode: "boolean" }).notNull().default(false),
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const grantConfirmations = sqliteTable("grant_confirmations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchingGrantId: integer("matching_grant_id")
    .notNull()
    .references(() => matchingGrants.id),
  token: text("token").notNull().unique(),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
  respondBy: integer("respond_by", { mode: "timestamp" }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  response: text("response").$type<"confirmed" | "declined">(),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  reminderCount: integer("reminder_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const invites = sqliteTable("invites", {
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").$type<TransactionType>().notNull(),
  status: text("status").notNull().default("completed"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id),
  companyId: integer("company_id").references(() => companies.id),
  inviteId: integer("invite_id").references(() => invites.id),
  voucherId: integer("voucher_id").references(() => vouchers.id),
  amountCents: integer("amount_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  listPriceCents: integer("list_price_cents").notNull(),
  serviceLabel: text("service_label").notNull(),
  invoiceNumber: text("invoice_number"),
  invoiceDate: text("invoice_date"),
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending' | 'settled'
  settledAt: integer("settled_at", { mode: "timestamp" }),
  commissionBps: integer("commission_bps").notNull().default(1000), // 10% commissione piattaforma Radici
  commissionAmountCents: integer("commission_amount_cents").notNull().default(0),
  providerNetCents: integer("provider_net_cents").notNull().default(0),
  paymentNotes: text("payment_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id),
  type: text("type").notNull().default("welfare"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  payload: text("payload", { mode: "json" })
    .$type<Record<string, any>>()
    .notNull()
    .default({}),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
  type: text("type").notNull(), // 'economic' | 'co2'
  title: text("title").notNull(),
  description: text("description").notNull(),
  impactValue: text("impact_value").notNull(),
  unitLabel: text("unit_label").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Company = typeof companies.$inferSelect;
export type WelfarePlan = typeof welfarePlans.$inferSelect;
export type PlanExtraAllocation = typeof planExtraAllocations.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type VenueOffering = typeof venueOfferings.$inferSelect;
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

export type BookingType = "hospitality" | "dinner" | "theater_event" | "experience";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "presence_confirmed"
  | "rejected"
  | "cancelled"
  | "attended"
  | "no_show";

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id),
  offeringId: integer("offering_id").references(() => venueOfferings.id),
  grantEventId: integer("grant_event_id").references(() => grantEvents.id),
  bookingType: text("booking_type").$type<BookingType>().notNull().default("hospitality"),
  bookingDate: text("booking_date").notNull(), // YYYY-MM-DD
  timeSlot: text("time_slot"), // es: "20:30", "14:00"
  partySize: integer("party_size").notNull().default(1),
  discountPercent: integer("discount_percent").notNull().default(10), // sconto community convenzione
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  finalPriceCents: integer("final_price_cents").notNull().default(0),
  status: text("status").$type<BookingStatus>().notNull().default("pending"),
  confirmationToken: text("confirmation_token").notNull().unique(),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  presenceConfirmedAt: integer("presence_confirmed_at", { mode: "timestamp" }),
  attendedAt: integer("attended_at", { mode: "timestamp" }),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type GrantEvent = typeof grantEvents.$inferSelect;
export type NewGrantEvent = typeof grantEvents.$inferInsert;
