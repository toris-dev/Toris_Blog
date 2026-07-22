-- CEO Command Center 테이블 (수동 입력 MVP)
-- builder_id 는 앱 전체 관례에 따라 사용자 email 을 사용한다.

CREATE TABLE IF NOT EXISTS receivables (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  customer TEXT NOT NULL,
  amount_krw INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS receivables_builder_idx ON receivables(builder_id);

CREATE TABLE IF NOT EXISTS payment_failures (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  mrr_krw INTEGER NOT NULL DEFAULT 0,
  failed_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS payment_failures_builder_idx ON payment_failures(builder_id);

CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  estimated_impact_krw INTEGER NOT NULL DEFAULT 0,
  done_at TEXT
);
CREATE INDEX IF NOT EXISTS deadlines_builder_idx ON deadlines(builder_id);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  channel TEXT NOT NULL, -- email|webform|chat|survey|manual
  kind TEXT NOT NULL, -- inquiry|feedback|churn|bug
  text TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 1,
  estimated_impact_krw INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS signals_builder_idx ON signals(builder_id);

CREATE TABLE IF NOT EXISTS financial_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id TEXT NOT NULL,
  cash_krw INTEGER NOT NULL DEFAULT 0,
  monthly_revenue_krw INTEGER NOT NULL DEFAULT 0,
  monthly_fixed_cost_krw INTEGER NOT NULL DEFAULT 0,
  monthly_variable_cost_krw INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS financial_snapshots_builder_idx ON financial_snapshots(builder_id, recorded_at);

CREATE TABLE IF NOT EXISTS loss_prevented (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  kind TEXT NOT NULL, -- recovered_receivable|recovered_payment|canceled_subscription|prevented_expiry|reduced_inquiry_time|recovered_churn
  amount_krw INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS loss_prevented_builder_idx ON loss_prevented(builder_id, occurred_at);

CREATE TABLE IF NOT EXISTS feature_requests (
  id TEXT PRIMARY KEY,
  builder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  customer_value_krw INTEGER NOT NULL DEFAULT 0,
  revenue_churn_impact_krw INTEGER NOT NULL DEFAULT 0,
  strategy_fit REAL NOT NULL DEFAULT 0.5,
  urgency REAL NOT NULL DEFAULT 0,
  estimated_effort_days REAL NOT NULL DEFAULT 1,
  origin TEXT NOT NULL DEFAULT 'customer', -- customer|founder
  status TEXT NOT NULL DEFAULT 'not_now', -- not_now|this_week|done
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feature_requests_builder_idx ON feature_requests(builder_id);
