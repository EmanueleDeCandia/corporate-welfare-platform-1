export const SCHEMA_VERSION = 4;

export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  vat_number TEXT NOT NULL,
  city TEXT NOT NULL,
  sector TEXT NOT NULL,
  employees_count INTEGER NOT NULL DEFAULT 0,
  funded_amount_cents INTEGER NOT NULL DEFAULT 0,
  impact_rating INTEGER NOT NULL DEFAULT 0,
  local_redistribution_cents INTEGER NOT NULL DEFAULT 0,
  co2_saved_kg INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '#1C3A2E',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  cover_image TEXT NOT NULL,
  highlight TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','friend','provider','csr','promoter','admin')),
  company_id INTEGER REFERENCES companies(id),
  venue_id INTEGER,
  impact_points INTEGER NOT NULL DEFAULT 0,
  badge_level TEXT NOT NULL DEFAULT 'Esploratore',
  referral_code TEXT NOT NULL UNIQUE,
  invited_by_user_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('hotel','agriturismo','restaurant','theater','show_venue')),
  destination_id INTEGER NOT NULL REFERENCES destinations(id),
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  cover_image TEXT NOT NULL,
  gallery TEXT DEFAULT '[]',
  services TEXT DEFAULT '[]',
  checkin_code TEXT NOT NULL UNIQUE,
  provider_user_id INTEGER REFERENCES users(id),
  sponsor_company_id INTEGER REFERENCES companies(id),
  impact_points_generated INTEGER NOT NULL DEFAULT 1,
  local_support_percent INTEGER NOT NULL DEFAULT 10,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS welfare_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  year INTEGER NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  eligible_employees INTEGER NOT NULL CHECK (eligible_employees >= 0),
  overnight_amount_cents INTEGER NOT NULL DEFAULT 5000 CHECK (overnight_amount_cents >= 0),
  dinner_amount_cents INTEGER NOT NULL DEFAULT 2500 CHECK (dinner_amount_cents >= 0),
  overnight_extra_threshold_bps INTEGER NOT NULL DEFAULT 2000,
  overnight_extra_cap_bps INTEGER NOT NULL DEFAULT 2000,
  dinner_extra_threshold_bps INTEGER NOT NULL DEFAULT 2000,
  dinner_extra_cap_bps INTEGER NOT NULL DEFAULT 2000,
  extra_window_days INTEGER NOT NULL DEFAULT 30 CHECK (extra_window_days >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (company_id, year)
);

CREATE TABLE IF NOT EXISTS plan_extra_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES welfare_plans(id),
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('overnight','dinner')),
  selected_at_time INTEGER NOT NULL,
  available_at_time INTEGER NOT NULL,
  vouchers_granted INTEGER NOT NULL CHECK (vouchers_granted > 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS venue_offerings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('overnight','dinner')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  list_price_cents INTEGER NOT NULL CHECK (list_price_cents >= 0),
  accepts_welfare INTEGER NOT NULL DEFAULT 1,
  daily_capacity INTEGER,
  friend_discount_bps INTEGER NOT NULL DEFAULT 1000,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (venue_id, benefit_type, name)
);

CREATE TABLE IF NOT EXISTS grant_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'teatro' CHECK (category IN ('teatro','musica','arte_cultura','natura_laboratorio')),
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  description TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  per_person_cents INTEGER NOT NULL DEFAULT 2500 CHECK (per_person_cents >= 0),
  confirmation_send_days INTEGER NOT NULL DEFAULT 7,
  confirmation_deadline_days INTEGER NOT NULL DEFAULT 3,
  artist_meetup_included INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES welfare_plans(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  company_id INTEGER NOT NULL REFERENCES companies(id),
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('overnight','dinner')),
  origin TEXT NOT NULL DEFAULT 'base' CHECK (origin IN ('base','extra')),
  extra_allocation_id INTEGER REFERENCES plan_extra_allocations(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','selected','attended','no_show','expired')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((origin = 'extra') = (extra_allocation_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS voucher_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL UNIQUE REFERENCES vouchers(id),
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  offering_id INTEGER NOT NULL REFERENCES venue_offerings(id),
  service_date TEXT NOT NULL,
  selected_at INTEGER NOT NULL DEFAULT (unixepoch()),
  attendance_status TEXT NOT NULL DEFAULT 'pending' CHECK (attendance_status IN ('pending','attended','no_show')),
  checked_in_at INTEGER,
  checked_in_by_user_id INTEGER REFERENCES users(id),
  no_show_marked_at INTEGER,
  qr_token TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS matching_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL UNIQUE REFERENCES vouchers(id),
  event_id INTEGER NOT NULL REFERENCES grant_events(id),
  amount_cents INTEGER NOT NULL DEFAULT 5000 CHECK (amount_cents >= 0),
  seats_requested INTEGER NOT NULL DEFAULT 2 CHECK (seats_requested BETWEEN 1 AND 2),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','confirmation_sent','confirmed','declined','expired','attended','no_show')),
  assigned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  confirmed_at INTEGER,
  attended_at INTEGER,
  qr_token TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS grant_seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matching_grant_id INTEGER NOT NULL REFERENCES matching_grants(id),
  holder_role TEXT NOT NULL CHECK (holder_role IN ('employee','companion')),
  holder_name TEXT NOT NULL,
  holder_email TEXT,
  value_cents INTEGER NOT NULL DEFAULT 2500 CHECK (value_cents >= 0),
  attended INTEGER NOT NULL DEFAULT 0,
  attended_at INTEGER,
  UNIQUE (matching_grant_id, holder_role)
);

CREATE TABLE IF NOT EXISTS grant_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matching_grant_id INTEGER NOT NULL REFERENCES matching_grants(id),
  token TEXT NOT NULL UNIQUE,
  scheduled_for INTEGER NOT NULL,
  respond_by INTEGER NOT NULL,
  sent_at INTEGER,
  channel TEXT NOT NULL DEFAULT 'email',
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  response TEXT,
  responded_at INTEGER,
  reminder_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  friend_user_id INTEGER REFERENCES users(id),
  expires_at INTEGER,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (inviter_id, email)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('welfare_charge','consumer_payment')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','invoiced','paid','refunded','receipted')),
  user_id INTEGER NOT NULL REFERENCES users(id),
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  company_id INTEGER REFERENCES companies(id),
  invite_id INTEGER REFERENCES invites(id),
  voucher_id INTEGER REFERENCES vouchers(id),
  selection_id INTEGER REFERENCES voucher_selections(id),
  offering_id INTEGER REFERENCES venue_offerings(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  list_price_cents INTEGER NOT NULL CHECK (list_price_cents >= 0),
  service_label TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','settled')),
  commission_bps INTEGER NOT NULL DEFAULT 2000 CHECK (commission_bps >= 0 AND commission_bps <= 10000),
  commission_cents INTEGER NOT NULL DEFAULT 0 CHECK (commission_cents >= 0),
  provider_net_cents INTEGER NOT NULL DEFAULT 0 CHECK (provider_net_cents >= 0),
  invoice_recorded_at INTEGER,
  payment_settled_at INTEGER,
  idempotency_key TEXT UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (commission_cents + provider_net_cents = amount_cents)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  type TEXT NOT NULL DEFAULT 'welfare',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  read INTEGER NOT NULL DEFAULT 0,
  transaction_id INTEGER REFERENCES transactions(id),
  selection_id INTEGER REFERENCES voucher_selections(id),
  recipient_user_id INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  venue_id INTEGER REFERENCES venues(id),
  caption TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_value TEXT NOT NULL,
  unit_label TEXT NOT NULL,
  protocol_number TEXT NOT NULL UNIQUE,
  period TEXT NOT NULL DEFAULT '2026',
  calculation_json TEXT DEFAULT '{}',
  issued_by TEXT NOT NULL DEFAULT 'Comitato ESG RADICI',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS impact_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (reason, ref_type, ref_id, user_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  data_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_voucher_base
  ON vouchers(plan_id, user_id, benefit_type) WHERE origin = 'base';
CREATE UNIQUE INDEX IF NOT EXISTS ux_voucher_extra
  ON vouchers(plan_id, user_id, benefit_type) WHERE origin = 'extra';
CREATE UNIQUE INDEX IF NOT EXISTS ux_tx_welfare_voucher
  ON transactions(voucher_id) WHERE voucher_id IS NOT NULL AND kind = 'welfare_charge';
CREATE INDEX IF NOT EXISTS ix_vouchers_user ON vouchers(user_id, status);
CREATE INDEX IF NOT EXISTS ix_vouchers_plan ON vouchers(plan_id, status);
CREATE INDEX IF NOT EXISTS ix_selections_venue_date ON voucher_selections(venue_id, service_date);
CREATE INDEX IF NOT EXISTS ix_grants_event ON matching_grants(event_id, status);
CREATE INDEX IF NOT EXISTS ix_tx_venue ON transactions(venue_id, created_at);
CREATE INDEX IF NOT EXISTS ix_tx_payment ON transactions(kind, payment_status);
CREATE INDEX IF NOT EXISTS ix_tx_company ON transactions(company_id, created_at);
CREATE INDEX IF NOT EXISTS ix_notifications_venue ON notifications(venue_id, read);
CREATE INDEX IF NOT EXISTS ix_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_extra_plan_type ON plan_extra_allocations(plan_id, benefit_type);
CREATE INDEX IF NOT EXISTS ix_offering_venue ON venue_offerings(venue_id, benefit_type);
CREATE INDEX IF NOT EXISTS ix_grant_events_starts ON grant_events(starts_at);
CREATE INDEX IF NOT EXISTS ix_impact_user ON impact_ledger(user_id);

CREATE TRIGGER IF NOT EXISTS trg_grant_only_overnight
BEFORE INSERT ON matching_grants
BEGIN
  SELECT RAISE(ABORT, 'Matching Grant solo per voucher Pernottamento selezionati')
  WHERE (
    SELECT benefit_type FROM vouchers WHERE id = NEW.voucher_id
  ) <> 'overnight'
  OR (
    SELECT status FROM vouchers WHERE id = NEW.voucher_id
  ) NOT IN ('selected', 'attended', 'no_show');
END;

CREATE VIEW IF NOT EXISTS v_plan_budget AS
SELECT
  p.id AS plan_id,
  p.company_id,
  p.year,
  p.status,
  p.eligible_employees,
  p.valid_until,
  p.extra_window_days,
  p.overnight_amount_cents,
  p.dinner_amount_cents,
  p.eligible_employees AS overnight_base,
  p.eligible_employees AS dinner_base,
  p.eligible_employees * 2 AS vouchers_available,
  p.eligible_employees * (p.overnight_amount_cents + p.dinner_amount_cents) AS virtual_budget_cents,
  (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id AND v.benefit_type = 'overnight' AND v.origin = 'base' AND v.status IN ('selected','attended','no_show')) AS overnight_base_selected,
  (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id AND v.benefit_type = 'dinner' AND v.origin = 'base' AND v.status IN ('selected','attended','no_show')) AS dinner_base_selected,
  (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id AND v.benefit_type = 'overnight' AND v.status IN ('selected','attended','no_show')) AS overnight_selected,
  (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id AND v.benefit_type = 'dinner' AND v.status IN ('selected','attended','no_show')) AS dinner_selected,
  (SELECT COALESCE(SUM(v.amount_cents), 0) FROM vouchers v WHERE v.plan_id = p.id AND v.status IN ('selected','attended','no_show')) AS real_budget_cents,
  (SELECT COALESCE(SUM(a.vouchers_granted), 0) FROM plan_extra_allocations a WHERE a.plan_id = p.id AND a.benefit_type = 'overnight') AS overnight_extra_granted,
  (SELECT COALESCE(SUM(a.vouchers_granted), 0) FROM plan_extra_allocations a WHERE a.plan_id = p.id AND a.benefit_type = 'dinner') AS dinner_extra_granted,
  p.overnight_extra_threshold_bps,
  p.overnight_extra_cap_bps,
  p.dinner_extra_threshold_bps,
  p.dinner_extra_cap_bps
FROM welfare_plans p;

CREATE VIEW IF NOT EXISTS v_attendance AS
SELECT
  s.id AS selection_id,
  s.venue_id,
  s.service_date,
  s.attendance_status,
  v.benefit_type,
  v.company_id,
  v.user_id,
  s.selected_at,
  s.checked_in_at
FROM voucher_selections s
JOIN vouchers v ON v.id = s.voucher_id;

CREATE VIEW IF NOT EXISTS v_grant_pipeline AS
SELECT
  g.id AS grant_id,
  g.status,
  g.event_id,
  g.seats_requested,
  g.assigned_at,
  g.voucher_id,
  v.user_id,
  v.company_id
FROM matching_grants g
JOIN vouchers v ON v.id = g.voucher_id;

CREATE VIEW IF NOT EXISTS v_event_seats AS
SELECT
  e.id AS event_id,
  e.title,
  e.venue_id,
  e.capacity,
  e.starts_at,
  COALESCE((
    SELECT SUM(g.seats_requested)
    FROM matching_grants g
    WHERE g.event_id = e.id
      AND g.status IN ('assigned','confirmation_sent','confirmed','attended')
  ), 0) AS seats_occupied,
  e.capacity - COALESCE((
    SELECT SUM(g.seats_requested)
    FROM matching_grants g
    WHERE g.event_id = e.id
      AND g.status IN ('assigned','confirmation_sent','confirmed','attended')
  ), 0) AS seats_free
FROM grant_events e;

CREATE VIEW IF NOT EXISTS v_venue_offer_filter AS
SELECT
  vn.id AS venue_id,
  MAX(CASE WHEN o.benefit_type = 'overnight' AND o.active = 1 THEN 1 ELSE 0 END) AS offers_overnight,
  MAX(CASE WHEN o.benefit_type = 'dinner' AND o.active = 1 THEN 1 ELSE 0 END) AS offers_dinner,
  CASE
    WHEN MAX(CASE WHEN o.benefit_type = 'overnight' AND o.active = 1 THEN 1 ELSE 0 END) = 1
     AND MAX(CASE WHEN o.benefit_type = 'dinner' AND o.active = 1 THEN 1 ELSE 0 END) = 1
    THEN 1 ELSE 0
  END AS offers_both
FROM venues vn
LEFT JOIN venue_offerings o ON o.venue_id = vn.id
GROUP BY vn.id;
`;

export const DROP_ALL_SQL = `
PRAGMA foreign_keys = OFF;
DROP VIEW IF EXISTS v_venue_offer_filter;
DROP VIEW IF EXISTS v_event_seats;
DROP VIEW IF EXISTS v_grant_pipeline;
DROP VIEW IF EXISTS v_attendance;
DROP VIEW IF EXISTS v_plan_budget;
DROP TRIGGER IF EXISTS trg_grant_only_overnight;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS impact_ledger;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS grant_confirmations;
DROP TABLE IF EXISTS grant_seats;
DROP TABLE IF EXISTS matching_grants;
DROP TABLE IF EXISTS voucher_selections;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS grant_events;
DROP TABLE IF EXISTS venue_offerings;
DROP TABLE IF EXISTS plan_extra_allocations;
DROP TABLE IF EXISTS welfare_plans;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS companies;
PRAGMA foreign_keys = ON;
`;
