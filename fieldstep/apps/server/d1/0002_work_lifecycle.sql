-- 작업지시 담당자 변경 이력을 append-only 이벤트로 보존한다.

CREATE TABLE IF NOT EXISTS assignment_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  work_order_id TEXT NOT NULL REFERENCES work_orders (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  action TEXT NOT NULL CHECK (action IN ('assigned', 'unassigned')),
  actor_user_id TEXT REFERENCES users (id),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS assignment_events_wo_idx
  ON assignment_events (work_order_id, created_at);
CREATE INDEX IF NOT EXISTS assignment_events_org_idx
  ON assignment_events (org_id, created_at);
