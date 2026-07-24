import { Hono } from "hono";
import {
  APPROVAL_CONSENT_VERSION,
  approveSchema,
  revisionRequestSchema,
  canTransition,
} from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, parseJson, recordAudit, notify } from "../db.js";
import { sha256Hex } from "../auth.js";
import {
  decodeMediaDataUrl,
  getPrivateMediaResponse,
} from "../media.js";
import {
  REPORT_PDF_RENDERER_VERSION,
  ReportArtifactError,
  computeSignedReportSourceSha256,
  getPrivatePdfArtifactResponse,
  type ReportArtifactRow,
} from "../report-artifacts.js";

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.use("*", async (c, next) => {
  c.header("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  c.header("Pragma", "no-cache");
  c.header("Expires", "0");
  c.header("X-Content-Type-Options", "nosniff");
  await next();
});

const INVALIDATED_APPROVAL_REQUEST_STATUSES = new Set(["expired", "superseded"]);
const REPORT_CONTEXT_KEY = "__context";

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

type PublicReportContext = Omit<ReportContextSnapshot, "org"> & {
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
    url: contentUrl(photo.id),
    caption: photo.caption,
    createdAt: photo.createdAt,
  }));
}

function publicMediaUrl(
  requestUrl: string,
  token: string,
  mediaId: string,
): string {
  return `${new URL(requestUrl).origin}/public/approvals/${encodeURIComponent(token)}/media/${encodeURIComponent(mediaId)}`;
}

function publicLogoUrl(
  requestUrl: string,
  token: string,
  logoId: string,
): string {
  return `${new URL(requestUrl).origin}/public/approvals/${encodeURIComponent(token)}/logo/${encodeURIComponent(logoId)}`;
}

function publicReportContext(
  context: ReportContextSnapshot,
  requestUrl: string,
  token: string,
): PublicReportContext {
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
            url: publicLogoUrl(requestUrl, token, logo.id),
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
  kind: "approval" | "signed",
): string {
  return `${reportNumber}-v${version}${kind === "signed" ? "-signed" : ""}.pdf`;
}

function publicArtifactResponse(
  artifact: ReportArtifactRow,
  args: {
    requestUrl: string;
    token: string;
    reportNumber: string;
    version: number;
  },
) {
  const tokenBase = `${new URL(args.requestUrl).origin}/public/approvals/${encodeURIComponent(args.token)}`;
  const pdfPath =
    artifact.kind === "signed" ? `${tokenBase}/signed-pdf` : `${tokenBase}/pdf`;
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
    readyAt: artifact.ready_at,
    uploadUrl: null,
    failureUrl: null,
    pdfUrl: artifact.status === "ready" ? pdfPath : null,
    filename: reportArtifactFilename(
      args.reportNumber,
      args.version,
      artifact.kind,
    ),
  };
}

async function loadPublicArtifact(
  db: D1Database,
  args: {
    approvalRequestId: string;
    workOrderId: string;
    reportVersionId: string;
    kind: "approval" | "signed";
  },
): Promise<
  | (ReportArtifactRow & { report_number: string; version: number })
  | null
> {
  const approvalConstraint =
    args.kind === "signed"
      ? "AND ra.approval_request_id = ?"
      : "AND ra.approval_request_id IS NULL";
  const bindings =
    args.kind === "signed"
      ? [
          args.workOrderId,
          args.reportVersionId,
          args.kind,
          args.approvalRequestId,
        ]
      : [args.workOrderId, args.reportVersionId, args.kind];
  return db
    .prepare(
      `SELECT ra.id, ra.org_id, ra.work_order_id, ra.report_version_id,
              ra.approval_request_id, ra.base_artifact_id, ra.kind, ra.status,
              ra.renderer_version, ra.source_sha256, ra.storage_key, ra.mime_type,
              ra.size_bytes, ra.etag, ra.checksum_sha256, ra.attempt_count,
              ra.last_error_code, ra.last_error_message, ra.created_by,
              ra.created_at, ra.updated_at, ra.ready_at,
              rv.report_number, rv.version
       FROM report_artifacts ra
       JOIN report_versions rv ON rv.id = ra.report_version_id
       WHERE ra.work_order_id = ? AND ra.report_version_id = ? AND ra.kind = ?
         ${approvalConstraint}`,
    )
    .bind(...bindings)
    .first<ReportArtifactRow & { report_number: string; version: number }>();
}

function artifactErrorResponse(error: unknown) {
  return error instanceof ReportArtifactError
    ? { error: error.message, code: error.code }
    : { error: "서명 PDF를 저장하지 못했습니다" };
}

function artifactErrorStatus(error: unknown): 400 | 409 | 503 {
  if (!(error instanceof ReportArtifactError)) return 503;
  return error.code === "immutable_conflict" ? 409 : 400;
}

function legacyPhotoResponse(dataUrl: string): Response | null {
  try {
    const media = decodeMediaDataUrl(dataUrl, "photo");
    return new Response(media.bytes.slice().buffer, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(media.bytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return null;
  }
}

type ApprovalRequestRow = {
  id: string;
  work_order_id: string;
  report_version_id: string;
  expires_at: string;
  sent_at: string;
  viewed_at: string | null;
  decided_at: string | null;
  status: string;
};

async function loadApprovalByToken(db: D1Database, token: string): Promise<ApprovalRequestRow | null> {
  const tokenHash = await sha256Hex(token);
  return db
    .prepare(
      "SELECT id, work_order_id, report_version_id, expires_at, sent_at, viewed_at, decided_at, status FROM approval_requests WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<ApprovalRequestRow>();
}

async function isApprovalRequestInvalidated(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const current = await db
    .prepare("SELECT status, expires_at FROM approval_requests WHERE id = ?")
    .bind(id)
    .first<{ status: string; expires_at: string }>();
  return (
    !current ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(current.status) ||
    new Date(current.expires_at).getTime() < Date.now()
  );
}

publicRoutes.get("/public/approvals/:token/media/:mediaId", async (c) => {
  const token = c.req.param("token");
  const mediaId = c.req.param("mediaId");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }

  const version = await c.env.DB.prepare(
    `SELECT photos_json
     FROM report_versions
     WHERE id = ? AND work_order_id = ?`,
  )
    .bind(ar.report_version_id, ar.work_order_id)
    .first<{ photos_json: string }>();
  if (!version) return c.json({ error: "보고서 버전을 찾을 수 없습니다" }, 404);

  const photo = parseJson<SnapshotPhoto[]>(version.photos_json, []).find(
    (item) => item.id === mediaId,
  );
  if (!photo) return c.json({ error: "보고서 사진을 찾을 수 없습니다" }, 404);

  // 구 스냅샷의 inline 사진은 이 응답에서만 해석하며 JSON 본문에는 다시 싣지 않는다.
  if (photo.url) {
    return (
      legacyPhotoResponse(photo.url) ??
      c.json({ error: "기존 보고서 사진이 올바르지 않습니다" }, 500)
    );
  }

  if (photo.storageKey) {
    if (!photo.mimeType || !photo.checksumSha256) {
      return c.json({ error: "보고서 사진 메타데이터가 올바르지 않습니다" }, 500);
    }
    if (!c.env.MEDIA) {
      return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
    }
    const response = await getPrivateMediaResponse(c.env.MEDIA, {
      storageKey: photo.storageKey,
      mimeType: photo.mimeType,
      checksumSha256: photo.checksumSha256,
    });
    return response ?? c.json({ error: "보고서 사진 원본을 찾을 수 없습니다" }, 404);
  }

  // 신규 D1 폴백 스냅샷은 원문 대신 photo id만 저장한다.
  const legacyPhoto = await c.env.DB.prepare(
    "SELECT data_url FROM photos WHERE id = ? AND work_order_id = ?",
  )
    .bind(photo.id, ar.work_order_id)
    .first<{ data_url: string }>();
  if (!legacyPhoto) {
    return c.json({ error: "보고서 사진 원본을 찾을 수 없습니다" }, 404);
  }
  return (
    legacyPhotoResponse(legacyPhoto.data_url) ??
    c.json({ error: "기존 보고서 사진이 올바르지 않습니다" }, 500)
  );
});

publicRoutes.get("/public/approvals/:token/logo/:logoId", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }

  const version = await c.env.DB
    .prepare(
      `SELECT structured_json
       FROM report_versions
       WHERE id = ? AND work_order_id = ?`,
    )
    .bind(ar.report_version_id, ar.work_order_id)
    .first<{ structured_json: string }>();
  if (!version) return c.json({ error: "보고서 버전을 찾을 수 없습니다" }, 404);

  const stored = parseJson<Record<string, unknown>>(version.structured_json, {});
  const context = stored[REPORT_CONTEXT_KEY] as ReportContextSnapshot | undefined;
  const logo = context?.org.logo ?? null;
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
});

publicRoutes.get("/public/approvals/:token", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);

  const wo = await c.env.DB.prepare(
    "SELECT id, org_id, approval_status, scheduled_date, scheduled_time, work_type, request FROM work_orders WHERE id = ?",
  )
    .bind(ar.work_order_id)
    .first<{
      id: string;
      org_id: string;
      approval_status: string;
      scheduled_date: string;
      scheduled_time: string | null;
      work_type: string;
      request: string | null;
    }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const isTimeExpired = new Date(ar.expires_at).getTime() < Date.now();
  const isInvalidated = INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status);
  if (isTimeExpired || isInvalidated) {
    // TTL은 아직 결정되지 않은 요청에만 상태 전이로 반영한다.
    // 승인/수정요청처럼 이미 결정된 요청은 링크 접근만 막고 증빙 상태는 보존한다.
    if (isTimeExpired && ar.status === "pending") {
      const ts = nowIso();
      await c.env.DB.batch([
        c.env.DB.prepare(
          "UPDATE approval_requests SET status = 'expired' WHERE id = ? AND status = 'pending'",
        ).bind(ar.id),
        c.env.DB
          .prepare(
            `UPDATE work_orders SET approval_status = 'expired', updated_at = ?
             WHERE id = ? AND approval_status = 'pending'
               AND NOT EXISTS (
                 SELECT 1 FROM approval_requests
                 WHERE work_order_id = ? AND status = 'pending'
               )`,
          )
          .bind(ts, wo.id, wo.id),
      ]);
    }
    return c.json({ error: "expired", approval: "expired" }, 410);
  }

  const org = await c.env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(wo.org_id).first<{ name: string }>();
  const ctx = await c.env.DB.prepare(
    `SELECT c.id AS customer_id, c.name AS customer_name, c.address AS customer_address,
            s.id AS site_id, s.name AS site_name, s.address AS site_address,
            a.id AS asset_id, a.name AS asset_name, a.model AS asset_model, a.serial_no AS asset_serial
     FROM work_orders w
     JOIN customers c ON c.id = w.customer_id AND c.org_id = w.org_id
     JOIN sites s ON s.id = w.site_id AND s.org_id = w.org_id AND s.customer_id = c.id
     LEFT JOIN assets a ON a.id = w.asset_id AND a.org_id = w.org_id AND a.site_id = s.id
     WHERE w.id = ? AND w.org_id = ?`,
  )
    .bind(wo.id, wo.org_id)
    .first<{
      customer_id: string;
      customer_name: string;
      customer_address: string | null;
      site_id: string;
      site_name: string;
      site_address: string | null;
      asset_id: string | null;
      asset_name: string | null;
      asset_model: string | null;
      asset_serial: string | null;
    }>();
  const version = await c.env.DB.prepare(
    `SELECT id, work_order_id, version, report_number, structured_json, photos_json,
            template_version, created_at, created_by
     FROM report_versions
     WHERE id = ? AND work_order_id = ?`,
  )
    .bind(ar.report_version_id, ar.work_order_id)
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
    }>();

  let viewedAt = ar.viewed_at;
  if (!viewedAt) {
    viewedAt = nowIso();
    await c.env.DB.prepare("UPDATE approval_requests SET viewed_at = ? WHERE id = ?").bind(viewedAt, ar.id).run();
  }

  const storedStructured = version
    ? parseJson<Record<string, unknown>>(version.structured_json, {})
    : {};
  const contextSnapshot = storedStructured[REPORT_CONTEXT_KEY] as
    | ReportContextSnapshot
    | undefined;
  const { [REPORT_CONTEXT_KEY]: _context, ...structured } = storedStructured;
  const liveAssignees = await c.env.DB.prepare(
    `SELECT u.name
     FROM assignments a JOIN users u ON u.id = a.user_id
     WHERE a.work_order_id = ? ORDER BY u.name ASC`,
  )
    .bind(wo.id)
    .all<{ name: string }>();
  const fallbackContext: ReportContextSnapshot = {
    org: {
      name: org?.name ?? "",
      businessNo: null,
      address: null,
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      logo: null,
    },
    workOrder: {
      id: wo.id,
      scheduledDate: wo.scheduled_date,
      scheduledTime: wo.scheduled_time,
      workType: wo.work_type,
      request: wo.request,
    },
    customer: {
      id: ctx?.customer_id ?? "",
      name: ctx?.customer_name ?? "",
      businessNo: null,
      address: ctx?.customer_address ?? null,
      contactName: null,
      contactPhone: null,
    },
    site: {
      id: ctx?.site_id ?? "",
      name: ctx?.site_name ?? "",
      address: ctx?.site_address ?? null,
    },
    asset: ctx?.asset_id
      ? {
          id: ctx.asset_id,
          name: ctx.asset_name ?? "",
          model: ctx.asset_model,
          serialNo: ctx.asset_serial,
        }
      : null,
    assigneeNames: (liveAssignees.results ?? []).map((row) => row.name),
  };
  const context: ReportContextSnapshot = contextSnapshot
    ? {
        ...contextSnapshot,
        assigneeNames:
          contextSnapshot.assigneeNames ?? fallbackContext.assigneeNames,
      }
    : fallbackContext;
  const responseContext = publicReportContext(context, c.req.url, token);
  const photos = version
    ? snapshotPhotoResponses(
        parseJson<SnapshotPhoto[]>(version.photos_json, []),
        (mediaId) => publicMediaUrl(c.req.url, token, mediaId),
      )
    : [];
  const approvalArtifact = version
    ? await loadPublicArtifact(c.env.DB, {
        approvalRequestId: ar.id,
        workOrderId: ar.work_order_id,
        reportVersionId: ar.report_version_id,
        kind: "approval",
      })
    : null;
  const signedArtifact =
    version && ar.status === "approved"
      ? await loadPublicArtifact(c.env.DB, {
          approvalRequestId: ar.id,
          workOrderId: ar.work_order_id,
          reportVersionId: ar.report_version_id,
          kind: "signed",
        })
      : null;

  return c.json({
    org: responseContext.org,
    reportVersion: version
      ? {
          id: version.id,
          workOrderId: version.work_order_id,
          version: version.version,
          reportNumber: version.report_number,
          structured,
          context: responseContext,
          photos,
          templateVersion: version.template_version,
          createdAt: version.created_at,
          createdBy: version.created_by,
          workOrder: responseContext.workOrder,
          customer: responseContext.customer,
          site: responseContext.site,
          asset: responseContext.asset,
          assigneeNames: responseContext.assigneeNames,
          artifact: approvalArtifact
            ? publicArtifactResponse(approvalArtifact, {
                requestUrl: c.req.url,
                token,
                reportNumber: version.report_number,
                version: version.version,
              })
            : null,
        }
      : null,
    approvalStatus: wo.approval_status,
    approvalRequestStatus: ar.status,
    viewedAt,
    signedArtifact: signedArtifact
      ? publicArtifactResponse(signedArtifact, {
          requestUrl: c.req.url,
          token,
          reportNumber: version!.report_number,
          version: version!.version,
        })
      : null,
  });
});

publicRoutes.get("/public/approvals/:token/pdf", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }
  const artifact = await loadPublicArtifact(c.env.DB, {
    approvalRequestId: ar.id,
    workOrderId: ar.work_order_id,
    reportVersionId: ar.report_version_id,
    kind: "approval",
  });
  if (
    !artifact ||
    artifact.status !== "ready" ||
    !artifact.storage_key ||
    !artifact.checksum_sha256
  ) {
    return c.json({ error: "승인 PDF가 아직 준비되지 않았습니다" }, 409);
  }
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
  try {
    const response = await getPrivatePdfArtifactResponse(c.env.MEDIA, {
      storageKey: artifact.storage_key,
      checksumSha256: artifact.checksum_sha256,
      filename: reportArtifactFilename(
        artifact.report_number,
        artifact.version,
        "approval",
      ),
      disposition: c.req.query("download") === "1" ? "attachment" : "inline",
    });
    return response ?? c.json({ error: "승인 PDF 원본을 찾을 수 없습니다" }, 404);
  } catch (error) {
    return c.json(artifactErrorResponse(error), artifactErrorStatus(error));
  }
});

publicRoutes.get("/public/approvals/:token/signed-pdf", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }
  if (ar.status !== "approved") {
    return c.json({ error: "승인 후 서명 PDF를 확인할 수 있습니다" }, 409);
  }
  const artifact = await loadPublicArtifact(c.env.DB, {
    approvalRequestId: ar.id,
    workOrderId: ar.work_order_id,
    reportVersionId: ar.report_version_id,
    kind: "signed",
  });
  if (
    !artifact ||
    artifact.status !== "ready" ||
    !artifact.storage_key ||
    !artifact.checksum_sha256
  ) {
    return c.json({ error: "서명 PDF가 아직 준비되지 않았습니다" }, 409);
  }
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);
  try {
    const response = await getPrivatePdfArtifactResponse(c.env.MEDIA, {
      storageKey: artifact.storage_key,
      checksumSha256: artifact.checksum_sha256,
      filename: reportArtifactFilename(
        artifact.report_number,
        artifact.version,
        "signed",
      ),
      disposition: c.req.query("download") === "1" ? "attachment" : "inline",
    });
    return response ?? c.json({ error: "서명 PDF 원본을 찾을 수 없습니다" }, 404);
  } catch (error) {
    return c.json(artifactErrorResponse(error), artifactErrorStatus(error));
  }
});

publicRoutes.put("/public/approvals/:token/signed-pdf", (c) => {
  c.header("Allow", "GET");
  return c.json(
    {
      error:
        "공개 승인 링크에서는 서명 PDF를 변경할 수 없습니다. 사무실에서 승인 증빙으로 생성해주세요",
    },
    405,
  );
});

publicRoutes.post("/public/approvals/:token/signed-pdf/failure", (c) => {
  return c.json(
    {
      error:
        "공개 승인 링크에서는 서명 PDF 상태를 변경할 수 없습니다. 사무실에서 복구해주세요",
    },
    403,
  );
});

publicRoutes.post("/public/approvals/:token/approve", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }
  if (ar.status !== "pending") {
    return c.json({ error: "이미 처리된 승인 요청입니다" }, 409);
  }

  const wo = await c.env.DB.prepare("SELECT id, org_id, approval_status, billing_status FROM work_orders WHERE id = ?")
    .bind(ar.work_order_id)
    .first<{ id: string; org_id: string; approval_status: string; billing_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("approval", wo.approval_status as any, "approved")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 승인할 수 없습니다` }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const ts = nowIso();
  const signatureId = newId();
  const transition = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO signatures (
           id, approval_request_id, name, title, signature_data_url, approved_at,
           agreed, consented_at, consent_version
         )
         SELECT ?, ar.id, ?, ?, ?, ?, 1, ?, ?
         FROM approval_requests ar
         JOIN work_orders w ON w.id = ar.work_order_id
         WHERE ar.id = ? AND ar.work_order_id = ? AND ar.report_version_id = ?
           AND ar.status = 'pending' AND ar.expires_at >= ?
           AND w.org_id = ? AND w.approval_status = 'pending'`,
      )
      .bind(
        signatureId,
        d.name,
        d.title ?? null,
        d.signatureDataUrl,
        ts,
        ts,
        APPROVAL_CONSENT_VERSION,
        ar.id,
        wo.id,
        ar.report_version_id,
        ts,
        wo.org_id,
      ),
    c.env.DB
      .prepare(
        `UPDATE approval_requests SET status = 'approved', decided_at = ?
         WHERE id = ? AND status = 'pending' AND expires_at >= ?
           AND EXISTS (
             SELECT 1 FROM signatures
             WHERE id = ? AND approval_request_id = approval_requests.id
           )`,
      )
      .bind(ts, ar.id, ts, signatureId),
    c.env.DB
      .prepare(
        `UPDATE approval_requests SET status = 'superseded'
         WHERE work_order_id = ? AND id <> ?
           AND status IN ('pending', 'revision_requested')
           AND EXISTS (
             SELECT 1
             FROM approval_requests decided
             JOIN signatures sig ON sig.approval_request_id = decided.id
             WHERE decided.id = ? AND decided.status = 'approved' AND sig.id = ?
           )`,
      )
      .bind(wo.id, ar.id, ar.id, signatureId),
    c.env.DB
      .prepare(
        `UPDATE report_versions SET locked_at = ?
         WHERE id = ? AND EXISTS (
           SELECT 1
           FROM approval_requests ar
           JOIN signatures sig ON sig.approval_request_id = ar.id
           WHERE ar.id = ? AND ar.status = 'approved' AND sig.id = ?
         )`,
      )
      .bind(ts, ar.report_version_id, ar.id, signatureId),
    c.env.DB
      .prepare(
        `UPDATE work_orders
         SET approval_status = 'approved',
             billing_status = CASE WHEN billing_status = 'none' THEN 'billable' ELSE billing_status END,
             updated_at = ?
         WHERE id = ? AND org_id = ? AND approval_status = 'pending'
           AND EXISTS (
             SELECT 1
             FROM approval_requests ar
             JOIN signatures sig ON sig.approval_request_id = ar.id
             WHERE ar.id = ? AND ar.work_order_id = work_orders.id
               AND ar.status = 'approved' AND sig.id = ?
           )`,
      )
      .bind(ts, wo.id, wo.org_id, ar.id, signatureId),
    c.env.DB
      .prepare(
        `INSERT INTO billing_records (
           id, work_order_id, amount, billed_at, due_at, paid_at, memo, updated_at
         )
         SELECT ?, ?, NULL, NULL, NULL, NULL, NULL, ?
         WHERE EXISTS (
           SELECT 1
           FROM work_orders w
           JOIN approval_requests ar ON ar.work_order_id = w.id
           JOIN signatures sig ON sig.approval_request_id = ar.id
           WHERE w.id = ? AND w.org_id = ? AND w.approval_status = 'approved'
             AND ar.id = ? AND ar.status = 'approved' AND sig.id = ?
         )
           AND NOT EXISTS (
             SELECT 1 FROM billing_records WHERE work_order_id = ?
           )`,
      )
      .bind(newId(), wo.id, ts, wo.id, wo.org_id, ar.id, signatureId, wo.id),
  ]);

  if (
    transition[0]?.meta.changes !== 1 ||
    transition[1]?.meta.changes !== 1 ||
    transition[4]?.meta.changes !== 1
  ) {
    if (await isApprovalRequestInvalidated(c.env.DB, ar.id)) {
      return c.json({ error: "expired" }, 410);
    }
    return c.json({ error: "승인 상태가 변경되었습니다" }, 409);
  }

  let signedArtifact: ReturnType<typeof publicArtifactResponse> | null = null;
  try {
    const baseArtifact = await loadPublicArtifact(c.env.DB, {
      approvalRequestId: ar.id,
      workOrderId: ar.work_order_id,
      reportVersionId: ar.report_version_id,
      kind: "approval",
    });
    if (
      baseArtifact?.status === "ready" &&
      baseArtifact.checksum_sha256
    ) {
      const signatureSha256 = await sha256Hex(d.signatureDataUrl);
      const sourceSha256 = await computeSignedReportSourceSha256({
        reportVersionId: ar.report_version_id,
        approvalRequestId: ar.id,
        basePdfChecksumSha256: baseArtifact.checksum_sha256,
        signerName: d.name,
        signerTitle: d.title ?? null,
        signatureSha256,
        approvedAt: ts,
        agreementVersion: APPROVAL_CONSENT_VERSION,
      });
      const signedArtifactId = newId();
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
                   NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, ?, ?, NULL)`,
        )
        .bind(
          signedArtifactId,
          wo.org_id,
          wo.id,
          ar.report_version_id,
          ar.id,
          baseArtifact.id,
          REPORT_PDF_RENDERER_VERSION,
          sourceSha256,
          ts,
          ts,
        )
        .run();
      const pendingSigned = await loadPublicArtifact(c.env.DB, {
        approvalRequestId: ar.id,
        workOrderId: ar.work_order_id,
        reportVersionId: ar.report_version_id,
        kind: "signed",
      });
      if (
        pendingSigned &&
        pendingSigned.source_sha256 === sourceSha256 &&
        pendingSigned.base_artifact_id === baseArtifact.id
      ) {
        signedArtifact = publicArtifactResponse(pendingSigned, {
          requestUrl: c.req.url,
          token,
          reportNumber: pendingSigned.report_number,
          version: pendingSigned.version,
        });
      }
    }
  } catch {
    // 고객 승인 자체는 성공한 상태다. 사무실의 signed/prepare 경로가
    // 동일한 서버 증빙으로 서명 PDF를 재생성한다.
  }

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(wo.org_id)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId: wo.org_id, userId: m.user_id, type: "approved", workOrderId: wo.id, message: "고객 승인이 완료되었습니다" });
  }

  await recordAudit(c.env.DB, { orgId: wo.org_id, actorUserId: null, event: "approved", target: wo.id });

  return c.json({
    ok: true,
    approvedAt: ts,
    signedArtifact,
    signedPdfRecoveryRequired: signedArtifact?.status !== "ready",
  });
});

publicRoutes.post("/public/approvals/:token/revision", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (
    new Date(ar.expires_at).getTime() < Date.now() ||
    INVALIDATED_APPROVAL_REQUEST_STATUSES.has(ar.status)
  ) {
    return c.json({ error: "expired" }, 410);
  }
  if (ar.status !== "pending") {
    return c.json({ error: "이미 처리된 승인 요청입니다" }, 409);
  }

  const wo = await c.env.DB.prepare("SELECT id, org_id, approval_status FROM work_orders WHERE id = ?")
    .bind(ar.work_order_id)
    .first<{ id: string; org_id: string; approval_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("approval", wo.approval_status as any, "revision_requested")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 수정 요청할 수 없습니다` }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = revisionRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const ts = nowIso();
  const transition = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `UPDATE approval_requests
         SET status = 'revision_requested', decided_at = ?, revision_comment = ?
         WHERE id = ? AND status = 'pending' AND expires_at >= ?
           AND EXISTS (
             SELECT 1 FROM work_orders
             WHERE id = ? AND org_id = ? AND approval_status = 'pending'
           )`,
      )
      .bind(ts, parsed.data.comment, ar.id, ts, wo.id, wo.org_id),
    c.env.DB
      .prepare(
        `UPDATE approval_requests SET status = 'superseded'
         WHERE work_order_id = ? AND id <> ?
           AND status IN ('pending', 'revision_requested')
           AND EXISTS (
             SELECT 1 FROM approval_requests decided
             WHERE decided.id = ? AND decided.status = 'revision_requested'
               AND decided.revision_comment = ?
           )`,
      )
      .bind(wo.id, ar.id, ar.id, parsed.data.comment),
    c.env.DB
      .prepare(
        `UPDATE work_orders SET approval_status = 'revision_requested', updated_at = ?
         WHERE id = ? AND org_id = ? AND approval_status = 'pending'
           AND EXISTS (
             SELECT 1 FROM approval_requests
             WHERE id = ? AND work_order_id = work_orders.id
               AND status = 'revision_requested' AND decided_at = ?
           )`,
      )
      .bind(ts, wo.id, wo.org_id, ar.id, ts),
  ]);

  if (
    transition[0]?.meta.changes !== 1 ||
    transition[2]?.meta.changes !== 1
  ) {
    if (await isApprovalRequestInvalidated(c.env.DB, ar.id)) {
      return c.json({ error: "expired" }, 410);
    }
    return c.json({ error: "승인 상태가 변경되었습니다" }, 409);
  }

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(wo.org_id)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId: wo.org_id, userId: m.user_id, type: "revision_requested", workOrderId: wo.id, message: `수정 요청: ${parsed.data.comment}` });
  }

  await recordAudit(c.env.DB, { orgId: wo.org_id, actorUserId: null, event: "revision_requested", target: wo.id, detail: { comment: parsed.data.comment } });

  return c.json({ ok: true });
});
