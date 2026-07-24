-- FR-022 / B-18 정기점검 일정.
-- schedule은 작업 템플릿과 원래 담당자 ID를 스냅샷으로 보존한다.
-- occurrence의 (schedule_id, occurrence_date)와 work_order_id UNIQUE가
-- 동시 sync 및 재시도에서 같은 작업이 두 번 만들어지는 것을 막는다.

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  source_work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  source_report_version_id TEXT REFERENCES report_versions (id),
  customer_id TEXT NOT NULL REFERENCES customers (id),
  site_id TEXT NOT NULL REFERENCES sites (id),
  asset_id TEXT REFERENCES assets (id),
  scheduled_time TEXT,
  work_type TEXT NOT NULL,
  request TEXT,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL
    CHECK (length(request_fingerprint) = 64),
  assignee_ids_json TEXT NOT NULL
    CHECK (
      CASE
        WHEN json_valid(assignee_ids_json)
        THEN json_type(assignee_ids_json) = 'array'
        ELSE 0
      END
    ),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  interval_count INTEGER NOT NULL CHECK (interval_count > 0),
  anchor_date TEXT NOT NULL,
  next_occurrence_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL
    CHECK (status IN ('active', 'paused', 'completed', 'canceled')),
  last_error_code TEXT,
  last_error_message TEXT,
  last_error_at TEXT,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_by TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (end_date IS NULL OR end_date >= anchor_date),
  CHECK (status <> 'active' OR next_occurrence_date IS NOT NULL),
  CHECK (status <> 'completed' OR next_occurrence_date IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS maintenance_schedules_source_work_uq
  ON maintenance_schedules (source_work_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS maintenance_schedules_org_idempotency_uq
  ON maintenance_schedules (org_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS maintenance_schedules_org_source_report_uq
  ON maintenance_schedules (org_id, source_report_version_id)
  WHERE source_report_version_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS maintenance_schedules_org_status_next_idx
  ON maintenance_schedules (org_id, status, next_occurrence_date);

CREATE TABLE IF NOT EXISTS maintenance_occurrences (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  schedule_id TEXT NOT NULL REFERENCES maintenance_schedules (id),
  occurrence_date TEXT NOT NULL,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS maintenance_occurrences_schedule_date_uq
  ON maintenance_occurrences (schedule_id, occurrence_date);
CREATE UNIQUE INDEX IF NOT EXISTS maintenance_occurrences_work_order_uq
  ON maintenance_occurrences (work_order_id);
CREATE INDEX IF NOT EXISTS maintenance_occurrences_org_schedule_idx
  ON maintenance_occurrences (org_id, schedule_id, occurrence_date);
