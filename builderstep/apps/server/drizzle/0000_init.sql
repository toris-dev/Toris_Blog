-- BuilderStep initial schema.
-- Matches apps/server/src/db/schema.ts exactly.

CREATE TYPE "stage" AS ENUM (
  'idea',
  'validation',
  'mvp',
  'launch',
  'user_acquisition',
  'first_revenue',
  'recurring_revenue',
  'growth'
);

CREATE TYPE "plan" AS ENUM ('monthly', 'yearly');

CREATE TYPE "channel" AS ENUM ('PG', 'APPLE', 'GOOGLE');

CREATE TYPE "subscription_status" AS ENUM (
  'active',
  'grace',
  'canceled',
  'expired',
  'refunded'
);

CREATE TYPE "billing_verification" AS ENUM ('verified', 'rejected');

CREATE TYPE "auth_provider" AS ENUM ('google', 'apple', 'github');

CREATE TYPE "stage_change_source" AS ENUM ('diagnosis', 'rediagnosis');

CREATE TYPE "task_status" AS ENUM ('todo', 'done');

CREATE TYPE "metric_kind" AS ENUM ('users', 'revenue', 'custom');

CREATE TABLE "builders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "provider" "auth_provider" NOT NULL,
  "nickname" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "builder_id" uuid NOT NULL REFERENCES "builders"("id"),
  "name" text NOT NULL,
  "description" text,
  "link" text,
  "current_stage" "stage" NOT NULL DEFAULT 'idea',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "stage_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id"),
  "stage" "stage" NOT NULL,
  "source" "stage_change_source" NOT NULL,
  "changed_at" timestamptz NOT NULL DEFAULT now()
);

-- diagnosis_surveys: questions/mapping 은 창업자 저작 콘텐츠(jsonb, 도메인 스키마 형태).
-- 설문은 단계별이 아니라 전체 8단계를 판별하는 단일 설문(버전 단위)이다.
CREATE TABLE "diagnosis_surveys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "version" integer NOT NULL UNIQUE,
  "questions" jsonb NOT NULL,
  "mapping" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "diagnosis_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id"),
  "survey_id" uuid NOT NULL REFERENCES "diagnosis_surveys"("id"),
  "survey_version" integer NOT NULL,
  "answers" jsonb NOT NULL,
  "total_score" integer NOT NULL,
  "result_stage" "stage" NOT NULL,
  "submitted_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "task_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "stage" "stage" NOT NULL,
  "title" text NOT NULL,
  "goal" text NOT NULL,
  "done_criteria" text NOT NULL,
  "estimated_hours" numeric NOT NULL,
  "order" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id"),
  "template_id" uuid NOT NULL REFERENCES "task_templates"("id"),
  "status" "task_status" NOT NULL DEFAULT 'todo',
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id"),
  "kind" "metric_kind" NOT NULL,
  "label" text NOT NULL,
  "value" numeric NOT NULL,
  "recorded_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "retro_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id"),
  "month" text NOT NULL,
  "stage_history_ids" jsonb NOT NULL,
  "completed_task_ids" jsonb NOT NULL,
  "metric_deltas" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "builder_id" uuid NOT NULL REFERENCES "builders"("id"),
  "topic" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "is_auto" boolean NOT NULL DEFAULT false,
  "opt_in" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES "posts"("id"),
  "builder_id" uuid NOT NULL REFERENCES "builders"("id"),
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "builder_id" uuid NOT NULL REFERENCES "builders"("id"),
  "plan" "plan" NOT NULL,
  "channel" "channel" NOT NULL,
  "status" "subscription_status" NOT NULL,
  "current_period_end" timestamptz NOT NULL,
  "original_transaction_id" text,
  "billing_key_ref" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "entitlements_builder_id_unique" ON "entitlements" ("builder_id");

-- billing_events is append-only: rows are never UPDATEd or DELETEd.
-- (channel, event_id) is the idempotency key that rejects duplicate webhook/receipt delivery.
CREATE TABLE "billing_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel" "channel" NOT NULL,
  "event_id" text NOT NULL,
  "type" text NOT NULL,
  "verification" "billing_verification" NOT NULL,
  "builder_id" uuid REFERENCES "builders"("id"),
  "payload" jsonb NOT NULL,
  "processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "billing_events_channel_event_id_unique" ON "billing_events" ("channel", "event_id");

CREATE TABLE "pricing_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "plan" "plan" NOT NULL,
  "price_krw" integer NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
