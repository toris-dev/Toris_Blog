import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const PNG_BYTES_ALT = new Uint8Array([
  ...PNG_BYTES,
  0x01,
]);
const WEBM_BYTES = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x41, 0x42]);
const WEBM_BYTES_ALT = new Uint8Array([...WEBM_BYTES, 0x43]);

type StoredObject = {
  bytes: Uint8Array;
  etag: string;
  sha256: ArrayBuffer | undefined;
};

class MemoryR2 {
  readonly objects = new Map<string, StoredObject>();

  async put(key: string, value: unknown, options?: unknown): Promise<R2Object | null> {
    if (this.objects.has(key)) return null;
    if (!(value instanceof Uint8Array)) throw new Error("test R2 expects Uint8Array");
    const stored = {
      bytes: value.slice(),
      etag: `etag-${this.objects.size + 1}`,
      sha256: (options as { sha256?: ArrayBuffer } | undefined)?.sha256,
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

function pngDataUrl(bytes: Uint8Array): string {
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`;
}

async function createFixture(db: D1Database, bucket: MemoryR2) {
  const signup = await request(db, bucket, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: "security-integrity@example.test",
      password: "password123",
      name: "무결성 관리자",
      orgName: "무결성 테스트 조직",
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
    body: JSON.stringify({ name: "무결성 고객" }),
  });
  const customer = (await customerResponse.json()) as {
    customer: { id: string };
  };
  const siteResponse = await request(db, bucket, "/sites", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      name: "무결성 현장",
    }),
  });
  const site = (await siteResponse.json()) as { site: { id: string } };
  const assetResponse = await request(db, bucket, "/assets", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      siteId: site.site.id,
      name: "무결성 장비",
    }),
  });
  const asset = (await assetResponse.json()) as { asset: { id: string } };

  const workOrderResponse = await request(db, bucket, "/work-orders", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      siteId: site.site.id,
      assetId: asset.asset.id,
      scheduledDate: "2026-07-23",
      workType: "정기점검",
      assigneeIds: [auth.user.id],
      intent: "schedule",
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
    customerId: customer.customer.id,
    siteId: site.site.id,
    assetId: asset.asset.id,
    workOrderId: workOrder.workOrder.id,
  };
}

describe("security and integrity regressions", () => {
  let db: D1Database;
  let bucket: MemoryR2;

  beforeEach(() => {
    db = createTestDb();
    bucket = new MemoryR2();
  });

  it("binds work-order photo and audio idempotency keys to bytes and metadata", async () => {
    const fixture = await createFixture(db, bucket);
    const photoPath = `/work-orders/${fixture.workOrderId}/photos`;
    const photoInit = {
      method: "POST",
      token: fixture.token,
      headers: { "Idempotency-Key": "photo:fingerprint-1" },
      body: JSON.stringify({
        kind: "before",
        caption: "동일 요청",
        dataUrl: pngDataUrl(PNG_BYTES),
      }),
    };

    const firstPhoto = await request(db, undefined, photoPath, photoInit);
    const replayedPhoto = await request(db, undefined, photoPath, photoInit);
    expect(firstPhoto.status).toBe(200);
    expect(replayedPhoto.status).toBe(200);
    await expect(replayedPhoto.json()).resolves.toMatchObject({
      idempotentReplay: true,
    });

    const changedPhotoMetadata = await request(db, undefined, photoPath, {
      ...photoInit,
      body: JSON.stringify({
        kind: "after",
        caption: "동일 요청",
        dataUrl: pngDataUrl(PNG_BYTES),
      }),
    });
    expect(changedPhotoMetadata.status).toBe(409);

    const byteKey = "photo:fingerprint-bytes";
    const originalBytes = await request(db, undefined, photoPath, {
      ...photoInit,
      headers: { "Idempotency-Key": byteKey },
    });
    expect(originalBytes.status).toBe(200);
    const changedPhotoBytes = await request(db, undefined, photoPath, {
      ...photoInit,
      headers: { "Idempotency-Key": byteKey },
      body: JSON.stringify({
        kind: "before",
        caption: "동일 요청",
        dataUrl: pngDataUrl(PNG_BYTES_ALT),
      }),
    });
    expect(changedPhotoBytes.status).toBe(409);

    const audioPath = `/work-orders/${fixture.workOrderId}/audio?caption=현장음성&durationSeconds=1.5`;
    const audioInit = {
      method: "POST",
      token: fixture.token,
      headers: {
        "Content-Type": "audio/webm",
        "Idempotency-Key": "audio:fingerprint-1",
      },
      body: new Blob([WEBM_BYTES.slice()], { type: "audio/webm" }),
    };
    const firstAudio = await request(db, bucket, audioPath, audioInit);
    const replayedAudio = await request(db, bucket, audioPath, audioInit);
    expect(firstAudio.status).toBe(200);
    expect(replayedAudio.status).toBe(200);
    await expect(replayedAudio.json()).resolves.toMatchObject({
      idempotentReplay: true,
    });

    const changedAudioMetadata = await request(
      db,
      bucket,
      `/work-orders/${fixture.workOrderId}/audio?caption=현장음성&durationSeconds=2`,
      audioInit,
    );
    expect(changedAudioMetadata.status).toBe(409);

    const audioByteKey = "audio:fingerprint-bytes";
    const originalAudioBytes = await request(db, bucket, audioPath, {
      ...audioInit,
      headers: {
        "Content-Type": "audio/webm",
        "Idempotency-Key": audioByteKey,
      },
    });
    expect(originalAudioBytes.status).toBe(200);
    const changedAudioBytes = await request(db, bucket, audioPath, {
      ...audioInit,
      headers: {
        "Content-Type": "audio/webm",
        "Idempotency-Key": audioByteKey,
      },
      body: new Blob([WEBM_BYTES_ALT.slice()], { type: "audio/webm" }),
    });
    expect(changedAudioBytes.status).toBe(409);

    const fingerprints = await db
      .prepare(
        `SELECT request_fingerprint
         FROM photos
         WHERE work_order_id = ?
         UNION ALL
         SELECT request_fingerprint
         FROM media_assets
         WHERE work_order_id = ?`,
      )
      .bind(fixture.workOrderId, fixture.workOrderId)
      .all<{ request_fingerprint: string | null }>();
    expect(fingerprints.results.length).toBeGreaterThanOrEqual(4);
    expect(
      fingerprints.results.every((row) =>
        /^[a-f0-9]{64}$/u.test(row.request_fingerprint ?? ""),
      ),
    ).toBe(true);
  });

  it("replays an identical asset photo but conflicts on changed bytes or metadata", async () => {
    const fixture = await createFixture(db, bucket);
    const path = `/assets/${fixture.assetId}/photos?caption=장비전경`;
    const init = {
      method: "POST",
      token: fixture.token,
      headers: {
        "Content-Type": "image/png",
        "Idempotency-Key": "asset-photo:fingerprint-1",
      },
      body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
    };

    const first = await request(db, bucket, path, init);
    const replay = await request(db, bucket, path, init);
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    const firstJson = (await first.json()) as { photo: { id: string } };
    await expect(replay.json()).resolves.toMatchObject({
      photo: { id: firstJson.photo.id },
      idempotentReplay: true,
    });

    const changedMetadata = await request(
      db,
      bucket,
      `/assets/${fixture.assetId}/photos?caption=다른설명`,
      init,
    );
    expect(changedMetadata.status).toBe(409);

    const changedBytes = await request(db, bucket, path, {
      ...init,
      body: new Blob([PNG_BYTES_ALT.slice()], { type: "image/png" }),
    });
    expect(changedBytes.status).toBe(409);
    const rows = await db
      .prepare(
        `SELECT idempotency_key, request_fingerprint
         FROM asset_photos
         WHERE org_id = ? AND asset_id = ? AND deleted_at IS NULL`,
      )
      .bind(fixture.org.id, fixture.assetId)
      .all<{
        idempotency_key: string | null;
        request_fingerprint: string | null;
      }>();
    expect(rows.results).toEqual([
      {
        idempotency_key: "asset-photo:fingerprint-1",
        request_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/u),
      },
    ]);
  });

  it("serializes concurrent logo replacements and retains every immutable object", async () => {
    const fixture = await createFixture(db, bucket);
    const upload = () =>
      request(db, bucket, "/organization/logo", {
        method: "POST",
        token: fixture.token,
        headers: { "Content-Type": "image/png" },
        body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
      });

    const [first, second] = await Promise.all([upload(), upload()]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const rows = await db
      .prepare(
        `SELECT id, storage_key, deleted_at
         FROM organization_logo_assets
         WHERE org_id = ?
         ORDER BY id ASC`,
      )
      .bind(fixture.org.id)
      .all<{ id: string; storage_key: string; deleted_at: string | null }>();
    expect(rows.results).toHaveLength(2);
    const active = rows.results.filter((row) => row.deleted_at === null);
    expect(active).toHaveLength(1);
    expect(
      rows.results.every((row) => bucket.objects.has(row.storage_key)),
    ).toBe(true);

    const profile = await db
      .prepare("SELECT logo_url FROM organization_profiles WHERE org_id = ?")
      .bind(fixture.org.id)
      .first<{ logo_url: string | null }>();
    expect(profile?.logo_url).toContain(
      `/organization/logo/${active[0]!.id}/content`,
    );
  });
});
