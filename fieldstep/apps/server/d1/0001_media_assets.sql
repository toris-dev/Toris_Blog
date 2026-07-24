-- 기존 원격 D1에 비공개 R2 미디어 메타데이터를 추가하는 멱등 마이그레이션.

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'audio')),
  photo_kind TEXT CHECK (photo_kind IS NULL OR photo_kind IN ('before', 'after', 'other')),
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  etag TEXT,
  checksum_sha256 TEXT NOT NULL,
  caption TEXT,
  duration_seconds REAL CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  CHECK (
    (media_type = 'photo' AND photo_kind IS NOT NULL)
    OR (media_type = 'audio' AND photo_kind IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_storage_key_uq ON media_assets (storage_key);
CREATE INDEX IF NOT EXISTS media_assets_org_idx ON media_assets (org_id);
CREATE INDEX IF NOT EXISTS media_assets_wo_idx ON media_assets (work_order_id);
CREATE INDEX IF NOT EXISTS media_assets_org_wo_idx ON media_assets (org_id, work_order_id);
