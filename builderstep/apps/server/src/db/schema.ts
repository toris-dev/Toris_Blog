import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * 사업화 8단계 (BuilderStep 도메인 계약).
 * idea -> validation -> mvp -> launch -> user_acquisition -> first_revenue -> recurring_revenue -> growth
 */
export const stageEnum = pgEnum("stage", [
  "idea",
  "validation",
  "mvp",
  "launch",
  "user_acquisition",
  "first_revenue",
  "recurring_revenue",
  "growth",
]);

/** 구독 결제 주기 */
export const planEnum = pgEnum("plan", ["monthly", "yearly"]);

/** 결제 채널 */
export const channelEnum = pgEnum("channel", ["PG", "APPLE", "GOOGLE"]);

/** 구독 상태 */
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "grace",
  "canceled",
  "expired",
  "refunded",
]);

/** 결제 이벤트(billing_events) 검증 상태 */
export const billingVerificationEnum = pgEnum("billing_verification", [
  "verified",
  "rejected",
]);

/** 인증 제공자 */
export const authProviderEnum = pgEnum("auth_provider", ["google", "apple", "github"]);

/** 단계 전이 사유 */
export const stageChangeSourceEnum = pgEnum("stage_change_source", [
  "diagnosis",
  "rediagnosis",
]);

/** 실행 과제 상태 */
export const taskStatusEnum = pgEnum("task_status", ["todo", "done"]);

/** 성과 지표 종류 */
export const metricKindEnum = pgEnum("metric_kind", ["users", "revenue", "custom"]);

/** 1인 개발자(빌더) 계정 */
export const builders = pgTable("builders", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  provider: authProviderEnum("provider").notNull(),
  nickname: text("nickname").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 빌더가 등록한 프로젝트. 현재 사업화 단계를 보유한다. */
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  builderId: uuid("builder_id")
    .notNull()
    .references(() => builders.id),
  name: text("name").notNull(),
  description: text("description"),
  link: text("link"),
  currentStage: stageEnum("current_stage").notNull().default("idea"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 프로젝트의 단계 전이 이력 (append-only 감사 로그) */
export const stageHistory = pgTable("stage_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  stage: stageEnum("stage").notNull(),
  source: stageChangeSourceEnum("source").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 진단 설문 정의(버전 단위). 문항(questions)과 단계 매핑(mapping)은
 * 창업자 저작 콘텐츠이므로 도메인 스키마(diagnosisSurveySchema/stageMappingSchema)
 * 형태의 jsonb 로 보관한다. 설문은 단계별이 아니라 전체 8단계를 판별하는 단일 설문이다.
 */
export const diagnosisSurveys = pgTable("diagnosis_surveys", {
  id: uuid("id").defaultRandom().primaryKey(),
  version: integer("version").notNull().unique(),
  questions: jsonb("questions").notNull(),
  mapping: jsonb("mapping").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 프로젝트가 제출한 진단 설문 응답 */
export const diagnosisResponses = pgTable("diagnosis_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => diagnosisSurveys.id),
  surveyVersion: integer("survey_version").notNull(),
  answers: jsonb("answers").notNull(),
  totalScore: integer("total_score").notNull(),
  resultStage: stageEnum("result_stage").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 단계별 실행 과제 템플릿. 템플릿 콘텐츠는 창업자 저작 영역이므로
 * 여기서는 구조(goal/done_criteria)만 정형 컬럼으로 보관한다.
 */
export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  stage: stageEnum("stage").notNull(),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  doneCriteria: text("done_criteria").notNull(),
  estimatedHours: numeric("estimated_hours").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 프로젝트에 배정된 실행 과제 인스턴스 */
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  templateId: uuid("template_id")
    .notNull()
    .references(() => taskTemplates.id),
  status: taskStatusEnum("status").notNull().default("todo"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 프로젝트의 사업 성과 지표 시계열 (예: MAU, 매출 등) */
export const metrics = pgTable("metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  kind: metricKindEnum("kind").notNull(),
  label: text("label").notNull(),
  value: numeric("value").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 단계 완료 시 작성하는 회고 리포트 */
export const retroReports = pgTable("retro_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  /** ISO 형식 "YYYY-MM" 월 식별자. */
  month: text("month").notNull(),
  stageHistoryIds: jsonb("stage_history_ids").notNull(),
  completedTaskIds: jsonb("completed_task_ids").notNull(),
  metricDeltas: jsonb("metric_deltas").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 커뮤니티 게시글 */
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  builderId: uuid("builder_id")
    .notNull()
    .references(() => builders.id),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  /** RetroReport 등으로부터 자동 생성된 게시물인지 여부. */
  isAuto: boolean("is_auto").notNull().default(false),
  /** 자동 생성 게시물 공개에 대한 작성자의 명시적 동의 여부. */
  optIn: boolean("opt_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 커뮤니티 게시글 댓글 */
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id),
  builderId: uuid("builder_id")
    .notNull()
    .references(() => builders.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 빌더별 현재 구독 자격. builder_id 는 유니크(빌더당 1개 활성 구독 레코드).
 */
export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    builderId: uuid("builder_id")
      .notNull()
      .references(() => builders.id),
    plan: planEnum("plan").notNull(),
    channel: channelEnum("channel").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    originalTransactionId: text("original_transaction_id"),
    billingKeyRef: text("billing_key_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    builderIdUnique: uniqueIndex("entitlements_builder_id_unique").on(table.builderId),
  }),
);

/**
 * 결제 채널(PG/APPLE/GOOGLE) 웹훅/영수증 원본 이벤트.
 * append-only: 절대 UPDATE/DELETE 하지 않는다. 재처리가 필요하면 새 행을 추가한다.
 * (channel, event_id) 조합이 멱등 키 — 동일 이벤트 중복 수신을 DB 유니크 제약으로 차단한다.
 */
export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channel: channelEnum("channel").notNull(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    verification: billingVerificationEnum("verification").notNull(),
    builderId: uuid("builder_id").references(() => builders.id),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    channelEventIdUnique: uniqueIndex("billing_events_channel_event_id_unique").on(
      table.channel,
      table.eventId,
    ),
  }),
);

/** 판매 중인 요금제 카탈로그 */
export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  plan: planEnum("plan").notNull(),
  priceKrw: integer("price_krw").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
