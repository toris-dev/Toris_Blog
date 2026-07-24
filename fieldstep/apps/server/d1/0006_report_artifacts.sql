-- 확정 보고서의 실제 PDF 산출물과 생성/복구 상태.
-- PDF 원문은 비공개 MEDIA R2에 두고 D1에는 불변 키와 무결성 메타데이터만 저장한다.

CREATE TABLE IF NOT EXISTS report_artifacts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  report_version_id TEXT NOT NULL REFERENCES report_versions (id),
  approval_request_id TEXT REFERENCES approval_requests (id),
  base_artifact_id TEXT REFERENCES report_artifacts (id),
  kind TEXT NOT NULL CHECK (kind IN ('approval', 'signed')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'ready', 'failed')),
  renderer_version TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  storage_key TEXT,
  mime_type TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes > 0),
  etag TEXT,
  checksum_sha256 TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code TEXT,
  last_error_message TEXT,
  created_by TEXT REFERENCES users (id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ready_at TEXT,
  CHECK (
    (kind = 'approval' AND approval_request_id IS NULL AND base_artifact_id IS NULL)
    OR
    (kind = 'signed' AND approval_request_id IS NOT NULL AND base_artifact_id IS NOT NULL)
  ),
  CHECK (
    (status = 'ready'
      AND storage_key IS NOT NULL
      AND mime_type = 'application/pdf'
      AND size_bytes IS NOT NULL
      AND etag IS NOT NULL
      AND checksum_sha256 IS NOT NULL
      AND ready_at IS NOT NULL)
    OR status <> 'ready'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS report_artifacts_version_kind_uq
  ON report_artifacts (report_version_id, kind);
CREATE UNIQUE INDEX IF NOT EXISTS report_artifacts_storage_key_uq
  ON report_artifacts (storage_key);
CREATE INDEX IF NOT EXISTS report_artifacts_org_idx
  ON report_artifacts (org_id);
CREATE INDEX IF NOT EXISTS report_artifacts_work_order_idx
  ON report_artifacts (work_order_id);
CREATE INDEX IF NOT EXISTS report_artifacts_approval_request_idx
  ON report_artifacts (approval_request_id);
CREATE INDEX IF NOT EXISTS report_artifacts_status_idx
  ON report_artifacts (status, updated_at);
