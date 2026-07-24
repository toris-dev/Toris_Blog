import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createImmutableReportPdfKey } from "../report-artifacts.js";
import { createTestDb } from "./d1-shim.js";
import {
  hasParseableMinimalPdfStructure,
  minimalParseablePdf,
} from "./pdf-fixture.js";
import { MemoryR2 } from "./r2-shim.js";

const SIGNATURE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlL8AAAAASUVORK5CYII=";

function request(
  db: D1Database,
  bucket: MemoryR2,
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return app.request(
    path,
    { ...rest, headers },
    { DB: db, MEDIA: bucket as unknown as R2Bucket },
  );
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function putPdf(
  db: D1Database,
  bucket: MemoryR2,
  path: string,
  bytes: Uint8Array,
  token?: string,
) {
  return request(db, bucket, path, {
    method: "PUT",
    token,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "X-Content-SHA256": await sha256Hex(bytes),
    },
    body: new Blob([bytes.slice()], { type: "application/pdf" }),
  });
}

async function createFinalizedReport(
  db: D1Database,
  bucket: MemoryR2,
) {
  const signup = await request(db, bucket, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: "report-artifact@example.test",
      password: "password123",
      name: "PDF 관리자",
      orgName: "PDF 테스트 조직",
    }),
  });
  const auth = (await signup.json()) as {
    token: string;
    user: { id: string };
  };
  const customerResponse = await request(db, bucket, "/customers", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({ name: "PDF 고객" }),
  });
  const customer = (await customerResponse.json()) as {
    customer: { id: string };
  };
  const siteResponse = await request(db, bucket, "/sites", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      name: "PDF 현장",
    }),
  });
  const site = (await siteResponse.json()) as { site: { id: string } };
  const workOrderResponse = await request(db, bucket, "/work-orders", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      siteId: site.site.id,
      scheduledDate: "2026-07-23",
      workType: "산업설비 정기점검",
      assigneeIds: [auth.user.id],
      intent: "schedule",
    }),
  });
  const workOrder = (await workOrderResponse.json()) as {
    workOrder: { id: string };
  };
  const workOrderId = workOrder.workOrder.id;
  const started = await request(db, bucket, `/work-orders/${workOrderId}/start`, {
    method: "POST",
    token: auth.token,
  });
  expect(started.status).toBe(200);
  const fieldRecord = await request(db, bucket, `/work-orders/${workOrderId}/field-record`, {
    method: "PUT",
    token: auth.token,
    body: JSON.stringify({
      workSummary: "산업설비 정기점검 완료",
      transcript: "압력과 진동 상태를 점검하고 정상임을 확인했습니다.",
    }),
  });
  expect(fieldRecord.status).toBe(200);
  const evidencePhoto = await request(
    db,
    bucket,
    `/work-orders/${workOrderId}/photos`,
    {
      method: "POST",
      token: auth.token,
      body: JSON.stringify({
        kind: "before",
        dataUrl: SIGNATURE_DATA_URL,
        caption: "보고서 증빙 사진",
      }),
    },
  );
  expect(evidencePhoto.status).toBe(200);
  const submitted = await request(db, bucket, `/work-orders/${workOrderId}/submit`, {
    method: "POST",
    token: auth.token,
  });
  expect(submitted.status).toBe(200);
  const detail = (await (
    await request(db, bucket, `/work-orders/${workOrderId}`, {
      token: auth.token,
    })
  ).json()) as { draft: { uncertainFields: string[] } };
  const finalized = await request(
    db,
    bucket,
    `/work-orders/${workOrderId}/report/finalize`,
    {
      method: "POST",
      token: auth.token,
      body: JSON.stringify({
        confirmedUncertainFields: detail.draft.uncertainFields,
      }),
    },
  );
  expect(finalized.status).toBe(200);
  const finalizedJson = (await finalized.json()) as {
    reportVersion: { id: string; version: number };
    artifact: { id: string; sourceSha256: string; status: string };
  };
  return {
    ...auth,
    workOrderId,
    reportVersion: finalizedJson.reportVersion,
    artifact: finalizedJson.artifact,
  };
}

describe("report PDF artifact routes", () => {
  let db: D1Database;
  let bucket: MemoryR2;

  beforeEach(() => {
    db = createTestDb();
    bucket = new MemoryR2();
  });

  it("gates approval links, stores the approval PDF, and recovers a signed PDF idempotently", async () => {
    const fixture = await createFinalizedReport(db, bucket);

    const prematureLink = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/approval-links`,
      { method: "POST", token: fixture.token },
    );
    expect(prematureLink.status).toBe(409);
    await expect(prematureLink.json()).resolves.toMatchObject({
      code: "report_pdf_not_ready",
      artifactStatus: "pending",
    });

    const approvalPdf = minimalParseablePdf("approval-v1");
    expect(hasParseableMinimalPdfStructure(approvalPdf)).toBe(true);
    const approvalUploadPath = `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/approval`;
    const uploaded = await putPdf(
      db,
      bucket,
      approvalUploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(uploaded.status).toBe(200);
    await expect(uploaded.json()).resolves.toMatchObject({
      artifact: {
        id: fixture.artifact.id,
        status: "ready",
        sourceSha256: fixture.artifact.sourceSha256,
      },
      reused: false,
    });

    const linkResponse = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/approval-links`,
      { method: "POST", token: fixture.token },
    );
    expect(linkResponse.status).toBe(200);
    const { token: approvalToken } = (await linkResponse.json()) as {
      token: string;
    };
    const publicReport = await request(
      db,
      bucket,
      `/public/approvals/${approvalToken}`,
    );
    const publicJson = (await publicReport.json()) as {
      approvalRequestStatus: string;
      reportVersion: {
        artifact: { status: string; pdfUrl: string };
      };
    };
    expect(publicJson.approvalRequestStatus).toBe("pending");
    expect(publicJson.reportVersion.artifact.status).toBe("ready");
    const basePdfResponse = await request(
      db,
      bucket,
      publicJson.reportVersion.artifact.pdfUrl,
    );
    expect(basePdfResponse.status).toBe(200);
    expect(new Uint8Array(await basePdfResponse.arrayBuffer())).toEqual(
      approvalPdf,
    );

    const approved = await request(
      db,
      bucket,
      `/public/approvals/${approvalToken}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "김승인",
          title: "공장장",
          signatureDataUrl: SIGNATURE_DATA_URL,
          agree: true,
        }),
      },
    );
    expect(approved.status).toBe(200);
    const approvedJson = (await approved.json()) as {
      signedArtifact: {
        id: string;
        status: string;
        sourceSha256: string;
        uploadUrl: string | null;
        failureUrl: string | null;
      };
      signedPdfRecoveryRequired: boolean;
    };
    expect(approvedJson.signedArtifact.status).toBe("pending");
    expect(approvedJson.signedArtifact.uploadUrl).toBeNull();
    expect(approvedJson.signedArtifact.failureUrl).toBeNull();
    expect(approvedJson.signedPdfRecoveryRequired).toBe(true);
    expect(approvedJson).not.toHaveProperty("signatureReceipt");
    expect(approvedJson).not.toHaveProperty("basePdfUrl");
    const approvedPublicView = (await (
      await request(db, bucket, `/public/approvals/${approvalToken}`)
    ).json()) as {
      approvalRequestStatus: string;
      signedArtifact: {
        status: string;
        uploadUrl: string | null;
        failureUrl: string | null;
      } | null;
    };
    expect(approvedPublicView.approvalRequestStatus).toBe("approved");
    expect(approvedPublicView.signedArtifact).toMatchObject({
      status: "pending",
      uploadUrl: null,
      failureUrl: null,
    });

    const blockedPublicUpload = await putPdf(
      db,
      bucket,
      `/public/approvals/${approvalToken}/signed-pdf`,
      minimalParseablePdf("untrusted-public-signed"),
    );
    expect(blockedPublicUpload.status).toBe(405);
    await expect(blockedPublicUpload.json()).resolves.toMatchObject({
      error: expect.stringContaining("사무실"),
    });
    const blockedPublicFailure = await request(
      db,
      bucket,
      `/public/approvals/${approvalToken}/signed-pdf/failure`,
      {
        method: "POST",
        body: JSON.stringify({
          code: "browser_closed",
          message: "공개 상태 변경 시도",
        }),
      },
    );
    expect(blockedPublicFailure.status).toBe(403);
    await expect(blockedPublicFailure.json()).resolves.toMatchObject({
      error: expect.stringContaining("사무실"),
    });

    const baseArtifactRow = await db
      .prepare(
        `SELECT storage_key
         FROM report_artifacts
         WHERE id = ? AND kind = 'approval' AND status = 'ready'`,
      )
      .bind(fixture.artifact.id)
      .first<{ storage_key: string }>();
    expect(baseArtifactRow?.storage_key).toBeTruthy();
    if (!baseArtifactRow?.storage_key) {
      throw new Error("ready approval artifact has no storage key");
    }
    expect(bucket.objects.delete(baseArtifactRow.storage_key)).toBe(true);
    const blockedPrepare = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/signed/prepare`,
      { method: "POST", token: fixture.token },
    );
    expect(blockedPrepare.status).toBe(409);
    await expect(blockedPrepare.json()).resolves.toMatchObject({
      code: "report_pdf_recovery_required",
      artifactStatus: "missing_object",
    });
    const restoredBase = await putPdf(
      db,
      bucket,
      approvalUploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(restoredBase.status).toBe(200);
    await expect(restoredBase.json()).resolves.toMatchObject({
      artifact: { status: "ready" },
      reused: false,
    });

    const prepared = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/signed/prepare`,
      { method: "POST", token: fixture.token },
    );
    expect(prepared.status).toBe(200);
    const preparedJson = (await prepared.json()) as {
      artifact: { id: string; status: string; sourceSha256: string };
      receipt: { sourceSha256: string; signatureDataUrl: string };
    };
    expect(preparedJson.artifact.id).toBe(approvedJson.signedArtifact.id);
    expect(preparedJson.artifact.status).toBe("pending");
    expect(preparedJson.receipt.signatureDataUrl).toBe(SIGNATURE_DATA_URL);

    const signedPdf = minimalParseablePdf("signed-v1");
    const signedUploadPath = `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/signed`;
    const recovered = await putPdf(
      db,
      bucket,
      signedUploadPath,
      signedPdf,
      fixture.token,
    );
    expect(recovered.status).toBe(200);
    await expect(recovered.json()).resolves.toMatchObject({
      artifact: {
        id: approvedJson.signedArtifact.id,
        status: "ready",
      },
      reused: false,
    });

    const signedDownload = await request(
      db,
      bucket,
      `/public/approvals/${approvalToken}/signed-pdf`,
    );
    expect(signedDownload.status).toBe(200);
    expect(new Uint8Array(await signedDownload.arrayBuffer())).toEqual(
      signedPdf,
    );
    expect(
      [...bucket.objects.keys()].filter((key) => key.endsWith(".pdf")),
    ).toHaveLength(2);

    const versionRow = await db
      .prepare(
        `SELECT version, structured_json
         FROM report_versions WHERE work_order_id = ?`,
      )
      .bind(fixture.workOrderId)
      .first<{ version: number; structured_json: string }>();
    expect(versionRow?.version).toBe(1);
    expect(versionRow?.structured_json).toContain("산업설비 정기점검 완료");
  });

  it("blocks approval links for a missing ready object and restores it with the identical PDF", async () => {
    const fixture = await createFinalizedReport(db, bucket);
    const approvalPdf = minimalParseablePdf("approval-missing-object");
    const uploadPath = `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/approval`;

    const uploaded = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(uploaded.status).toBe(200);

    const artifactRow = await db
      .prepare(
        `SELECT storage_key
         FROM report_artifacts
         WHERE id = ? AND status = 'ready'`,
      )
      .bind(fixture.artifact.id)
      .first<{ storage_key: string }>();
    expect(artifactRow?.storage_key).toBeTruthy();
    if (!artifactRow?.storage_key) throw new Error("ready artifact has no storage key");
    expect(bucket.objects.delete(artifactRow.storage_key)).toBe(true);

    const brokenLink = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/approval-links`,
      { method: "POST", token: fixture.token },
    );
    expect(brokenLink.status).toBe(409);
    await expect(brokenLink.json()).resolves.toMatchObject({
      code: "report_pdf_recovery_required",
      artifactStatus: "missing_object",
      recoveryUrl: expect.stringContaining(uploadPath),
    });
    const requestCount = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM approval_requests
         WHERE work_order_id = ?`,
      )
      .bind(fixture.workOrderId)
      .first<{ count: number }>();
    expect(requestCount?.count).toBe(0);

    const recovered = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(recovered.status).toBe(200);
    await expect(recovered.json()).resolves.toMatchObject({
      artifact: { status: "ready" },
      reused: false,
    });
    expect(bucket.objects.has(artifactRow.storage_key)).toBe(true);

    const link = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/approval-links`,
      { method: "POST", token: fixture.token },
    );
    expect(link.status).toBe(200);

    const replay = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({ reused: true });
  });

  it("protects a fresh upload lease and permits one stale takeover", async () => {
    const fixture = await createFinalizedReport(db, bucket);
    const approvalPdf = minimalParseablePdf("approval-upload-lease");
    const uploadPath = `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/approval`;
    const failurePath = `${uploadPath}/failure`;

    const leasedAt = new Date().toISOString();
    const lease = await db
      .prepare(
        `UPDATE report_artifacts
         SET status = 'uploading', attempt_count = 1, updated_at = ?
         WHERE id = ? AND status = 'pending' AND attempt_count = 0`,
      )
      .bind(leasedAt, fixture.artifact.id)
      .run();
    expect(lease.meta.changes).toBe(1);

    const blockedUpload = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(blockedUpload.status).toBe(409);

    const blockedFailure = await request(db, bucket, failurePath, {
      method: "POST",
      token: fixture.token,
      body: JSON.stringify({
        code: "renderer_timeout",
        message: "아직 실행 중인 렌더러",
      }),
    });
    expect(blockedFailure.status).toBe(409);

    const stillLeased = await db
      .prepare(
        `SELECT status, attempt_count
         FROM report_artifacts WHERE id = ?`,
      )
      .bind(fixture.artifact.id)
      .first<{ status: string; attempt_count: number }>();
    expect(stillLeased).toEqual({ status: "uploading", attempt_count: 1 });

    await db
      .prepare(
        `UPDATE report_artifacts
         SET updated_at = '2000-01-01T00:00:00.000Z'
         WHERE id = ? AND status = 'uploading' AND attempt_count = 1`,
      )
      .bind(fixture.artifact.id)
      .run();
    const takeover = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(takeover.status).toBe(200);
    await expect(takeover.json()).resolves.toMatchObject({
      artifact: {
        status: "ready",
        attemptCount: 2,
      },
      reused: false,
    });
  });

  it("does not let a late failed upload overwrite a newer ready attempt", async () => {
    const fixture = await createFinalizedReport(db, bucket);
    const approvalPdf = minimalParseablePdf("approval-late-loser");
    const uploadPath = `/work-orders/${fixture.workOrderId}/report-versions/1/artifacts/approval`;
    let markPutStarted!: () => void;
    let releasePut!: () => void;
    const putStarted = new Promise<void>((resolve) => {
      markPutStarted = resolve;
    });
    const putRelease = new Promise<void>((resolve) => {
      releasePut = resolve;
    });
    bucket.beforePut = async () => {
      markPutStarted();
      await putRelease;
      throw new Error("simulated stale uploader failure");
    };

    const losingUploadPromise = putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    await putStarted;

    const claimed = await db
      .prepare(
        `SELECT id, org_id, work_order_id, report_version_id,
                renderer_version, source_sha256, attempt_count
         FROM report_artifacts
         WHERE id = ? AND status = 'uploading'`,
      )
      .bind(fixture.artifact.id)
      .first<{
        id: string;
        org_id: string;
        work_order_id: string;
        report_version_id: string;
        renderer_version: string;
        source_sha256: string;
        attempt_count: number;
      }>();
    expect(claimed?.attempt_count).toBe(1);
    if (!claimed) throw new Error("upload attempt was not claimed");

    const checksumSha256 = await sha256Hex(approvalPdf);
    const storageKey = createImmutableReportPdfKey({
      orgId: claimed.org_id,
      workOrderId: claimed.work_order_id,
      reportVersionId: claimed.report_version_id,
      kind: "approval",
      sourceSha256: claimed.source_sha256,
    });
    const checksumBuffer = await crypto.subtle.digest(
      "SHA-256",
      approvalPdf.slice().buffer,
    );
    bucket.objects.set(storageKey, {
      bytes: approvalPdf.slice(),
      etag: "etag-newer-winner",
      sha256: checksumBuffer,
      customMetadata: {
        artifactId: claimed.id,
        reportVersionId: claimed.report_version_id,
        kind: "approval",
        rendererVersion: claimed.renderer_version,
        sourceSha256: claimed.source_sha256,
        outputSha256: checksumSha256,
      },
    });
    const newerReady = await db
      .prepare(
        `UPDATE report_artifacts
         SET status = 'ready', attempt_count = attempt_count + 1,
             storage_key = ?, mime_type = 'application/pdf', size_bytes = ?,
             etag = ?, checksum_sha256 = ?, last_error_code = NULL,
             last_error_message = NULL, updated_at = ?, ready_at = ?
         WHERE id = ? AND status = 'uploading' AND attempt_count = ?`,
      )
      .bind(
        storageKey,
        approvalPdf.byteLength,
        "etag-newer-winner",
        checksumSha256,
        new Date().toISOString(),
        new Date().toISOString(),
        claimed.id,
        claimed.attempt_count,
      )
      .run();
    expect(newerReady.meta.changes).toBe(1);

    releasePut();
    const losingUpload = await losingUploadPromise;
    expect(losingUpload.status).toBe(503);
    bucket.beforePut = null;

    const finalArtifact = await db
      .prepare(
        `SELECT status, attempt_count, last_error_code
         FROM report_artifacts WHERE id = ?`,
      )
      .bind(fixture.artifact.id)
      .first<{
        status: string;
        attempt_count: number;
        last_error_code: string | null;
      }>();
    expect(finalArtifact).toEqual({
      status: "ready",
      attempt_count: 2,
      last_error_code: null,
    });

    const replay = await putPdf(
      db,
      bucket,
      uploadPath,
      approvalPdf,
      fixture.token,
    );
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({ reused: true });
  });
});
