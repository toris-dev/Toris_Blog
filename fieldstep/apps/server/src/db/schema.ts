/**
 * Drizzle sqlite-core 스키마 — d1/0000_init.sql의 타입 미러(문서/추후 쿼리빌더용).
 * 런타임 쿼리는 db.ts에서 D1 prepared statement로 직접 수행한다(단순성/신뢰성 우선).
 */
import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    pwHash: text("pw_hash").notNull(),
    pwSalt: text("pw_salt").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({ emailUq: uniqueIndex("users_email_uq").on(t.email) }),
);

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    active: integer("active").notNull().default(1),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({ orgUserUq: uniqueIndex("memberships_org_user_uq").on(t.orgId, t.userId) }),
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  userId: text("user_id").notNull(),
  orgId: text("org_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  acceptedAt: text("accepted_at"),
  createdAt: text("created_at").notNull(),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    bizNo: text("biz_no"),
    address: text("address"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    memo: text("memo"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({ orgIdx: index("customers_org_idx").on(t.orgId) }),
);

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  customerId: text("customer_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  accessInfo: text("access_info"),
  mapUrl: text("map_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  siteId: text("site_id").notNull(),
  name: text("name").notNull(),
  model: text("model"),
  serialNo: text("serial_no"),
  installedAt: text("installed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  customerId: text("customer_id").notNull(),
  siteId: text("site_id").notNull(),
  assetId: text("asset_id"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  workType: text("work_type").notNull(),
  request: text("request"),
  workStatus: text("work_status").notNull().default("scheduled"),
  approvalStatus: text("approval_status").notNull().default("not_sent"),
  billingStatus: text("billing_status").notNull().default("none"),
  aiStatus: text("ai_status").notNull().default("idle"),
  startedAt: text("started_at"),
  submittedAt: text("submitted_at"),
  reviewedAt: text("reviewed_at"),
  completedAt: text("completed_at"),
  canceledAt: text("canceled_at"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  userId: text("user_id").notNull(),
});

export const fieldRecords = sqliteTable("field_records", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  workSummary: text("work_summary"),
  transcript: text("transcript"),
  partsJson: text("parts_json"),
  issues: text("issues"),
  notes: text("notes"),
  nextInspectionDate: text("next_inspection_date"),
  updatedAt: text("updated_at").notNull(),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  kind: text("kind").notNull(),
  dataUrl: text("data_url").notNull(),
  caption: text("caption"),
  createdAt: text("created_at").notNull(),
});

export const reportDrafts = sqliteTable("report_drafts", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  structuredJson: text("structured_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reportVersions = sqliteTable("report_versions", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  version: integer("version").notNull(),
  reportNumber: text("report_number").notNull(),
  structuredJson: text("structured_json").notNull(),
  photosJson: text("photos_json").notNull(),
  templateVersion: integer("template_version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  lockedAt: text("locked_at"),
});

export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  reportVersionId: text("report_version_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  sentAt: text("sent_at").notNull(),
  viewedAt: text("viewed_at"),
  decidedAt: text("decided_at"),
  status: text("status").notNull().default("pending"),
});

export const signatures = sqliteTable("signatures", {
  id: text("id").primaryKey(),
  approvalRequestId: text("approval_request_id").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  signatureDataUrl: text("signature_data_url").notNull(),
  approvedAt: text("approved_at").notNull(),
});

export const billingRecords = sqliteTable("billing_records", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  amount: real("amount"),
  billedAt: text("billed_at"),
  dueAt: text("due_at"),
  paidAt: text("paid_at"),
  memo: text("memo"),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  userId: text("user_id"),
  type: text("type").notNull(),
  workOrderId: text("work_order_id"),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  actorUserId: text("actor_user_id"),
  event: text("event").notNull(),
  target: text("target").notNull(),
  detailJson: text("detail_json"),
  createdAt: text("created_at").notNull(),
});
