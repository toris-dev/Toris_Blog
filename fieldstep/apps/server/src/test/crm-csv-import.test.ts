import {
  CRM_IMPORT_MAX_ROWS,
  type CrmImportResponse,
} from "@fieldstep/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CrmCsvImportError,
  parseCrmImportCsv,
  parseRfc4180Csv,
} from "../crm-csv-import.js";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

function request(
  db: D1Database,
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return app.request(path, { ...rest, headers }, { DB: db });
}

async function signup(
  db: D1Database,
  email = "admin@crm-import.test",
) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      name: "관리자",
      orgName: `${email} 조직`,
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    org: { id: string };
  };
}

function importCsv(
  db: D1Database,
  token: string,
  csv: string,
  idempotencyKey = "crm-import-test-0001",
  contentType = "text/csv; charset=utf-8",
) {
  return request(db, "/crm/imports/csv", {
    method: "POST",
    token,
    headers: {
      "Content-Type": contentType,
      "Idempotency-Key": idempotencyKey,
    },
    body: csv,
  });
}

function failFirstBatch(db: D1Database): D1Database {
  let shouldFail = true;
  return new Proxy(db, {
    get(target, property) {
      if (property === "batch") {
        return async (statements: D1PreparedStatement[]) => {
          if (shouldFail) {
            shouldFail = false;
            throw new Error("temporary D1 failure");
          }
          return target.batch(statements);
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function stealClaimAfterFirstBatch(db: D1Database): D1Database {
  let shouldSteal = true;
  return new Proxy(db, {
    get(target, property) {
      if (property === "batch") {
        return async (statements: D1PreparedStatement[]) => {
          const result = await target.batch(statements);
          if (shouldSteal) {
            shouldSteal = false;
            await target
              .prepare(
                `UPDATE audit_events
                 SET target = 'replacement-worker-token',
                     created_at = ?
                 WHERE event = 'crm_csv_import_claimed'`,
              )
              .bind(new Date().toISOString())
              .run();
          }
          return result;
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

describe("CRM RFC 4180 CSV parser", () => {
  it("handles a UTF-8 BOM, escaped commas/quotes, CRLF, and quoted newlines", () => {
    const csv =
      "\uFEFF고객사명,고객사 메모,현장명,장비명\r\n" +
      '"한빛, 산업","첫 줄\r\n둘째 ""확인"" 줄",1공장,냉각펌프\r\n' +
      "다음산업,,2공장,\r\n";

    const rawRows = parseRfc4180Csv(csv.replace(/^\uFEFF/u, ""));
    expect(rawRows).toHaveLength(3);
    expect(rawRows[1]).toMatchObject({
      sourceRow: 2,
      cells: [
        "한빛, 산업",
        '첫 줄\n둘째 "확인" 줄',
        "1공장",
        "냉각펌프",
      ],
    });
    expect(rawRows[2]?.sourceRow).toBe(4);

    const parsed = parseCrmImportCsv(csv);
    expect(parsed.totalRows).toBe(2);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      sourceRow: 2,
      customer: {
        name: "한빛, 산업",
        memo: '첫 줄\n둘째 "확인" 줄',
      },
      site: { name: "1공장" },
      asset: { name: "냉각펌프" },
    });
    expect(parsed.rows[1]?.sourceRow).toBe(4);
  });

  it("rejects malformed quote syntax with the physical source row", () => {
    expect(() =>
      parseCrmImportCsv('customer_name\n정상 고객사\n"닫히지 않은 고객사'),
    ).toThrowError(CrmCsvImportError);
    expect(() =>
      parseCrmImportCsv('customer_name\n정상 고객사\n"닫히지 않은 고객사'),
    ).toThrow("CSV 3행");
  });

  it("enforces the documented maximum number of non-empty data rows", () => {
    const csv = [
      "customer_name",
      ...Array.from(
        { length: CRM_IMPORT_MAX_ROWS + 1 },
        (_, index) => `고객사 ${index + 1}`,
      ),
    ].join("\n");
    expect(() => parseCrmImportCsv(csv)).toThrow(
      `최대 ${CRM_IMPORT_MAX_ROWS.toLocaleString("ko-KR")}행`,
    );
  });
});

describe("POST /crm/imports/csv", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("partially succeeds and reports the exact invalid source row without creating its hierarchy", async () => {
    const admin = await signup(db);
    const csv = [
      "customer_name,site_name,asset_name,asset_installed_at",
      '"Alpha, Inc.",제1공장,순환펌프,2024-02-29',
      "잘못된 고객사,오류 현장,오류 장비,2024-02-30",
    ].join("\r\n");

    const response = await importCsv(db, admin.token, csv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as CrmImportResponse;
    expect(body.import).toMatchObject({
      totalRows: 2,
      succeededRows: 1,
      failedRows: 1,
      created: { customers: 1, sites: 1, assets: 1 },
      reused: { customers: 0, sites: 0, assets: 0 },
      errors: [{ row: 3 }],
      idempotentReplay: false,
    });
    expect(body.import.errors[0]?.reason).toContain("설치일");

    const valid = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM customers WHERE org_id = ? AND name = ?",
      )
      .bind(admin.org.id, "Alpha, Inc.")
      .first<{ count: number }>();
    const invalid = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM customers WHERE org_id = ? AND name = ?",
      )
      .bind(admin.org.id, "잘못된 고객사")
      .first<{ count: number }>();
    expect(valid?.count).toBe(1);
    expect(invalid?.count).toBe(0);
  });

  it("replays the same key and fingerprint, rejects key reuse, and avoids duplicates with a new key", async () => {
    const admin = await signup(db);
    const csv =
      "customer_name,site_name,asset_name\n중앙플랜트,울산 현장,압축기\n";

    const first = await importCsv(
      db,
      admin.token,
      csv,
      "crm-import-idempotency-01",
    );
    expect(first.status).toBe(200);

    const replay = await importCsv(
      db,
      admin.token,
      csv,
      "crm-import-idempotency-01",
    );
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      import: {
        created: { customers: 1, sites: 1, assets: 1 },
        idempotentReplay: true,
      },
    });

    const conflict = await importCsv(
      db,
      admin.token,
      `${csv}추가 고객사,,\n`,
      "crm-import-idempotency-01",
    );
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      code: "idempotency_fingerprint_conflict",
    });

    const safeRetry = await importCsv(
      db,
      admin.token,
      csv,
      "crm-import-idempotency-02",
    );
    expect(safeRetry.status).toBe(200);
    await expect(safeRetry.json()).resolves.toMatchObject({
      import: {
        created: { customers: 0, sites: 0, assets: 0 },
        reused: { customers: 1, sites: 1, assets: 1 },
        idempotentReplay: false,
      },
    });

    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM customers WHERE org_id = ?) AS customers,
           (SELECT COUNT(*) FROM sites WHERE org_id = ?) AS sites,
           (SELECT COUNT(*) FROM assets WHERE org_id = ?) AS assets`,
      )
      .bind(admin.org.id, admin.org.id, admin.org.id)
      .first<{ customers: number; sites: number; assets: number }>();
    expect(counts).toEqual({ customers: 1, sites: 1, assets: 1 });
  });

  it("does not write an earlier row when the CSV grammar is malformed later", async () => {
    const admin = await signup(db);
    const response = await importCsv(
      db,
      admin.token,
      'customer_name\n저장되면 안 되는 고객사\n"닫히지 않은 값',
      "crm-import-malformed-01",
    );
    expect(response.status).toBe(400);

    const row = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM customers WHERE org_id = ? AND name = ?",
      )
      .bind(admin.org.id, "저장되면 안 되는 고객사")
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });

  it("isolates identical hierarchy names by organization", async () => {
    const firstOrg = await signup(db, "first@crm-import.test");
    const secondOrg = await signup(db, "second@crm-import.test");
    const csv = "customer_name,site_name\n동명이 고객사,본사 현장\n";

    expect(
      (
        await importCsv(
          db,
          firstOrg.token,
          csv,
          "crm-import-first-org",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await importCsv(
          db,
          secondOrg.token,
          csv,
          "crm-import-second-org",
        )
      ).status,
    ).toBe(200);

    const rows = await db
      .prepare(
        "SELECT id, org_id FROM customers WHERE name = ? ORDER BY org_id",
      )
      .bind("동명이 고객사")
      .all<{ id: string; org_id: string }>();
    expect(rows.results).toHaveLength(2);
    expect(new Set(rows.results.map((row) => row.org_id))).toEqual(
      new Set([firstOrg.org.id, secondOrg.org.id]),
    );
    expect(rows.results[0]?.id).not.toBe(rows.results[1]?.id);
  });

  it("allows only office/admin roles and strict CSV media types", async () => {
    const admin = await signup(db);
    const csv = "customer_name\n권한 테스트 고객사\n";

    const wrongType = await importCsv(
      db,
      admin.token,
      csv,
      "crm-import-content-type",
      "application/json",
    );
    expect(wrongType.status).toBe(415);

    await db
      .prepare("UPDATE memberships SET role = 'field' WHERE org_id = ?")
      .bind(admin.org.id)
      .run();
    const forbidden = await importCsv(
      db,
      admin.token,
      csv,
      "crm-import-field-role",
    );
    expect(forbidden.status).toBe(403);
  });

  it("reclaims a failed idempotency claim without duplicating committed hierarchy", async () => {
    const admin = await signup(db);
    const csv = "customer_name,site_name\n복구 고객사,복구 현장\n";
    const key = "crm-import-recover-failed";

    const first = await importCsv(db, admin.token, csv, key);
    expect(first.status).toBe(200);

    await db
      .prepare(
        "DELETE FROM audit_events WHERE org_id = ? AND event = 'crm_csv_import_completed'",
      )
      .bind(admin.org.id)
      .run();
    const failedClaim = await db
      .prepare(
        "UPDATE audit_events SET event = 'crm_csv_import_failed' WHERE org_id = ? AND event = 'crm_csv_import_finalized'",
      )
      .bind(admin.org.id)
      .run();
    expect(failedClaim.meta.changes).toBe(1);

    const recovered = await importCsv(db, admin.token, csv, key);
    expect(recovered.status).toBe(200);
    await expect(recovered.json()).resolves.toMatchObject({
      import: {
        created: { customers: 0, sites: 0, assets: 0 },
        reused: { customers: 1, sites: 1, assets: 0 },
        idempotentReplay: false,
      },
    });

    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM customers WHERE org_id = ?) AS customers,
           (SELECT COUNT(*) FROM sites WHERE org_id = ?) AS sites`,
      )
      .bind(admin.org.id, admin.org.id)
      .first<{ customers: number; sites: number }>();
    expect(counts).toEqual({ customers: 1, sites: 1 });
  });

  it("propagates a transient D1 batch failure and retries the same key", async () => {
    const admin = await signup(db);
    const csv = "customer_name,site_name\n일시 장애 고객사,일시 장애 현장\n";
    const key = "crm-import-transient-d1";

    const failed = await importCsv(failFirstBatch(db), admin.token, csv, key);
    expect(failed.status).toBe(500);

    const claim = await db
      .prepare(
        "SELECT event FROM audit_events WHERE org_id = ? AND event = 'crm_csv_import_failed'",
      )
      .bind(admin.org.id)
      .first<{ event: string }>();
    expect(claim?.event).toBe("crm_csv_import_failed");

    const retried = await importCsv(db, admin.token, csv, key);
    expect(retried.status).toBe(200);
    await expect(retried.json()).resolves.toMatchObject({
      import: {
        succeededRows: 1,
        failedRows: 0,
        created: { customers: 1, sites: 1, assets: 0 },
      },
    });
  });

  it("fences a worker that loses its claim and never publishes its local result", async () => {
    const admin = await signup(db);
    const csv = "customer_name,site_name\n펜싱 고객사,펜싱 현장\n";
    const key = "crm-import-claim-fencing";

    const staleWorker = await importCsv(
      stealClaimAfterFirstBatch(db),
      admin.token,
      csv,
      key,
    );
    expect(staleWorker.status).toBe(409);
    await expect(staleWorker.json()).resolves.toMatchObject({
      code: "import_claim_lost",
    });

    const completed = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM audit_events WHERE org_id = ? AND event = 'crm_csv_import_completed'",
      )
      .bind(admin.org.id)
      .first<{ count: number }>();
    expect(completed?.count).toBe(0);

    await db
      .prepare(
        "UPDATE audit_events SET event = 'crm_csv_import_failed' WHERE org_id = ? AND target = 'replacement-worker-token'",
      )
      .bind(admin.org.id)
      .run();
    const recovered = await importCsv(db, admin.token, csv, key);
    expect(recovered.status).toBe(200);
    await expect(recovered.json()).resolves.toMatchObject({
      import: {
        created: { customers: 0, sites: 0, assets: 0 },
        reused: { customers: 1, sites: 1, assets: 0 },
      },
    });
  });

  it("does not create children below inactive CRM parents", async () => {
    const admin = await signup(db);
    const customerOnly = await importCsv(
      db,
      admin.token,
      "customer_name\n비활성 고객사\n",
      "crm-import-inactive-customer-seed",
    );
    expect(customerOnly.status).toBe(200);

    const customer = await db
      .prepare(
        "SELECT id FROM customers WHERE org_id = ? AND name = '비활성 고객사'",
      )
      .bind(admin.org.id)
      .first<{ id: string }>();
    await db
      .prepare(
        "UPDATE master_entity_states SET active = 0 WHERE org_id = ? AND entity_type = 'customer' AND entity_id = ?",
      )
      .bind(admin.org.id, customer!.id)
      .run();

    const blockedSite = await importCsv(
      db,
      admin.token,
      "customer_name,site_name\n비활성 고객사,생기면 안 되는 현장\n",
      "crm-import-inactive-customer-child",
    );
    expect(blockedSite.status).toBe(200);
    await expect(blockedSite.json()).resolves.toMatchObject({
      import: {
        succeededRows: 0,
        failedRows: 1,
        errors: [{ row: 2, reason: "비활성 고객사에는 현장을 등록할 수 없습니다" }],
      },
    });

    const siteCount = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM sites WHERE org_id = ? AND name = '생기면 안 되는 현장'",
      )
      .bind(admin.org.id)
      .first<{ count: number }>();
    expect(siteCount?.count).toBe(0);

    await db
      .prepare(
        "UPDATE master_entity_states SET active = 1 WHERE org_id = ? AND entity_type = 'customer' AND entity_id = ?",
      )
      .bind(admin.org.id, customer!.id)
      .run();
    const siteSeed = await importCsv(
      db,
      admin.token,
      "customer_name,site_name\n비활성 고객사,비활성 예정 현장\n",
      "crm-import-inactive-site-seed",
    );
    expect(siteSeed.status).toBe(200);
    const site = await db
      .prepare(
        "SELECT id FROM sites WHERE org_id = ? AND name = '비활성 예정 현장'",
      )
      .bind(admin.org.id)
      .first<{ id: string }>();
    await db
      .prepare(
        "UPDATE master_entity_states SET active = 0 WHERE org_id = ? AND entity_type = 'site' AND entity_id = ?",
      )
      .bind(admin.org.id, site!.id)
      .run();

    const blockedAsset = await importCsv(
      db,
      admin.token,
      "customer_name,site_name,asset_name\n비활성 고객사,비활성 예정 현장,생기면 안 되는 장비\n",
      "crm-import-inactive-site-child",
    );
    expect(blockedAsset.status).toBe(200);
    await expect(blockedAsset.json()).resolves.toMatchObject({
      import: {
        succeededRows: 0,
        failedRows: 1,
        errors: [{ row: 2, reason: "비활성 현장에는 장비를 등록할 수 없습니다" }],
      },
    });

    const assetCount = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM assets WHERE org_id = ? AND name = '생기면 안 되는 장비'",
      )
      .bind(admin.org.id)
      .first<{ count: number }>();
    expect(assetCount?.count).toBe(0);
  });
});
