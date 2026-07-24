import { Hono } from "hono";
import {
  workOrderCreateSchema,
  workOrderPatchSchema,
  maintenanceScheduleActionSchema,
  maintenanceScheduleSyncSchema,
  assignSchema,
  fieldRecordUpsertSchema,
  photoCreateSchema,
  reportPutSchema,
  structuredDraftSchema,
  approvalLinkCreateSchema,
  reportCorrectionSchema,
  canTransition,
  RuleBasedDraftEngine,
  formatReportNumber,
  addCalendarDays,
  nextMaintenanceOccurrence,
  toSeoulDateString,
  APPROVAL_LINK_TTL_DAYS,
  type MaintenanceFrequency,
  type ChecklistItem,
  type UsedPart,
  type StructuredDraft,
} from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, parseJson, recordAudit, notify } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";
import { generateToken, sha256Hex, addDaysIso } from "../auth.js";
import {
  createImmutableMediaKey,
  computeMediaRequestFingerprint,
  computeMediaRequestFingerprintFromChecksum,
  decodeMediaBytes,
  decodeMediaDataUrl,
  deletePrivateMedia,
  encodeMediaDataUrl,
  getPrivateMediaResponse,
  MAX_AUDIO_BYTES,
  MAX_PHOTO_BYTES,
  MediaValidationError,
  putPrivateMedia,
  type MediaType,
} from "../media.js";
import {
  REPORT_PDF_MIME_TYPE,
  REPORT_PDF_RENDERER_VERSION,
  ReportArtifactError,
  computeReportSourceSha256,
  computeSignedReportSourceSha256,
  getPrivatePdfArtifactResponse,
  hasMatchingPrivatePdfArtifact,
  putPrivatePdfArtifact,
  type ReportArtifactKind,
  type ReportArtifactRow,
} from "../report-artifacts.js";
import { z } from "zod";


export const workOrderRoutes = new Hono<AppEnv>();


type WorkOrderRow = {
  id: string;
  org_id: string;
  customer_id: string;
  site_id: string;
  asset_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  work_type: string;
  request: string | null;
  work_status: string;
  approval_status: string;
  billing_status: string;
  ai_status: string;
  started_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  revision: number;
  write_token: string | null;
};

type MaintenanceScheduleRow = {
  id: string;
  org_id: string;
  source_work_order_id: string;
  source_report_version_id: string | null;
  customer_id: string;
  site_id: string;
  asset_id: string | null;
  scheduled_time: string | null;
  work_type: string;
  request: string | null;
  idempotency_key: string;
  request_fingerprint: string;
  assignee_ids_json: string;
  frequency: MaintenanceFrequency;
  interval_count: number;
  anchor_date: string;
  next_occurrence_date: string | null;
  end_date: string | null;
  status: "active" | "paused" | "completed" | "canceled";
  last_error_code: string | null;
  last_error_message: string | null;
  last_error_at: string | null;
  revision: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type MaintenanceOccurrenceRow = {
  id: string;
  schedule_id: string;
  occurrence_date: string;
  work_order_id: string;
  created_at: string;
};

const MAINTENANCE_SYNC_DEFAULT_HORIZON_DAYS = 90;
const MAINTENANCE_SYNC_DEFAULT_ROW_CAP = 50;
const MAINTENANCE_IDEMPOTENCY_KEY_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

function maintenanceOccurrenceId(
  scheduleId: string,
  occurrenceDate: string,
): string {
  return `maintenance-occurrence:${scheduleId}:${occurrenceDate}`;
}

function maintenanceWorkOrderId(
  scheduleId: string,
  occurrenceDate: string,
): string {
  return `maintenance-work:${scheduleId}:${occurrenceDate}`;
}

function maintenanceAssignmentId(
  workOrderId: string,
  userId: string,
): string {
  return `${workOrderId}:assignment:${userId}`;
}

function maintenanceAssignmentEventId(
  workOrderId: string,
  userId: string,
): string {
  return `${workOrderId}:assigned-event:${userId}`;
}

function maintenanceNotificationId(
  workOrderId: string,
  userId: string,
): string {
  return `${workOrderId}:assigned-notification:${userId}`;
}

function maintenanceAuditId(workOrderId: string): string {
  return `${workOrderId}:generated-audit`;
}

function maintenanceStatusAuditId(
  scheduleId: string,
  revision: number,
): string {
  return `maintenance-status:${scheduleId}:${revision}`;
}

function maintenanceAssigneeSnapshot(row: MaintenanceScheduleRow): string[] {
  const parsed = parseJson<unknown>(row.assignee_ids_json, []);
  if (!Array.isArray(parsed)) return [];
  return [
    ...new Set(
      parsed.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      ),
    ),
  ];
}

type ReportLogoSnapshot = {
  id: string;
  storageKey: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  checksumSha256: string;
  sizeBytes: number;
};

type ReportContextSnapshot = {
  org: {
    name: string;
    businessNo: string | null;
    address: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    logo: ReportLogoSnapshot | null;
  };
  workOrder: {
    id: string;
    scheduledDate: string;
    scheduledTime: string | null;
    workType: string;
    request: string | null;
  };
  customer: {
    id: string;
    name: string;
    businessNo: string | null;
    address: string | null;
    contactName: string | null;
    contactPhone: string | null;
  };
  site: { id: string; name: string; address: string | null };
  asset: {
    id: string;
    name: string;
    model: string | null;
    serialNo: string | null;
  } | null;
  assigneeNames: string[];
};

const REPORT_CONTEXT_KEY = "__context";

type ReportContextResponse = Omit<ReportContextSnapshot, "org"> & {
  org: Omit<ReportContextSnapshot["org"], "logo"> & {
    logo: {
      id: string;
      url: string;
      mimeType: ReportLogoSnapshot["mimeType"];
      checksumSha256: string;
      sizeBytes: number;
    } | null;
  };
};

function storedReport(text: string): {
  structured: Record<string, unknown>;
  context: ReportContextSnapshot | null;
} {
  const stored = parseJson<Record<string, unknown>>(text, {});
  const context = (stored[REPORT_CONTEXT_KEY] as ReportContextSnapshot | undefined) ?? null;
  const { [REPORT_CONTEXT_KEY]: _context, ...structured } = stored;
  return { structured, context };
}

function reportVersionLogoUrl(
  requestUrl: string,
  workOrderId: string,
  version: number,
  logoId: string,
): string {
  return `${new URL(requestUrl).origin}/work-orders/${encodeURIComponent(workOrderId)}/report-versions/${version}/logo/${encodeURIComponent(logoId)}`;
}

function reportContextResponse(
  context: ReportContextSnapshot | null,
  requestUrl: string,
  workOrderId: string,
  version: number,
): ReportContextResponse | null {
  if (!context) return null;
  const logo = context.org.logo ?? null;
  return {
    ...context,
    customer: {
      ...context.customer,
      businessNo: context.customer.businessNo ?? null,
      contactName: context.customer.contactName ?? null,
      contactPhone: context.customer.contactPhone ?? null,
    },
    org: {
      name: context.org.name,
      businessNo: context.org.businessNo ?? null,
      address: context.org.address ?? null,
      contactName: context.org.contactName ?? null,
      contactPhone: context.org.contactPhone ?? null,
      contactEmail: context.org.contactEmail ?? null,
      logo: logo
        ? {
            id: logo.id,
            url: reportVersionLogoUrl(
              requestUrl,
              workOrderId,
              version,
              logo.id,
            ),
            mimeType: logo.mimeType,
            checksumSha256: logo.checksumSha256,
            sizeBytes: logo.sizeBytes,
          }
        : null,
    },
  };
}

function reportArtifactFilename(
  reportNumber: string,
  version: number,
  kind: ReportArtifactKind,
): string {
  return `${reportNumber}-v${version}${kind === "signed" ? "-signed" : ""}.pdf`;
}

function reportArtifactResponse(
  artifact: ReportArtifactRow,
  args: {
    requestUrl: string;
    workOrderId: string;
    version: number;
    reportNumber: string;
  },
) {
  const base = `${new URL(args.requestUrl).origin}/work-orders/${encodeURIComponent(args.workOrderId)}/report-versions/${args.version}/artifacts/${artifact.kind}`;
  return {
    id: artifact.id,
    kind: artifact.kind,
    status: artifact.status,
    rendererVersion: artifact.renderer_version,
    sourceSha256: artifact.source_sha256,
    sizeBytes: artifact.size_bytes,
    checksumSha256: artifact.checksum_sha256,
    attemptCount: artifact.attempt_count,
    lastErrorCode: artifact.last_error_code,
    lastErrorMessage: artifact.last_error_message,
    updatedAt: artifact.updated_at,
    readyAt: artifact.ready_at,
    uploadUrl: base,
    failureUrl: `${base}/failure`,
    pdfUrl: artifact.status === "ready" ? `${base}/pdf` : null,
    filename: reportArtifactFilename(
      args.reportNumber,
      args.version,
      artifact.kind,
    ),
  };
}

const reportArtifactFailureSchema = z.object({
  code: z.string().trim().min(1).max(64),
  message: z.string().trim().min(1).max(1_000),
});

type ReportVersionArtifactRow = ReportArtifactRow & {
  version: number;
  report_number: string;
};

async function loadReportVersionArtifact(
  db: D1Database,
  args: {
    orgId: string;
    workOrderId: string;
    version: number;
    kind: ReportArtifactKind;
  },
): Promise<ReportVersionArtifactRow | null> {
  return db
    .prepare(
      `SELECT ra.id, ra.org_id, ra.work_order_id, ra.report_version_id,
              ra.approval_request_id, ra.base_artifact_id, ra.kind, ra.status,
              ra.renderer_version, ra.source_sha256, ra.storage_key, ra.mime_type,
              ra.size_bytes, ra.etag, ra.checksum_sha256, ra.attempt_count,
              ra.last_error_code, ra.last_error_message, ra.created_by,
              ra.created_at, ra.updated_at, ra.ready_at,
              rv.version, rv.report_number
       FROM report_artifacts ra
       JOIN report_versions rv
         ON rv.id = ra.report_version_id
        AND rv.work_order_id = ra.work_order_id
       JOIN work_orders w
         ON w.id = ra.work_order_id
        AND w.org_id = ra.org_id
       WHERE ra.org_id = ? AND ra.work_order_id = ?
         AND rv.version = ? AND ra.kind = ?`,
    )
    .bind(args.orgId, args.workOrderId, args.version, args.kind)
    .first<ReportVersionArtifactRow>();
}

function reportArtifactErrorResponse(error: unknown): {
  error: string;
  code?: string;
} {
  return error instanceof ReportArtifactError
    ? { error: error.message, code: error.code }
    : { error: "PDF 산출물을 저장하지 못했습니다" };
}

function reportArtifactErrorStatus(error: unknown): 400 | 409 | 503 {
  if (!(error instanceof ReportArtifactError)) return 503;
  if (error.code === "immutable_conflict") return 409;
  if (error.code === "missing_object") return 503;
  return 400;
}

type MediaAssetRow = {
  id: string;
  org_id: string;
  work_order_id: string;
  media_type: MediaType;
  photo_kind: "before" | "after" | "other" | null;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  etag: string | null;
  checksum_sha256: string;
  caption: string | null;
  duration_seconds: number | null;
  created_at: string;
};

type SnapshotPhoto = {
  id: string;
  kind: "before" | "after" | "other";
  url?: string;
  storageKey?: string;
  mimeType?: string;
  checksumSha256?: string;
  caption: string | null;
  createdAt: string;
};

function snapshotPhotoResponses(
  snapshot: SnapshotPhoto[],
  contentUrl: (mediaId: string) => string,
): Array<{
  id: string;
  kind: "before" | "after" | "other";
  url: string;
  caption: string | null;
  createdAt: string;
}> {
  return snapshot.map((photo) => ({
    id: photo.id,
    kind: photo.kind,
    // 구 버전의 inline data URL도 JSON으로 다시 노출하지 않고 스트림 경유로 통일한다.
    url: contentUrl(photo.id),
    caption: photo.caption,
    createdAt: photo.createdAt,
  }));
}

const photoBinaryMetadataSchema = z.object({
  kind: z.enum(["before", "after", "other"]),
  caption: z.string().trim().max(500).optional(),
});
const audioBinaryMetadataSchema = z.object({
  caption: z.string().trim().max(500).optional(),
  durationSeconds: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.number().finite().min(0).max(600).optional(),
  ),
});
const MAX_D1_PHOTO_DATA_URL_CHARS = 1_900_000;
const MAX_D1_PHOTO_BYTES = 1_400_000;
const MAX_LEGACY_PHOTO_JSON_BYTES = MAX_D1_PHOTO_DATA_URL_CHARS + 1_024;
const MAX_PHOTOS_PER_WORK_ORDER = 20;
const REPORT_ARTIFACT_UPLOAD_LEASE_MS = 5 * 60 * 1_000;
const uploadIdempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u);

async function countWorkOrderPhotos(
  db: D1Database,
  orgId: string,
  workOrderId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM photos WHERE work_order_id = ?) +
         (SELECT COUNT(*) FROM media_assets
          WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
            AND deleted_at IS NULL) AS n`,
    )
    .bind(workOrderId, orgId, workOrderId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function loadIdempotentPhoto(
  db: D1Database,
  orgId: string,
  workOrderId: string,
  idempotencyKey: string,
  expectedFingerprint: string,
  requestUrl: string,
): Promise<
  | { kind: "miss" }
  | { kind: "conflict" }
  | {
      kind: "replay";
      photo: {
        id: string;
        workOrderId: string;
        kind: "before" | "after" | "other";
        url: string;
        caption: string | null;
        createdAt: string;
      };
    }
> {
  const r2 = await db
    .prepare(
      `SELECT id, photo_kind, mime_type, checksum_sha256, caption,
              request_fingerprint, created_at
       FROM media_assets
       WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
         AND idempotency_key = ? AND deleted_at IS NULL`,
    )
    .bind(orgId, workOrderId, idempotencyKey)
    .first<{
      id: string;
      photo_kind: "before" | "after" | "other";
      mime_type: string;
      checksum_sha256: string;
      caption: string | null;
      request_fingerprint: string | null;
      created_at: string;
    }>();
  if (r2) {
    const storedFingerprint =
      r2.request_fingerprint ??
      (await computeMediaRequestFingerprintFromChecksum({
        mediaType: "photo",
        mimeType: r2.mime_type,
        checksumSha256: r2.checksum_sha256,
        metadata: {
          kind: r2.photo_kind,
          caption: r2.caption,
        },
      }));
    if (storedFingerprint !== expectedFingerprint) return { kind: "conflict" };
    return {
      kind: "replay",
      photo: {
        id: r2.id,
        workOrderId,
        kind: r2.photo_kind,
        url: authenticatedMediaUrl(requestUrl, workOrderId, r2.id),
        caption: r2.caption,
        createdAt: r2.created_at,
      },
    };
  }

  const legacy = await db
    .prepare(
      `SELECT p.id, p.kind, p.data_url, p.caption, p.request_fingerprint,
              p.created_at
       FROM photos p
       JOIN work_orders w ON w.id = p.work_order_id
       WHERE p.work_order_id = ? AND p.idempotency_key = ? AND w.org_id = ?`,
    )
    .bind(workOrderId, idempotencyKey, orgId)
    .first<{
      id: string;
      kind: "before" | "after" | "other";
      data_url: string;
      caption: string | null;
      request_fingerprint: string | null;
      created_at: string;
    }>();
  if (!legacy) return { kind: "miss" };

  let storedFingerprint = legacy.request_fingerprint;
  if (!storedFingerprint) {
    try {
      storedFingerprint = await computeMediaRequestFingerprint({
        media: decodeMediaDataUrl(legacy.data_url, "photo"),
        metadata: {
          kind: legacy.kind,
          caption: legacy.caption,
        },
      });
    } catch {
      return { kind: "conflict" };
    }
  }
  if (storedFingerprint !== expectedFingerprint) return { kind: "conflict" };
  return {
    kind: "replay",
    photo: {
      id: legacy.id,
      workOrderId,
      kind: legacy.kind,
      url: authenticatedMediaUrl(requestUrl, workOrderId, legacy.id),
      caption: legacy.caption,
      createdAt: legacy.created_at,
    },
  };
}

async function loadIdempotentAudio(
  db: D1Database,
  orgId: string,
  workOrderId: string,
  idempotencyKey: string,
  expectedFingerprint: string,
  requestUrl: string,
): Promise<
  | { kind: "miss" }
  | { kind: "conflict" }
  | {
      kind: "replay";
      audio: {
        id: string;
        workOrderId: string;
        url: string;
        mimeType: string;
        caption: string | null;
        durationSeconds: number | null;
        createdAt: string;
        transcriptStatus: "not_connected";
      };
    }
> {
  const row = await db
    .prepare(
      `SELECT id, mime_type, checksum_sha256, caption, duration_seconds,
              request_fingerprint, created_at
       FROM media_assets
       WHERE org_id = ? AND work_order_id = ? AND media_type = 'audio'
         AND idempotency_key = ? AND deleted_at IS NULL`,
    )
    .bind(orgId, workOrderId, idempotencyKey)
    .first<{
      id: string;
      mime_type: string;
      checksum_sha256: string;
      caption: string | null;
      duration_seconds: number | null;
      request_fingerprint: string | null;
      created_at: string;
    }>();
  if (!row) return { kind: "miss" };
  const storedFingerprint =
    row.request_fingerprint ??
    (await computeMediaRequestFingerprintFromChecksum({
      mediaType: "audio",
      mimeType: row.mime_type,
      checksumSha256: row.checksum_sha256,
      metadata: {
        caption: row.caption,
        durationSeconds: row.duration_seconds,
      },
    }));
  if (storedFingerprint !== expectedFingerprint) return { kind: "conflict" };
  return {
    kind: "replay",
    audio: {
      id: row.id,
      workOrderId,
      url: authenticatedMediaUrl(requestUrl, workOrderId, row.id),
      mimeType: row.mime_type,
      caption: row.caption,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      transcriptStatus: "not_connected" as const,
    },
  };
}

async function upsertReportDraft(
  db: D1Database,
  workOrderId: string,
  draft: StructuredDraft,
  updatedAt: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM report_drafts WHERE work_order_id = ?")
    .bind(workOrderId)
    .first<{ id: string }>();
  if (existing) {
    await db
      .prepare(
        `UPDATE report_drafts
         SET structured_json = ?, updated_at = ?, revision = revision + 1
         WHERE work_order_id = ?`,
      )
      .bind(JSON.stringify(draft), updatedAt, workOrderId)
      .run();
    return;
  }
  await db
    .prepare(
      "INSERT INTO report_drafts (id, work_order_id, structured_json, updated_at) VALUES (?, ?, ?, ?)",
    )
    .bind(newId(), workOrderId, JSON.stringify(draft), updatedAt)
    .run();
}

function manualReportFallback(input: {
  transcript: string;
  workSummary: string | null;
  parts: UsedPart[];
  checklist: ChecklistItem[];
  issues: string | null;
  notes: string | null;
  nextInspectionDate: string | null;
}): StructuredDraft {
  const firstTranscriptLine =
    input.transcript
      .split(/[.\n]/u)
      .map((line) => line.trim())
      .find(Boolean) ?? "";
  return {
    workSummary: input.workSummary?.trim() || firstTranscriptLine,
    actions: [],
    usedParts: input.parts,
    checklist: input.checklist,
    fieldNotes: input.notes?.trim() ?? "",
    issues: input.issues?.trim() ? [input.issues.trim()] : [],
    recommendations: [],
    nextInspectionDate: input.nextInspectionDate,
    uncertainFields: [],
  };
}

function reconcileUncertainFields(
  uncertainFields: string[],
  nextPartCount: number,
): string[] {
  return uncertainFields.filter((field) => {
    const match = /^usedParts\[(\d+)\]\.(?:model|quantity)$/u.exec(field);
    return !match || Number(match[1]) < nextPartCount;
  });
}

function requestMimeType(request: Request): string {
  return (request.headers.get("Content-Type") ?? "")
    .split(";", 1)[0]!
    .trim()
    .toLowerCase();
}

async function readBoundedRequestBytes(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maxBytes
  ) {
    throw new MediaValidationError("media_too_large", "요청 본문의 용량 제한을 초과했습니다");
  }
  if (!request.body) {
    throw new MediaValidationError("empty_media", "빈 미디어는 저장할 수 없습니다");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new MediaValidationError("media_too_large", "요청 본문의 용량 제한을 초과했습니다");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) {
    throw new MediaValidationError("empty_media", "빈 미디어는 저장할 수 없습니다");
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function contentOrigin(requestUrl: string): string {
  return new URL(requestUrl).origin;
}

function authenticatedMediaUrl(
  requestUrl: string,
  workOrderId: string,
  mediaId: string,
): string {
  return `${contentOrigin(requestUrl)}/work-orders/${encodeURIComponent(workOrderId)}/media/${encodeURIComponent(mediaId)}`;
}

function mediaValidationResponse(error: unknown): { error: string } {
  return {
    error:
      error instanceof MediaValidationError
        ? error.message
        : "미디어 파일을 처리하지 못했습니다",
  };
}

function mediaValidationStatus(error: unknown): 400 | 413 {
  return error instanceof MediaValidationError && error.code === "media_too_large"
    ? 413
    : 400;
}

async function loadReportContextSnapshot(
  db: D1Database,
  orgId: string,
  workOrderId: string,
): Promise<ReportContextSnapshot | null> {
  const row = await db
    .prepare(
      `SELECT o.name AS org_name,
              op.business_no AS org_business_no, op.address AS org_address,
              op.contact_name AS org_contact_name, op.contact_phone AS org_contact_phone,
              op.contact_email AS org_contact_email,
              ola.id AS logo_id, ola.storage_key AS logo_storage_key,
              ola.mime_type AS logo_mime_type, ola.checksum_sha256 AS logo_checksum_sha256,
              ola.size_bytes AS logo_size_bytes,
              w.id, w.scheduled_date, w.scheduled_time, w.work_type, w.request,
              c.id AS customer_id, c.name AS customer_name, c.biz_no AS customer_business_no,
              c.address AS customer_address, c.contact_name AS customer_contact_name,
              c.contact_phone AS customer_contact_phone,
              s.id AS site_id, s.name AS site_name, s.address AS site_address,
              a.id AS asset_id, a.name AS asset_name, a.model AS asset_model, a.serial_no AS asset_serial
       FROM work_orders w
       JOIN organizations o ON o.id = w.org_id
       LEFT JOIN organization_profiles op ON op.org_id = o.id
       LEFT JOIN organization_logo_assets ola
         ON ola.id = (
           SELECT logo.id
           FROM organization_logo_assets logo
           WHERE logo.org_id = o.id AND logo.deleted_at IS NULL
           ORDER BY logo.created_at DESC, logo.rowid DESC
           LIMIT 1
         )
       JOIN customers c ON c.id = w.customer_id AND c.org_id = w.org_id
       JOIN sites s ON s.id = w.site_id AND s.org_id = w.org_id AND s.customer_id = c.id
       LEFT JOIN assets a ON a.id = w.asset_id AND a.org_id = w.org_id AND a.site_id = s.id
       WHERE w.org_id = ? AND w.id = ?
         AND (w.asset_id IS NULL OR a.id IS NOT NULL)`,
    )
    .bind(orgId, workOrderId)
    .first<{
      org_name: string;
      org_business_no: string | null;
      org_address: string | null;
      org_contact_name: string | null;
      org_contact_phone: string | null;
      org_contact_email: string | null;
      logo_id: string | null;
      logo_storage_key: string | null;
      logo_mime_type: ReportLogoSnapshot["mimeType"] | null;
      logo_checksum_sha256: string | null;
      logo_size_bytes: number | null;
      id: string;
      scheduled_date: string;
      scheduled_time: string | null;
      work_type: string;
      request: string | null;
      customer_id: string;
      customer_name: string;
      customer_business_no: string | null;
      customer_address: string | null;
      customer_contact_name: string | null;
      customer_contact_phone: string | null;
      site_id: string;
      site_name: string;
      site_address: string | null;
      asset_id: string | null;
      asset_name: string | null;
      asset_model: string | null;
      asset_serial: string | null;
    }>();

  if (!row) return null;
  const snapshotAssigneeNames = await assigneeNames(db, workOrderId);
  return {
    org: {
      name: row.org_name,
      businessNo: row.org_business_no,
      address: row.org_address,
      contactName: row.org_contact_name,
      contactPhone: row.org_contact_phone,
      contactEmail: row.org_contact_email,
      logo:
        row.logo_id &&
        row.logo_storage_key &&
        row.logo_mime_type &&
        row.logo_checksum_sha256 &&
        row.logo_size_bytes
          ? {
              id: row.logo_id,
              storageKey: row.logo_storage_key,
              mimeType: row.logo_mime_type,
              checksumSha256: row.logo_checksum_sha256,
              sizeBytes: row.logo_size_bytes,
            }
          : null,
    },
    workOrder: {
      id: row.id,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      workType: row.work_type,
      request: row.request,
    },
    customer: {
      id: row.customer_id,
      name: row.customer_name,
      businessNo: row.customer_business_no,
      address: row.customer_address,
      contactName: row.customer_contact_name,
      contactPhone: row.customer_contact_phone,
    },
    site: {
      id: row.site_id,
      name: row.site_name,
      address: row.site_address,
    },
    asset: row.asset_id
      ? {
          id: row.asset_id,
          name: row.asset_name ?? "",
          model: row.asset_model,
          serialNo: row.asset_serial,
        }
      : null,
    assigneeNames: snapshotAssigneeNames,
  };
}

async function assigneeNames(db: D1Database, workOrderId: string): Promise<string[]> {
  const rows = await db
    .prepare("SELECT u.name FROM assignments a JOIN users u ON u.id = a.user_id WHERE a.work_order_id = ?")
    .bind(workOrderId)
    .all<{ name: string }>();
  return (rows.results ?? []).map((r) => r.name);
}

async function assigneeIds(db: D1Database, workOrderId: string): Promise<string[]> {
  const rows = await db
    .prepare("SELECT user_id FROM assignments WHERE work_order_id = ?")
    .bind(workOrderId)
    .all<{ user_id: string }>();
  return (rows.results ?? []).map((r) => r.user_id);
}

async function allActiveMembers(db: D1Database, orgId: string, userIds: string[]): Promise<boolean> {
  if (userIds.length === 0) return true;
  if (new Set(userIds).size !== userIds.length) return false;
  const placeholders = userIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(`SELECT user_id FROM memberships WHERE org_id = ? AND active = 1 AND user_id IN (${placeholders})`)
    .bind(orgId, ...userIds)
    .all<{ user_id: string }>();
  const found = new Set((rows.results ?? []).map((r) => r.user_id));
  return userIds.every((uid) => found.has(uid));
}

type AssignmentChangeResult = {
  added: string[];
  removed: string[];
  workStatus: string;
  updatedAt: string;
};

type WorkOrderMutableFields = {
  scheduledDate: string;
  scheduledTime: string | null;
  workType: string;
  request: string | null;
  customerId: string;
  siteId: string;
  assetId: string | null;
};

async function replaceAssignments(
  db: D1Database,
  args: {
    orgId: string;
    workOrder: WorkOrderRow;
    userIds: string[];
    actorUserId: string;
    fields: WorkOrderMutableFields;
  },
): Promise<AssignmentChangeResult | null> {
  const currentIds = await assigneeIds(db, args.workOrder.id);
  const current = new Set(currentIds);
  const next = new Set(args.userIds);
  const added = args.userIds.filter((userId) => !current.has(userId));
  const removed = currentIds.filter((userId) => !next.has(userId));
  const ts = nowIso();
  const nextStatus =
    args.workOrder.work_status === "draft" && args.userIds.length > 0
      ? "scheduled"
      : args.workOrder.work_status;
  const nextRevision = args.workOrder.revision + 1;
  const writeToken = newId();

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE work_orders
         SET work_status = ?,
             scheduled_date = ?,
             scheduled_time = ?,
             work_type = ?,
             request = ?,
             customer_id = ?,
             site_id = ?,
             asset_id = ?,
             updated_at = ?,
             revision = ?,
             write_token = ?
         WHERE id = ? AND org_id = ? AND work_status = ? AND revision = ?`,
      )
      .bind(
        nextStatus,
        args.fields.scheduledDate,
        args.fields.scheduledTime,
        args.fields.workType,
        args.fields.request,
        args.fields.customerId,
        args.fields.siteId,
        args.fields.assetId,
        ts,
        nextRevision,
        writeToken,
        args.workOrder.id,
        args.orgId,
        args.workOrder.work_status,
        args.workOrder.revision,
      ),
  ];
  for (const userId of removed) {
    statements.push(
      db
        .prepare(
          `DELETE FROM assignments
           WHERE work_order_id = ? AND user_id = ?
             AND EXISTS (
               SELECT 1 FROM work_orders
               WHERE id = ? AND org_id = ? AND revision = ? AND write_token = ?
             )`,
        )
        .bind(
          args.workOrder.id,
          userId,
          args.workOrder.id,
          args.orgId,
          nextRevision,
          writeToken,
        ),
      db
        .prepare(
          `INSERT INTO assignment_events
             (id, org_id, work_order_id, user_id, action, actor_user_id, created_at)
           SELECT ?, ?, ?, ?, 'unassigned', ?, ?
           WHERE EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND revision = ? AND write_token = ?
           )`,
        )
        .bind(
          newId(),
          args.orgId,
          args.workOrder.id,
          userId,
          args.actorUserId,
          ts,
          args.workOrder.id,
          args.orgId,
          nextRevision,
          writeToken,
        ),
    );
  }
  for (const userId of added) {
    statements.push(
      db
        .prepare(
          `INSERT INTO assignments (id, work_order_id, user_id)
           SELECT ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND revision = ? AND write_token = ?
           )`,
        )
        .bind(
          newId(),
          args.workOrder.id,
          userId,
          args.workOrder.id,
          args.orgId,
          nextRevision,
          writeToken,
        ),
      db
        .prepare(
          `INSERT INTO assignment_events
             (id, org_id, work_order_id, user_id, action, actor_user_id, created_at)
           SELECT ?, ?, ?, ?, 'assigned', ?, ?
           WHERE EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND revision = ? AND write_token = ?
           )`,
        )
        .bind(
          newId(),
          args.orgId,
          args.workOrder.id,
          userId,
          args.actorUserId,
          ts,
          args.workOrder.id,
          args.orgId,
          nextRevision,
          writeToken,
        ),
    );
  }

  const results = await db.batch(statements);
  if (results[0]?.meta.changes !== 1) return null;

  for (const userId of removed) {
    await notify(db, {
      orgId: args.orgId,
      userId,
      type: "assignment_removed",
      workOrderId: args.workOrder.id,
      message: `${args.workOrder.scheduled_date} ${args.workOrder.work_type} 작업 배정이 해제되었습니다`,
    });
  }
  for (const userId of added) {
    await notify(db, {
      orgId: args.orgId,
      userId,
      type: "assigned",
      workOrderId: args.workOrder.id,
      message: `${args.workOrder.scheduled_date} ${args.workOrder.work_type} 작업이 배정되었습니다`,
    });
  }
  if (added.length > 0 || removed.length > 0 || nextStatus !== args.workOrder.work_status) {
    await recordAudit(db, {
      orgId: args.orgId,
      actorUserId: args.actorUserId,
      event: "assignment_changed",
      target: args.workOrder.id,
      detail: {
        added,
        removed,
        fromStatus: args.workOrder.work_status,
        toStatus: nextStatus,
      },
    });
  }
  return { added, removed, workStatus: nextStatus, updatedAt: ts };
}

async function loadAssignmentHistory(
  db: D1Database,
  orgId: string,
  workOrderId: string,
) {
  const rows = await db
    .prepare(
      `SELECT ae.id, ae.work_order_id, ae.user_id, subject.name AS user_name,
              ae.action, ae.actor_user_id, actor.name AS actor_name, ae.created_at
       FROM assignment_events ae
       JOIN users subject ON subject.id = ae.user_id
       LEFT JOIN users actor ON actor.id = ae.actor_user_id
       WHERE ae.org_id = ? AND ae.work_order_id = ?
       ORDER BY ae.created_at ASC, ae.id ASC`,
    )
    .bind(orgId, workOrderId)
    .all<{
      id: string;
      work_order_id: string;
      user_id: string;
      user_name: string;
      action: "assigned" | "unassigned";
      actor_user_id: string | null;
      actor_name: string | null;
      created_at: string;
    }>();
  return (rows.results ?? []).map((row) => ({
    id: row.id,
    workOrderId: row.work_order_id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    createdAt: row.created_at,
  }));
}

async function hasValidWorkOrderHierarchy(
  db: D1Database,
  orgId: string,
  customerId: string,
  siteId: string,
  assetId: string | null,
): Promise<boolean> {
  const site = await db
    .prepare(
      `SELECT 1
       FROM sites s
       JOIN customers c ON c.id = s.customer_id AND c.org_id = s.org_id
       LEFT JOIN master_entity_states customer_state
         ON customer_state.org_id = c.org_id
        AND customer_state.entity_type = 'customer'
        AND customer_state.entity_id = c.id
       LEFT JOIN master_entity_states site_state
         ON site_state.org_id = s.org_id
        AND site_state.entity_type = 'site'
        AND site_state.entity_id = s.id
       WHERE s.org_id = ? AND s.id = ? AND c.id = ?
         AND COALESCE(customer_state.active, 1) = 1
         AND COALESCE(site_state.active, 1) = 1`,
    )
    .bind(orgId, siteId, customerId)
    .first();
  if (!site) return false;
  if (!assetId) return true;

  const asset = await db
    .prepare(
      `SELECT 1
       FROM assets a
       LEFT JOIN master_entity_states asset_state
         ON asset_state.org_id = a.org_id
        AND asset_state.entity_type = 'asset'
        AND asset_state.entity_id = a.id
       WHERE a.org_id = ? AND a.id = ? AND a.site_id = ?
         AND COALESCE(asset_state.active, 1) = 1`,
    )
    .bind(orgId, assetId, siteId)
    .first();
  return !!asset;
}

type MaintenanceScheduleListRow = MaintenanceScheduleRow & {
  customer_name: string;
  site_name: string;
  asset_name: string | null;
};

function maintenanceScheduleResponse(
  row: MaintenanceScheduleListRow,
  occurrences: MaintenanceOccurrenceRow[],
) {
  return {
    id: row.id,
    sourceWorkOrderId: row.source_work_order_id,
    sourceReportVersionId: row.source_report_version_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    siteId: row.site_id,
    siteName: row.site_name,
    assetId: row.asset_id,
    assetName: row.asset_name,
    scheduledTime: row.scheduled_time,
    workType: row.work_type,
    request: row.request,
    assigneeIds: maintenanceAssigneeSnapshot(row),
    frequency: row.frequency,
    intervalCount: row.interval_count,
    anchorDate: row.anchor_date,
    nextOccurrenceDate: row.next_occurrence_date,
    endDate: row.end_date,
    status: row.status,
    lastErrorCode: row.last_error_code,
    lastErrorMessage: row.last_error_message,
    lastErrorAt: row.last_error_at,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    occurrences: occurrences.map((occurrence) => ({
      id: occurrence.id,
      occurrenceDate: occurrence.occurrence_date,
      workOrderId: occurrence.work_order_id,
      createdAt: occurrence.created_at,
    })),
  };
}

type MaintenanceMaterializationResult = {
  advanced: boolean;
  created: boolean;
  assignedCount: number;
  blocked: {
    scheduleId: string;
    code: "inactive_hierarchy" | "no_active_assignees";
    message: string;
    nextOccurrenceDate: string;
  } | null;
};

async function activeMaintenanceAssigneeIds(
  db: D1Database,
  row: MaintenanceScheduleRow,
): Promise<string[]> {
  const snapshot = maintenanceAssigneeSnapshot(row);
  if (snapshot.length === 0) return [];
  const placeholders = snapshot.map(() => "?").join(", ");
  const activeRows = await db
    .prepare(
      `SELECT user_id
       FROM memberships
       WHERE org_id = ? AND active = 1
         AND user_id IN (${placeholders})`,
    )
    .bind(row.org_id, ...snapshot)
    .all<{ user_id: string }>();
  const active = new Set((activeRows.results ?? []).map((item) => item.user_id));
  return snapshot.filter((userId) => active.has(userId));
}

async function pauseBlockedMaintenanceSchedule(
  db: D1Database,
  row: MaintenanceScheduleRow,
  code: "inactive_hierarchy" | "no_active_assignees",
  message: string,
  actorUserId: string,
): Promise<boolean> {
  const ts = nowIso();
  const nextRevision = row.revision + 1;
  const results = await db.batch([
    db
      .prepare(
        `UPDATE maintenance_schedules
         SET status = 'paused',
             last_error_code = ?,
             last_error_message = ?,
             last_error_at = ?,
             revision = ?,
             updated_at = ?
         WHERE id = ? AND org_id = ? AND status = 'active'
           AND revision = ? AND next_occurrence_date = ?`,
      )
      .bind(
        code,
        message,
        ts,
        nextRevision,
        ts,
        row.id,
        row.org_id,
        row.revision,
        row.next_occurrence_date,
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO audit_events
           (id, org_id, actor_user_id, event, target, detail_json, created_at)
         SELECT ?, ?, ?, 'maintenance_schedule_blocked', ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM maintenance_schedules
           WHERE id = ? AND org_id = ? AND status = 'paused'
             AND revision = ? AND last_error_code = ?
         )`,
      )
      .bind(
        `${row.id}:blocked:${nextRevision}`,
        row.org_id,
        actorUserId,
        row.id,
        JSON.stringify({
          code,
          message,
          nextOccurrenceDate: row.next_occurrence_date,
        }),
        ts,
        row.id,
        row.org_id,
        nextRevision,
        code,
      ),
  ]);
  return (
    results[0]?.meta.changes === 1 &&
    results[1]?.meta.changes === 1
  );
}

async function materializeNextMaintenanceOccurrence(
  db: D1Database,
  row: MaintenanceScheduleRow,
  actorUserId: string,
): Promise<MaintenanceMaterializationResult> {
  const occurrenceDate = row.next_occurrence_date;
  if (row.status !== "active" || !occurrenceDate) {
    return {
      advanced: false,
      created: false,
      assignedCount: 0,
      blocked: null,
    };
  }

  if (
    !(await hasValidWorkOrderHierarchy(
      db,
      row.org_id,
      row.customer_id,
      row.site_id,
      row.asset_id,
    ))
  ) {
    const message =
      "고객·현장·장비 중 비활성 항목이 있어 다음 작업 생성을 일시중지했습니다";
    const paused = await pauseBlockedMaintenanceSchedule(
      db,
      row,
      "inactive_hierarchy",
      message,
      actorUserId,
    );
    return {
      advanced: false,
      created: false,
      assignedCount: 0,
      blocked: paused
        ? {
            scheduleId: row.id,
            code: "inactive_hierarchy",
            message,
            nextOccurrenceDate: occurrenceDate,
          }
        : null,
    };
  }

  const activeAssigneeIds = await activeMaintenanceAssigneeIds(db, row);
  if (activeAssigneeIds.length === 0) {
    const message =
      "활성 담당자가 없어 다음 작업 생성을 일시중지했습니다";
    const paused = await pauseBlockedMaintenanceSchedule(
      db,
      row,
      "no_active_assignees",
      message,
      actorUserId,
    );
    return {
      advanced: false,
      created: false,
      assignedCount: 0,
      blocked: paused
        ? {
            scheduleId: row.id,
            code: "no_active_assignees",
            message,
            nextOccurrenceDate: occurrenceDate,
          }
        : null,
    };
  }

  if (row.end_date && occurrenceDate > row.end_date) {
    const closed = await db
      .prepare(
        `UPDATE maintenance_schedules
         SET status = 'completed',
             next_occurrence_date = NULL,
             revision = revision + 1,
             updated_at = ?
         WHERE id = ? AND org_id = ? AND status = 'active'
           AND revision = ? AND next_occurrence_date = ?`,
      )
      .bind(
        nowIso(),
        row.id,
        row.org_id,
        row.revision,
        occurrenceDate,
      )
      .run();
    return {
      advanced: closed.meta.changes === 1,
      created: false,
      assignedCount: 0,
      blocked: null,
    };
  }

  const followingDate = nextMaintenanceOccurrence(
    occurrenceDate,
    row.frequency,
    row.interval_count,
    row.anchor_date,
  );
  const completes = !!row.end_date && followingDate > row.end_date;
  const nextOccurrenceDate = completes ? null : followingDate;
  const nextStatus = completes ? "completed" : "active";
  const workOrderId = maintenanceWorkOrderId(row.id, occurrenceDate);
  const occurrenceId = maintenanceOccurrenceId(row.id, occurrenceDate);
  const assigneeIds = activeAssigneeIds;
  const ts = nowIso();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT OR IGNORE INTO work_orders
           (id, org_id, customer_id, site_id, asset_id, scheduled_date,
            scheduled_time, work_type, request, work_status, approval_status,
            billing_status, ai_status, created_by, created_at, updated_at)
         SELECT ?, ms.org_id, ms.customer_id, ms.site_id, ms.asset_id, ?,
                ms.scheduled_time, ms.work_type, ms.request, 'scheduled',
                'not_sent', 'none', 'idle', ms.created_by, ?, ?
         FROM maintenance_schedules ms
         WHERE ms.id = ? AND ms.org_id = ? AND ms.status = 'active'
           AND ms.revision = ? AND ms.next_occurrence_date = ?
           AND EXISTS (
             SELECT 1
             FROM memberships member
             JOIN json_each(?) active_candidate
               ON active_candidate.value = member.user_id
             WHERE member.org_id = ms.org_id AND member.active = 1
           )
           AND EXISTS (
             SELECT 1
             FROM sites site
             JOIN customers customer
               ON customer.id = site.customer_id
              AND customer.org_id = site.org_id
             LEFT JOIN master_entity_states customer_state
               ON customer_state.org_id = customer.org_id
              AND customer_state.entity_type = 'customer'
              AND customer_state.entity_id = customer.id
             LEFT JOIN master_entity_states site_state
               ON site_state.org_id = site.org_id
              AND site_state.entity_type = 'site'
              AND site_state.entity_id = site.id
             WHERE site.org_id = ms.org_id
               AND site.id = ms.site_id
               AND customer.id = ms.customer_id
               AND COALESCE(customer_state.active, 1) = 1
               AND COALESCE(site_state.active, 1) = 1
           )
           AND (
             ms.asset_id IS NULL
             OR EXISTS (
               SELECT 1
               FROM assets asset
               LEFT JOIN master_entity_states asset_state
                 ON asset_state.org_id = asset.org_id
                AND asset_state.entity_type = 'asset'
                AND asset_state.entity_id = asset.id
               WHERE asset.org_id = ms.org_id
                 AND asset.id = ms.asset_id
                 AND asset.site_id = ms.site_id
                 AND COALESCE(asset_state.active, 1) = 1
             )
           )`,
      )
      .bind(
        workOrderId,
        occurrenceDate,
        ts,
        ts,
        row.id,
        row.org_id,
        row.revision,
        occurrenceDate,
        JSON.stringify(assigneeIds),
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO maintenance_occurrences
           (id, org_id, schedule_id, occurrence_date, work_order_id, created_at)
         SELECT ?, ms.org_id, ms.id, ?, ?, ?
         FROM maintenance_schedules ms
         WHERE ms.id = ? AND ms.org_id = ? AND ms.status = 'active'
           AND ms.revision = ? AND ms.next_occurrence_date = ?
           AND EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ms.org_id
           )`,
      )
      .bind(
        occurrenceId,
        occurrenceDate,
        workOrderId,
        ts,
        row.id,
        row.org_id,
        row.revision,
        occurrenceDate,
        workOrderId,
      ),
  ];

  const assignmentStatementIndexes: number[] = [];
  for (const userId of assigneeIds) {
    assignmentStatementIndexes.push(statements.length);
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO assignments (id, work_order_id, user_id)
           SELECT ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM work_orders WHERE id = ? AND org_id = ?
           )
             AND EXISTS (
               SELECT 1 FROM memberships
               WHERE org_id = ? AND user_id = ? AND active = 1
             )
             AND EXISTS (
               SELECT 1
               FROM maintenance_schedules current_schedule
               JOIN maintenance_occurrences current_occurrence
                 ON current_occurrence.schedule_id = current_schedule.id
                AND current_occurrence.occurrence_date = ?
                AND current_occurrence.work_order_id = ?
               WHERE current_schedule.id = ?
                 AND current_schedule.org_id = ?
                 AND current_schedule.status = 'active'
                 AND current_schedule.revision = ?
                 AND current_schedule.next_occurrence_date = ?
             )`,
        )
        .bind(
          maintenanceAssignmentId(workOrderId, userId),
          workOrderId,
          userId,
          workOrderId,
          row.org_id,
          row.org_id,
          userId,
          occurrenceDate,
          workOrderId,
          row.id,
          row.org_id,
          row.revision,
          occurrenceDate,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO assignment_events
             (id, org_id, work_order_id, user_id, action, actor_user_id, created_at)
           SELECT ?, ?, ?, ?, 'assigned', ?, ?
           WHERE EXISTS (
             SELECT 1 FROM assignments
             WHERE work_order_id = ? AND user_id = ?
           )
             AND EXISTS (
               SELECT 1 FROM maintenance_schedules
               WHERE id = ? AND org_id = ? AND status = 'active'
                 AND revision = ? AND next_occurrence_date = ?
           )`,
        )
        .bind(
          maintenanceAssignmentEventId(workOrderId, userId),
          row.org_id,
          workOrderId,
          userId,
          actorUserId,
          ts,
          workOrderId,
          userId,
          row.id,
          row.org_id,
          row.revision,
          occurrenceDate,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO notifications
             (id, org_id, user_id, type, work_order_id, message, created_at, read_at)
           SELECT ?, ?, ?, 'assigned', ?, ?, ?, NULL
           WHERE EXISTS (
             SELECT 1 FROM assignments
             WHERE work_order_id = ? AND user_id = ?
           )
             AND EXISTS (
               SELECT 1 FROM maintenance_schedules
               WHERE id = ? AND org_id = ? AND status = 'active'
                 AND revision = ? AND next_occurrence_date = ?
           )`,
        )
        .bind(
          maintenanceNotificationId(workOrderId, userId),
          row.org_id,
          userId,
          workOrderId,
          `${occurrenceDate} ${row.work_type} 정기 작업이 배정되었습니다`,
          ts,
          workOrderId,
          userId,
          row.id,
          row.org_id,
          row.revision,
          occurrenceDate,
        ),
    );
  }

  statements.push(
    db
      .prepare(
        `INSERT OR IGNORE INTO audit_events
           (id, org_id, actor_user_id, event, target, detail_json, created_at)
         SELECT ?, ?, ?, 'maintenance_work_generated', ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM work_orders WHERE id = ? AND org_id = ?
         )
           AND EXISTS (
             SELECT 1 FROM maintenance_schedules
             WHERE id = ? AND org_id = ? AND status = 'active'
               AND revision = ? AND next_occurrence_date = ?
         )`,
      )
      .bind(
        maintenanceAuditId(workOrderId),
        row.org_id,
        actorUserId,
        workOrderId,
        JSON.stringify({
          scheduleId: row.id,
          occurrenceDate,
        }),
        ts,
        workOrderId,
        row.org_id,
        row.id,
        row.org_id,
        row.revision,
        occurrenceDate,
      ),
  );
  const cursorStatementIndex = statements.length;
  statements.push(
    db
      .prepare(
        `UPDATE maintenance_schedules
         SET next_occurrence_date = ?,
             status = ?,
             revision = revision + 1,
             updated_at = ?
         WHERE id = ? AND org_id = ? AND status = 'active'
           AND revision = ? AND next_occurrence_date = ?
           AND EXISTS (
             SELECT 1
             FROM maintenance_occurrences occurrence
             WHERE occurrence.schedule_id = maintenance_schedules.id
               AND occurrence.occurrence_date = ?
               AND occurrence.work_order_id = ?
           )`,
      )
      .bind(
        nextOccurrenceDate,
        nextStatus,
        ts,
        row.id,
        row.org_id,
        row.revision,
        occurrenceDate,
        occurrenceDate,
        workOrderId,
      ),
  );

  const results = await db.batch(statements);
  const assignedCount = assignmentStatementIndexes.reduce(
    (count, index) => count + (results[index]?.meta.changes === 1 ? 1 : 0),
    0,
  );
  return {
    advanced: results[cursorStatementIndex]?.meta.changes === 1,
    created: results[0]?.meta.changes === 1,
    assignedCount,
    blocked: null,
  };
}

const cancelSchema = z.object({ reason: z.string().min(1) });
const finalizeReportSchema = z.object({
  confirmedUncertainFields: z.array(z.string().min(1).max(200)).max(100),
});

async function revisionRequestTargetsLatestVersion(
  db: D1Database,
  workOrderId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1
       FROM approval_requests ar
       WHERE ar.work_order_id = ?
         AND (
           ar.status = 'revision_requested'
           OR (
             ar.status = 'approved'
             AND ar.correction_requested_at IS NOT NULL
           )
         )
         AND ar.report_version_id = (
           SELECT id FROM report_versions
           WHERE work_order_id = ?
           ORDER BY version DESC LIMIT 1
         )
       ORDER BY ar.sent_at DESC, ar.id DESC
       LIMIT 1`,
    )
    .bind(workOrderId, workOrderId)
    .first();
  return !!row;
}

async function isAssigned(db: D1Database, workOrderId: string, userId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM assignments WHERE work_order_id = ? AND user_id = ?")
    .bind(workOrderId, userId)
    .first();
  return !!row;
}

type WorkOrderContactContext = {
  siteAddress?: string | null;
  accessInfo?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

function summaryOf(
  r: WorkOrderRow,
  customerName: string,
  siteName: string,
  names: string[],
  contact: WorkOrderContactContext = {},
) {
  return {
    id: r.id,
    workStatus: r.work_status,
    approvalStatus: r.approval_status,
    billingStatus: r.billing_status,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time,
    workType: r.work_type,
    customerName,
    siteName,
    assigneeNames: names,
    request: r.request,
    siteAddress: contact.siteAddress ?? null,
    accessInfo: contact.accessInfo ?? null,
    contactName: contact.contactName ?? null,
    contactPhone: contact.contactPhone ?? null,
  };
}

function fieldSafeSummary<T extends ReturnType<typeof summaryOf>>(summary: T) {
  const {
    approvalStatus: _approvalStatus,
    billingStatus: _billingStatus,
    ...safe
  } = summary;
  return safe;
}

async function maintenanceCreateReplayPayload(
  db: D1Database,
  orgId: string,
  schedule: MaintenanceScheduleRow,
) {
  const workOrder = await db
    .prepare("SELECT * FROM work_orders WHERE id = ? AND org_id = ?")
    .bind(schedule.source_work_order_id, orgId)
    .first<WorkOrderRow>();
  if (!workOrder) {
    throw new Error("Maintenance source work order is missing");
  }
  return {
    workOrder: {
      ...summaryOf(workOrder, "", "", []),
      customerId: workOrder.customer_id,
      siteId: workOrder.site_id,
      assetId: workOrder.asset_id,
      request: workOrder.request,
      assigneeIds: maintenanceAssigneeSnapshot(schedule),
      createdAt: workOrder.created_at,
      updatedAt: workOrder.updated_at,
    },
    maintenanceSchedule: {
      id: schedule.id,
      status: schedule.status,
      nextOccurrenceDate: schedule.next_occurrence_date,
    },
    replayed: true,
  };
}

// ---------------------------------------------------------------------------
// GET /work-orders
// ---------------------------------------------------------------------------

workOrderRoutes.get("/work-orders", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const role = c.get("role");
  if (role !== "admin" && role !== "office" && role !== "field") {
    return c.json({ error: "권한이 없습니다" }, 403);
  }
  const date = c.req.query("date");
  const status = c.req.query("status");
  const mine = c.req.query("mine") === "1" || role === "field";

  const conditions = ["wo.org_id = ?"];
  const params: unknown[] = [orgId];
  if (date) {
    conditions.push("wo.scheduled_date = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("wo.work_status = ?");
    params.push(status);
  }
  if (mine) {
    conditions.push("EXISTS (SELECT 1 FROM assignments a WHERE a.work_order_id = wo.id AND a.user_id = ?)");
    params.push(c.get("userId"));
  }

  const rows = await c.env.DB.prepare(
    `SELECT wo.*, c.name AS customer_name, s.name AS site_name,
            COALESCE(s.address, c.address) AS site_address,
            s.access_info, c.contact_name, c.contact_phone
     FROM work_orders wo
     JOIN customers c ON c.id = wo.customer_id
     JOIN sites s ON s.id = wo.site_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY wo.scheduled_date DESC, wo.scheduled_time ASC`,
  )
    .bind(...params)
    .all<
      WorkOrderRow & {
        customer_name: string;
        site_name: string;
        site_address: string | null;
        access_info: string | null;
        contact_name: string | null;
        contact_phone: string | null;
      }
    >();

  const workOrders = await Promise.all(
    (rows.results ?? []).map(async (r) => {
      const summary = summaryOf(
        r,
        r.customer_name,
        r.site_name,
        await assigneeNames(c.env.DB, r.id),
        {
          siteAddress: r.site_address,
          accessInfo: r.access_info,
          contactName: r.contact_name,
          contactPhone: r.contact_phone,
        },
      );
      return role === "field" ? fieldSafeSummary(summary) : summary;
    }),
  );

  return c.json({ workOrders });
});

// ---------------------------------------------------------------------------
// POST /work-orders
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = workOrderCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const intent =
    d.intent ?? (d.assigneeIds.length > 0 ? "schedule" : "draft");
  if (intent === "schedule" && d.assigneeIds.length === 0) {
    return c.json(
      { error: "예정 작업에는 담당자를 한 명 이상 배정해야 합니다" },
      400,
    );
  }
  const initialStatus = intent === "schedule" ? "scheduled" : "draft";
  let recurrenceIdentity: {
    idempotencyKey: string;
    requestFingerprint: string;
    scheduleId: string;
    sourceWorkOrderId: string;
  } | null = null;

  if (d.recurrence) {
    if (intent !== "schedule") {
      return c.json(
        { error: "반복 일정은 예정 작업으로만 등록할 수 있습니다" },
        400,
      );
    }
    const idempotencyKey = c.req.header("Idempotency-Key")?.trim() ?? "";
    if (!MAINTENANCE_IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return c.json(
        {
          error:
            "반복 일정 등록에는 8~128자의 유효한 Idempotency-Key가 필요합니다",
        },
        400,
      );
    }
    const requestFingerprint = await sha256Hex(
      JSON.stringify({
        customerId: d.customerId,
        siteId: d.siteId,
        assetId: d.assetId ?? null,
        scheduledDate: d.scheduledDate,
        scheduledTime: d.scheduledTime ?? null,
        workType: d.workType,
        request: d.request ?? null,
        assigneeIds: [...d.assigneeIds].sort(),
        sourceReportVersionId: d.sourceReportVersionId ?? null,
        recurrence: {
          frequency: d.recurrence.frequency,
          intervalCount: d.recurrence.intervalCount,
          endDate: d.recurrence.endDate ?? null,
        },
      }),
    );
    const identityDigest = await sha256Hex(
      d.sourceReportVersionId
        ? `${orgId}:report:${d.sourceReportVersionId}`
        : `${orgId}:${idempotencyKey}`,
    );
    recurrenceIdentity = {
      idempotencyKey,
      requestFingerprint,
      scheduleId: `maintenance-schedule:${identityDigest}`,
      sourceWorkOrderId: `maintenance-source:${identityDigest}`,
    };

    let matchedBySourceReport = false;
    let existingSchedule: MaintenanceScheduleRow | null = null;
    if (d.sourceReportVersionId) {
      existingSchedule = await c.env.DB
        .prepare(
          `SELECT *
           FROM maintenance_schedules
           WHERE org_id = ? AND source_report_version_id = ?`,
        )
        .bind(orgId, d.sourceReportVersionId)
        .first<MaintenanceScheduleRow>();
      matchedBySourceReport = !!existingSchedule;
    }
    existingSchedule ??= await c.env.DB
      .prepare(
        `SELECT *
         FROM maintenance_schedules
         WHERE org_id = ? AND idempotency_key = ?`,
      )
      .bind(orgId, idempotencyKey)
      .first<MaintenanceScheduleRow>();
    if (existingSchedule) {
      if (existingSchedule.request_fingerprint !== requestFingerprint) {
        return c.json(
          {
            error: matchedBySourceReport
              ? "이 확정 보고서의 다음 점검 일정이 이미 다른 내용으로 등록되었습니다"
              : "같은 Idempotency-Key가 다른 반복 일정 요청에 이미 사용되었습니다",
          },
          409,
        );
      }
      return c.json(
        await maintenanceCreateReplayPayload(
          c.env.DB,
          orgId,
          existingSchedule,
        ),
      );
    }

    if (d.sourceReportVersionId) {
      const sourceReport = await c.env.DB
        .prepare(
          `SELECT rv.structured_json, source.customer_id, source.site_id,
                  source.asset_id
           FROM report_versions rv
           JOIN work_orders source ON source.id = rv.work_order_id
           WHERE rv.id = ? AND source.org_id = ?
             AND source.approval_status <> 'revision_requested'
             AND NOT EXISTS (
               SELECT 1
               FROM report_versions newer
               WHERE newer.work_order_id = rv.work_order_id
                 AND newer.version > rv.version
             )
           LIMIT 1`,
        )
        .bind(d.sourceReportVersionId, orgId)
        .first<{
          structured_json: string;
          customer_id: string;
          site_id: string;
          asset_id: string | null;
        }>();
      const sourceStructured = sourceReport
        ? structuredDraftSchema.safeParse(
            parseJson(sourceReport.structured_json, null),
          )
        : null;
      if (
        !sourceReport ||
        !sourceStructured?.success ||
        sourceStructured.data.nextInspectionDate !== d.scheduledDate
      ) {
        return c.json(
          {
            error:
              "확정 보고서의 다음 점검 정보가 변경되었습니다. 작업 상세에서 다시 시작해주세요",
          },
          409,
        );
      }
      if (
        sourceReport.customer_id !== d.customerId ||
        sourceReport.site_id !== d.siteId ||
        sourceReport.asset_id !== (d.assetId ?? null)
      ) {
        return c.json(
          {
            error:
              "확정 보고서와 고객·현장·장비 정보가 일치하지 않습니다",
          },
          409,
        );
      }
    }
  }

  if (
    !(await hasValidWorkOrderHierarchy(
      c.env.DB,
      orgId,
      d.customerId,
      d.siteId,
      d.assetId ?? null,
    ))
  ) {
    return c.json({ error: "고객·현장·장비 연결이 올바르지 않습니다" }, 400);
  }
  if (!(await allActiveMembers(c.env.DB, orgId, d.assigneeIds))) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  const id = recurrenceIdentity?.sourceWorkOrderId ?? newId();
  const ts = nowIso();
  let maintenanceSchedule:
    | {
        id: string;
        status: MaintenanceScheduleRow["status"];
        nextOccurrenceDate: string | null;
      }
    | null = null;

  if (d.recurrence) {
    const identity = recurrenceIdentity!;
    const scheduleId = identity.scheduleId;
    const candidateNextDate = nextMaintenanceOccurrence(
      d.scheduledDate,
      d.recurrence.frequency,
      d.recurrence.intervalCount,
      d.scheduledDate,
    );
    const hasFutureOccurrence =
      !d.recurrence.endDate ||
      candidateNextDate <= d.recurrence.endDate;
    const nextOccurrenceDate = hasFutureOccurrence
      ? candidateNextDate
      : null;
    const scheduleStatus = hasFutureOccurrence ? "active" : "completed";
    const statements: D1PreparedStatement[] = [
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO work_orders
             (id, org_id, customer_id, site_id, asset_id, scheduled_date,
              scheduled_time, work_type, request, work_status, approval_status,
              billing_status, ai_status, created_by, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 'not_sent',
                  'none', 'idle', ?, ?, ?
           FROM sites site
           JOIN customers customer
             ON customer.id = site.customer_id
            AND customer.org_id = site.org_id
           LEFT JOIN master_entity_states customer_state
             ON customer_state.org_id = customer.org_id
            AND customer_state.entity_type = 'customer'
            AND customer_state.entity_id = customer.id
           LEFT JOIN master_entity_states site_state
             ON site_state.org_id = site.org_id
            AND site_state.entity_type = 'site'
            AND site_state.entity_id = site.id
           WHERE site.org_id = ? AND site.id = ? AND customer.id = ?
             AND COALESCE(customer_state.active, 1) = 1
             AND COALESCE(site_state.active, 1) = 1
             AND (
               ? IS NULL
               OR EXISTS (
                 SELECT 1
                 FROM assets asset
                 LEFT JOIN master_entity_states asset_state
                   ON asset_state.org_id = asset.org_id
                  AND asset_state.entity_type = 'asset'
                  AND asset_state.entity_id = asset.id
                 WHERE asset.org_id = ? AND asset.id = ?
                   AND asset.site_id = site.id
                   AND COALESCE(asset_state.active, 1) = 1
               )
             )
             AND NOT EXISTS (
               SELECT 1
               FROM json_each(?) snapshot
               WHERE NOT EXISTS (
                 SELECT 1 FROM memberships member
                 WHERE member.org_id = ?
                   AND member.user_id = CAST(snapshot.value AS TEXT)
                   AND member.active = 1
               )
             )
             AND (
               ? IS NULL
               OR EXISTS (
                 SELECT 1
                 FROM report_versions source_report
                 JOIN work_orders source_work
                   ON source_work.id = source_report.work_order_id
                 WHERE source_report.id = ?
                   AND source_work.org_id = ?
                   AND source_work.approval_status <> 'revision_requested'
                   AND source_work.customer_id = ?
                   AND source_work.site_id = ?
                   AND (
                     (source_work.asset_id IS NULL AND ? IS NULL)
                     OR source_work.asset_id = ?
                   )
                   AND json_valid(source_report.structured_json)
                   AND json_extract(
                     source_report.structured_json,
                     '$.nextInspectionDate'
                   ) = ?
                   AND NOT EXISTS (
                     SELECT 1
                     FROM report_versions newer
                     WHERE newer.work_order_id = source_report.work_order_id
                       AND newer.version > source_report.version
                   )
               )
             )
             AND NOT EXISTS (
               SELECT 1
               FROM maintenance_schedules existing
               WHERE existing.org_id = ?
                 AND (
                   existing.idempotency_key = ?
                   OR (
                     ? IS NOT NULL
                     AND existing.source_report_version_id = ?
                   )
                 )
             )`,
        )
        .bind(
          id,
          orgId,
          d.customerId,
          d.siteId,
          d.assetId ?? null,
          d.scheduledDate,
          d.scheduledTime ?? null,
          d.workType,
          d.request ?? null,
          c.get("userId"),
          ts,
          ts,
          orgId,
          d.siteId,
          d.customerId,
          d.assetId ?? null,
          orgId,
          d.assetId ?? null,
          JSON.stringify(d.assigneeIds),
          orgId,
          d.sourceReportVersionId ?? null,
          d.sourceReportVersionId ?? null,
          orgId,
          d.customerId,
          d.siteId,
          d.assetId ?? null,
          d.assetId ?? null,
          d.scheduledDate,
          orgId,
          identity.idempotencyKey,
          d.sourceReportVersionId ?? null,
          d.sourceReportVersionId ?? null,
        ),
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO maintenance_schedules
             (id, org_id, source_work_order_id, source_report_version_id,
              customer_id, site_id, asset_id, scheduled_time, work_type,
              request, idempotency_key, request_fingerprint,
              assignee_ids_json, frequency, interval_count, anchor_date,
              next_occurrence_date, end_date, status, revision, created_by,
              created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM work_orders WHERE id = ? AND org_id = ?
           )
             AND (
               ? IS NULL
               OR EXISTS (
                 SELECT 1
                 FROM report_versions source_report
                 JOIN work_orders source_work
                   ON source_work.id = source_report.work_order_id
                 WHERE source_report.id = ?
                   AND source_work.org_id = ?
                   AND source_work.approval_status <> 'revision_requested'
                   AND source_work.customer_id = ?
                   AND source_work.site_id = ?
                   AND (
                     (source_work.asset_id IS NULL AND ? IS NULL)
                     OR source_work.asset_id = ?
                   )
                   AND json_valid(source_report.structured_json)
                   AND json_extract(
                     source_report.structured_json,
                     '$.nextInspectionDate'
                   ) = ?
                   AND NOT EXISTS (
                     SELECT 1
                     FROM report_versions newer
                     WHERE newer.work_order_id = source_report.work_order_id
                       AND newer.version > source_report.version
                   )
               )
             )`,
        )
        .bind(
          scheduleId,
          orgId,
          id,
          d.sourceReportVersionId ?? null,
          d.customerId,
          d.siteId,
          d.assetId ?? null,
          d.scheduledTime ?? null,
          d.workType,
          d.request ?? null,
          identity.idempotencyKey,
          identity.requestFingerprint,
          JSON.stringify(d.assigneeIds),
          d.recurrence.frequency,
          d.recurrence.intervalCount,
          d.scheduledDate,
          nextOccurrenceDate,
          d.recurrence.endDate ?? null,
          scheduleStatus,
          c.get("userId"),
          ts,
          ts,
          id,
          orgId,
          d.sourceReportVersionId ?? null,
          d.sourceReportVersionId ?? null,
          orgId,
          d.customerId,
          d.siteId,
          d.assetId ?? null,
          d.assetId ?? null,
          d.scheduledDate,
        ),
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO maintenance_occurrences
             (id, org_id, schedule_id, occurrence_date, work_order_id, created_at)
           SELECT ?, schedule.org_id, schedule.id, ?,
                  schedule.source_work_order_id, ?
           FROM maintenance_schedules schedule
           WHERE schedule.id = ? AND schedule.org_id = ?
             AND schedule.request_fingerprint = ?
             AND schedule.source_work_order_id = ?`,
        )
        .bind(
          maintenanceOccurrenceId(scheduleId, d.scheduledDate),
          d.scheduledDate,
          ts,
          scheduleId,
          orgId,
          identity.requestFingerprint,
          id,
        ),
    ];
    for (const userId of d.assigneeIds) {
      statements.push(
        c.env.DB
          .prepare(
            `INSERT OR IGNORE INTO assignments (id, work_order_id, user_id)
             SELECT ?, schedule.source_work_order_id, ?
             FROM maintenance_schedules schedule
             WHERE schedule.id = ? AND schedule.org_id = ?
               AND schedule.request_fingerprint = ?
               AND schedule.source_work_order_id = ?
               AND EXISTS (
                 SELECT 1 FROM memberships
                 WHERE org_id = ? AND user_id = ? AND active = 1
               )`,
          )
          .bind(
            maintenanceAssignmentId(id, userId),
            userId,
            scheduleId,
            orgId,
            identity.requestFingerprint,
            id,
            orgId,
            userId,
          ),
        c.env.DB
          .prepare(
            `INSERT OR IGNORE INTO assignment_events
               (id, org_id, work_order_id, user_id, action, actor_user_id, created_at)
             SELECT ?, ?, ?, ?, 'assigned', ?, ?
             WHERE EXISTS (
               SELECT 1 FROM maintenance_schedules
               WHERE id = ? AND org_id = ? AND request_fingerprint = ?
                 AND source_work_order_id = ?
             )
               AND EXISTS (
                 SELECT 1 FROM assignments
                 WHERE work_order_id = ? AND user_id = ?
               )`,
          )
          .bind(
            maintenanceAssignmentEventId(id, userId),
            orgId,
            id,
            userId,
            c.get("userId"),
            ts,
            scheduleId,
            orgId,
            identity.requestFingerprint,
            id,
            id,
            userId,
          ),
        c.env.DB
          .prepare(
            `INSERT OR IGNORE INTO notifications
               (id, org_id, user_id, type, work_order_id, message, created_at, read_at)
             SELECT ?, ?, ?, 'assigned', ?, ?, ?, NULL
             WHERE EXISTS (
               SELECT 1 FROM maintenance_schedules
               WHERE id = ? AND org_id = ? AND request_fingerprint = ?
                 AND source_work_order_id = ?
             )
               AND EXISTS (
                 SELECT 1 FROM assignments
                 WHERE work_order_id = ? AND user_id = ?
               )`,
          )
          .bind(
            maintenanceNotificationId(id, userId),
            orgId,
            userId,
            id,
            `${d.scheduledDate} ${d.workType} 작업이 배정되었습니다`,
            ts,
            scheduleId,
            orgId,
            identity.requestFingerprint,
            id,
            id,
            userId,
          ),
      );
    }
    statements.push(
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO audit_events
             (id, org_id, actor_user_id, event, target, detail_json, created_at)
           SELECT ?, ?, ?, 'work_order_created', ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM maintenance_schedules
             WHERE id = ? AND org_id = ? AND request_fingerprint = ?
               AND source_work_order_id = ?
           )`,
        )
        .bind(
          `maintenance-source-created:${scheduleId}`,
          orgId,
          c.get("userId"),
          id,
          JSON.stringify({
            workStatus: "scheduled",
            assigneeIds: d.assigneeIds,
            maintenanceScheduleId: scheduleId,
          }),
          ts,
          scheduleId,
          orgId,
          identity.requestFingerprint,
          id,
        ),
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO audit_events
             (id, org_id, actor_user_id, event, target, detail_json, created_at)
           SELECT ?, ?, ?, 'maintenance_schedule_created', ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM maintenance_schedules
             WHERE id = ? AND org_id = ? AND request_fingerprint = ?
               AND source_work_order_id = ?
           )`,
        )
        .bind(
          `maintenance-schedule-created:${scheduleId}`,
          orgId,
          c.get("userId"),
          scheduleId,
          JSON.stringify({
            sourceWorkOrderId: id,
            sourceReportVersionId: d.sourceReportVersionId ?? null,
            frequency: d.recurrence.frequency,
            intervalCount: d.recurrence.intervalCount,
            nextOccurrenceDate,
            endDate: d.recurrence.endDate ?? null,
          }),
          ts,
          scheduleId,
          orgId,
          identity.requestFingerprint,
          id,
        ),
    );
    // D1 batch is a transaction: any failed child insert rolls back the work,
    // schedule, source occurrence, assignments, notifications, and audits.
    await c.env.DB.batch(statements);
    let matchedBySourceReport = false;
    let storedSchedule: MaintenanceScheduleRow | null = null;
    if (d.sourceReportVersionId) {
      storedSchedule = await c.env.DB
        .prepare(
          `SELECT *
           FROM maintenance_schedules
           WHERE org_id = ? AND source_report_version_id = ?`,
        )
        .bind(orgId, d.sourceReportVersionId)
        .first<MaintenanceScheduleRow>();
      matchedBySourceReport = !!storedSchedule;
    }
    storedSchedule ??= await c.env.DB
      .prepare(
        `SELECT *
         FROM maintenance_schedules
         WHERE org_id = ? AND idempotency_key = ?`,
      )
      .bind(orgId, identity.idempotencyKey)
      .first<MaintenanceScheduleRow>();
    if (!storedSchedule) {
      return c.json(
        {
          error:
            "등록 중 기준정보 또는 담당자 상태가 변경되었습니다. 확인 후 다시 시도해주세요",
        },
        409,
      );
    }
    if (storedSchedule.request_fingerprint !== identity.requestFingerprint) {
      return c.json(
        {
          error: matchedBySourceReport
            ? "이 확정 보고서의 다음 점검 일정이 이미 다른 내용으로 등록되었습니다"
            : "같은 Idempotency-Key가 다른 반복 일정 요청에 이미 사용되었습니다",
        },
        409,
      );
    }
    maintenanceSchedule = {
      id: storedSchedule.id,
      status: storedSchedule.status,
      nextOccurrenceDate: storedSchedule.next_occurrence_date,
    };
  } else {
    await c.env.DB.prepare(
      `INSERT INTO work_orders
         (id, org_id, customer_id, site_id, asset_id, scheduled_date, scheduled_time, work_type, request,
          work_status, approval_status, billing_status, ai_status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_sent', 'none', 'idle', ?, ?, ?)`,
    )
      .bind(
        id,
        orgId,
        d.customerId,
        d.siteId,
        d.assetId ?? null,
        d.scheduledDate,
        d.scheduledTime ?? null,
        d.workType,
        d.request ?? null,
        initialStatus,
        c.get("userId"),
        ts,
        ts,
      )
      .run();

    for (const userId of d.assigneeIds) {
      await c.env.DB
        .prepare(
          "INSERT INTO assignments (id, work_order_id, user_id) VALUES (?, ?, ?)",
        )
        .bind(newId(), id, userId)
        .run();
      await c.env.DB
        .prepare(
          `INSERT INTO assignment_events
             (id, org_id, work_order_id, user_id, action, actor_user_id, created_at)
           VALUES (?, ?, ?, ?, 'assigned', ?, ?)`,
        )
        .bind(newId(), orgId, id, userId, c.get("userId"), ts)
        .run();
      await notify(c.env.DB, {
        orgId,
        userId,
        type: "assigned",
        workOrderId: id,
        message: `${d.scheduledDate} ${d.workType} 작업이 배정되었습니다`,
      });
    }

    await recordAudit(c.env.DB, {
      orgId,
      actorUserId: c.get("userId"),
      event: "work_order_created",
      target: id,
      detail: { workStatus: initialStatus, assigneeIds: d.assigneeIds },
    });
  }

  const row = await c.env.DB
    .prepare("SELECT * FROM work_orders WHERE id = ? AND org_id = ?")
    .bind(id, orgId)
    .first<WorkOrderRow>();
  if (!row) {
    throw new Error("Created work order is missing");
  }
  return c.json({
    workOrder: {
      ...summaryOf(row, "", "", []),
      customerId: d.customerId,
      siteId: d.siteId,
      assetId: d.assetId ?? null,
      request: d.request ?? null,
      assigneeIds: d.assigneeIds,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    maintenanceSchedule,
  });
});

// ---------------------------------------------------------------------------
// Maintenance schedules: explicit, bounded materialization (FR-022 / B-18)
//
// schedule.next_occurrence_date --CAS--> generated work + occurrence + next cursor
//              |                        all statements are one D1 transaction
//              +-- UNIQUE(schedule,date) + deterministic work id make retry safe
// ---------------------------------------------------------------------------

workOrderRoutes.get(
  "/maintenance-schedules",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const rows = await c.env.DB
      .prepare(
        `SELECT ms.*, customer.name AS customer_name, site.name AS site_name,
                asset.name AS asset_name
         FROM maintenance_schedules ms
         JOIN customers customer
           ON customer.id = ms.customer_id AND customer.org_id = ms.org_id
         JOIN sites site
           ON site.id = ms.site_id AND site.org_id = ms.org_id
         LEFT JOIN assets asset
           ON asset.id = ms.asset_id AND asset.org_id = ms.org_id
         WHERE ms.org_id = ?
         ORDER BY
           CASE ms.status
             WHEN 'active' THEN 0
             WHEN 'paused' THEN 1
             WHEN 'completed' THEN 2
             ELSE 3
           END,
           ms.next_occurrence_date ASC,
           ms.created_at DESC
         LIMIT 200`,
      )
      .bind(orgId)
      .all<MaintenanceScheduleListRow>();
    const schedules = rows.results ?? [];
    if (schedules.length === 0) {
      return c.json({ schedules: [] });
    }

    const occurrenceRows: MaintenanceOccurrenceRow[] = [];
    // D1 has a bounded bind-variable budget. Keep each lookup comfortably
    // below it even when the schedule list reaches its 200-row page limit.
    const occurrenceChunkSize = 80;
    for (
      let offset = 0;
      offset < schedules.length;
      offset += occurrenceChunkSize
    ) {
      const scheduleIds = schedules
        .slice(offset, offset + occurrenceChunkSize)
        .map((schedule) => schedule.id);
      const placeholders = scheduleIds.map(() => "?").join(", ");
      const chunk = await c.env.DB
        .prepare(
          `SELECT id, schedule_id, occurrence_date, work_order_id, created_at
           FROM maintenance_occurrences
           WHERE org_id = ? AND schedule_id IN (${placeholders})
           ORDER BY occurrence_date DESC, id DESC
           LIMIT 1000`,
        )
        .bind(orgId, ...scheduleIds)
        .all<MaintenanceOccurrenceRow>();
      occurrenceRows.push(...(chunk.results ?? []));
    }
    const occurrencesBySchedule = new Map<
      string,
      MaintenanceOccurrenceRow[]
    >();
    for (const occurrence of occurrenceRows) {
      const existing = occurrencesBySchedule.get(occurrence.schedule_id) ?? [];
      existing.push(occurrence);
      occurrencesBySchedule.set(occurrence.schedule_id, existing);
    }

    return c.json({
      schedules: schedules.map((schedule) =>
        maintenanceScheduleResponse(
          schedule,
          occurrencesBySchedule.get(schedule.id) ?? [],
        ),
      ),
    });
  },
);

workOrderRoutes.post(
  "/maintenance-schedules/sync",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = maintenanceScheduleSyncSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error:
            "생성 범위는 1~366일, 한 번에 생성할 작업 수는 1~100이어야 합니다",
        },
        400,
      );
    }
    const orgId = c.get("orgId");
    const horizonDays =
      parsed.data.horizonDays ?? MAINTENANCE_SYNC_DEFAULT_HORIZON_DAYS;
    const rowCap = parsed.data.rowCap ?? MAINTENANCE_SYNC_DEFAULT_ROW_CAP;
    const horizonDate = addCalendarDays(
      toSeoulDateString(),
      horizonDays,
    );
    let processed = 0;
    let generated = 0;
    let assignedCount = 0;
    const blockedSchedules: NonNullable<
      MaintenanceMaterializationResult["blocked"]
    >[] = [];
    let concurrencyRetries = 0;
    let attempts = 0;
    const attemptCap = rowCap * 3 + 10;

    while (processed < rowCap && attempts < attemptCap) {
      const schedule = await c.env.DB
        .prepare(
          `SELECT *
           FROM maintenance_schedules
           WHERE org_id = ? AND status = 'active'
             AND next_occurrence_date IS NOT NULL
             AND next_occurrence_date <= ?
           ORDER BY next_occurrence_date ASC, id ASC
           LIMIT 1`,
        )
        .bind(orgId, horizonDate)
        .first<MaintenanceScheduleRow>();
      if (!schedule) break;

      attempts += 1;
      const result = await materializeNextMaintenanceOccurrence(
        c.env.DB,
        schedule,
        c.get("userId"),
      );
      if (result.blocked) {
        blockedSchedules.push(result.blocked);
        continue;
      }
      if (!result.advanced) {
        concurrencyRetries += 1;
        continue;
      }
      processed += 1;
      assignedCount += result.assignedCount;
      if (result.created) {
        generated += 1;
      }
    }

    const remaining = await c.env.DB
      .prepare(
        `SELECT 1
         FROM maintenance_schedules
         WHERE org_id = ? AND status = 'active'
           AND next_occurrence_date IS NOT NULL
           AND next_occurrence_date <= ?
         LIMIT 1`,
      )
      .bind(orgId, horizonDate)
      .first();

    return c.json({
      generated,
      processed,
      assignedCount,
      blockedCount: blockedSchedules.length,
      blockedSchedules,
      horizonDate,
      rowCap,
      limitReached: !!remaining,
      concurrencyRetries,
    });
  },
);

workOrderRoutes.patch(
  "/maintenance-schedules/:id",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = maintenanceScheduleActionSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "pause, resume, cancel 중 하나를 선택해주세요" }, 400);
    }
    const schedule = await c.env.DB
      .prepare(
        "SELECT * FROM maintenance_schedules WHERE id = ? AND org_id = ?",
      )
      .bind(id, orgId)
      .first<MaintenanceScheduleRow>();
    if (!schedule) {
      return c.json({ error: "정기점검 일정을 찾을 수 없습니다" }, 404);
    }

    const targetStatus =
      parsed.data.action === "pause"
        ? "paused"
        : parsed.data.action === "resume"
          ? "active"
          : "canceled";
    if (schedule.status === targetStatus) {
      return c.json({
        changed: false,
        schedule: {
          id: schedule.id,
          status: schedule.status,
          nextOccurrenceDate: schedule.next_occurrence_date,
          revision: schedule.revision,
        },
      });
    }
    const allowed =
      (parsed.data.action === "pause" && schedule.status === "active") ||
      (parsed.data.action === "resume" &&
        schedule.status === "paused" &&
        schedule.next_occurrence_date !== null) ||
      (parsed.data.action === "cancel" &&
        (schedule.status === "active" || schedule.status === "paused"));
    if (!allowed) {
      return c.json(
        { error: `현재 상태(${schedule.status})에서는 ${parsed.data.action}할 수 없습니다` },
        409,
      );
    }

    if (parsed.data.action === "resume") {
      if (
        !(await hasValidWorkOrderHierarchy(
          c.env.DB,
          orgId,
          schedule.customer_id,
          schedule.site_id,
          schedule.asset_id,
        ))
      ) {
        return c.json(
          {
            error:
              "비활성 고객·현장·장비가 포함되어 있습니다. 기준정보를 활성화한 뒤 다시 시도해주세요",
            code: "inactive_hierarchy",
          },
          409,
        );
      }
      if ((await activeMaintenanceAssigneeIds(c.env.DB, schedule)).length === 0) {
        return c.json(
          {
            error:
              "활성 담당자가 없습니다. 담당자 계정을 활성화한 뒤 다시 시도해주세요",
            code: "no_active_assignees",
          },
          409,
        );
      }
    }

    const ts = nowIso();
    const nextRevision = schedule.revision + 1;
    const clearsError = parsed.data.action === "resume";
    const results = await c.env.DB.batch([
      c.env.DB
        .prepare(
          `UPDATE maintenance_schedules
           SET status = ?,
               last_error_code = ?,
               last_error_message = ?,
               last_error_at = ?,
               revision = ?,
               updated_at = ?
           WHERE id = ? AND org_id = ? AND status = ? AND revision = ?`,
        )
        .bind(
          targetStatus,
          clearsError ? null : schedule.last_error_code,
          clearsError ? null : schedule.last_error_message,
          clearsError ? null : schedule.last_error_at,
          nextRevision,
          ts,
          id,
          orgId,
          schedule.status,
          schedule.revision,
        ),
      c.env.DB
        .prepare(
          `INSERT OR IGNORE INTO audit_events
             (id, org_id, actor_user_id, event, target, detail_json, created_at)
           SELECT ?, ?, ?, 'maintenance_schedule_status_changed', ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM maintenance_schedules
             WHERE id = ? AND org_id = ? AND status = ? AND revision = ?
               AND last_error_code IS ?
               AND last_error_message IS ?
               AND last_error_at IS ?
           )`,
        )
        .bind(
          maintenanceStatusAuditId(id, nextRevision),
          orgId,
          c.get("userId"),
          id,
          JSON.stringify({
            from: schedule.status,
            to: targetStatus,
            action: parsed.data.action,
          }),
          ts,
          id,
          orgId,
          targetStatus,
          nextRevision,
          clearsError ? null : schedule.last_error_code,
          clearsError ? null : schedule.last_error_message,
          clearsError ? null : schedule.last_error_at,
        ),
    ]);
    if (
      results[0]?.meta.changes !== 1 ||
      results[1]?.meta.changes !== 1
    ) {
      return c.json(
        { error: "일정 상태가 다른 요청에서 변경되었습니다. 새로고침 후 다시 시도해주세요" },
        409,
      );
    }
    return c.json({
      changed: true,
      schedule: {
        id,
        status: targetStatus,
        nextOccurrenceDate: schedule.next_occurrence_date,
        revision: nextRevision,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// GET /work-orders/:id
// ---------------------------------------------------------------------------

async function loadWorkOrder(db: D1Database, orgId: string, id: string): Promise<WorkOrderRow | null> {
  return db.prepare("SELECT * FROM work_orders WHERE org_id = ? AND id = ?").bind(orgId, id).first<WorkOrderRow>();
}

/** field 역할은 본인 배정 작업만 접근 가능 — 조회 대상 미배정 시 404(존재 노출 방지). */
async function guardAccess(c: any, wo: WorkOrderRow): Promise<boolean> {
  const role = c.get("role");
  if (role === "admin" || role === "office") return true;
  if (role === "field") {
    return isAssigned(c.env.DB, wo.id, c.get("userId"));
  }
  return false;
}

workOrderRoutes.get("/work-orders/:id", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const customer = await c.env.DB.prepare(
    "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE id = ? AND org_id = ?",
  )
    .bind(wo.customer_id, orgId)
    .first<{ id: string; name: string; biz_no: string | null; address: string | null; contact_name: string | null; contact_phone: string | null; memo: string | null }>();
  const site = await c.env.DB.prepare(
    "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE id = ? AND org_id = ? AND customer_id = ?",
  )
    .bind(wo.site_id, orgId, wo.customer_id)
    .first<{ id: string; customer_id: string; name: string; address: string | null; access_info: string | null; map_url: string | null }>();
  const asset = wo.asset_id
    ? await c.env.DB.prepare(
        "SELECT id, site_id, name, model, serial_no, installed_at FROM assets WHERE id = ? AND org_id = ? AND site_id = ?",
      )
        .bind(wo.asset_id, orgId, wo.site_id)
        .first<{ id: string; site_id: string; name: string; model: string | null; serial_no: string | null; installed_at: string | null }>()
    : null;

  const assigneeRows = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, m.role, m.active
     FROM assignments a JOIN users u ON u.id = a.user_id JOIN memberships m ON m.user_id = u.id AND m.org_id = ?
     WHERE a.work_order_id = ?`,
  )
    .bind(orgId, id)
    .all<{ id: string; email: string; name: string; role: string; active: number }>();

  const fieldRecordRow = await c.env.DB.prepare(
    "SELECT work_order_id, work_summary, transcript, parts_json, checklist_json, issues, notes, next_inspection_date, updated_at FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{
      work_order_id: string;
      work_summary: string | null;
      transcript: string | null;
      parts_json: string | null;
      checklist_json: string | null;
      issues: string | null;
      notes: string | null;
      next_inspection_date: string | null;
      updated_at: string;
    }>();

  const photoRows = await c.env.DB.prepare(
    "SELECT id, work_order_id, kind, caption, created_at FROM photos WHERE work_order_id = ? ORDER BY created_at ASC",
  )
    .bind(id)
    .all<{ id: string; work_order_id: string; kind: string; caption: string | null; created_at: string }>();
  const mediaRows = await c.env.DB.prepare(
    `SELECT id, org_id, work_order_id, media_type, photo_kind, storage_key, mime_type,
            size_bytes, etag, checksum_sha256, caption, duration_seconds, created_at
     FROM media_assets
     WHERE org_id = ? AND work_order_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(orgId, id)
    .all<MediaAssetRow>();
  const activeMedia = mediaRows.results ?? [];
  const r2Photos = activeMedia
    .filter((row) => row.media_type === "photo" && row.photo_kind)
    .map((row) => ({
      id: row.id,
      workOrderId: row.work_order_id,
      kind: row.photo_kind!,
      url: authenticatedMediaUrl(c.req.url, id, row.id),
      caption: row.caption,
      createdAt: row.created_at,
    }));
  const audio = activeMedia
    .filter((row) => row.media_type === "audio")
    .map((row) => ({
      id: row.id,
      workOrderId: row.work_order_id,
      url: authenticatedMediaUrl(c.req.url, id, row.id),
      mimeType: row.mime_type,
      caption: row.caption,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      transcriptStatus: "not_connected" as const,
    }));
  const photos = [
    ...(photoRows.results ?? []).map((p) => ({
      id: p.id,
      workOrderId: p.work_order_id,
      kind: p.kind,
      url: authenticatedMediaUrl(c.req.url, id, p.id),
      caption: p.caption,
      createdAt: p.created_at,
    })),
    ...r2Photos,
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const draftRow = await c.env.DB.prepare(
    "SELECT structured_json FROM report_drafts WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ structured_json: string }>();
  const parsedDraft = draftRow
    ? structuredDraftSchema.safeParse(parseJson(draftRow.structured_json, null))
    : null;

  const versionRows = await c.env.DB.prepare(
    `SELECT rv.id, rv.work_order_id, rv.version, rv.report_number,
            rv.structured_json,
            rv.created_at, rv.created_by,
            approval.id AS approval_artifact_id,
            approval.status AS approval_artifact_status,
            approval.source_sha256 AS approval_source_sha256,
            signed.id AS signed_artifact_id,
            signed.status AS signed_artifact_status
     FROM report_versions rv
     LEFT JOIN report_artifacts approval
       ON approval.report_version_id = rv.id AND approval.kind = 'approval'
     LEFT JOIN report_artifacts signed
       ON signed.report_version_id = rv.id AND signed.kind = 'signed'
     WHERE rv.work_order_id = ?
     ORDER BY rv.version ASC`,
  )
    .bind(id)
    .all<{
      id: string;
      work_order_id: string;
      version: number;
      report_number: string;
      structured_json: string;
      created_at: string;
      created_by: string;
      approval_artifact_id: string | null;
      approval_artifact_status: ReportArtifactRow["status"] | null;
      approval_source_sha256: string | null;
      signed_artifact_id: string | null;
      signed_artifact_status: ReportArtifactRow["status"] | null;
    }>();

  const approvalRow = await c.env.DB.prepare(
    `SELECT ar.id, ar.report_version_id, ar.status, ar.sent_at, ar.expires_at,
            ar.viewed_at, ar.decided_at, ar.revision_comment,
            ar.correction_requested_at,
            sig.name AS approver_name, sig.title AS approver_title
     FROM approval_requests ar
     LEFT JOIN signatures sig ON sig.approval_request_id = ar.id
     WHERE ar.work_order_id = ? ORDER BY ar.sent_at DESC, ar.rowid DESC LIMIT 1`,
  )
    .bind(id)
    .first<{
      id: string;
      report_version_id: string;
      status: string;
      sent_at: string;
      expires_at: string;
      viewed_at: string | null;
      decided_at: string | null;
      revision_comment: string | null;
      correction_requested_at: string | null;
      approver_name: string | null;
      approver_title: string | null;
    }>();

  const billingRow = await c.env.DB.prepare(
    "SELECT amount, billed_at, due_at, paid_at, memo FROM billing_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ amount: number | null; billed_at: string | null; due_at: string | null; paid_at: string | null; memo: string | null }>();

  const isFieldRole = c.get("role") === "field";
  let nextVisitCandidate: {
    scheduledDate: string;
    reportVersionId: string;
    managedByScheduleId: string | null;
    existingWorkOrderId: string | null;
  } | null = null;
  const latestVersionRow = (versionRows.results ?? []).at(-1);
  const latestStructured = latestVersionRow
    ? structuredDraftSchema.safeParse(
        parseJson(latestVersionRow.structured_json, null),
      )
    : null;
  const finalizedNextInspectionDate =
    latestStructured?.success &&
    wo.approval_status !== "revision_requested"
      ? latestStructured.data.nextInspectionDate
      : null;
  if (!isFieldRole && finalizedNextInspectionDate && latestVersionRow) {
    const managedSchedule = await c.env.DB
      .prepare(
        `SELECT occurrence.schedule_id
         FROM maintenance_occurrences occurrence
         JOIN maintenance_schedules schedule
           ON schedule.id = occurrence.schedule_id
          AND schedule.org_id = occurrence.org_id
         WHERE occurrence.org_id = ? AND occurrence.work_order_id = ?
           AND schedule.status IN ('active', 'paused')
           AND schedule.next_occurrence_date = ?
         LIMIT 1`,
      )
      .bind(orgId, id, finalizedNextInspectionDate)
      .first<{ schedule_id: string }>();
    const existingNextWork = await c.env.DB
      .prepare(
        `SELECT id
         FROM work_orders
         WHERE org_id = ? AND id <> ?
           AND work_status <> 'canceled'
           AND customer_id = ? AND site_id = ?
           AND scheduled_date = ?
           AND (
             (asset_id IS NULL AND ? IS NULL)
             OR asset_id = ?
           )
         ORDER BY created_at ASC, id ASC
         LIMIT 1`,
      )
      .bind(
        orgId,
        id,
        wo.customer_id,
        wo.site_id,
        finalizedNextInspectionDate,
        wo.asset_id,
        wo.asset_id,
      )
      .first<{ id: string }>();
    nextVisitCandidate = {
      scheduledDate: finalizedNextInspectionDate,
      reportVersionId: latestVersionRow.id,
      managedByScheduleId: managedSchedule?.schedule_id ?? null,
      existingWorkOrderId: existingNextWork?.id ?? null,
    };
  }
  const fullWorkOrder = {
    ...summaryOf(
      wo,
      customer?.name ?? "",
      site?.name ?? "",
      (assigneeRows.results ?? []).map((a) => a.name),
      {
        siteAddress: site?.address ?? customer?.address ?? null,
        accessInfo: site?.access_info ?? null,
        contactName: customer?.contact_name ?? null,
        contactPhone: customer?.contact_phone ?? null,
      },
    ),
    customerId: wo.customer_id,
    siteId: wo.site_id,
    assetId: wo.asset_id,
    request: wo.request,
    assigneeIds: (assigneeRows.results ?? []).map((a) => a.id),
    createdAt: wo.created_at,
    updatedAt: wo.updated_at,
  };
  const assignmentHistory = isFieldRole
    ? []
    : await loadAssignmentHistory(c.env.DB, orgId, id);

  return c.json({
    workOrder: isFieldRole ? fieldSafeSummary(fullWorkOrder) : fullWorkOrder,
    customer: customer
      ? isFieldRole
        ? {
            id: customer.id,
            name: customer.name,
            address: customer.address,
            contactName: customer.contact_name,
            contactPhone: customer.contact_phone,
          }
        : {
            id: customer.id,
            name: customer.name,
            bizNo: customer.biz_no,
            address: customer.address,
            contactName: customer.contact_name,
            contactPhone: customer.contact_phone,
            memo: customer.memo,
          }
      : null,
    site: site
      ? { id: site.id, customerId: site.customer_id, name: site.name, address: site.address, accessInfo: site.access_info, mapUrl: site.map_url }
      : null,
    asset: asset
      ? { id: asset.id, siteId: asset.site_id, name: asset.name, model: asset.model, serialNo: asset.serial_no, installedAt: asset.installed_at }
      : null,
    assignees: (assigneeRows.results ?? []).map((a) =>
      isFieldRole
        ? { id: a.id, name: a.name, role: a.role, active: !!a.active }
        : {
            id: a.id,
            email: a.email,
            name: a.name,
            role: a.role,
            active: !!a.active,
          },
    ),
    assignmentHistory,
    fieldRecord: fieldRecordRow
      ? {
          workOrderId: fieldRecordRow.work_order_id,
          workSummary: fieldRecordRow.work_summary,
          transcript: fieldRecordRow.transcript,
          parts: parseJson<UsedPart[]>(fieldRecordRow.parts_json, []),
          checklist: parseJson<ChecklistItem[]>(
            fieldRecordRow.checklist_json,
            [],
          ),
          issues: fieldRecordRow.issues,
          notes: fieldRecordRow.notes,
          nextInspectionDate: fieldRecordRow.next_inspection_date,
          updatedAt: fieldRecordRow.updated_at,
        }
      : null,
    photos,
    audio,
    draft: parsedDraft?.success ? parsedDraft.data : null,
    nextVisitCandidate,
    reportVersions: isFieldRole
      ? []
      : (versionRows.results ?? []).map((v) => ({
          id: v.id,
          workOrderId: v.work_order_id,
          reportNumber: v.report_number,
          version: v.version,
          createdAt: v.created_at,
          createdBy: v.created_by,
          artifact: v.approval_artifact_id
            ? {
                id: v.approval_artifact_id,
                status: v.approval_artifact_status,
                sourceSha256: v.approval_source_sha256,
                pdfUrl:
                  v.approval_artifact_status === "ready"
                    ? `${new URL(c.req.url).origin}/work-orders/${encodeURIComponent(id)}/report-versions/${v.version}/artifacts/approval/pdf`
                    : null,
              }
            : null,
          signedArtifact: v.signed_artifact_id
            ? {
                id: v.signed_artifact_id,
                status: v.signed_artifact_status,
                pdfUrl:
                  v.signed_artifact_status === "ready"
                    ? `${new URL(c.req.url).origin}/work-orders/${encodeURIComponent(id)}/report-versions/${v.version}/artifacts/signed/pdf`
                    : null,
              }
            : null,
        })),
    approval: !isFieldRole && approvalRow
      ? {
          workOrderId: id,
          reportVersionId: approvalRow.report_version_id,
          status: wo.approval_status,
          requestStatus: approvalRow.status,
          requestedAt: approvalRow.sent_at,
          expiresAt: approvalRow.expires_at,
          viewedAt: approvalRow.viewed_at,
          approvedAt: approvalRow.status === "approved" ? approvalRow.decided_at : null,
          approverName: approvalRow.approver_name,
          approverTitle: approvalRow.approver_title,
          revisionComment: approvalRow.revision_comment,
          correctionRequestedAt: approvalRow.correction_requested_at,
        }
      : null,
    billing: !isFieldRole && billingRow
      ? {
          workOrderId: id,
          status: wo.billing_status,
          amount: billingRow.amount,
          billedAt: billingRow.billed_at,
          dueAt: billingRow.due_at,
          paidAt: billingRow.paid_at,
          memo: billingRow.memo,
        }
      : null,
  });
});

// ---------------------------------------------------------------------------
// Authenticated private media stream
// ---------------------------------------------------------------------------

workOrderRoutes.get("/work-orders/:id/media/:mediaId", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const mediaId = c.req.param("mediaId");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) {
    return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  }

  const mediaAsset = await c.env.DB.prepare(
    `SELECT id, org_id, work_order_id, media_type, photo_kind, storage_key, mime_type,
            size_bytes, etag, checksum_sha256, caption, duration_seconds, created_at
     FROM media_assets
     WHERE id = ? AND org_id = ? AND work_order_id = ? AND deleted_at IS NULL`,
  )
    .bind(mediaId, orgId, id)
    .first<MediaAssetRow>();
  if (mediaAsset) {
    if (!c.env.MEDIA) {
      return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
    }
    const response = await getPrivateMediaResponse(c.env.MEDIA, {
      storageKey: mediaAsset.storage_key,
      mimeType: mediaAsset.mime_type,
      checksumSha256: mediaAsset.checksum_sha256,
    });
    return response ?? c.json({ error: "미디어 원본을 찾을 수 없습니다" }, 404);
  }

  const legacyPhoto = await c.env.DB.prepare(
    "SELECT data_url FROM photos WHERE id = ? AND work_order_id = ?",
  )
    .bind(mediaId, id)
    .first<{ data_url: string }>();
  if (!legacyPhoto) return c.json({ error: "미디어를 찾을 수 없습니다" }, 404);

  let media: ReturnType<typeof decodeMediaBytes>;
  try {
    media = decodeMediaDataUrl(legacyPhoto.data_url, "photo");
  } catch {
    return c.json({ error: "기존 사진 원본이 올바르지 않습니다" }, 500);
  }
  return new Response(media.bytes.slice().buffer, {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// ---------------------------------------------------------------------------
// PATCH /work-orders/:id
// ---------------------------------------------------------------------------

workOrderRoutes.patch("/work-orders/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = workOrderPatchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const currentAssigneeIds = await assigneeIds(c.env.DB, id);
  const nextAssigneeIds = d.assigneeIds ?? currentAssigneeIds;

  if (
    d.assigneeIds !== undefined &&
    !["draft", "scheduled", "in_progress"].includes(wo.work_status)
  ) {
    return c.json(
      { error: `현재 상태(${wo.work_status})에서는 담당자를 변경할 수 없습니다` },
      409,
    );
  }
  if (d.intent === "draft" && wo.work_status !== "draft") {
    return c.json({ error: "예정 이후 작업을 초안으로 되돌릴 수 없습니다" }, 409);
  }
  if (d.intent === "draft" && nextAssigneeIds.length > 0) {
    return c.json({ error: "초안에는 담당자를 배정할 수 없습니다" }, 400);
  }
  if (
    (wo.work_status !== "draft" || d.intent === "schedule") &&
    nextAssigneeIds.length === 0
  ) {
    return c.json(
      { error: "예정 작업에는 담당자를 한 명 이상 배정해야 합니다" },
      400,
    );
  }

  const merged = {
    scheduledDate: d.scheduledDate ?? wo.scheduled_date,
    scheduledTime: d.scheduledTime ?? wo.scheduled_time,
    workType: d.workType ?? wo.work_type,
    request: d.request ?? wo.request,
    customerId: d.customerId ?? wo.customer_id,
    siteId: d.siteId ?? wo.site_id,
    assetId: d.assetId ?? wo.asset_id,
  };

  if (
    !(await hasValidWorkOrderHierarchy(
      c.env.DB,
      orgId,
      merged.customerId,
      merged.siteId,
      merged.assetId,
    ))
  ) {
    return c.json({ error: "고객·현장·장비 연결이 올바르지 않습니다" }, 400);
  }
  if (
    nextAssigneeIds.length > 0 &&
    !(await allActiveMembers(c.env.DB, orgId, nextAssigneeIds))
  ) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  const assignmentChange = await replaceAssignments(c.env.DB, {
    orgId,
    workOrder: wo,
    userIds: nextAssigneeIds,
    actorUserId: c.get("userId"),
    fields: merged,
  });
  if (!assignmentChange) {
    return c.json(
      { error: "작업이 다른 요청에서 변경되어 수정하지 못했습니다" },
      409,
    );
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "work_order_updated",
    target: id,
    detail: {
      fields: Object.keys(d).filter(
        (key) => key !== "assigneeIds" && key !== "intent",
      ),
    },
  });

  const updated = await loadWorkOrder(c.env.DB, orgId, id);
  return c.json({
    workOrder: {
      ...summaryOf(updated!, "", "", await assigneeNames(c.env.DB, id)),
      customerId: updated!.customer_id,
      siteId: updated!.site_id,
      assetId: updated!.asset_id,
      request: updated!.request,
      assigneeIds: await assigneeIds(c.env.DB, id),
      createdAt: updated!.created_at,
      updatedAt: updated!.updated_at,
    },
  });
});

workOrderRoutes.post("/work-orders/:id/assign", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  if (!["draft", "scheduled", "in_progress"].includes(wo.work_status)) {
    return c.json(
      { error: `현재 상태(${wo.work_status})에서는 담당자를 변경할 수 없습니다` },
      409,
    );
  }
  if (!(await allActiveMembers(c.env.DB, orgId, parsed.data.userIds))) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  const assignmentChange = await replaceAssignments(c.env.DB, {
    orgId,
    workOrder: wo,
    userIds: parsed.data.userIds,
    actorUserId: c.get("userId"),
    fields: {
      scheduledDate: wo.scheduled_date,
      scheduledTime: wo.scheduled_time,
      workType: wo.work_type,
      request: wo.request,
      customerId: wo.customer_id,
      siteId: wo.site_id,
      assetId: wo.asset_id,
    },
  });
  if (!assignmentChange) {
    return c.json(
      { error: "작업 상태가 변경되어 담당자를 수정하지 못했습니다" },
      409,
    );
  }
  const updated = await loadWorkOrder(c.env.DB, orgId, id);

  return c.json({
    workOrder: {
      ...summaryOf(updated!, "", "", await assigneeNames(c.env.DB, id)),
      customerId: updated!.customer_id,
      siteId: updated!.site_id,
      assetId: updated!.asset_id,
      request: updated!.request,
      assigneeIds: parsed.data.userIds,
      createdAt: updated!.created_at,
      updatedAt: updated!.updated_at,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/start
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/start", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const role = c.get("role");
  if (role === "field" && !(await isAssigned(c.env.DB, id, c.get("userId")))) {
    return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  }
  if (role !== "office" && role !== "admin" && role !== "field") {
    return c.json({ error: "권한이 없습니다" }, 403);
  }

  if (!canTransition("work", wo.work_status as any, "in_progress")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 시작할 수 없습니다` }, 409);
  }
  if ((await assigneeIds(c.env.DB, id)).length === 0) {
    return c.json({ error: "담당자를 한 명 이상 배정한 뒤 시작해주세요" }, 409);
  }

  const ts = nowIso();
  const transitioned = await c.env.DB.prepare(
    `UPDATE work_orders
     SET work_status = 'in_progress', started_at = ?, updated_at = ?
     WHERE id = ? AND org_id = ? AND work_status = ?`,
  )
    .bind(ts, ts, id, orgId, wo.work_status)
    .run();
  if (transitioned.meta.changes !== 1) {
    return c.json({ error: "작업 상태가 이미 변경되었습니다" }, 409);
  }
  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_started", target: id });

  return c.json({ ok: true, startedAt: ts, workStatus: "in_progress" });
});


// ---------------------------------------------------------------------------
// POST /work-orders/:id/complete
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/complete", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("work", wo.work_status as any, "completed")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 완료 처리할 수 없습니다` }, 409);
  }

  const ts = nowIso();
  const transitioned = await c.env.DB.prepare(
    `UPDATE work_orders
     SET work_status = 'completed', completed_at = ?, updated_at = ?
     WHERE id = ? AND org_id = ? AND work_status = ?`,
  )
    .bind(ts, ts, id, orgId, wo.work_status)
    .run();
  if (transitioned.meta.changes !== 1) {
    return c.json({ error: "작업 상태가 이미 변경되었습니다" }, 409);
  }
  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_completed", target: id });

  return c.json({ ok: true, completedAt: ts, workStatus: "completed" });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/cancel
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/cancel", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  if (!canTransition("work", wo.work_status as any, "canceled")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 취소할 수 없습니다` }, 409);
  }

  const ts = nowIso();
  const transitioned = await c.env.DB.prepare(
    `UPDATE work_orders
     SET work_status = 'canceled', canceled_at = ?, updated_at = ?
     WHERE id = ? AND org_id = ? AND work_status = ?`,
  )
    .bind(ts, ts, id, orgId, wo.work_status)
    .run();
  if (transitioned.meta.changes !== 1) {
    return c.json({ error: "작업 상태가 이미 변경되었습니다" }, 409);
  }
  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "work_canceled",
    target: id,
    detail: { reason: parsed.data.reason },
  });

  return c.json({ ok: true, canceledAt: ts, workStatus: "canceled" });
});

// ---------------------------------------------------------------------------
// PUT /work-orders/:id/field-record
// ---------------------------------------------------------------------------

workOrderRoutes.put("/work-orders/:id/field-record", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 기록할 수 있습니다" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = fieldRecordUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const existing = await c.env.DB.prepare("SELECT id, next_inspection_date FROM field_records WHERE work_order_id = ?")
    .bind(id)
    .first<{ id: string; next_inspection_date: string | null }>();
  const ts = nowIso();
  const partsJson = d.parts !== undefined ? JSON.stringify(d.parts) : undefined;
  const checklistJson =
    d.checklist !== undefined ? JSON.stringify(d.checklist) : undefined;
  const nextInspectionDate =
    d.nextInspectionDate !== undefined ? d.nextInspectionDate : (existing?.next_inspection_date ?? null);

  let writeChanges = 0;
  if (existing) {
    const write = await c.env.DB.prepare(
      `UPDATE field_records SET
         work_summary = COALESCE(?, work_summary),
         transcript = COALESCE(?, transcript),
         parts_json = COALESCE(?, parts_json),
         checklist_json = COALESCE(?, checklist_json),
         issues = COALESCE(?, issues),
         notes = COALESCE(?, notes),
         next_inspection_date = ?,
         updated_at = ?
       WHERE work_order_id = ?
         AND EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
         )`,
    )
      .bind(
        d.workSummary ?? null,
        d.transcript ?? null,
        partsJson ?? null,
        checklistJson ?? null,
        d.issues ?? null,
        d.notes ?? null,
        nextInspectionDate,
        ts,
        id,
        id,
        orgId,
      )
      .run();
    writeChanges = write.meta.changes;
  } else {
    const write = await c.env.DB.prepare(
      `INSERT INTO field_records (
         id, work_order_id, work_summary, transcript, parts_json, checklist_json,
         issues, notes, next_inspection_date, updated_at
       )
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM work_orders
         WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
       )
         AND NOT EXISTS (
           SELECT 1 FROM field_records WHERE work_order_id = ?
         )`,
    )
      .bind(
        newId(),
        id,
        d.workSummary ?? null,
        d.transcript ?? null,
        partsJson ?? "[]",
        checklistJson ?? "[]",
        d.issues ?? null,
        d.notes ?? null,
        d.nextInspectionDate ?? null,
        ts,
        id,
        orgId,
        id,
      )
      .run();
    writeChanges = write.meta.changes;
  }
  if (writeChanges !== 1) {
    return c.json(
      { error: "작업 상태 또는 현장기록이 다른 요청에서 변경되었습니다" },
      409,
    );
  }

  const saved = await c.env.DB.prepare(
    "SELECT work_order_id, work_summary, transcript, parts_json, checklist_json, issues, notes, next_inspection_date, updated_at FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{
      work_order_id: string;
      work_summary: string | null;
      transcript: string | null;
      parts_json: string | null;
      checklist_json: string | null;
      issues: string | null;
      notes: string | null;
      next_inspection_date: string | null;
      updated_at: string;
    }>();

  return c.json({
    fieldRecord: {
      workOrderId: saved!.work_order_id,
      workSummary: saved!.work_summary,
      transcript: saved!.transcript,
      parts: parseJson<UsedPart[]>(saved!.parts_json, []),
      checklist: parseJson<ChecklistItem[]>(saved!.checklist_json, []),
      issues: saved!.issues,
      notes: saved!.notes,
      nextInspectionDate: saved!.next_inspection_date,
      updatedAt: saved!.updated_at,
    },
  });
});

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/photos", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 사진을 추가할 수 있습니다" }, 409);
  }

  const rawIdempotencyKey = c.req.header("Idempotency-Key");
  const parsedIdempotencyKey = rawIdempotencyKey
    ? uploadIdempotencyKeySchema.safeParse(rawIdempotencyKey)
    : null;
  if (parsedIdempotencyKey && !parsedIdempotencyKey.success) {
    return c.json({ error: "업로드 멱등성 키가 올바르지 않습니다" }, 400);
  }
  const idempotencyKey = parsedIdempotencyKey?.data ?? null;

  const photoId = newId();
  const ts = nowIso();
  let metadata: z.infer<typeof photoBinaryMetadataSchema>;
  let media;
  try {
    const mimeType = requestMimeType(c.req.raw);
    if (mimeType === "application/json") {
      // 기존 클라이언트를 위한 유한 크기의 호환 경로다. 신규 웹은 raw binary를 사용한다.
      const jsonBytes = await readBoundedRequestBytes(
        c.req.raw,
        MAX_LEGACY_PHOTO_JSON_BYTES,
      );
      const body = JSON.parse(new TextDecoder().decode(jsonBytes)) as unknown;
      const parsed = photoCreateSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
      }
      if (parsed.data.dataUrl.length > MAX_D1_PHOTO_DATA_URL_CHARS) {
        return c.json({ error: "기존 JSON 사진 업로드 용량을 초과했습니다" }, 413);
      }
      metadata = {
        kind: parsed.data.kind,
        caption: parsed.data.caption,
      };
      media = decodeMediaDataUrl(parsed.data.dataUrl, "photo");
    } else {
      const parsed = photoBinaryMetadataSchema.safeParse({
        kind: c.req.query("kind"),
        caption: c.req.query("caption"),
      });
      if (!parsed.success) {
        return c.json({ error: "사진 메타데이터가 올바르지 않습니다" }, 400);
      }
      metadata = parsed.data;
      media = decodeMediaBytes(
        "photo",
        mimeType,
        await readBoundedRequestBytes(c.req.raw, MAX_PHOTO_BYTES),
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
    }
    return c.json(
      mediaValidationResponse(error),
      mediaValidationStatus(error),
    );
  }

  const requestFingerprint = await computeMediaRequestFingerprint({
    media,
    metadata: {
      kind: metadata.kind,
      caption: metadata.caption ?? null,
    },
  });
  if (idempotencyKey) {
    const replay = await loadIdempotentPhoto(
      c.env.DB,
      orgId,
      id,
      idempotencyKey,
      requestFingerprint,
      c.req.url,
    );
    if (replay.kind === "conflict") {
      return c.json(
        { error: "같은 멱등성 키가 다른 사진 또는 메타데이터에 사용되었습니다" },
        409,
      );
    }
    if (replay.kind === "replay") {
      return c.json({ photo: replay.photo, idempotentReplay: true });
    }
  }
  if (
    (await countWorkOrderPhotos(c.env.DB, orgId, id)) >=
    MAX_PHOTOS_PER_WORK_ORDER
  ) {
    return c.json(
      { error: `사진은 작업당 최대 ${MAX_PHOTOS_PER_WORK_ORDER}장까지 등록할 수 있습니다` },
      409,
    );
  }

  if (c.env.MEDIA) {
    const storageKey = createImmutableMediaKey({
      orgId,
      workOrderId: id,
      mediaType: "photo",
      mimeType: media.mimeType,
      createdAt: new Date(ts),
      assetId: photoId,
    });
    let stored;
    try {
      stored = await putPrivateMedia(c.env.MEDIA, {
        storageKey,
        media,
        assetId: photoId,
      });
    } catch (error) {
      return c.json(mediaValidationResponse(error), error instanceof MediaValidationError ? 400 : 503);
    }

    try {
      const inserted = await c.env.DB.prepare(
        `INSERT INTO media_assets (
           id, org_id, work_order_id, media_type, photo_kind, storage_key,
           mime_type, size_bytes, etag, checksum_sha256, caption,
           duration_seconds, idempotency_key, request_fingerprint, created_at,
           deleted_at
         )
         SELECT ?, ?, ?, 'photo', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL
         WHERE EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
         )
           AND (
             (SELECT COUNT(*) FROM photos WHERE work_order_id = ?) +
             (SELECT COUNT(*) FROM media_assets
              WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
                AND deleted_at IS NULL)
           ) < ?`,
      )
        .bind(
          photoId,
          orgId,
          id,
          metadata.kind,
          stored.storageKey,
          stored.mimeType,
          stored.sizeBytes,
          stored.etag,
          stored.checksumSha256,
          metadata.caption ?? null,
          idempotencyKey,
          requestFingerprint,
          ts,
          id,
          orgId,
          id,
          orgId,
          id,
          MAX_PHOTOS_PER_WORK_ORDER,
        )
        .run();
      if (inserted.meta.changes !== 1) {
        await deletePrivateMedia(c.env.MEDIA, stored.storageKey);
        const limitReached =
          (await countWorkOrderPhotos(c.env.DB, orgId, id)) >=
          MAX_PHOTOS_PER_WORK_ORDER;
        return c.json(
          {
            error: limitReached
              ? `사진은 작업당 최대 ${MAX_PHOTOS_PER_WORK_ORDER}장까지 등록할 수 있습니다`
              : "작업 상태가 변경되어 사진을 추가하지 못했습니다",
          },
          409,
        );
      }
    } catch (error) {
      await deletePrivateMedia(c.env.MEDIA, stored.storageKey).catch(() => undefined);
      if (idempotencyKey) {
        const replay = await loadIdempotentPhoto(
          c.env.DB,
          orgId,
          id,
          idempotencyKey,
          requestFingerprint,
          c.req.url,
        );
        if (replay.kind === "conflict") {
          return c.json(
            { error: "같은 멱등성 키가 다른 사진 또는 메타데이터에 사용되었습니다" },
            409,
          );
        }
        if (replay.kind === "replay") {
          return c.json({ photo: replay.photo, idempotentReplay: true });
        }
      }
      throw error;
    }

    return c.json({
      photo: {
        id: photoId,
        workOrderId: id,
        kind: metadata.kind,
        url: authenticatedMediaUrl(c.req.url, id, photoId),
        caption: metadata.caption ?? null,
        createdAt: ts,
      },
    });
  }

  if (media.bytes.byteLength > MAX_D1_PHOTO_BYTES) {
    return c.json(
      { error: "D1 사진 폴백 용량을 초과했습니다. R2 MEDIA 바인딩이 필요합니다" },
      413,
    );
  }
  const dataUrl = encodeMediaDataUrl("photo", media.mimeType, media.bytes);
  if (dataUrl.length > MAX_D1_PHOTO_DATA_URL_CHARS) {
    return c.json(
      { error: "D1 사진 폴백 용량을 초과했습니다. R2 MEDIA 바인딩이 필요합니다" },
      413,
    );
  }
  const inserted = await c.env.DB.prepare(
    `INSERT INTO photos (
       id, work_order_id, kind, data_url, caption, idempotency_key,
       request_fingerprint, created_at
     )
     SELECT ?, ?, ?, ?, ?, ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM work_orders
       WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
     )
       AND (
         (SELECT COUNT(*) FROM photos WHERE work_order_id = ?) +
         (SELECT COUNT(*) FROM media_assets
          WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
            AND deleted_at IS NULL)
       ) < ?`,
  )
    .bind(
      photoId,
      id,
      metadata.kind,
      dataUrl,
      metadata.caption ?? null,
      idempotencyKey,
      requestFingerprint,
      ts,
      id,
      orgId,
      id,
      orgId,
      id,
      MAX_PHOTOS_PER_WORK_ORDER,
    )
    .run()
    .catch(async (error) => {
      if (idempotencyKey) {
        const replay = await loadIdempotentPhoto(
          c.env.DB,
          orgId,
          id,
          idempotencyKey,
          requestFingerprint,
          c.req.url,
        );
        if (replay.kind === "conflict") return { conflict: true as const };
        if (replay.kind === "replay") return { replay: replay.photo };
      }
      throw error;
    });
  if ("conflict" in inserted) {
    return c.json(
      { error: "같은 멱등성 키가 다른 사진 또는 메타데이터에 사용되었습니다" },
      409,
    );
  }
  if ("replay" in inserted) {
    return c.json({ photo: inserted.replay, idempotentReplay: true });
  }
  if (inserted.meta.changes !== 1) {
    const limitReached =
      (await countWorkOrderPhotos(c.env.DB, orgId, id)) >=
      MAX_PHOTOS_PER_WORK_ORDER;
    return c.json(
      {
        error: limitReached
          ? `사진은 작업당 최대 ${MAX_PHOTOS_PER_WORK_ORDER}장까지 등록할 수 있습니다`
          : "작업 상태가 변경되어 사진을 추가하지 못했습니다",
      },
      409,
    );
  }

  return c.json({
    photo: {
      id: photoId,
      workOrderId: id,
      kind: metadata.kind,
      url: authenticatedMediaUrl(c.req.url, id, photoId),
      caption: metadata.caption ?? null,
      createdAt: ts,
    },
  });
});

workOrderRoutes.delete("/work-orders/:id/photos/:photoId", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const photoId = c.req.param("photoId");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 사진을 삭제할 수 있습니다" }, 409);
  }

  const mediaAsset = await c.env.DB.prepare(
    `SELECT id, org_id, work_order_id, media_type, photo_kind, storage_key, mime_type,
            size_bytes, etag, checksum_sha256, caption, duration_seconds, created_at
     FROM media_assets
     WHERE id = ? AND org_id = ? AND work_order_id = ?
       AND media_type = 'photo' AND deleted_at IS NULL`,
  )
    .bind(photoId, orgId, id)
    .first<MediaAssetRow>();
  if (mediaAsset) {
    if (!c.env.MEDIA) {
      return c.json({ error: "R2 MEDIA 바인딩이 없어 사진 원본을 삭제하지 못했습니다" }, 503);
    }
    const ts = nowIso();
    const marked = await c.env.DB.prepare(
      `UPDATE media_assets SET deleted_at = ?
       WHERE id = ? AND org_id = ? AND work_order_id = ? AND deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
         )`,
    )
      .bind(ts, photoId, orgId, id, id, orgId)
      .run();
    if (marked.meta.changes !== 1) {
      return c.json({ error: "사진을 찾을 수 없거나 작업 상태가 변경되었습니다" }, 409);
    }
    try {
      await deletePrivateMedia(c.env.MEDIA, mediaAsset.storage_key);
    } catch {
      // R2 장애 시 tombstone을 되돌려 같은 API로 안전하게 재시도할 수 있게 한다.
      await c.env.DB.prepare(
        "UPDATE media_assets SET deleted_at = NULL WHERE id = ? AND deleted_at = ?",
      )
        .bind(photoId, ts)
        .run();
      return c.json({ error: "사진 원본 삭제에 실패했습니다" }, 503);
    }
    await c.env.DB.prepare("DELETE FROM media_assets WHERE id = ? AND deleted_at = ?")
      .bind(photoId, ts)
      .run();
    return c.json({ ok: true });
  }

  const deleted = await c.env.DB.prepare(
    `DELETE FROM photos
     WHERE id = ? AND work_order_id = ?
       AND EXISTS (
         SELECT 1 FROM work_orders
         WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
       )`,
  )
    .bind(photoId, id, id, orgId)
    .run();
  if (deleted.meta.changes !== 1) {
    return c.json({ error: "사진을 찾을 수 없거나 작업 상태가 변경되었습니다" }, 409);
  }
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Audio originals (R2 only; STT remains an explicit manual step)
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/audio", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 음성 메모를 추가할 수 있습니다" }, 409);
  }

  const rawIdempotencyKey = c.req.header("Idempotency-Key");
  const parsedIdempotencyKey = rawIdempotencyKey
    ? uploadIdempotencyKeySchema.safeParse(rawIdempotencyKey)
    : null;
  if (parsedIdempotencyKey && !parsedIdempotencyKey.success) {
    return c.json({ error: "업로드 멱등성 키가 올바르지 않습니다" }, 400);
  }
  const idempotencyKey = parsedIdempotencyKey?.data ?? null;

  const parsed = audioBinaryMetadataSchema.safeParse({
    caption: c.req.query("caption"),
    durationSeconds: c.req.query("durationSeconds"),
  });
  if (!parsed.success) {
    return c.json({ error: "음성 메타데이터가 올바르지 않습니다" }, 400);
  }
  const metadata = parsed.data;

  let media: ReturnType<typeof decodeMediaBytes>;
  try {
    media = decodeMediaBytes(
      "audio",
      requestMimeType(c.req.raw),
      await readBoundedRequestBytes(c.req.raw, MAX_AUDIO_BYTES),
    );
  } catch (error) {
    return c.json(
      mediaValidationResponse(error),
      mediaValidationStatus(error),
    );
  }

  const requestFingerprint = await computeMediaRequestFingerprint({
    media,
    metadata: {
      caption: metadata.caption ?? null,
      durationSeconds: metadata.durationSeconds ?? null,
    },
  });
  if (idempotencyKey) {
    const replay = await loadIdempotentAudio(
      c.env.DB,
      orgId,
      id,
      idempotencyKey,
      requestFingerprint,
      c.req.url,
    );
    if (replay.kind === "conflict") {
      return c.json(
        { error: "같은 멱등성 키가 다른 음성 또는 메타데이터에 사용되었습니다" },
        409,
      );
    }
    if (replay.kind === "replay") {
      return c.json({ audio: replay.audio, idempotentReplay: true });
    }
  }
  if (!c.env.MEDIA) {
    return c.json({ error: "음성 원본 저장을 위한 R2 MEDIA 바인딩이 필요합니다" }, 503);
  }

  const audioId = newId();
  const ts = nowIso();
  const storageKey = createImmutableMediaKey({
    orgId,
    workOrderId: id,
    mediaType: "audio",
    mimeType: media.mimeType,
    createdAt: new Date(ts),
    assetId: audioId,
  });
  let stored;
  try {
    stored = await putPrivateMedia(c.env.MEDIA, {
      storageKey,
      media,
      assetId: audioId,
    });
  } catch (error) {
    return c.json(mediaValidationResponse(error), error instanceof MediaValidationError ? 400 : 503);
  }

  try {
    const inserted = await c.env.DB.prepare(
      `INSERT INTO media_assets (
         id, org_id, work_order_id, media_type, photo_kind, storage_key,
         mime_type, size_bytes, etag, checksum_sha256, caption,
         duration_seconds, idempotency_key, request_fingerprint, created_at,
         deleted_at
       )
       SELECT ?, ?, ?, 'audio', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
       WHERE EXISTS (
         SELECT 1 FROM work_orders
         WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
       )`,
    )
      .bind(
        audioId,
        orgId,
        id,
        stored.storageKey,
        stored.mimeType,
        stored.sizeBytes,
        stored.etag,
        stored.checksumSha256,
        metadata.caption ?? null,
        metadata.durationSeconds ?? null,
        idempotencyKey,
        requestFingerprint,
        ts,
        id,
        orgId,
      )
      .run();
    if (inserted.meta.changes !== 1) {
      await deletePrivateMedia(c.env.MEDIA, stored.storageKey);
      return c.json({ error: "작업 상태가 변경되어 음성 메모를 추가하지 못했습니다" }, 409);
    }
  } catch (error) {
    await deletePrivateMedia(c.env.MEDIA, stored.storageKey).catch(() => undefined);
    if (idempotencyKey) {
      const replay = await loadIdempotentAudio(
        c.env.DB,
        orgId,
        id,
        idempotencyKey,
        requestFingerprint,
        c.req.url,
      );
      if (replay.kind === "conflict") {
        return c.json(
          { error: "같은 멱등성 키가 다른 음성 또는 메타데이터에 사용되었습니다" },
          409,
        );
      }
      if (replay.kind === "replay") {
        return c.json({ audio: replay.audio, idempotentReplay: true });
      }
    }
    throw error;
  }

  return c.json({
    audio: {
      id: audioId,
      workOrderId: id,
      url: authenticatedMediaUrl(c.req.url, id, audioId),
      mimeType: stored.mimeType,
      caption: metadata.caption ?? null,
      durationSeconds: metadata.durationSeconds ?? null,
      createdAt: ts,
      transcriptStatus: "not_connected",
    },
  });
});

workOrderRoutes.delete("/work-orders/:id/audio/:audioId", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const audioId = c.req.param("audioId");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 음성 메모를 삭제할 수 있습니다" }, 409);
  }

  const mediaAsset = await c.env.DB.prepare(
    `SELECT id, org_id, work_order_id, media_type, photo_kind, storage_key, mime_type,
            size_bytes, etag, checksum_sha256, caption, duration_seconds, created_at
     FROM media_assets
     WHERE id = ? AND org_id = ? AND work_order_id = ?
       AND media_type = 'audio' AND deleted_at IS NULL`,
  )
    .bind(audioId, orgId, id)
    .first<MediaAssetRow>();
  if (!mediaAsset) return c.json({ error: "음성 메모를 찾을 수 없습니다" }, 404);
  if (!c.env.MEDIA) {
    return c.json({ error: "R2 MEDIA 바인딩이 없어 음성 원본을 삭제하지 못했습니다" }, 503);
  }

  const ts = nowIso();
  const marked = await c.env.DB.prepare(
    `UPDATE media_assets SET deleted_at = ?
     WHERE id = ? AND org_id = ? AND work_order_id = ?
       AND media_type = 'audio' AND deleted_at IS NULL
       AND EXISTS (
         SELECT 1 FROM work_orders
         WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
       )`,
  )
    .bind(ts, audioId, orgId, id, id, orgId)
    .run();
  if (marked.meta.changes !== 1) {
    return c.json({ error: "음성 메모를 찾을 수 없거나 작업 상태가 변경되었습니다" }, 409);
  }

  try {
    await deletePrivateMedia(c.env.MEDIA, mediaAsset.storage_key);
  } catch {
    await c.env.DB.prepare(
      "UPDATE media_assets SET deleted_at = NULL WHERE id = ? AND deleted_at = ?",
    )
      .bind(audioId, ts)
      .run();
    return c.json({ error: "음성 원본 삭제에 실패했습니다" }, 503);
  }
  await c.env.DB.prepare("DELETE FROM media_assets WHERE id = ? AND deleted_at = ?")
    .bind(audioId, ts)
    .run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/submit
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/submit", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("work", wo.work_status as any, "submitted")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 제출할 수 없습니다` }, 409);
  }

  const fr = await c.env.DB.prepare(
    "SELECT work_summary, transcript, parts_json, checklist_json, issues, notes, next_inspection_date FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{
      work_summary: string | null;
      transcript: string | null;
      parts_json: string | null;
      checklist_json: string | null;
      issues: string | null;
      notes: string | null;
      next_inspection_date: string | null;
    }>();
  const photoCount = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM photos WHERE work_order_id = ?) +
       (SELECT COUNT(*) FROM media_assets
        WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
          AND deleted_at IS NULL) AS n`,
  )
    .bind(id, orgId, id)
    .first<{ n: number }>();
  if ((photoCount?.n ?? 0) < 1) {
    return c.json({ error: "사진을 1장 이상 등록해야 제출할 수 있습니다" }, 400);
  }
  if (!(fr?.transcript?.trim() || fr?.work_summary?.trim())) {
    return c.json({ error: "음성 전사 또는 작업 요약을 입력해야 제출할 수 있습니다" }, 400);
  }

  const ts = nowIso();
  let aiStatus = "drafted";
  const draftInput = {
    transcript: fr?.transcript ?? "",
    workSummary: fr?.work_summary ?? null,
    parts: parseJson<UsedPart[]>(fr?.parts_json, []),
    checklist: parseJson<ChecklistItem[]>(fr?.checklist_json, []),
    issues: fr?.issues ?? null,
    notes: fr?.notes ?? null,
    nextInspectionDate: fr?.next_inspection_date ?? null,
  };
  let generatedDraft: StructuredDraft;
  try {
    const engine = new RuleBasedDraftEngine();
    generatedDraft = await engine.generate({
      transcript: draftInput.transcript,
      workSummary: draftInput.workSummary ?? undefined,
      parts: draftInput.parts,
      checklist: draftInput.checklist,
      issues: draftInput.issues ?? undefined,
      notes: draftInput.notes ?? undefined,
      // 값이 없을 때는 transcript의 실제 ISO 날짜를 규칙 엔진이 추출한다.
      nextInspectionDate: draftInput.nextInspectionDate ?? undefined,
    });
  } catch {
    aiStatus = "failed";
    // 규칙 엔진 실패가 제출 자체를 막지 않도록 원본 기반 수동 편집 초안을 남긴다.
    generatedDraft = manualReportFallback(draftInput);
  }
  await upsertReportDraft(c.env.DB, id, generatedDraft, ts);

  const submitted = await c.env.DB.prepare(
    `UPDATE work_orders
     SET work_status = 'submitted', submitted_at = ?, ai_status = ?, updated_at = ?
     WHERE id = ? AND org_id = ? AND work_status = 'in_progress'
       AND (
         EXISTS (SELECT 1 FROM photos WHERE work_order_id = work_orders.id)
         OR EXISTS (
           SELECT 1 FROM media_assets
           WHERE org_id = work_orders.org_id
             AND work_order_id = work_orders.id
             AND media_type = 'photo'
             AND deleted_at IS NULL
         )
       )
       AND EXISTS (
         SELECT 1 FROM field_records fr
         WHERE fr.work_order_id = work_orders.id
           AND (
             TRIM(COALESCE(fr.transcript, '')) <> ''
             OR TRIM(COALESCE(fr.work_summary, '')) <> ''
           )
       )`,
  )
    .bind(ts, aiStatus, ts, id, orgId)
    .run();
  if (submitted.meta.changes !== 1) {
    return c.json({ error: "제출 조건 또는 작업 상태가 변경되었습니다" }, 409);
  }

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(orgId)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId, userId: m.user_id, type: "submitted", workOrderId: id, message: `${wo.work_type} 작업이 제출되었습니다` });
  }

  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_submitted", target: id, detail: { aiStatus } });

  return c.json({ ok: true, submittedAt: ts, workStatus: "submitted", aiStatus, draft: generatedDraft });
});

// ---------------------------------------------------------------------------
// PUT /work-orders/:id/report
// ---------------------------------------------------------------------------

workOrderRoutes.put("/work-orders/:id/report", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const revisionOpen =
    (wo.work_status === "reviewed" || wo.work_status === "completed") &&
    wo.approval_status === "revision_requested" &&
    (await revisionRequestTargetsLatestVersion(c.env.DB, id));
  if (wo.work_status !== "submitted" && !revisionOpen) {
    return c.json({ error: "제출된 리포트만 수정할 수 있습니다 (확정 후에는 새 버전이 필요합니다)" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = reportPutSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const ts = nowIso();
  const existing = await c.env.DB.prepare(
    "SELECT id, structured_json, revision FROM report_drafts WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ id: string; structured_json: string; revision: number }>();
  if (!existing) return c.json({ error: "초안이 없습니다" }, 400);
  const currentDraft = structuredDraftSchema.safeParse(
    parseJson(existing.structured_json, null),
  );
  if (!currentDraft.success) {
    return c.json({ error: "기존 보고서 초안 데이터가 올바르지 않습니다" }, 409);
  }
  const storedDraft = {
    ...parsed.data.structured,
    // 불확실 판정은 서버 생성값이다. 편집 요청으로 제거해 확인 절차를 우회할 수 없다.
    // 단, 부품 행을 삭제한 뒤 존재하지 않는 배열 인덱스는 확인 대상으로 남기지 않는다.
    uncertainFields: reconcileUncertainFields(
      currentDraft.data.uncertainFields,
      parsed.data.structured.usedParts.length,
    ),
  };
  const updated = await c.env.DB.prepare(
    `UPDATE report_drafts
     SET structured_json = ?, updated_at = ?, revision = revision + 1
     WHERE work_order_id = ? AND revision = ?
       AND EXISTS (
         SELECT 1
         FROM work_orders w
         WHERE w.id = ? AND w.org_id = ?
           AND (
             w.work_status = 'submitted'
             OR (
               w.work_status IN ('reviewed', 'completed')
               AND w.approval_status = 'revision_requested'
               AND EXISTS (
                 SELECT 1
                 FROM approval_requests ar
                 WHERE ar.work_order_id = w.id
                   AND (
                     ar.status = 'revision_requested'
                     OR (
                       ar.status = 'approved'
                       AND ar.correction_requested_at IS NOT NULL
                     )
                   )
                   AND ar.report_version_id = (
                     SELECT rv.id
                     FROM report_versions rv
                     WHERE rv.work_order_id = w.id
                     ORDER BY rv.version DESC
                     LIMIT 1
                   )
               )
             )
           )
       )`,
  )
    .bind(
      JSON.stringify(storedDraft),
      ts,
      id,
      existing.revision,
      id,
      orgId,
    )
    .run();
  if (updated.meta.changes !== 1) {
    return c.json(
      { error: "보고서 상태 또는 초안이 다른 요청에서 변경되었습니다" },
      409,
    );
  }

  return c.json({ draft: storedDraft });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/report/finalize
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/report/finalize", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsedFinalize = finalizeReportSchema.safeParse(body);
  if (!parsedFinalize.success) {
    return c.json({ error: "확인이 필요한 항목 목록을 제출해주세요" }, 400);
  }

  const revisionOpen =
    (wo.work_status === "reviewed" || wo.work_status === "completed") &&
    wo.approval_status === "revision_requested" &&
    (await revisionRequestTargetsLatestVersion(c.env.DB, id));
  const firstFinalize = canTransition("work", wo.work_status as any, "reviewed");
  if (!firstFinalize && !revisionOpen) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 확정할 수 없습니다` }, 409);
  }

  const draftRow = await c.env.DB.prepare("SELECT structured_json FROM report_drafts WHERE work_order_id = ?").bind(id).first<{ structured_json: string }>();
  if (!draftRow) return c.json({ error: "초안이 없습니다" }, 400);

  const contextSnapshot = await loadReportContextSnapshot(c.env.DB, orgId, id);
  if (!contextSnapshot) {
    return c.json({ error: "작업의 고객·현장·장비 연결이 올바르지 않습니다" }, 409);
  }
  const draftResult = structuredDraftSchema.safeParse(
    parseJson(draftRow.structured_json, null),
  );
  if (!draftResult.success) {
    return c.json({ error: "보고서 초안 데이터가 올바르지 않습니다" }, 409);
  }
  const draft = draftResult.data;
  const confirmed = new Set(parsedFinalize.data.confirmedUncertainFields);
  const missingUncertainFields = draft.uncertainFields.filter(
    (field) => !confirmed.has(field),
  );
  if (missingUncertainFields.length > 0) {
    return c.json(
      {
        error: "확인이 필요한 항목이 남아있습니다",
        missingUncertainFields,
      },
      409,
    );
  }
  const confirmedUncertainFields = draft.uncertainFields.filter((field) =>
    confirmed.has(field),
  );
  const storedStructured = {
    ...draft,
    [REPORT_CONTEXT_KEY]: contextSnapshot,
  };

  const photoRows = await c.env.DB.prepare(
    "SELECT id, work_order_id, kind, data_url, caption, created_at FROM photos WHERE work_order_id = ? ORDER BY created_at ASC",
  )
    .bind(id)
    .all<{ id: string; work_order_id: string; kind: string; data_url: string; caption: string | null; created_at: string }>();
  const r2PhotoRows = await c.env.DB.prepare(
    `SELECT id, org_id, work_order_id, media_type, photo_kind, storage_key, mime_type,
            size_bytes, etag, checksum_sha256, caption, duration_seconds, created_at
     FROM media_assets
     WHERE org_id = ? AND work_order_id = ? AND media_type = 'photo'
       AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(orgId, id)
    .all<MediaAssetRow>();
  const snapshotPhotos: SnapshotPhoto[] = [
    ...(photoRows.results ?? []).map((p) => ({
      id: p.id,
      kind: p.kind as SnapshotPhoto["kind"],
      caption: p.caption,
      createdAt: p.created_at,
    })),
    ...(r2PhotoRows.results ?? []).map((p) => ({
      id: p.id,
      kind: p.photo_kind!,
      storageKey: p.storage_key,
      mimeType: p.mime_type,
      checksumSha256: p.checksum_sha256,
      caption: p.caption,
      createdAt: p.created_at,
    })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const versionCountRow = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM report_versions WHERE work_order_id = ?")
    .bind(id)
    .first<{ n: number }>();
  const version = (versionCountRow?.n ?? 0) + 1;

  const latestVersion = await c.env.DB.prepare(
    "SELECT id, version, report_number FROM report_versions WHERE work_order_id = ? ORDER BY version DESC LIMIT 1",
  )
    .bind(id)
    .first<{ id: string; version: number; report_number: string }>();
  if (!firstFinalize && !latestVersion) {
    return c.json({ error: "수정할 기존 보고서 버전이 없습니다" }, 409);
  }

  const ts = nowIso();
  let reportNumber: string;
  if (firstFinalize) {
    const allocation = await c.env.DB.prepare(
      `INSERT INTO report_number_sequences (org_id, next_value, updated_at)
       VALUES (?, 2, ?)
       ON CONFLICT(org_id) DO UPDATE SET
         next_value = report_number_sequences.next_value + 1,
         updated_at = excluded.updated_at
       RETURNING next_value - 1 AS allocated_value`,
    )
      .bind(orgId, ts)
      .first<{ allocated_value: number }>();
    const allocatedValue = allocation?.allocated_value;
    if (
      typeof allocatedValue !== "number" ||
      !Number.isSafeInteger(allocatedValue) ||
      allocatedValue < 1
    ) {
      throw new Error("Report number allocation failed");
    }
    reportNumber = formatReportNumber("FS", wo.scheduled_date, allocatedValue);
  } else {
    reportNumber = latestVersion!.report_number;
  }

  const versionId = newId();
  const approvalArtifactId = newId();
  const structuredJson = JSON.stringify(storedStructured);
  const photosJson = JSON.stringify(snapshotPhotos);
  const sourceSha256 = await computeReportSourceSha256({
    id: versionId,
    workOrderId: id,
    version,
    reportNumber,
    structuredJson,
    photosJson,
    templateVersion: 1,
    createdBy: c.get("userId"),
    createdAt: ts,
  });

  const insertVersion = firstFinalize
    ? c.env.DB.prepare(
        `INSERT INTO report_versions (id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_by, created_at, locked_at)
         SELECT ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL
         WHERE EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND work_status = 'submitted'
         )`,
      )
    : c.env.DB.prepare(
        `INSERT INTO report_versions (id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_by, created_at, locked_at)
         SELECT ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL
         WHERE EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND work_status IN ('reviewed', 'completed')
             AND approval_status = 'revision_requested'
         )
           AND EXISTS (
             SELECT 1 FROM approval_requests
             WHERE work_order_id = ? AND report_version_id = ?
               AND (
                 status = 'revision_requested'
                 OR (
                   status = 'approved'
                   AND correction_requested_at IS NOT NULL
                 )
               )
           )
           AND ? = (
             SELECT id FROM report_versions
             WHERE work_order_id = ?
             ORDER BY version DESC LIMIT 1
           )`,
      );
  const insertValues = [
    versionId,
    id,
    version,
    reportNumber,
    structuredJson,
    photosJson,
    c.get("userId"),
    ts,
    id,
    orgId,
  ] as const;
  const boundInsert = firstFinalize
    ? insertVersion.bind(...insertValues)
    : insertVersion.bind(
        ...insertValues,
        id,
        latestVersion?.id ?? "",
        latestVersion?.id ?? "",
        id,
      );
  const transition = await c.env.DB.batch([
    boundInsert,
    c.env.DB
      .prepare(
        `INSERT INTO report_artifacts (
           id, org_id, work_order_id, report_version_id, approval_request_id,
           base_artifact_id, kind, status, renderer_version, source_sha256,
           storage_key, mime_type, size_bytes, etag, checksum_sha256,
           attempt_count, last_error_code, last_error_message, created_by,
           created_at, updated_at, ready_at
         )
         SELECT ?, ?, ?, ?, NULL, NULL, 'approval', 'pending', ?, ?,
                NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, ?, ?, ?, NULL
         WHERE EXISTS (
           SELECT 1 FROM report_versions
           WHERE id = ? AND work_order_id = ?
         )`,
      )
      .bind(
        approvalArtifactId,
        orgId,
        id,
        versionId,
        REPORT_PDF_RENDERER_VERSION,
        sourceSha256,
        c.get("userId"),
        ts,
        ts,
        versionId,
        id,
      ),
    c.env.DB
      .prepare(
        `UPDATE work_orders
         SET work_status = CASE
               WHEN work_status = 'completed' THEN 'completed'
               ELSE 'reviewed'
             END,
             reviewed_at = ?,
             updated_at = ?
         WHERE id = ? AND org_id = ?
           AND EXISTS (
             SELECT 1 FROM report_versions
             WHERE id = ? AND work_order_id = work_orders.id
           )`,
      )
      .bind(ts, ts, id, orgId, versionId),
  ]);
  if (
    transition[0]?.meta.changes !== 1 ||
    transition[1]?.meta.changes !== 1 ||
    transition[2]?.meta.changes !== 1
  ) {
    return c.json({ error: "검토 상태가 변경되어 리포트를 확정하지 못했습니다" }, 409);
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "report_finalized",
    target: id,
    detail: {
      version,
      reportNumber,
      confirmedUncertainFields,
      revisionOfVersion: revisionOpen ? version - 1 : null,
    },
  });

  return c.json({
    reportVersion: {
      id: versionId,
      workOrderId: id,
      reportNumber,
      version,
      createdAt: ts,
      createdBy: c.get("userId"),
    },
    artifact: {
      id: approvalArtifactId,
      kind: "approval",
      status: "pending",
      rendererVersion: REPORT_PDF_RENDERER_VERSION,
      sourceSha256,
      uploadUrl: `${new URL(c.req.url).origin}/work-orders/${encodeURIComponent(id)}/report-versions/${version}/artifacts/approval`,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /work-orders/:id/report-versions/:version — 불변 스냅샷(인쇄·이력용)
// ---------------------------------------------------------------------------

workOrderRoutes.get(
  "/work-orders/:id/report-versions/:version",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const versionNo = Number(c.req.param("version"));
  if (!Number.isInteger(versionNo) || versionNo < 1) return c.json({ error: "버전이 올바르지 않습니다" }, 400);

  const version = await c.env.DB.prepare(
    `SELECT id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_at, created_by, locked_at
     FROM report_versions WHERE work_order_id = ? AND version = ?`,
  )
    .bind(id, versionNo)
    .first<{
      id: string;
      work_order_id: string;
      version: number;
      report_number: string;
      structured_json: string;
      photos_json: string;
      template_version: number;
      created_at: string;
      created_by: string;
      locked_at: string | null;
    }>();
  if (!version) return c.json({ error: "보고서 버전을 찾을 수 없습니다" }, 404);

  const signature = await c.env.DB.prepare(
    `SELECT sig.name, sig.title, sig.signature_data_url, sig.approved_at,
            sig.agreed, sig.consented_at, sig.consent_version
     FROM signatures sig JOIN approval_requests ar ON ar.id = sig.approval_request_id
     WHERE ar.report_version_id = ? AND ar.status = 'approved'
     ORDER BY sig.approved_at DESC LIMIT 1`,
  )
    .bind(version.id)
    .first<{
      name: string;
      title: string | null;
      signature_data_url: string;
      approved_at: string;
      agreed: number;
      consented_at: string | null;
      consent_version: string;
    }>();
  const artifactRows = await c.env.DB
    .prepare(
      `SELECT id, org_id, work_order_id, report_version_id, approval_request_id,
              base_artifact_id, kind, status, renderer_version, source_sha256,
              storage_key, mime_type, size_bytes, etag, checksum_sha256,
              attempt_count, last_error_code, last_error_message, created_by,
              created_at, updated_at, ready_at
       FROM report_artifacts
       WHERE org_id = ? AND work_order_id = ? AND report_version_id = ?
       ORDER BY CASE kind WHEN 'approval' THEN 0 ELSE 1 END`,
    )
    .bind(orgId, id, version.id)
    .all<ReportArtifactRow>();
  const report = storedReport(version.structured_json);
  const photos = snapshotPhotoResponses(
    parseJson<SnapshotPhoto[]>(version.photos_json, []),
    (mediaId) => authenticatedMediaUrl(c.req.url, id, mediaId),
  );

  return c.json({
    reportVersion: {
      id: version.id,
      workOrderId: version.work_order_id,
      version: version.version,
      reportNumber: version.report_number,
      structured: report.structured,
      context: reportContextResponse(
        report.context,
        c.req.url,
        id,
        version.version,
      ),
      photos,
      templateVersion: version.template_version,
      createdAt: version.created_at,
      createdBy: version.created_by,
      lockedAt: version.locked_at,
      signature: signature
        ? {
            name: signature.name,
            title: signature.title,
            signatureDataUrl: signature.signature_data_url,
            approvedAt: signature.approved_at,
            agreed: signature.agreed === 1,
            consentedAt: signature.consented_at,
            consentVersion: signature.consent_version,
          }
        : null,
      artifacts: {
        approval: artifactRows.results
          ?.filter((artifact) => artifact.kind === "approval")
          .map((artifact) =>
            reportArtifactResponse(artifact, {
              requestUrl: c.req.url,
              workOrderId: id,
              version: version.version,
              reportNumber: version.report_number,
            }),
          )[0] ?? null,
        signed: artifactRows.results
          ?.filter((artifact) => artifact.kind === "signed")
          .map((artifact) =>
            reportArtifactResponse(artifact, {
              requestUrl: c.req.url,
              workOrderId: id,
              version: version.version,
              reportNumber: version.report_number,
            }),
          )[0] ?? null,
      },
    },
  });
  },
);

// ---------------------------------------------------------------------------
// Immutable report logo/PDF artifacts
// ---------------------------------------------------------------------------

workOrderRoutes.get(
  "/work-orders/:id/report-versions/:version/logo/:logoId",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const workOrderId = c.req.param("id");
    const versionNo = Number(c.req.param("version"));
    if (!Number.isInteger(versionNo) || versionNo < 1) {
      return c.json({ error: "버전이 올바르지 않습니다" }, 400);
    }
    const version = await c.env.DB
      .prepare(
        `SELECT rv.structured_json
         FROM report_versions rv
         JOIN work_orders w ON w.id = rv.work_order_id
         WHERE w.org_id = ? AND rv.work_order_id = ? AND rv.version = ?`,
      )
      .bind(orgId, workOrderId, versionNo)
      .first<{ structured_json: string }>();
    if (!version) return c.json({ error: "보고서 버전을 찾을 수 없습니다" }, 404);

    const logo = storedReport(version.structured_json).context?.org.logo ?? null;
    if (!logo || logo.id !== c.req.param("logoId")) {
      return c.json({ error: "보고서 로고를 찾을 수 없습니다" }, 404);
    }
    if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
    const response = await getPrivateMediaResponse(c.env.MEDIA, {
      storageKey: logo.storageKey,
      mimeType: logo.mimeType,
      checksumSha256: logo.checksumSha256,
    });
    return response ?? c.json({ error: "보고서 로고 원본을 찾을 수 없습니다" }, 404);
  },
);

workOrderRoutes.post(
  "/work-orders/:id/report-versions/:version/artifacts/signed/prepare",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const workOrderId = c.req.param("id");
    const versionNo = Number(c.req.param("version"));
    if (!Number.isInteger(versionNo) || versionNo < 1) {
      return c.json({ error: "버전이 올바르지 않습니다" }, 400);
    }

    const baseArtifact = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind: "approval",
    });
    if (!baseArtifact || baseArtifact.status !== "ready") {
      return c.json(
        { error: "고객 승인용 PDF가 준비된 뒤 서명본을 복구할 수 있습니다" },
        409,
      );
    }
    const baseArtifactRecoveryUrl = reportArtifactResponse(baseArtifact, {
      requestUrl: c.req.url,
      workOrderId,
      version: versionNo,
      reportNumber: baseArtifact.report_number,
    }).uploadUrl;
    if (
      !baseArtifact.storage_key ||
      baseArtifact.size_bytes === null ||
      baseArtifact.mime_type !== REPORT_PDF_MIME_TYPE ||
      !baseArtifact.checksum_sha256
    ) {
      return c.json(
        {
          error: "고객 승인용 PDF 저장 메타데이터가 불완전하여 수동 복구가 필요합니다",
          code: "report_pdf_manual_repair_required",
          artifactStatus: "metadata_missing",
        },
        409,
      );
    }
    if (!c.env.MEDIA) {
      return c.json(
        {
          error: "PDF 저장소를 확인할 수 없습니다",
          code: "report_pdf_storage_unavailable",
        },
        503,
      );
    }
    try {
      const exists = await hasMatchingPrivatePdfArtifact(c.env.MEDIA, {
        orgId,
        workOrderId,
        storageKey: baseArtifact.storage_key,
        artifactId: baseArtifact.id,
        reportVersionId: baseArtifact.report_version_id,
        kind: "approval",
        rendererVersion: baseArtifact.renderer_version,
        sourceSha256: baseArtifact.source_sha256,
        contentLength: baseArtifact.size_bytes,
        checksumSha256: baseArtifact.checksum_sha256,
      });
      if (!exists) {
        return c.json(
          {
            error: "고객 승인용 PDF 원본이 없어 같은 파일을 다시 업로드해야 합니다",
            code: "report_pdf_recovery_required",
            artifactStatus: "missing_object",
            recoveryUrl: baseArtifactRecoveryUrl,
          },
          409,
        );
      }
    } catch (error) {
      if (error instanceof ReportArtifactError) {
        return c.json(
          {
            error: "고객 승인용 PDF 무결성을 확인하지 못해 서명본을 준비할 수 없습니다",
            code: "report_pdf_manual_repair_required",
            artifactStatus: error.code,
          },
          409,
        );
      }
      return c.json(
        {
          error: "PDF 저장소 확인에 실패했습니다",
          code: "report_pdf_storage_unavailable",
        },
        503,
      );
    }

    const signature = await c.env.DB
      .prepare(
        `SELECT ar.id AS approval_request_id, sig.name, sig.title,
                sig.signature_data_url, sig.approved_at, sig.consent_version
         FROM approval_requests ar
         JOIN signatures sig ON sig.approval_request_id = ar.id
         WHERE ar.work_order_id = ? AND ar.report_version_id = ?
           AND ar.status = 'approved'
         ORDER BY sig.approved_at DESC, sig.rowid DESC
         LIMIT 1`,
      )
      .bind(workOrderId, baseArtifact.report_version_id)
      .first<{
        approval_request_id: string;
        name: string;
        title: string | null;
        signature_data_url: string;
        approved_at: string;
        consent_version: string;
      }>();
    if (!signature) {
      return c.json({ error: "승인된 고객 서명을 찾을 수 없습니다" }, 409);
    }

    const signatureSha256 = await sha256Hex(signature.signature_data_url);
    const sourceSha256 = await computeSignedReportSourceSha256({
      reportVersionId: baseArtifact.report_version_id,
      approvalRequestId: signature.approval_request_id,
      basePdfChecksumSha256: baseArtifact.checksum_sha256,
      signerName: signature.name,
      signerTitle: signature.title,
      signatureSha256,
      approvedAt: signature.approved_at,
      agreementVersion: signature.consent_version,
    });
    const artifactId = newId();
    const ts = nowIso();
    await c.env.DB
      .prepare(
        `INSERT OR IGNORE INTO report_artifacts (
           id, org_id, work_order_id, report_version_id, approval_request_id,
           base_artifact_id, kind, status, renderer_version, source_sha256,
           storage_key, mime_type, size_bytes, etag, checksum_sha256,
           attempt_count, last_error_code, last_error_message, created_by,
           created_at, updated_at, ready_at
         )
         VALUES (?, ?, ?, ?, ?, ?, 'signed', 'pending', ?, ?,
                 NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, ?, ?, ?, NULL)`,
      )
      .bind(
        artifactId,
        orgId,
        workOrderId,
        baseArtifact.report_version_id,
        signature.approval_request_id,
        baseArtifact.id,
        REPORT_PDF_RENDERER_VERSION,
        sourceSha256,
        c.get("userId"),
        ts,
        ts,
      )
      .run();

    const artifact = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind: "signed",
    });
    if (
      !artifact ||
      artifact.source_sha256 !== sourceSha256 ||
      artifact.approval_request_id !== signature.approval_request_id ||
      artifact.base_artifact_id !== baseArtifact.id
    ) {
      return c.json(
        { error: "기존 서명 PDF 산출물의 원본이 현재 승인 증빙과 다릅니다" },
        409,
      );
    }

    return c.json({
      artifact: reportArtifactResponse(artifact, {
        requestUrl: c.req.url,
        workOrderId,
        version: versionNo,
        reportNumber: baseArtifact.report_number,
      }),
      receipt: {
        reportVersionId: baseArtifact.report_version_id,
        approvalRequestId: signature.approval_request_id,
        sourceSha256,
        signerName: signature.name,
        signerTitle: signature.title,
        signatureDataUrl: signature.signature_data_url,
        approvedAt: signature.approved_at,
        agreementVersion: signature.consent_version,
      },
      basePdfUrl: `${new URL(c.req.url).origin}/work-orders/${encodeURIComponent(workOrderId)}/report-versions/${versionNo}/artifacts/approval/pdf`,
    });
  },
);

workOrderRoutes.put(
  "/work-orders/:id/report-versions/:version/artifacts/:kind",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const workOrderId = c.req.param("id");
    const versionNo = Number(c.req.param("version"));
    const kind = c.req.param("kind");
    if (!Number.isInteger(versionNo) || versionNo < 1) {
      return c.json({ error: "버전이 올바르지 않습니다" }, 400);
    }
    if (kind !== "approval" && kind !== "signed") {
      return c.json({ error: "PDF 산출물 종류가 올바르지 않습니다" }, 400);
    }
    if (requestMimeType(c.req.raw) !== REPORT_PDF_MIME_TYPE) {
      return c.json({ error: "application/pdf 파일만 업로드할 수 있습니다" }, 415);
    }
    if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

    let artifact = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind,
    });
    if (!artifact) return c.json({ error: "PDF 산출물을 찾을 수 없습니다" }, 404);

    const checksumSha256 = (
      c.req.header("x-content-sha256") ?? ""
    ).trim().toLowerCase();
    const contentLength = Number(c.req.header("content-length"));
    let recoveringMissingReadyObject = false;
    if (
      artifact.status === "ready" &&
      artifact.checksum_sha256 === checksumSha256
    ) {
      if (
        !artifact.storage_key ||
        artifact.size_bytes === null ||
        artifact.mime_type !== REPORT_PDF_MIME_TYPE
      ) {
        return c.json(
          {
            error: "PDF 저장 메타데이터가 불완전하여 수동 복구가 필요합니다",
            code: "report_pdf_manual_repair_required",
          },
          409,
        );
      }
      try {
        const exists = await hasMatchingPrivatePdfArtifact(c.env.MEDIA, {
          orgId,
          workOrderId,
          storageKey: artifact.storage_key,
          artifactId: artifact.id,
          reportVersionId: artifact.report_version_id,
          kind,
          rendererVersion: artifact.renderer_version,
          sourceSha256: artifact.source_sha256,
          contentLength: artifact.size_bytes,
          checksumSha256,
        });
        if (exists) {
          return c.json({
            artifact: reportArtifactResponse(artifact, {
              requestUrl: c.req.url,
              workOrderId,
              version: versionNo,
              reportNumber: artifact.report_number,
            }),
            reused: true,
          });
        }
        recoveringMissingReadyObject = true;
      } catch (error) {
        return c.json(
          reportArtifactErrorResponse(error),
          reportArtifactErrorStatus(error),
        );
      }
    }
    if (artifact.status === "ready" && !recoveringMissingReadyObject) {
      return c.json(
        { error: "준비된 불변 PDF를 다른 파일로 덮어쓸 수 없습니다" },
        409,
      );
    }
    if (!c.req.raw.body) return c.json({ error: "PDF 요청 본문이 비어 있습니다" }, 400);
    if (
      recoveringMissingReadyObject &&
      artifact.size_bytes !== contentLength
    ) {
      return c.json(
        { error: "복구 PDF의 본문 크기가 기존 산출물과 일치하지 않습니다" },
        409,
      );
    }

    const uploadingAt = nowIso();
    const staleBefore = new Date(
      Date.now() - REPORT_ARTIFACT_UPLOAD_LEASE_MS,
    ).toISOString();
    const expectedAttemptCount = artifact.attempt_count;
    const claimedAttemptCount = expectedAttemptCount + 1;
    const uploading = recoveringMissingReadyObject
      ? await c.env.DB
          .prepare(
            `UPDATE report_artifacts
             SET status = 'uploading', attempt_count = attempt_count + 1,
                 last_error_code = NULL, last_error_message = NULL,
                 updated_at = ?
             WHERE id = ? AND org_id = ? AND work_order_id = ?
               AND report_version_id = ? AND kind = ? AND source_sha256 = ?
               AND status = 'ready' AND attempt_count = ?
               AND checksum_sha256 = ? AND storage_key = ?`,
          )
          .bind(
            uploadingAt,
            artifact.id,
            orgId,
            workOrderId,
            artifact.report_version_id,
            kind,
            artifact.source_sha256,
            expectedAttemptCount,
            artifact.checksum_sha256,
            artifact.storage_key,
          )
          .run()
      : await c.env.DB
          .prepare(
            `UPDATE report_artifacts
             SET status = 'uploading', attempt_count = attempt_count + 1,
                 last_error_code = NULL, last_error_message = NULL,
                 updated_at = ?
             WHERE id = ? AND org_id = ? AND work_order_id = ?
               AND report_version_id = ? AND kind = ?
               AND source_sha256 = ? AND attempt_count = ?
               AND (
                 status IN ('pending', 'failed')
                 OR (status = 'uploading' AND updated_at <= ?)
               )`,
          )
          .bind(
            uploadingAt,
            artifact.id,
            orgId,
            workOrderId,
            artifact.report_version_id,
            kind,
            artifact.source_sha256,
            expectedAttemptCount,
            staleBefore,
          )
          .run();
    if (uploading.meta.changes !== 1) {
      return c.json({ error: "PDF 산출물 상태가 변경되었습니다" }, 409);
    }

    let storedResult:
      | Awaited<ReturnType<typeof putPrivatePdfArtifact>>
      | null = null;
    try {
      const stored = await putPrivatePdfArtifact(c.env.MEDIA, {
        artifactId: artifact.id,
        orgId,
        workOrderId,
        reportVersionId: artifact.report_version_id,
        kind,
        rendererVersion: artifact.renderer_version,
        sourceSha256: artifact.source_sha256,
        body: c.req.raw.body,
        contentLength,
        checksumSha256,
        filename: reportArtifactFilename(
          artifact.report_number,
          versionNo,
          kind,
        ),
      });
      const readyAt = nowIso();
      const ready = await c.env.DB
        .prepare(
          `UPDATE report_artifacts
           SET status = 'ready', storage_key = ?, mime_type = ?, size_bytes = ?,
               etag = ?, checksum_sha256 = ?, last_error_code = NULL,
               last_error_message = NULL, updated_at = ?, ready_at = ?
           WHERE id = ? AND source_sha256 = ? AND status = 'uploading'
             AND attempt_count = ?`,
        )
        .bind(
          stored.storageKey,
          stored.mimeType,
          stored.sizeBytes,
          stored.etag,
          stored.checksumSha256,
          readyAt,
          readyAt,
          artifact.id,
          artifact.source_sha256,
          claimedAttemptCount,
        )
        .run();
      if (ready.meta.changes !== 1) {
        return c.json(
          { error: "새 업로드 시도가 시작되어 이전 PDF 결과를 반영하지 않았습니다" },
          409,
        );
      }
      // DB의 ready 전이는 위 CAS로 이미 확정됐다. 이후 재조회가 일시적으로
      // 실패해도 성공한 산출물을 failed로 되돌리거나 5xx로 오인하지 않도록,
      // 방금 확정한 값을 응답용 행에 그대로 반영한다.
      artifact = {
        ...artifact,
        status: "ready",
        storage_key: stored.storageKey,
        mime_type: stored.mimeType,
        size_bytes: stored.sizeBytes,
        etag: stored.etag,
        checksum_sha256: stored.checksumSha256,
        attempt_count: claimedAttemptCount,
        last_error_code: null,
        last_error_message: null,
        updated_at: readyAt,
        ready_at: readyAt,
      };
      storedResult = stored;
    } catch (error) {
      const failedAt = nowIso();
      const message =
        error instanceof Error ? error.message.slice(0, 1_000) : "PDF 저장 실패";
      const code =
        error instanceof ReportArtifactError ? error.code : "storage_unavailable";
      await c.env.DB
        .prepare(
          `UPDATE report_artifacts
           SET status = 'failed', last_error_code = ?, last_error_message = ?,
               updated_at = ?, ready_at = NULL
           WHERE id = ? AND status = 'uploading' AND attempt_count = ?`,
        )
        .bind(code, message, failedAt, artifact.id, claimedAttemptCount)
        .run();
      return c.json(
        reportArtifactErrorResponse(error),
        reportArtifactErrorStatus(error),
      );
    }
    if (!storedResult) {
      return c.json({ error: "PDF 저장 완료 결과를 확인하지 못했습니다" }, 503);
    }
    try {
      await recordAudit(c.env.DB, {
        orgId,
        actorUserId: c.get("userId"),
        event: kind === "approval" ? "report_pdf_ready" : "signed_report_pdf_ready",
        target: artifact.id,
        detail: {
          reportVersionId: artifact.report_version_id,
          sourceSha256: artifact.source_sha256,
          checksumSha256: storedResult.checksumSha256,
          sizeBytes: storedResult.sizeBytes,
          reused: storedResult.reused,
        },
      });
    } catch (error) {
      console.error("report PDF ready audit failed", error);
    }
    return c.json({
      artifact: reportArtifactResponse(artifact, {
        requestUrl: c.req.url,
        workOrderId,
        version: versionNo,
        reportNumber: artifact.report_number,
      }),
      reused: storedResult.reused,
    });
  },
);

workOrderRoutes.post(
  "/work-orders/:id/report-versions/:version/artifacts/:kind/failure",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const workOrderId = c.req.param("id");
    const versionNo = Number(c.req.param("version"));
    const kind = c.req.param("kind");
    if (!Number.isInteger(versionNo) || versionNo < 1) {
      return c.json({ error: "버전이 올바르지 않습니다" }, 400);
    }
    if (kind !== "approval" && kind !== "signed") {
      return c.json({ error: "PDF 산출물 종류가 올바르지 않습니다" }, 400);
    }
    const parsed = reportArtifactFailureSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) return c.json({ error: "실패 정보를 입력해주세요" }, 400);

    const artifact = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind,
    });
    if (!artifact) return c.json({ error: "PDF 산출물을 찾을 수 없습니다" }, 404);
    if (artifact.status === "ready") {
      return c.json({ error: "준비된 불변 PDF를 실패 상태로 바꿀 수 없습니다" }, 409);
    }
    const ts = nowIso();
    const staleBefore = new Date(
      Date.now() - REPORT_ARTIFACT_UPLOAD_LEASE_MS,
    ).toISOString();
    const failedUpdate = await c.env.DB
      .prepare(
        `UPDATE report_artifacts
         SET status = 'failed', attempt_count = attempt_count + 1,
             last_error_code = ?, last_error_message = ?, updated_at = ?,
             ready_at = NULL
         WHERE id = ? AND attempt_count = ?
           AND (
             status IN ('pending', 'failed')
             OR (status = 'uploading' AND updated_at <= ?)
           )`,
      )
      .bind(
        parsed.data.code,
        parsed.data.message,
        ts,
        artifact.id,
        artifact.attempt_count,
        staleBefore,
      )
      .run();
    if (failedUpdate.meta.changes !== 1) {
      return c.json(
        { error: "진행 중인 최신 PDF 업로드는 실패 상태로 바꿀 수 없습니다" },
        409,
      );
    }
    const failed = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind,
    });
    return c.json({
      artifact: reportArtifactResponse(failed!, {
        requestUrl: c.req.url,
        workOrderId,
        version: versionNo,
        reportNumber: artifact.report_number,
      }),
    });
  },
);

workOrderRoutes.get(
  "/work-orders/:id/report-versions/:version/artifacts/:kind/pdf",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const workOrderId = c.req.param("id");
    const versionNo = Number(c.req.param("version"));
    const kind = c.req.param("kind");
    if (!Number.isInteger(versionNo) || versionNo < 1) {
      return c.json({ error: "버전이 올바르지 않습니다" }, 400);
    }
    if (kind !== "approval" && kind !== "signed") {
      return c.json({ error: "PDF 산출물 종류가 올바르지 않습니다" }, 400);
    }
    const artifact = await loadReportVersionArtifact(c.env.DB, {
      orgId,
      workOrderId,
      version: versionNo,
      kind,
    });
    if (
      !artifact ||
      artifact.status !== "ready" ||
      !artifact.storage_key ||
      !artifact.checksum_sha256
    ) {
      return c.json({ error: "PDF가 아직 준비되지 않았습니다" }, 409);
    }
    if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
    try {
      const response = await getPrivatePdfArtifactResponse(c.env.MEDIA, {
        storageKey: artifact.storage_key,
        checksumSha256: artifact.checksum_sha256,
        filename: reportArtifactFilename(
          artifact.report_number,
          versionNo,
          kind,
        ),
        disposition: c.req.query("download") === "1" ? "attachment" : "inline",
      });
      return response ?? c.json({ error: "PDF 원본을 찾을 수 없습니다" }, 404);
    } catch (error) {
      return c.json(
        reportArtifactErrorResponse(error),
        reportArtifactErrorStatus(error),
      );
    }
  },
);

// ---------------------------------------------------------------------------
// POST /work-orders/:id/report-correction
// 승인된 원본 요청/서명은 변경하지 않고, 그 요청에 정정 개시 사유만 추가한다.
// 이후 새 report_version을 확정하고 새 승인 링크를 발급한다.
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/report-correction", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!canTransition("approval", wo.approval_status as any, "revision_requested")) {
    return c.json({ error: "승인완료 상태에서만 정정을 시작할 수 있습니다" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = reportCorrectionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "정정 사유를 입력해주세요" }, 400);

  const approvedRequest = await c.env.DB
    .prepare(
      `SELECT ar.id, ar.report_version_id
       FROM approval_requests ar
       WHERE ar.work_order_id = ?
         AND ar.status = 'approved'
         AND ar.correction_requested_at IS NULL
         AND ar.report_version_id = (
           SELECT id FROM report_versions
           WHERE work_order_id = ?
           ORDER BY version DESC LIMIT 1
         )
       ORDER BY ar.decided_at DESC, ar.rowid DESC
       LIMIT 1`,
    )
    .bind(id, id)
    .first<{ id: string; report_version_id: string }>();
  if (!approvedRequest) {
    return c.json({ error: "정정할 최신 승인본을 찾을 수 없습니다" }, 409);
  }

  const ts = nowIso();
  const transition = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `UPDATE approval_requests
         SET revision_comment = ?, correction_requested_at = ?, correction_requested_by = ?
         WHERE id = ? AND work_order_id = ? AND report_version_id = ?
           AND status = 'approved' AND correction_requested_at IS NULL
           AND EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND approval_status = 'approved'
           )`,
      )
      .bind(
        parsed.data.comment,
        ts,
        userId,
        approvedRequest.id,
        id,
        approvedRequest.report_version_id,
        id,
        orgId,
      ),
    c.env.DB
      .prepare(
        `UPDATE work_orders
         SET approval_status = 'revision_requested', updated_at = ?
         WHERE id = ? AND org_id = ? AND approval_status = 'approved'
           AND EXISTS (
             SELECT 1 FROM approval_requests
             WHERE id = ? AND work_order_id = work_orders.id
               AND status = 'approved'
               AND correction_requested_at = ?
               AND correction_requested_by = ?
           )`,
      )
      .bind(ts, id, orgId, approvedRequest.id, ts, userId),
  ]);

  if (transition[0]?.meta.changes !== 1 || transition[1]?.meta.changes !== 1) {
    return c.json({ error: "승인 상태가 변경되어 정정을 시작하지 못했습니다" }, 409);
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: userId,
    event: "report_correction_requested",
    target: id,
    detail: {
      approvalRequestId: approvedRequest.id,
      reportVersionId: approvedRequest.report_version_id,
      comment: parsed.data.comment,
    },
  });

  return c.json({
    ok: true,
    approvalStatus: "revision_requested",
    reportVersionId: approvedRequest.report_version_id,
    correctionRequestedAt: ts,
  });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/approval-links
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/approval-links", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parsedBody = approvalLinkCreateSchema.safeParse(body);
  if (!parsedBody.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { invalidatePrevious } = parsedBody.data;
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const latestVersion = await c.env.DB.prepare(
    "SELECT id, version FROM report_versions WHERE work_order_id = ? ORDER BY version DESC LIMIT 1",
  )
    .bind(id)
    .first<{ id: string; version: number }>();
  if (!latestVersion) return c.json({ error: "확정된 리포트가 없습니다" }, 400);
  const approvalArtifact = await loadReportVersionArtifact(c.env.DB, {
    orgId,
    workOrderId: id,
    version: latestVersion.version,
    kind: "approval",
  });
  if (!approvalArtifact || approvalArtifact.status !== "ready") {
    return c.json(
      {
        error: "고객에게 보낼 PDF가 아직 준비되지 않았습니다",
        code: "report_pdf_not_ready",
        artifactStatus: approvalArtifact?.status ?? "missing",
      },
      409,
    );
  }
  const approvalArtifactRecoveryUrl = reportArtifactResponse(approvalArtifact, {
    requestUrl: c.req.url,
    workOrderId: id,
    version: latestVersion.version,
    reportNumber: approvalArtifact.report_number,
  }).uploadUrl;
  if (
    !approvalArtifact.storage_key ||
    approvalArtifact.size_bytes === null ||
    approvalArtifact.mime_type !== REPORT_PDF_MIME_TYPE ||
    !approvalArtifact.checksum_sha256
  ) {
    return c.json(
      {
        error: "고객 승인용 PDF 저장 메타데이터가 불완전하여 수동 복구가 필요합니다",
        code: "report_pdf_manual_repair_required",
        artifactStatus: "metadata_missing",
      },
      409,
    );
  }
  if (!c.env.MEDIA) {
    return c.json(
      {
        error: "PDF 저장소를 확인할 수 없습니다",
        code: "report_pdf_storage_unavailable",
      },
      503,
    );
  }
  try {
    const exists = await hasMatchingPrivatePdfArtifact(c.env.MEDIA, {
      orgId,
      workOrderId: id,
      storageKey: approvalArtifact.storage_key,
      artifactId: approvalArtifact.id,
      reportVersionId: approvalArtifact.report_version_id,
      kind: "approval",
      rendererVersion: approvalArtifact.renderer_version,
      sourceSha256: approvalArtifact.source_sha256,
      contentLength: approvalArtifact.size_bytes,
      checksumSha256: approvalArtifact.checksum_sha256,
    });
    if (!exists) {
      return c.json(
        {
          error: "고객 승인용 PDF 원본이 없어 같은 파일을 다시 업로드해야 합니다",
          code: "report_pdf_recovery_required",
          artifactStatus: "missing_object",
          recoveryUrl: approvalArtifactRecoveryUrl,
        },
        409,
      );
    }
  } catch (error) {
    if (error instanceof ReportArtifactError) {
      return c.json(
        {
          error: "고객 승인용 PDF 무결성을 확인하지 못해 링크를 발급할 수 없습니다",
          code: "report_pdf_manual_repair_required",
          artifactStatus: error.code,
        },
        409,
      );
    }
    return c.json(
      {
        error: "PDF 저장소 확인에 실패했습니다",
        code: "report_pdf_storage_unavailable",
      },
      503,
    );
  }

  if (wo.approval_status !== "pending" && !canTransition("approval", wo.approval_status as any, "pending")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 발송할 수 없습니다` }, 409);
  }

  const activeRequest = await c.env.DB
    .prepare(
      `SELECT id, report_version_id, status
       FROM approval_requests
       WHERE work_order_id = ? AND status IN ('pending', 'revision_requested')
       ORDER BY sent_at DESC, rowid DESC LIMIT 1`,
    )
    .bind(id)
    .first<{ id: string; report_version_id: string; status: string }>();
  if (
    activeRequest?.status === "revision_requested" &&
    activeRequest.report_version_id === latestVersion.id
  ) {
    return c.json(
      { error: "수정 리포트를 새 버전으로 확정한 뒤 승인 링크를 생성해주세요" },
      409,
    );
  }

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const requestId = newId();
  const ts = nowIso();
  const expiresAt = addDaysIso(APPROVAL_LINK_TTL_DAYS);

  const insertRequest = activeRequest
    ? c.env.DB
        .prepare(
          `INSERT INTO approval_requests (id, work_order_id, report_version_id, token_hash, expires_at, sent_at, viewed_at, decided_at, status)
           SELECT ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending'
           WHERE EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND approval_status = ?
           )
             AND EXISTS (
               SELECT 1 FROM approval_requests
               WHERE id = ? AND work_order_id = ? AND status = ?
             )`,
        )
        .bind(
          requestId,
          id,
          latestVersion.id,
          tokenHash,
          expiresAt,
          ts,
          id,
          orgId,
          wo.approval_status,
          activeRequest.id,
          id,
          activeRequest.status,
        )
    : c.env.DB
        .prepare(
          `INSERT INTO approval_requests (id, work_order_id, report_version_id, token_hash, expires_at, sent_at, viewed_at, decided_at, status)
           SELECT ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending'
           WHERE EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND approval_status = ?
           )
             AND NOT EXISTS (
               SELECT 1 FROM approval_requests
               WHERE work_order_id = ? AND status IN ('pending', 'revision_requested')
             )`,
        )
        .bind(
          requestId,
          id,
          latestVersion.id,
          tokenHash,
          expiresAt,
          ts,
          id,
          orgId,
          wo.approval_status,
          id,
        );

  const workOrderTransition = c.env.DB
    .prepare(
      `UPDATE work_orders SET approval_status = 'pending', updated_at = ?
       WHERE id = ? AND org_id = ? AND approval_status = ?
         AND EXISTS (
           SELECT 1 FROM approval_requests
           WHERE id = ? AND work_order_id = work_orders.id AND status = 'pending'
         )`,
    )
    .bind(ts, id, orgId, wo.approval_status, requestId);
  const transition = invalidatePrevious
    ? await c.env.DB.batch([
        insertRequest,
        // 기본값은 안전한 재발급이다. 새 요청 삽입 성공 시에만 이전 링크를 무효화한다.
        c.env.DB
          .prepare(
            `UPDATE approval_requests SET status = 'superseded'
             WHERE work_order_id = ? AND id <> ?
               AND status IN ('pending', 'revision_requested')
               AND EXISTS (
                 SELECT 1 FROM approval_requests
                 WHERE id = ? AND work_order_id = ? AND status = 'pending'
               )`,
          )
          .bind(id, requestId, requestId, id),
        workOrderTransition,
      ])
    : await c.env.DB.batch([insertRequest, workOrderTransition]);
  const workOrderTransitionIndex = invalidatePrevious ? 2 : 1;

  if (
    transition[0]?.meta.changes !== 1 ||
    transition[workOrderTransitionIndex]?.meta.changes !== 1
  ) {
    return c.json({ error: "승인 상태가 변경되어 링크를 발급하지 못했습니다" }, 409);
  }
  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "approval_link_created",
    target: id,
    detail: { invalidatePrevious },
  });

  const origin = c.env.APP_ORIGIN ?? "https://field.toris.kr";
  return c.json({ url: `${origin}/approval?token=${token}`, token, expiresAt });
});
