import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

describe("worker operations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows media idempotency and integrity headers in CORS preflight", async () => {
    const response = await app.request(
      "https://api.field.toris.kr/work-orders/work-1/photos",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://field.toris.kr",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers":
            "idempotency-key,x-source-sha256,x-content-sha256",
        },
      },
      { DB: createTestDb() },
    );

    expect(response.status).toBe(204);
    const allowedHeaders =
      response.headers.get("Access-Control-Allow-Headers")?.toLowerCase() ?? "";
    expect(allowedHeaders).toContain("idempotency-key");
    expect(allowedHeaders).toContain("x-source-sha256");
    expect(allowedHeaders).toContain("x-content-sha256");
  });

  it("reports ready only when the migrated D1 schema and R2 binding respond", async () => {
    const media = {
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    } as unknown as R2Bucket;

    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: createTestDb(), MEDIA: media },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "fieldstep-api",
      status: "ready",
    });
    expect(media.list).toHaveBeenCalledWith({ limit: 1 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Request-ID")).toBeTruthy();
  });

  it("reports not ready when the organization logo metadata migration is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = createTestDb();
    await db.exec("DROP TABLE organization_logo_assets");
    const media = {
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    } as unknown as R2Bucket;

    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: db, MEDIA: media },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "fieldstep-api",
      status: "not_ready",
    });
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("reports not ready when the report number allocator migration is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = createTestDb();
    await db.exec("DROP TABLE report_number_sequences");
    const media = {
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    } as unknown as R2Bucket;

    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: db, MEDIA: media },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "fieldstep-api",
      status: "not_ready",
    });
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("reports not ready when the maintenance occurrence migration is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = createTestDb();
    await db.exec("DROP TABLE maintenance_occurrences");
    const media = {
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    } as unknown as R2Bucket;

    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: db, MEDIA: media },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "fieldstep-api",
      status: "not_ready",
    });
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("reports not ready when a maintenance uniqueness index is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = createTestDb();
    await db.exec("DROP INDEX maintenance_schedules_org_source_report_uq");
    const media = {
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    } as unknown as R2Bucket;

    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: db, MEDIA: media },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "fieldstep-api",
      status: "not_ready",
    });
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("returns a non-diagnostic 503 when a readiness dependency is absent", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await app.request(
      "https://api.field.toris.kr/health/ready",
      undefined,
      { DB: createTestDb() },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "fieldstep-api",
      status: "not_ready",
    });
    expect(log).toHaveBeenCalledTimes(1);
    const structuredLog = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      event: string;
      request: { route: string };
    };
    expect(structuredLog.event).toBe("readiness_check_failed");
    expect(structuredLog.request.route).toBe("/health/ready");
  });
});
