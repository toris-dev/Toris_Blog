import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgo=";

type StoredObject = {
  bytes: Uint8Array;
  etag: string;
  contentType: string | undefined;
  sha256: ArrayBuffer | undefined;
};

class MemoryR2 {
  readonly objects = new Map<string, StoredObject>();
  failDeleteOnce = false;

  async put(key: string, value: unknown, options?: unknown): Promise<R2Object | null> {
    if (this.objects.has(key)) return null;
    if (!(value instanceof Uint8Array)) throw new Error("test R2 expects Uint8Array");

    const stored = {
      bytes: value.slice(),
      etag: `etag-${this.objects.size + 1}`,
      contentType: (
        options as { httpMetadata?: { contentType?: string } } | undefined
      )?.httpMetadata?.contentType,
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
    if (this.failDeleteOnce) {
      this.failDeleteOnce = false;
      throw new Error("injected delete failure");
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

async function createAssetFixture(
  db: D1Database,
  bucket: MemoryR2,
  email: string,
  suffix: string,
) {
  const signup = await request(db, bucket, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      name: `${suffix} 관리자`,
      orgName: `${suffix} 조직`,
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
    body: JSON.stringify({ name: `${suffix} 고객` }),
  });
  const customer = (
    (await customerResponse.json()) as { customer: { id: string } }
  ).customer;
  const siteResponse = await request(db, bucket, "/sites", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({ customerId: customer.id, name: `${suffix} 현장` }),
  });
  const site = ((await siteResponse.json()) as { site: { id: string } }).site;
  const assetResponse = await request(db, bucket, "/assets", {
    method: "POST",
    token: auth.token,
    body: JSON.stringify({ siteId: site.id, name: `${suffix} 장비` }),
  });
  const asset = ((await assetResponse.json()) as { asset: { id: string } }).asset;

  return { ...auth, customer, site, asset };
}

async function uploadPng(
  db: D1Database,
  bucket: MemoryR2,
  token: string,
  assetId: string,
) {
  return request(db, bucket, `/assets/${assetId}/photos`, {
    method: "POST",
    token,
    headers: { "Content-Type": "image/png" },
    body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
  });
}

async function uploadOrganizationLogo(
  db: D1Database,
  bucket: MemoryR2,
  token: string,
) {
  return request(db, bucket, "/organization/logo", {
    method: "POST",
    token,
    headers: { "Content-Type": "image/png" },
    body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
  });
}

describe("asset photo private R2 lifecycle", () => {
  let db: D1Database;
  let bucket: MemoryR2;

  beforeEach(() => {
    db = createTestDb();
    bucket = new MemoryR2();
  });

  it("uploads, lists, streams, and deletes an asset photo", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "asset-photo@test.example",
      "사진",
    );
    const uploaded = await uploadPng(db, bucket, fixture.token, fixture.asset.id);
    expect(uploaded.status).toBe(200);
    const photo = (
      (await uploaded.json()) as {
        photo: {
          id: string;
          assetId: string;
          siteId: string;
          url: string;
          mimeType: string;
        };
      }
    ).photo;
    expect(photo).toMatchObject({
      assetId: fixture.asset.id,
      siteId: fixture.site.id,
      mimeType: "image/png",
    });
    expect(bucket.objects.size).toBe(1);

    const listed = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos`,
      { token: fixture.token },
    );
    await expect(listed.json()).resolves.toMatchObject({
      photos: [{ id: photo.id, assetId: fixture.asset.id, siteId: fixture.site.id }],
    });

    const detail = await request(db, bucket, `/assets/${fixture.asset.id}`, {
      token: fixture.token,
    });
    await expect(detail.json()).resolves.toMatchObject({
      asset: { id: fixture.asset.id },
      photos: [{ id: photo.id }],
    });

    const content = await request(db, bucket, photo.url, {
      token: fixture.token,
    });
    expect(content.status).toBe(200);
    expect(content.headers.get("Content-Type")).toBe("image/png");
    expect(content.headers.get("Cache-Control")).toBe("private, no-store");
    expect(new Uint8Array(await content.arrayBuffer())).toEqual(PNG_BYTES);

    const deleted = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos/${photo.id}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(deleted.status).toBe(200);
    expect(bucket.objects.size).toBe(0);

    const afterDelete = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos`,
      { token: fixture.token },
    );
    await expect(afterDelete.json()).resolves.toEqual({ photos: [] });
    const tombstone = await db
      .prepare("SELECT deleted_at FROM asset_photos WHERE id = ?")
      .bind(photo.id)
      .first<{ deleted_at: string | null }>();
    expect(tombstone?.deleted_at).not.toBeNull();
  });

  it("keeps organization and asset/site ownership isolated", async () => {
    const first = await createAssetFixture(
      db,
      bucket,
      "first@asset-photo.test",
      "첫번째",
    );
    const second = await createAssetFixture(
      db,
      bucket,
      "second@asset-photo.test",
      "두번째",
    );
    const uploaded = await uploadPng(db, bucket, first.token, first.asset.id);
    const photo = (
      (await uploaded.json()) as { photo: { id: string; url: string } }
    ).photo;

    for (const response of [
      await request(db, bucket, `/assets/${first.asset.id}/photos`, {
        token: second.token,
      }),
      await request(db, bucket, photo.url, { token: second.token }),
      await request(
        db,
        bucket,
        `/assets/${first.asset.id}/photos/${photo.id}`,
        { method: "DELETE", token: second.token },
      ),
      await request(
        db,
        bucket,
        `/assets/${second.asset.id}/photos/${photo.id}/content`,
        { token: second.token },
      ),
    ]) {
      expect(response.status).toBe(404);
    }
    expect(bucket.objects.size).toBe(1);
  });

  it("rejects mismatched image bytes before storing them", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "invalid@asset-photo.test",
      "검증",
    );
    const invalid = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Content-Type": "image/png" },
        body: new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" }),
      },
    );
    expect(invalid.status).toBe(400);
    expect(bucket.objects.size).toBe(0);
    const count = await db
      .prepare("SELECT COUNT(*) AS count FROM asset_photos")
      .first<{ count: number }>();
    expect(count?.count).toBe(0);
  });

  it("rolls back the logical delete when R2 deletion fails", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "rollback@asset-photo.test",
      "보상",
    );
    const uploaded = await uploadPng(db, bucket, fixture.token, fixture.asset.id);
    const photo = ((await uploaded.json()) as { photo: { id: string } }).photo;

    bucket.failDeleteOnce = true;
    const failedDelete = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos/${photo.id}`,
      { method: "DELETE", token: fixture.token },
    );
    expect(failedDelete.status).toBe(503);

    const restored = await db
      .prepare("SELECT deleted_at FROM asset_photos WHERE id = ?")
      .bind(photo.id)
      .first<{ deleted_at: string | null }>();
    expect(restored?.deleted_at).toBeNull();
    const listed = await request(
      db,
      bucket,
      `/assets/${fixture.asset.id}/photos`,
      { token: fixture.token },
    );
    await expect(listed.json()).resolves.toMatchObject({
      photos: [{ id: photo.id }],
    });
    expect(bucket.objects.size).toBe(1);
  });

  it("requires the private R2 binding", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "binding@asset-photo.test",
      "바인딩",
    );
    const response = await request(
      db,
      undefined,
      `/assets/${fixture.asset.id}/photos`,
      {
        method: "POST",
        token: fixture.token,
        headers: { "Content-Type": "image/png" },
        body: new Blob([PNG_BYTES.slice()], { type: "image/png" }),
      },
    );
    expect(response.status).toBe(503);
  });
});

describe("organization logo private R2 lifecycle", () => {
  let db: D1Database;
  let bucket: MemoryR2;

  beforeEach(() => {
    db = createTestDb();
    bucket = new MemoryR2();
  });

  it("uploads, streams, and retains replaced logo objects for immutable reports", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "logo@organization.test",
      "로고",
    );
    const firstUpload = await uploadOrganizationLogo(db, bucket, fixture.token);
    expect(firstUpload.status).toBe(200);
    const first = (
      (await firstUpload.json()) as {
        organization: { logoUrl: string };
        logo: { id: string; url: string };
      }
    );
    expect(first.organization.logoUrl).toBe(first.logo.url);

    const firstContent = await request(db, bucket, first.logo.url, {
      token: fixture.token,
    });
    expect(firstContent.status).toBe(200);
    expect(new Uint8Array(await firstContent.arrayBuffer())).toEqual(PNG_BYTES);

    const secondUpload = await uploadOrganizationLogo(db, bucket, fixture.token);
    expect(secondUpload.status).toBe(200);
    const second = (
      (await secondUpload.json()) as {
        organization: { logoUrl: string };
        logo: { id: string; url: string };
      }
    );
    expect(second.logo.id).not.toBe(first.logo.id);
    expect(second.organization.logoUrl).toBe(second.logo.url);
    expect(bucket.objects.size).toBe(2);

    const superseded = await request(db, bucket, first.logo.url, {
      token: fixture.token,
    });
    expect(superseded.status).toBe(404);
    const rows = await db
      .prepare(
        "SELECT id, deleted_at FROM organization_logo_assets WHERE org_id = ? ORDER BY created_at ASC",
      )
      .bind(fixture.org.id)
      .all<{ id: string; deleted_at: string | null }>();
    expect(rows.results).toHaveLength(2);
    expect(rows.results.filter((row) => row.deleted_at === null)).toEqual([
      { id: second.logo.id, deleted_at: null },
    ]);
  });

  it("streams a historical logo through authenticated and public report-version scopes", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "historical-logo@organization.test",
      "과거 로고",
    );
    const firstUpload = await uploadOrganizationLogo(
      db,
      bucket,
      fixture.token,
    );
    const firstLogo = (
      (await firstUpload.json()) as {
        logo: { id: string; url: string };
      }
    ).logo;

    const workOrderResponse = await request(db, bucket, "/work-orders", {
      method: "POST",
      token: fixture.token,
      body: JSON.stringify({
        customerId: fixture.customer.id,
        siteId: fixture.site.id,
        assetId: fixture.asset.id,
        scheduledDate: "2026-07-23",
        workType: "정기점검",
        assigneeIds: [fixture.user.id],
        intent: "schedule",
      }),
    });
    const workOrder = (
      (await workOrderResponse.json()) as { workOrder: { id: string } }
    ).workOrder;
    const started = await request(db, bucket, `/work-orders/${workOrder.id}/start`, {
      method: "POST",
      token: fixture.token,
    });
    expect(started.status).toBe(200);
    const fieldRecord = await request(db, bucket, `/work-orders/${workOrder.id}/field-record`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({
        workSummary: "산업설비 정기점검 완료",
        transcript: "냉동기 압력과 진동 상태를 점검하고 정상임을 확인했습니다.",
      }),
    });
    expect(fieldRecord.status).toBe(200);
    const evidencePhoto = await request(
      db,
      bucket,
      `/work-orders/${workOrder.id}/photos`,
      {
        method: "POST",
        token: fixture.token,
        body: JSON.stringify({
          kind: "before",
          dataUrl: PNG_DATA_URL,
          caption: "확정 보고서 증빙",
        }),
      },
    );
    expect(evidencePhoto.status).toBe(200);
    const submitted = await request(db, bucket, `/work-orders/${workOrder.id}/submit`, {
      method: "POST",
      token: fixture.token,
    });
    expect(submitted.status).toBe(200);
    const detail = (await (
      await request(db, bucket, `/work-orders/${workOrder.id}`, {
        token: fixture.token,
      })
    ).json()) as { draft: { uncertainFields: string[] } };
    const finalized = await request(
      db,
      bucket,
      `/work-orders/${workOrder.id}/report/finalize`,
      {
        method: "POST",
        token: fixture.token,
        body: JSON.stringify({
          confirmedUncertainFields: detail.draft.uncertainFields,
        }),
      },
    );
    expect(finalized.status).toBe(200);

    const versionResponse = await request(
      db,
      bucket,
      `/work-orders/${workOrder.id}/report-versions/1`,
      { token: fixture.token },
    );
    const version = (await versionResponse.json()) as {
      reportVersion: {
        id: string;
        context: {
          org: {
            logo: { id: string; url: string } | null;
          };
        };
      };
    };
    expect(version.reportVersion.context.org.logo?.id).toBe(firstLogo.id);
    const historicalUrl = version.reportVersion.context.org.logo!.url;

    const replacement = await uploadOrganizationLogo(
      db,
      bucket,
      fixture.token,
    );
    expect(replacement.status).toBe(200);
    const directOldLogo = await request(db, bucket, firstLogo.url, {
      token: fixture.token,
    });
    expect(directOldLogo.status).toBe(404);
    const authenticatedSnapshotLogo = await request(
      db,
      bucket,
      historicalUrl,
      { token: fixture.token },
    );
    expect(authenticatedSnapshotLogo.status).toBe(200);
    expect(new Uint8Array(await authenticatedSnapshotLogo.arrayBuffer())).toEqual(
      PNG_BYTES,
    );

    // 공개 로고 스트림의 경계만 검증한다. 승인 링크 발급은 별도의
    // PDF 무결성 테스트가 담당하므로 유효한 요청 토큰을 직접 준비한다.
    const token = await seedPublicApprovalRequest(
      db,
      workOrder.id,
      version.reportVersion.id,
    );
    const publicReport = await request(
      db,
      bucket,
      `/public/approvals/${token}`,
    );
    expect(publicReport.status).toBe(200);
    const publicJson = (await publicReport.json()) as {
      reportVersion: {
        context: { org: { logo: { id: string; url: string } | null } };
      };
    };
    expect(publicJson.reportVersion.context.org.logo?.id).toBe(firstLogo.id);
    const publicSnapshotLogo = await request(
      db,
      bucket,
      publicJson.reportVersion.context.org.logo!.url,
    );
    expect(publicSnapshotLogo.status).toBe(200);
    expect(new Uint8Array(await publicSnapshotLogo.arrayBuffer())).toEqual(
      PNG_BYTES,
    );
  });

  it("does not stream another organization's logo", async () => {
    const first = await createAssetFixture(
      db,
      bucket,
      "first-logo@organization.test",
      "첫 로고",
    );
    const second = await createAssetFixture(
      db,
      bucket,
      "second-logo@organization.test",
      "둘째 로고",
    );
    const uploaded = await uploadOrganizationLogo(db, bucket, first.token);
    const logo = ((await uploaded.json()) as { logo: { url: string } }).logo;

    const crossOrg = await request(db, bucket, logo.url, {
      token: second.token,
    });
    expect(crossOrg.status).toBe(404);
  });

  it("soft-deletes logo metadata while retaining the R2 object", async () => {
    const fixture = await createAssetFixture(
      db,
      bucket,
      "logo-rollback@organization.test",
      "로고 보상",
    );
    const uploaded = await uploadOrganizationLogo(db, bucket, fixture.token);
    const logo = (
      (await uploaded.json()) as {
        organization: { logoUrl: string };
        logo: { id: string; url: string };
      }
    );

    bucket.failDeleteOnce = true;
    const deleted = await request(db, bucket, "/organization/logo", {
      method: "DELETE",
      token: fixture.token,
    });
    expect(deleted.status).toBe(200);

    const profile = await request(db, bucket, "/organization", {
      token: fixture.token,
    });
    await expect(profile.json()).resolves.toMatchObject({
      organization: { logoUrl: null },
    });
    const noLongerListed = await request(db, bucket, logo.logo.url, {
      token: fixture.token,
    });
    expect(noLongerListed.status).toBe(404);
    expect(bucket.objects.size).toBe(1);
    expect(bucket.failDeleteOnce).toBe(true);
  });
});
