import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgo=";
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const WEBM_BYTES = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x41, 0x42]);

type StoredObject = {
  bytes: Uint8Array;
  etag: string;
  contentType: string | undefined;
  sha256: ArrayBuffer | undefined;
};

class MemoryR2 {
  readonly objects = new Map<string, StoredObject>();
  readonly putOptions: unknown[] = [];
  failDeleteOnce = false;

  async put(key: string, value: unknown, options?: unknown): Promise<R2Object | null> {
    this.putOptions.push(options);
    if (this.objects.has(key)) return null;
    if (!(value instanceof Uint8Array)) throw new Error("test R2 expects Uint8Array");

    const contentType = (
      options as { httpMetadata?: { contentType?: string } } | undefined
    )?.httpMetadata?.contentType;
    const sha256 = (
      options as { sha256?: ArrayBuffer } | undefined
    )?.sha256;
    const stored = {
      bytes: value.slice(),
      etag: `etag-${this.objects.size + 1}`,
      contentType,
      sha256,
    };
    this.objects.set(key, stored);
    return {
      key,
      size: stored.bytes.byteLength,
      etag: stored.etag,
    } as R2Object;
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const stored = this.objects.get(key);
    if (!stored) return null;
    return {
      key,
      size: stored.bytes.byteLength,
      etag: stored.etag,
      httpEtag: `"${stored.etag}"`,
      body: new Blob([stored.bytes.slice()]).stream(),
      checksums: stored.sha256 ? { sha256: stored.sha256 } : {},
    } as R2ObjectBody;
  }

  async delete(key: string): Promise<void> {
    if (this.failDeleteOnce) {
      this.failDeleteOnce = false;
      throw new Error("injected R2 delete failure");
    }
    this.objects.delete(key);
  }
}

function request(
  db: D1Database,
  bucket: MemoryR2 | undefined,
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
    { DB: db, ...(bucket ? { MEDIA: bucket as unknown as R2Bucket } : {}) },
  );
}

async function seedPublicApprovalRequest(
  db: D1Database,
  workOrderId: string,
  reportVersionId: string,
): Promise<string> {
  const token = `media-test-${crypto.randomUUID()}`;
  const tokenHash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token),
      ),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const sentAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();
  await db
    .prepare(
      `INSERT INTO approval_requests
         (id, work_order_id, report_version_id, token_hash, expires_at, sent_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      crypto.randomUUID(),
      workOrderId,
      reportVersionId,
      tokenHash,
      expiresAt,
      sentAt,
    )
    .run();
  return token;
}

async function expectResponseBytes(
  response: Response,
  expected: Uint8Array,
  mimeType: string,
) {
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe(mimeType);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(expected);
}

async function createInProgressWorkOrder(
  db: D1Database,
  bucket?: MemoryR2,
) {
  const signup = await request(db, bucket, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: "media@example.test",
      password: "password123",
      name: "미디어 담당자",
      orgName: "미디어 테스트 조직",
    }),
  });
  expect(signup.status).toBe(200);
  const auth = (await signup.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };

  const customerResponse = await request(db, bucket, "/customers", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({ name: "미디어 고객" }),
  });
  const customer = (await customerResponse.json()) as {
    customer: { id: string };
  };
  const siteResponse = await request(db, bucket, "/sites", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      name: "미디어 현장",
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
      workType: "정기점검",
      assigneeIds: [auth.user.id],
    }),
  });
  expect(workOrderResponse.status).toBe(200);
  const workOrder = (await workOrderResponse.json()) as {
    workOrder: { id: string };
  };
  const started = await request(
    db,
    bucket,
    `/work-orders/${workOrder.workOrder.id}/start`,
    { method: "POST", token: auth.token },
  );
  expect(started.status).toBe(200);

  return {
    ...auth,
    workOrderId: workOrder.workOrder.id,
  };
}

describe("private R2 media integration", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("keeps the existing D1 photo fallback when MEDIA is not bound", async () => {
    const fixture = await createInProgressWorkOrder(db);
    const uploaded = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/photos`,
      {
        method: "POST",
        token: fixture.token,
        body: JSON.stringify({ kind: "before", dataUrl: PNG_DATA_URL }),
      },
    );
    expect(uploaded.status).toBe(200);

    const legacyCount = await db
      .prepare("SELECT COUNT(*) AS n FROM photos WHERE work_order_id = ?")
      .bind(fixture.workOrderId)
      .first<{ n: number }>();
    const r2Count = await db
      .prepare("SELECT COUNT(*) AS n FROM media_assets WHERE work_order_id = ?")
      .bind(fixture.workOrderId)
      .first<{ n: number }>();
    expect(legacyCount?.n).toBe(1);
    expect(r2Count?.n).toBe(0);

    const detail = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}`,
      { token: fixture.token },
    );
    const detailJson = (await detail.json()) as {
      photos: { url: string }[];
      audio: unknown[];
    };
    expect(detailJson.photos[0]?.url).toContain(
      `/work-orders/${fixture.workOrderId}/media/`,
    );
    expect(detailJson.audio).toEqual([]);

    const photoResponse = await request(
      db,
      undefined,
      detailJson.photos[0]!.url,
      { token: fixture.token },
    );
    await expectResponseBytes(photoResponse, PNG_BYTES, "image/png");

    await request(db, undefined, `/work-orders/${fixture.workOrderId}/field-record`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ transcript: "D1 사진 보고서" }),
    });
    await request(db, undefined, `/work-orders/${fixture.workOrderId}/submit`, {
      method: "POST",
      token: fixture.token,
    });
    await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/report/finalize`,
      {
        method: "POST",
        token: fixture.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    const snapshot = await db
      .prepare("SELECT photos_json FROM report_versions WHERE work_order_id = ?")
      .bind(fixture.workOrderId)
      .first<{ photos_json: string }>();
    expect(snapshot?.photos_json).toContain('"id"');
    expect(snapshot?.photos_json).not.toContain("data:image");
  });

  it("replays a photo upload with the same idempotency key without creating a duplicate", async () => {
    const fixture = await createInProgressWorkOrder(db);
    const upload = () =>
      request(
        db,
        undefined,
        `/work-orders/${fixture.workOrderId}/photos`,
        {
          method: "POST",
          token: fixture.token,
          headers: { "Idempotency-Key": "photo:test-retry-1" },
          body: JSON.stringify({ kind: "before", dataUrl: PNG_DATA_URL }),
        },
      );

    const first = await upload();
    const second = await upload();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstJson = (await first.json()) as { photo: { id: string } };
    const secondJson = (await second.json()) as {
      photo: { id: string };
      idempotentReplay: boolean;
    };
    expect(secondJson.photo.id).toBe(firstJson.photo.id);
    expect(secondJson.idempotentReplay).toBe(true);
    const count = await db
      .prepare("SELECT COUNT(*) AS n FROM photos WHERE work_order_id = ?")
      .bind(fixture.workOrderId)
      .first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it("accepts 20 photos and rejects the 21st at the server boundary", async () => {
    const fixture = await createInProgressWorkOrder(db);
    for (let index = 0; index < 20; index += 1) {
      const uploaded = await request(
        db,
        undefined,
        `/work-orders/${fixture.workOrderId}/photos`,
        {
          method: "POST",
          token: fixture.token,
          headers: { "Idempotency-Key": `photo:limit-${index}` },
          body: JSON.stringify({ kind: "other", dataUrl: PNG_DATA_URL }),
        },
      );
      expect(uploaded.status).toBe(200);
    }
    const overflow = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/photos`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Idempotency-Key": "photo:limit-overflow" },
        body: JSON.stringify({ kind: "other", dataUrl: PNG_DATA_URL }),
      },
    );
    expect(overflow.status).toBe(409);
    expect(await overflow.json()).toMatchObject({
      error: expect.stringContaining("최대 20장"),
    });
  });

  it("round-trips checklist, rejects nonpositive parts, and uses a transcript date in the draft", async () => {
    const fixture = await createInProgressWorkOrder(db);
    const invalid = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/field-record`,
      {
        method: "PUT",
        token: fixture.token,
        body: JSON.stringify({
          transcript: "점검 완료",
          parts: [{ name: "필터", quantity: 0, unit: "개" }],
        }),
      },
    );
    expect(invalid.status).toBe(400);

    const saved = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/field-record`,
      {
        method: "PUT",
        token: fixture.token,
        body: JSON.stringify({
          transcript: "펌프 점검 완료. 다음 점검일은 2026-10-02",
          notes: "압력 정상",
          checklist: [
            {
              id: "safety",
              label: "안전 조치 확인",
              checked: true,
              note: "LOTO 완료",
            },
          ],
          parts: [{ name: "필터", quantity: 1, unit: "개" }],
        }),
      },
    );
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      fieldRecord: {
        checklist: [
          {
            id: "safety",
            label: "안전 조치 확인",
            checked: true,
          },
        ],
      },
    });

    await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/photos`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Idempotency-Key": "photo:checklist-submit" },
        body: JSON.stringify({ kind: "after", dataUrl: PNG_DATA_URL }),
      },
    );
    const submitted = await request(
      db,
      undefined,
      `/work-orders/${fixture.workOrderId}/submit`,
      { method: "POST", token: fixture.token },
    );
    expect(submitted.status).toBe(200);
    expect(await submitted.json()).toMatchObject({
      draft: {
        fieldNotes: "압력 정상",
        checklist: [{ id: "safety", checked: true }],
        nextInspectionDate: "2026-10-02",
      },
    });
  });

  it("stores R2 photo bytes privately and hydrates immutable snapshots inside auth boundaries", async () => {
    const bucket = new MemoryR2();
    const fixture = await createInProgressWorkOrder(db, bucket);
    const uploaded = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/photos?kind=after`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Content-Type": "image/png" },
        body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
      },
    );
    expect(uploaded.status).toBe(200);
    const uploadedJson = (await uploaded.json()) as {
      photo: { id: string; url: string };
    };
    const photoId = uploadedJson.photo.id;
    expect(uploadedJson.photo.url).toContain(
      `/work-orders/${fixture.workOrderId}/media/${photoId}`,
    );
    expect(bucket.objects.size).toBe(1);
    expect(bucket.putOptions[0]).toMatchObject({
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: {
        contentType: "image/png",
        cacheControl: "private, no-store",
      },
    });

    const legacyCount = await db
      .prepare("SELECT COUNT(*) AS n FROM photos WHERE work_order_id = ?")
      .bind(fixture.workOrderId)
      .first<{ n: number }>();
    expect(legacyCount?.n).toBe(0);

    await request(db, bucket, `/work-orders/${fixture.workOrderId}/field-record`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ transcript: "정기 점검 완료" }),
    });
    const submitted = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/submit`,
      { method: "POST", token: fixture.token },
    );
    expect(submitted.status).toBe(200);
    const finalized = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/report/finalize`,
      {
        method: "POST",
        token: fixture.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    expect(finalized.status).toBe(200);

    const storedVersion = await db
      .prepare(
        "SELECT photos_json FROM report_versions WHERE work_order_id = ? AND version = 1",
      )
      .bind(fixture.workOrderId)
      .first<{ photos_json: string }>();
    expect(storedVersion?.photos_json).toContain("storageKey");
    expect(storedVersion?.photos_json).not.toContain("data:image");

    const versionResponse = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/report-versions/1`,
      { token: fixture.token },
    );
    expect(versionResponse.status).toBe(200);
    const versionJson = (await versionResponse.json()) as {
      reportVersion: {
        id: string;
        photos: { url: string }[];
        context: { assigneeNames: string[]; customer: { name: string } };
      };
    };
    expect(versionJson.reportVersion.photos[0]?.url).toContain(
      `/work-orders/${fixture.workOrderId}/media/${photoId}`,
    );
    expect(versionJson.reportVersion.context.assigneeNames).toEqual([
      "미디어 담당자",
    ]);
    expect(versionJson.reportVersion.context.customer.name).toBe("미디어 고객");
    const privatePhoto = await request(
      db,
      bucket,
      versionJson.reportVersion.photos[0]!.url,
      { token: fixture.token },
    );
    await expectResponseBytes(privatePhoto, PNG_BYTES, "image/png");
    const unauthenticatedPhoto = await request(
      db,
      bucket,
      versionJson.reportVersion.photos[0]!.url,
    );
    expect(unauthenticatedPhoto.status).toBe(401);

    // 공개 사진 스트림의 경계만 검증한다. 승인 링크 발급은 별도의
    // PDF 무결성 테스트가 담당하므로 유효한 요청 토큰을 직접 준비한다.
    const publicToken = await seedPublicApprovalRequest(
      db,
      fixture.workOrderId,
      versionJson.reportVersion.id,
    );
    const publicResponse = await request(
      db,
      bucket,
      `/public/approvals/${publicToken}`,
    );
    expect(publicResponse.status).toBe(200);
    const publicJson = (await publicResponse.json()) as {
      reportVersion: {
        photos: { url: string }[];
        context: { assigneeNames: string[] };
      };
    };
    expect(publicJson.reportVersion.photos[0]?.url).toContain(
      `/public/approvals/${publicToken}/media/${photoId}`,
    );
    expect(publicJson.reportVersion.context.assigneeNames).toEqual([
      "미디어 담당자",
    ]);
    const publicPhoto = await request(
      db,
      bucket,
      publicJson.reportVersion.photos[0]!.url,
    );
    await expectResponseBytes(publicPhoto, PNG_BYTES, "image/png");

    const lockedDelete = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/photos/${photoId}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(lockedDelete.status).toBe(409);
    expect(bucket.objects.size).toBe(1);
  });

  it("restores the media tombstone when R2 deletion fails so deletion can be retried", async () => {
    const bucket = new MemoryR2();
    const fixture = await createInProgressWorkOrder(db, bucket);
    const uploaded = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/photos?kind=before`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Content-Type": "image/png" },
        body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
      },
    );
    expect(uploaded.status).toBe(200);
    const { photo } = (await uploaded.json()) as { photo: { id: string } };

    bucket.failDeleteOnce = true;
    const failedDelete = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/photos/${photo.id}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(failedDelete.status).toBe(503);
    expect(bucket.objects.size).toBe(1);
    const restored = await db
      .prepare("SELECT deleted_at FROM media_assets WHERE id = ?")
      .bind(photo.id)
      .first<{ deleted_at: string | null }>();
    expect(restored?.deleted_at).toBeNull();

    const retriedDelete = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/photos/${photo.id}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(retriedDelete.status).toBe(200);
    expect(bucket.objects.size).toBe(0);
    const metadata = await db
      .prepare("SELECT COUNT(*) AS n FROM media_assets WHERE id = ?")
      .bind(photo.id)
      .first<{ n: number }>();
    expect(metadata?.n).toBe(0);
  });

  it("uploads, hydrates, and deletes an audio original while STT remains unconnected", async () => {
    const noBucketFixture = await createInProgressWorkOrder(db);
    const unavailable = await request(
      db,
      undefined,
      `/work-orders/${noBucketFixture.workOrderId}/audio`,
      {
        method: "POST",
        token: noBucketFixture.token,
        headers: { "Content-Type": "audio/webm" },
        body: new Blob([WEBM_BYTES.slice()], { type: "audio/webm" }),
      },
    );
    expect(unavailable.status).toBe(503);

    db = createTestDb();
    const bucket = new MemoryR2();
    const fixture = await createInProgressWorkOrder(db, bucket);
    const uploaded = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/audio?durationSeconds=1.5`,
      {
        method: "POST",
        token: fixture.token,
        headers: {
          "Content-Type": "audio/webm",
          "Idempotency-Key": "audio:test-retry-1",
        },
        body: new Blob([WEBM_BYTES.slice()], { type: "audio/webm" }),
      },
    );
    expect(uploaded.status).toBe(200);
    const uploadedJson = (await uploaded.json()) as {
      audio: { id: string; transcriptStatus: string };
    };
    expect(uploadedJson.audio.transcriptStatus).toBe("not_connected");

    const replayed = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/audio?durationSeconds=1.5`,
      {
        method: "POST",
        token: fixture.token,
        headers: {
          "Content-Type": "audio/webm",
          "Idempotency-Key": "audio:test-retry-1",
        },
        body: new Blob([WEBM_BYTES.slice()], { type: "audio/webm" }),
      },
    );
    expect(replayed.status).toBe(200);
    expect(await replayed.json()).toMatchObject({
      audio: { id: uploadedJson.audio.id },
      idempotentReplay: true,
    });

    const detail = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}`,
      { token: fixture.token },
    );
    const detailJson = (await detail.json()) as {
      audio: {
        id: string;
        url: string;
        transcriptStatus: string;
      }[];
    };
    expect(detailJson.audio[0]).toMatchObject({
      id: uploadedJson.audio.id,
      transcriptStatus: "not_connected",
    });
    expect(detailJson.audio[0]?.url).toContain(
      `/work-orders/${fixture.workOrderId}/media/${uploadedJson.audio.id}`,
    );
    const audioResponse = await request(
      db,
      bucket,
      detailJson.audio[0]!.url,
      { token: fixture.token },
    );
    await expectResponseBytes(audioResponse, WEBM_BYTES, "audio/webm");

    const deleted = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/audio/${uploadedJson.audio.id}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(deleted.status).toBe(200);
    expect(bucket.objects.size).toBe(0);
    const metadata = await db
      .prepare("SELECT COUNT(*) AS n FROM media_assets WHERE id = ?")
      .bind(uploadedJson.audio.id)
      .first<{ n: number }>();
    expect(metadata?.n).toBe(0);
  });
});
