import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type UserRole = "employee" | "friend" | "provider" | "csr" | "promoter" | "admin";
export type VoucherType = "hotel" | "aperitivo" | "theater";
export type VoucherStatus = "available" | "redeemed" | "expired";
export type TransactionType = "welfare_redeem" | "consumer_payment";

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

export const vouchers = sqliteTable("vouchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  type: text("type").$type<VoucherType>().notNull(),
  status: text("status").$type<VoucherStatus>().notNull().default("available"),
  slotIndex: integer("slot_index").notNull().default(1),
  amountCents: integer("amount_cents").notNull().default(0),
  venueId: integer("venue_id").references(() => venues.id),
  redeemedAt: integer("redeemed_at", { mode: "timestamp" }),
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
export type Destination = typeof destinations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Share = typeof shares.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Session = typeof sessions.$inferSelect;
