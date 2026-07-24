-- 기존 원격 D1에 조직 프로필, 초대 수명주기, CRM 활성 상태를 추가하는 멱등 마이그레이션.
-- 기존 행은 보조 테이블에 상태 행이 없으면 활성(active=1)으로 해석한다.

CREATE TABLE IF NOT EXISTS organization_profiles (
  org_id TEXT PRIMARY KEY REFERENCES organizations (id),
  logo_url TEXT,
  business_no TEXT,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_logo_assets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  etag TEXT,
  checksum_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_logo_assets_storage_key_uq
  ON organization_logo_assets (storage_key);
CREATE INDEX IF NOT EXISTS organization_logo_assets_org_idx
  ON organization_logo_assets (org_id, deleted_at);

CREATE TABLE IF NOT EXISTS invite_lifecycle (
  invite_id TEXT PRIMARY KEY REFERENCES invites (id),
  canceled_at TEXT,
  resend_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS master_entity_states (
  org_id TEXT NOT NULL REFERENCES organizations (id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'site', 'asset')),
  entity_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES users (id),
  PRIMARY KEY (org_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS master_entity_states_lookup_idx
  ON master_entity_states (org_id, entity_type, active);

CREATE TABLE IF NOT EXISTS asset_photos (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  site_id TEXT NOT NULL REFERENCES sites (id),
  asset_id TEXT NOT NULL REFERENCES assets (id),
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  etag TEXT,
  checksum_sha256 TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS asset_photos_storage_key_uq ON asset_photos (storage_key);
CREATE INDEX IF NOT EXISTS asset_photos_org_asset_idx
  ON asset_photos (org_id, asset_id, deleted_at);
CREATE INDEX IF NOT EXISTS asset_photos_site_idx ON asset_photos (site_id);
