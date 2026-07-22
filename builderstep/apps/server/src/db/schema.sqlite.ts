import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * D1(Workers) 배포용 스키마 — 래피드 결제/구독 연동 범위.
 * 전체 도메인 스키마(pg)는 schema.ts에 유지하고,
 * 프로덕션 워커는 이 최소 계약만 소유한다.
 */

/** 구독자 — 래피드가 인증을 소유하므로 이메일/외부 ID가 식별자다 */
export const subscribers = sqliteTable(
  "subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    rapidUserId: text("rapid_user_id"),
    plan: text("plan", { enum: ["monthly", "yearly"] }),
    status: text("status", {
      enum: ["none", "active", "grace", "canceled", "expired", "refunded"],
    })
      .notNull()
      .default("none"),
    currentPeriodEnd: text("current_period_end"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    emailUq: uniqueIndex("subscribers_email_uq").on(t.email),
  }),
);

/** 앱 사용자 — 구글 로그인 이메일이 식별자, 진단된 단계 저장 */
export const appUsers = sqliteTable("app_users", {
  email: text("email").primaryKey(),
  uid: text("uid"),
  name: text("name"),
  stage: integer("stage").notNull().default(0),
  diagnosedAt: text("diagnosed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 목표 트래킹 — 무료 3개 제한은 API에서 강제 */
export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  title: text("title").notNull(),
  stage: integer("stage"),
  status: text("status", { enum: ["todo", "doing", "done"] })
    .notNull()
    .default("todo"),
  retro: text("retro"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** 커뮤니티 글 — 열람 무료, 작성은 PRO */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  author: text("author").notNull(),
  type: text("type", { enum: ["story", "feedback", "match"] })
    .notNull()
    .default("story"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

/** 전문가 상담 예약 — PRO */
export const expertSessions = sqliteTable("expert_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  topic: text("topic", { enum: ["marketing", "pricing", "tax", "legal"] }).notNull(),
  preferredAt: text("preferred_at").notNull(),
  note: text("note"),
  status: text("status", { enum: ["requested", "confirmed", "done", "canceled"] })
    .notNull()
    .default("requested"),
  createdAt: text("created_at").notNull(),
});

/** 일별 지표 — PRO */
export const metrics = sqliteTable(
  "metrics",
  {
    email: text("email").notNull(),
    date: text("date").notNull(),
    revenue: integer("revenue").notNull().default(0),
    users: integer("users").notNull().default(0),
  },
  (t) => ({
    pk: uniqueIndex("metrics_email_date_uq").on(t.email, t.date),
  }),
);

/** 웹훅 수신 로그 — 이벤트 ID로 중복 처리 방지 */
export const webhookEvents = sqliteTable(
  "webhook_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    provider: text("provider").notNull().default("rapid"),
    externalId: text("external_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: text("payload").notNull(),
    receivedAt: text("received_at").notNull(),
  },
  (t) => ({
    externalUq: uniqueIndex("webhook_events_external_uq").on(t.provider, t.externalId),
  }),
);

// ---------------------------------------------------------------------------
// CEO Command Center (수동 입력 MVP) — builder_id 는 사용자 email
// ---------------------------------------------------------------------------

export const receivables = sqliteTable("receivables", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  customer: text("customer").notNull(),
  amountKrw: integer("amount_krw").notNull(),
  dueDate: text("due_date").notNull(),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull(),
});

export const paymentFailures = sqliteTable("payment_failures", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  subscriptionId: text("subscription_id").notNull(),
  mrrKrw: integer("mrr_krw").notNull().default(0),
  failedAt: text("failed_at").notNull(),
  retryCount: integer("retry_count").notNull().default(0),
  resolvedAt: text("resolved_at"),
});

export const deadlines = sqliteTable("deadlines", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date").notNull(),
  estimatedImpactKrw: integer("estimated_impact_krw").notNull().default(0),
  doneAt: text("done_at"),
});

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  channel: text("channel", {
    enum: ["email", "webform", "chat", "survey", "manual"],
  }).notNull(),
  kind: text("kind", { enum: ["inquiry", "feedback", "churn", "bug"] }).notNull(),
  text: text("text").notNull().default(""),
  count: integer("count").notNull().default(1),
  estimatedImpactKrw: integer("estimated_impact_krw").notNull().default(0),
  receivedAt: text("received_at").notNull(),
});

export const financialSnapshots = sqliteTable("financial_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  builderId: text("builder_id").notNull(),
  cashKrw: integer("cash_krw").notNull().default(0),
  monthlyRevenueKrw: integer("monthly_revenue_krw").notNull().default(0),
  monthlyFixedCostKrw: integer("monthly_fixed_cost_krw").notNull().default(0),
  monthlyVariableCostKrw: integer("monthly_variable_cost_krw").notNull().default(0),
  recordedAt: text("recorded_at").notNull(),
});

export const lossPrevented = sqliteTable("loss_prevented", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  kind: text("kind", {
    enum: [
      "recovered_receivable",
      "recovered_payment",
      "canceled_subscription",
      "prevented_expiry",
      "reduced_inquiry_time",
      "recovered_churn",
    ],
  }).notNull(),
  amountKrw: integer("amount_krw").notNull().default(0),
  note: text("note").notNull().default(""),
  occurredAt: text("occurred_at").notNull(),
});

export const featureRequests = sqliteTable("feature_requests", {
  id: text("id").primaryKey(),
  builderId: text("builder_id").notNull(),
  title: text("title").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  customerValueKrw: integer("customer_value_krw").notNull().default(0),
  revenueChurnImpactKrw: integer("revenue_churn_impact_krw").notNull().default(0),
  strategyFit: real("strategy_fit").notNull().default(0.5),
  urgency: real("urgency").notNull().default(0),
  estimatedEffortDays: real("estimated_effort_days").notNull().default(1),
  origin: text("origin", { enum: ["customer", "founder"] }).notNull().default("customer"),
  status: text("status", { enum: ["not_now", "this_week", "done"] })
    .notNull()
    .default("not_now"),
  createdAt: text("created_at").notNull(),
});
