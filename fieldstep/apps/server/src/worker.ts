import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { routePath } from "hono/route";
import type { AppEnv } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { orgRoutes } from "./routes/org.js";
import { crmRoutes } from "./routes/crm.js";
import { workOrderRoutes } from "./routes/workorders.js";
import { publicRoutes } from "./routes/public.js";
import { billingRoutes } from "./routes/billing.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { notificationRoutes } from "./routes/notifications.js";
import { opsRoutes } from "./routes/ops.js";

const app = new Hono<AppEnv>();

const SERVICE_NAME = "fieldstep-api";
const REQUIRED_D1_TABLES = [
  "organizations",
  "users",
  "memberships",
  "sessions",
  "invites",
  "customers",
  "sites",
  "assets",
  "work_orders",
  "maintenance_schedules",
  "maintenance_occurrences",
  "assignments",
  "assignment_events",
  "field_records",
  "photos",
  "media_assets",
  "report_drafts",
  "report_versions",
  "report_number_sequences",
  "approval_requests",
  "signatures",
  "billing_records",
  "notifications",
  "audit_events",
  "login_attempts",
  "organization_profiles",
  "organization_logo_assets",
  "invite_lifecycle",
  "master_entity_states",
  "asset_photos",
  "report_artifacts",
  "operator_sessions",
  "org_templates",
] as const;
const REQUIRED_D1_TABLES_SQL = REQUIRED_D1_TABLES.map(() => "?").join(", ");
const REQUIRED_D1_INDEXES = [
  "maintenance_schedules_source_work_uq",
  "maintenance_schedules_org_idempotency_uq",
  "maintenance_schedules_org_source_report_uq",
  "maintenance_occurrences_schedule_date_uq",
  "maintenance_occurrences_work_order_uq",
] as const;
const REQUIRED_D1_INDEXES_SQL = REQUIRED_D1_INDEXES.map(() => "?").join(", ");
const REQUIRED_D1_COLUMNS = {
  field_records: ["checklist_json"],
  photos: ["idempotency_key", "request_fingerprint"],
  media_assets: ["idempotency_key", "request_fingerprint"],
  asset_photos: ["idempotency_key", "request_fingerprint"],
  approval_requests: [
    "revision_comment",
    "correction_requested_at",
    "correction_requested_by",
  ],
  signatures: ["agreed", "consented_at", "consent_version"],
  billing_records: ["revision", "write_token"],
  work_orders: ["revision", "write_token"],
  maintenance_schedules: [
    "source_work_order_id",
    "source_report_version_id",
    "idempotency_key",
    "request_fingerprint",
    "assignee_ids_json",
    "frequency",
    "interval_count",
    "anchor_date",
    "next_occurrence_date",
    "end_date",
    "status",
    "last_error_code",
    "last_error_message",
    "last_error_at",
    "revision",
  ],
  maintenance_occurrences: [
    "schedule_id",
    "occurrence_date",
    "work_order_id",
  ],
  report_drafts: ["revision"],
  report_number_sequences: ["org_id", "next_value", "updated_at"],
} as const;
const SAFE_LOG_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

type RequestLogContext = {
  requestId: string;
  rayId: string | null;
  method: string;
  route: string;
  orgId: string | null;
  workOrderId: string | null;
};

function safeLogIdentifier(value: string | null | undefined): string | null {
  return value && SAFE_LOG_IDENTIFIER.test(value) ? value : null;
}

function requestLogContext(c: Context<AppEnv>): RequestLogContext {
  let matchedRoute = "<unmatched>";
  try {
    matchedRoute = routePath(c) || matchedRoute;
  } catch {
    // Error logging must not obscure the original exception.
  }

  const workOrderId = matchedRoute.includes("/work-orders/:id")
    ? safeLogIdentifier(c.req.param("id"))
    : null;

  return {
    requestId: safeLogIdentifier(c.req.header("x-request-id")) ?? crypto.randomUUID(),
    rayId: safeLogIdentifier(c.req.header("cf-ray")),
    method: c.req.method,
    // Route templates avoid logging approval tokens or query-string secrets.
    route: matchedRoute,
    orgId: safeLogIdentifier(c.get("orgId")),
    workOrderId,
  };
}

function serializeError(error: unknown): {
  name: string;
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  let message = "Unknown non-Error value";
  try {
    message = String(error);
  } catch {
    // Keep the fallback when coercion itself fails.
  }
  return { name: "NonErrorThrown", message, stack: null };
}

function logStructuredError(
  event: string,
  context: RequestLogContext,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      service: SERVICE_NAME,
      event,
      request: {
        id: context.requestId,
        rayId: context.rayId,
        method: context.method,
        route: context.route,
      },
      correlation: {
        orgId: context.orgId,
        workOrderId: context.workOrderId,
      },
      error: serializeError(error),
      ...details,
    }),
  );
}

async function assertD1Ready(db: D1Database | undefined): Promise<void> {
  if (!db) {
    throw new Error("D1 DB binding is not configured");
  }
  const result = await db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name IN (${REQUIRED_D1_TABLES_SQL})`,
    )
    .bind(...REQUIRED_D1_TABLES)
    .all<{ name: string }>();

  const existingTables = new Set(result.results.map((row) => row.name));
  const missingTables = REQUIRED_D1_TABLES.filter((name) => !existingTables.has(name));
  const indexResult = await db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'index' AND name IN (${REQUIRED_D1_INDEXES_SQL})`,
    )
    .bind(...REQUIRED_D1_INDEXES)
    .all<{ name: string }>();
  const existingIndexes = new Set(
    indexResult.results.map((row) => row.name),
  );
  const missingIndexes = REQUIRED_D1_INDEXES.filter(
    (name) => !existingIndexes.has(name),
  );
  const missingColumns = (
    await Promise.all(
      Object.entries(REQUIRED_D1_COLUMNS).map(async ([table, expectedColumns]) => {
        const columnsResult = await db
          .prepare("SELECT name FROM pragma_table_info(?)")
          .bind(table)
          .all<{ name: string }>();
        if (!columnsResult.success) {
          throw new Error(`D1 column readiness query failed: ${table}`);
        }
        const existingColumns = new Set(columnsResult.results.map((row) => row.name));
        return expectedColumns
          .filter((column) => !existingColumns.has(column))
          .map((column) => `${table}.${column}`);
      }),
    )
  ).flat();

  if (
    !result.success ||
    !indexResult.success ||
    missingTables.length > 0 ||
    missingIndexes.length > 0 ||
    missingColumns.length > 0
  ) {
    throw new Error(
      missingTables.length > 0
        ? `Required D1 tables are missing: ${missingTables.join(", ")}`
        : missingIndexes.length > 0
          ? `Required D1 indexes are missing: ${missingIndexes.join(", ")}`
        : missingColumns.length > 0
          ? `Required D1 columns are missing: ${missingColumns.join(", ")}`
        : "D1 readiness query failed",
    );
  }
}

async function assertR2Ready(bucket: R2Bucket | undefined): Promise<void> {
  if (!bucket) {
    throw new Error("R2 MEDIA binding is not configured");
  }
  await bucket.list({ limit: 1 });
}

app.use(
  "*",
  cors({
    origin: ["https://field.toris.kr", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "X-Source-SHA256",
      "X-Content-SHA256",
    ],
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: SERVICE_NAME }));

app.get("/health/ready", async (c) => {
  const logContext = requestLogContext(c);
  const [d1Check, r2Check] = await Promise.allSettled([
    assertD1Ready(c.env?.DB),
    assertR2Ready(c.env?.MEDIA),
  ]);

  if (d1Check.status === "rejected" || r2Check.status === "rejected") {
    const failures = [
      d1Check.status === "rejected"
        ? { component: "d1", error: serializeError(d1Check.reason) }
        : null,
      r2Check.status === "rejected"
        ? { component: "r2", error: serializeError(r2Check.reason) }
        : null,
    ].filter((failure) => failure !== null);
    const primaryError =
      d1Check.status === "rejected"
        ? d1Check.reason
        : r2Check.status === "rejected"
          ? r2Check.reason
          : new Error("Readiness check failed without a rejected component");

    logStructuredError("readiness_check_failed", logContext, primaryError, { failures });
    c.header("Cache-Control", "no-store");
    c.header("X-Request-ID", logContext.requestId);
    return c.json({ ok: false, service: SERVICE_NAME, status: "not_ready" }, 503);
  }

  c.header("Cache-Control", "no-store");
  c.header("X-Request-ID", logContext.requestId);
  return c.json({ ok: true, service: SERVICE_NAME, status: "ready" });
});

app.route("/", authRoutes);
app.route("/", orgRoutes);
app.route("/", crmRoutes);
app.route("/", workOrderRoutes);
app.route("/", publicRoutes);
app.route("/", billingRoutes);
app.route("/", dashboardRoutes);
app.route("/", notificationRoutes);
app.route("/", opsRoutes);

// 미매칭 라우트 — 일관된 JSON 404
app.notFound((c) => c.json({ error: "요청한 리소스를 찾을 수 없습니다" }, 404));

// 처리되지 않은 예외 — 내부 정보는 서버 로그에만, 클라이언트에는 일반 메시지
app.onError((err, c) => {
  const logContext = requestLogContext(c);
  logStructuredError("unhandled_request_error", logContext, err);
  c.header("Cache-Control", "no-store");
  c.header("X-Request-ID", logContext.requestId);
  return c.json({ error: "서버 오류가 발생했습니다" }, 500);
});

export default app;
