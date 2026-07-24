/**
 * Drizzle sqlite-core 스키마 — d1/0000_init.sql의 타입 미러(문서/추후 쿼리빌더용).
 * 런타임 쿼리는 db.ts에서 D1 prepared statement로 직접 수행한다(단순성/신뢰성 우선).
 */
import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const organizationProfiles = sqliteTable("organization_profiles", {
  orgId: text("org_id").primaryKey(),
  logoUrl: text("logo_url"),
  businessNo: text("business_no"),
  address: text("address"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  updatedAt: text("updated_at").notNull(),
});

export const organizationLogoAssets = sqliteTable(
  "organization_logo_assets",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    etag: text("etag"),
    checksumSha256: text("checksum_sha256").notNull(),
    createdAt: text("created_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (t) => ({
    storageKeyUq: uniqueIndex("organization_logo_assets_storage_key_uq").on(t.storageKey),
    orgIdx: index("organization_logo_assets_org_idx").on(t.orgId, t.deletedAt),
    activeOrgUq: uniqueIndex("organization_logo_assets_active_org_uq")
      .on(t.orgId)
      .where(sql`${t.deletedAt} IS NULL`),
  }),
);

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

export const inviteLifecycle = sqliteTable("invite_lifecycle", {
  inviteId: text("invite_id").primaryKey(),
  canceledAt: text("canceled_at"),
  resendCount: integer("resend_count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
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

export const assetPhotos = sqliteTable(
  "asset_photos",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    siteId: text("site_id").notNull(),
    assetId: text("asset_id").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    etag: text("etag"),
    checksumSha256: text("checksum_sha256").notNull(),
    caption: text("caption"),
    idempotencyKey: text("idempotency_key"),
    requestFingerprint: text("request_fingerprint"),
    createdAt: text("created_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (t) => ({
    storageKeyUq: uniqueIndex("asset_photos_storage_key_uq").on(t.storageKey),
    orgAssetIdx: index("asset_photos_org_asset_idx").on(t.orgId, t.assetId, t.deletedAt),
    siteIdx: index("asset_photos_site_idx").on(t.siteId),
    uploadIdempotencyUq: uniqueIndex("asset_photos_upload_idempotency_uq")
      .on(t.orgId, t.assetId, t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL AND ${t.deletedAt} IS NULL`),
  }),
);

export const masterEntityStates = sqliteTable(
  "master_entity_states",
  {
    orgId: text("org_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    active: integer("active").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
    updatedBy: text("updated_by"),
  },
  (t) => ({
    lookupIdx: index("master_entity_states_lookup_idx").on(t.orgId, t.entityType, t.active),
    pk: primaryKey({ columns: [t.orgId, t.entityType, t.entityId] }),
  }),
);

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
  revision: integer("revision").notNull().default(0),
  writeToken: text("write_token"),
});

export const maintenanceSchedules = sqliteTable(
  "maintenance_schedules",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    sourceWorkOrderId: text("source_work_order_id").notNull(),
    sourceReportVersionId: text("source_report_version_id"),
    customerId: text("customer_id").notNull(),
    siteId: text("site_id").notNull(),
    assetId: text("asset_id"),
    scheduledTime: text("scheduled_time"),
    workType: text("work_type").notNull(),
    request: text("request"),
    idempotencyKey: text("idempotency_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    assigneeIdsJson: text("assignee_ids_json").notNull(),
    frequency: text("frequency").notNull(),
    intervalCount: integer("interval_count").notNull(),
    anchorDate: text("anchor_date").notNull(),
    nextOccurrenceDate: text("next_occurrence_date"),
    endDate: text("end_date"),
    status: text("status").notNull(),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    lastErrorAt: text("last_error_at"),
    revision: integer("revision").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    sourceWorkUq: uniqueIndex("maintenance_schedules_source_work_uq").on(
      t.sourceWorkOrderId,
    ),
    orgIdempotencyUq: uniqueIndex(
      "maintenance_schedules_org_idempotency_uq",
    ).on(t.orgId, t.idempotencyKey),
    orgSourceReportUq: uniqueIndex(
      "maintenance_schedules_org_source_report_uq",
    )
      .on(t.orgId, t.sourceReportVersionId)
      .where(sql`${t.sourceReportVersionId} IS NOT NULL`),
    orgStatusNextIdx: index(
      "maintenance_schedules_org_status_next_idx",
    ).on(t.orgId, t.status, t.nextOccurrenceDate),
  }),
);

export const maintenanceOccurrences = sqliteTable(
  "maintenance_occurrences",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    scheduleId: text("schedule_id").notNull(),
    occurrenceDate: text("occurrence_date").notNull(),
    workOrderId: text("work_order_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    scheduleDateUq: uniqueIndex(
      "maintenance_occurrences_schedule_date_uq",
    ).on(t.scheduleId, t.occurrenceDate),
    workOrderUq: uniqueIndex(
      "maintenance_occurrences_work_order_uq",
    ).on(t.workOrderId),
    orgScheduleIdx: index(
      "maintenance_occurrences_org_schedule_idx",
    ).on(t.orgId, t.scheduleId, t.occurrenceDate),
  }),
);

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  userId: text("user_id").notNull(),
});

export const assignmentEvents = sqliteTable(
  "assignment_events",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    workOrderId: text("work_order_id").notNull(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    actorUserId: text("actor_user_id"),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    workOrderIdx: index("assignment_events_wo_idx").on(t.workOrderId),
    orgIdx: index("assignment_events_org_idx").on(t.orgId),
  }),
);

export const fieldRecords = sqliteTable("field_records", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  workSummary: text("work_summary"),
  transcript: text("transcript"),
  partsJson: text("parts_json"),
  checklistJson: text("checklist_json"),
  issues: text("issues"),
  notes: text("notes"),
  nextInspectionDate: text("next_inspection_date"),
  updatedAt: text("updated_at").notNull(),
});

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    workOrderId: text("work_order_id").notNull(),
    kind: text("kind").notNull(),
    dataUrl: text("data_url").notNull(),
    caption: text("caption"),
    idempotencyKey: text("idempotency_key"),
    requestFingerprint: text("request_fingerprint"),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    uploadIdempotencyUq: uniqueIndex("photos_wo_idempotency_uq").on(
      t.workOrderId,
      t.idempotencyKey,
    ),
  }),
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    workOrderId: text("work_order_id").notNull(),
    mediaType: text("media_type").notNull(),
    photoKind: text("photo_kind"),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    etag: text("etag"),
    checksumSha256: text("checksum_sha256").notNull(),
    caption: text("caption"),
    durationSeconds: real("duration_seconds"),
    idempotencyKey: text("idempotency_key"),
    requestFingerprint: text("request_fingerprint"),
    createdAt: text("created_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (t) => ({
    storageKeyUq: uniqueIndex("media_assets_storage_key_uq").on(t.storageKey),
    orgIdx: index("media_assets_org_idx").on(t.orgId),
    workOrderIdx: index("media_assets_wo_idx").on(t.workOrderId),
    orgWorkOrderIdx: index("media_assets_org_wo_idx").on(t.orgId, t.workOrderId),
    uploadIdempotencyUq: uniqueIndex(
      "media_assets_upload_idempotency_uq",
    ).on(t.orgId, t.workOrderId, t.mediaType, t.idempotencyKey),
  }),
);

export const reportDrafts = sqliteTable("report_drafts", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  structuredJson: text("structured_json").notNull(),
  updatedAt: text("updated_at").notNull(),
  revision: integer("revision").notNull().default(0),
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

export const reportNumberSequences = sqliteTable("report_number_sequences", {
  orgId: text("org_id").primaryKey(),
  nextValue: integer("next_value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reportArtifacts = sqliteTable(
  "report_artifacts",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    workOrderId: text("work_order_id").notNull(),
    reportVersionId: text("report_version_id").notNull(),
    approvalRequestId: text("approval_request_id"),
    baseArtifactId: text("base_artifact_id"),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("pending"),
    rendererVersion: text("renderer_version").notNull(),
    sourceSha256: text("source_sha256").notNull(),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    etag: text("etag"),
    checksumSha256: text("checksum_sha256"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    createdBy: text("created_by"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    readyAt: text("ready_at"),
  },
  (t) => ({
    versionKindUq: uniqueIndex("report_artifacts_version_kind_uq").on(
      t.reportVersionId,
      t.kind,
    ),
    storageKeyUq: uniqueIndex("report_artifacts_storage_key_uq").on(t.storageKey),
    orgIdx: index("report_artifacts_org_idx").on(t.orgId),
    workOrderIdx: index("report_artifacts_work_order_idx").on(t.workOrderId),
    approvalRequestIdx: index("report_artifacts_approval_request_idx").on(
      t.approvalRequestId,
    ),
    statusIdx: index("report_artifacts_status_idx").on(t.status, t.updatedAt),
  }),
);

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
  revisionComment: text("revision_comment"),
  correctionRequestedAt: text("correction_requested_at"),
  correctionRequestedBy: text("correction_requested_by"),
});

export const signatures = sqliteTable("signatures", {
  id: text("id").primaryKey(),
  approvalRequestId: text("approval_request_id").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  signatureDataUrl: text("signature_data_url").notNull(),
  approvedAt: text("approved_at").notNull(),
  agreed: integer("agreed").notNull().default(1),
  consentedAt: text("consented_at"),
  consentVersion: text("consent_version").notNull().default("approval-consent-v1"),
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
  revision: integer("revision").notNull().default(0),
  writeToken: text("write_token"),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    userId: text("user_id"),
    type: text("type").notNull(),
    workOrderId: text("work_order_id"),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull(),
    readAt: text("read_at"),
  },
  (t) => ({
    overdueOnceUq: uniqueIndex("notifications_billing_overdue_once_uq")
      .on(t.orgId, t.userId, t.workOrderId, t.type)
      .where(
        sql`${t.type} = 'billing_overdue' AND ${t.userId} IS NOT NULL AND ${t.workOrderId} IS NOT NULL`,
      ),
  }),
);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  actorUserId: text("actor_user_id"),
  event: text("event").notNull(),
  target: text("target").notNull(),
  detailJson: text("detail_json"),
  createdAt: text("created_at").notNull(),
});

// 통합관리자(서비스 운영자) 콘솔 — PRD §14.3. 조직 격리와 분리된 전사 운영용.
export const operatorSessions = sqliteTable(
  "operator_sessions",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: text("user_id").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    tokenHashUq: uniqueIndex("operator_sessions_token_hash_uq").on(t.tokenHash),
    userIdx: index("operator_sessions_user_idx").on(t.userId),
  }),
);

export const orgTemplates = sqliteTable(
  "org_templates",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    configJson: text("config_json").notNull(),
    active: integer("active").notNull().default(0),
    uploadedBy: text("uploaded_by"),
    uploadedAt: text("uploaded_at").notNull(),
  },
  (t) => ({
    orgVersionUq: uniqueIndex("org_templates_org_version_uq").on(t.orgId, t.version),
    activeOrgUq: uniqueIndex("org_templates_active_org_uq")
      .on(t.orgId)
      .where(sql`${t.active} = 1`),
  }),
);
