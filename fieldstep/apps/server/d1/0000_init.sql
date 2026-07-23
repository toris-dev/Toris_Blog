-- 현장완료 (fieldstep) D1 초기 스키마

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  pw_salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_org_user_uq ON memberships (org_id, user_id);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id),
  org_id TEXT NOT NULL REFERENCES organizations (id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uq ON sessions (token_hash);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS invites_token_hash_uq ON invites (token_hash);
CREATE INDEX IF NOT EXISTS invites_org_idx ON invites (org_id);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  name TEXT NOT NULL,
  biz_no TEXT,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  memo TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS customers_org_idx ON customers (org_id);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  customer_id TEXT NOT NULL REFERENCES customers (id),
  name TEXT NOT NULL,
  address TEXT,
  access_info TEXT,
  map_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sites_org_idx ON sites (org_id);
CREATE INDEX IF NOT EXISTS sites_customer_idx ON sites (customer_id);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  site_id TEXT NOT NULL REFERENCES sites (id),
  name TEXT NOT NULL,
  model TEXT,
  serial_no TEXT,
  installed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS assets_org_idx ON assets (org_id);
CREATE INDEX IF NOT EXISTS assets_site_idx ON assets (site_id);

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  customer_id TEXT NOT NULL REFERENCES customers (id),
  site_id TEXT NOT NULL REFERENCES sites (id),
  asset_id TEXT REFERENCES assets (id),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  work_type TEXT NOT NULL,
  request TEXT,
  work_status TEXT NOT NULL DEFAULT 'scheduled',
  approval_status TEXT NOT NULL DEFAULT 'not_sent',
  billing_status TEXT NOT NULL DEFAULT 'none',
  ai_status TEXT NOT NULL DEFAULT 'idle',
  started_at TEXT,
  submitted_at TEXT,
  reviewed_at TEXT,
  completed_at TEXT,
  canceled_at TEXT,
  created_by TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS work_orders_org_idx ON work_orders (org_id);
CREATE INDEX IF NOT EXISTS work_orders_org_date_idx ON work_orders (org_id, scheduled_date);
CREATE INDEX IF NOT EXISTS work_orders_org_status_idx ON work_orders (org_id, work_status);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  user_id TEXT NOT NULL REFERENCES users (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS assignments_wo_user_uq ON assignments (work_order_id, user_id);
CREATE INDEX IF NOT EXISTS assignments_user_idx ON assignments (user_id);

CREATE TABLE IF NOT EXISTS field_records (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  work_summary TEXT,
  transcript TEXT,
  parts_json TEXT,
  issues TEXT,
  notes TEXT,
  next_inspection_date TEXT,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS field_records_wo_uq ON field_records (work_order_id);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  kind TEXT NOT NULL,
  data_url TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS photos_wo_idx ON photos (work_order_id);

CREATE TABLE IF NOT EXISTS report_drafts (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  structured_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS report_drafts_wo_uq ON report_drafts (work_order_id);

CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  version INTEGER NOT NULL,
  report_number TEXT NOT NULL,
  structured_json TEXT NOT NULL,
  photos_json TEXT NOT NULL,
  template_version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  locked_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS report_versions_wo_version_uq ON report_versions (work_order_id, version);
CREATE INDEX IF NOT EXISTS report_versions_wo_idx ON report_versions (work_order_id);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  report_version_id TEXT NOT NULL REFERENCES report_versions (id),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  viewed_at TEXT,
  decided_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE UNIQUE INDEX IF NOT EXISTS approval_requests_token_hash_uq ON approval_requests (token_hash);
CREATE INDEX IF NOT EXISTS approval_requests_wo_idx ON approval_requests (work_order_id);

CREATE TABLE IF NOT EXISTS signatures (
  id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL REFERENCES approval_requests (id),
  name TEXT NOT NULL,
  title TEXT,
  signature_data_url TEXT NOT NULL,
  approved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS signatures_approval_idx ON signatures (approval_request_id);

CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  amount REAL,
  billed_at TEXT,
  due_at TEXT,
  paid_at TEXT,
  memo TEXT,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_records_wo_uq ON billing_records (work_order_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  user_id TEXT REFERENCES users (id),
  type TEXT NOT NULL,
  work_order_id TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS notifications_org_idx ON notifications (org_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  actor_user_id TEXT REFERENCES users (id),
  event TEXT NOT NULL,
  target TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_org_idx ON audit_events (org_id);

-- 로그인 무차별 대입 스로틀 상태 (key = "<ip>:<email>", 슬라이딩 윈도우 카운터)
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);
