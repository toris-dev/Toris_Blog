import { beforeEach, describe, expect, it } from "vitest";
import { APPROVAL_CONSENT_VERSION } from "@fieldstep/shared";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";
import { minimalParseablePdf } from "./pdf-fixture.js";
import { MemoryR2 } from "./r2-shim.js";

const TEST_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgo=";
const TEST_SIGNATURE_DATA_URL = TEST_PNG_DATA_URL;
let mediaBucket: MemoryR2;

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
  return app.request(
    path,
    { ...rest, headers },
    { DB: db, MEDIA: mediaBucket as unknown as R2Bucket },
  );
}

function pauseFirstQueryContaining(
  db: D1Database,
  sqlFragment: string,
  onPaused: () => void,
  resume: Promise<void>,
): D1Database {
  let shouldPause = true;
  return new Proxy(db, {
    get(target, property) {
      if (property !== "prepare") {
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      }
      return (sql: string) => {
        const statement = target.prepare(sql);
        if (!sql.includes(sqlFragment)) return statement;
        const wrap = (current: D1PreparedStatement): D1PreparedStatement =>
          new Proxy(current, {
            get(statementTarget, statementProperty) {
              if (statementProperty === "bind") {
                return (...values: unknown[]) =>
                  wrap(statementTarget.bind(...values));
              }
              if (statementProperty === "first") {
                return async <T>(columnName?: string) => {
                  const row =
                    columnName === undefined
                      ? await statementTarget.first<T>()
                      : await statementTarget.first<T>(columnName);
                  if (shouldPause) {
                    shouldPause = false;
                    onPaused();
                    await resume;
                  }
                  return row;
                };
              }
              const value = Reflect.get(statementTarget, statementProperty);
              return typeof value === "function"
                ? value.bind(statementTarget)
                : value;
            },
          });
        return wrap(statement);
      };
    },
  });
}

async function signup(db: D1Database, email: string) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      name: "관리자",
      orgName: "승인 P0 테스트 조직",
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };
}

async function createWorkOrder(db: D1Database, token: string) {
  const meResponse = await request(db, "/me", { token });
  const me = (await meResponse.json()) as { user: { id: string } };
  const customerResponse = await request(db, "/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "승인 고객" }),
  });
  const { customer } = (await customerResponse.json()) as {
    customer: { id: string };
  };
  const siteResponse = await request(db, "/sites", {
    method: "POST",
    token,
    body: JSON.stringify({ customerId: customer.id, name: "승인 현장" }),
  });
  const { site } = (await siteResponse.json()) as { site: { id: string } };
  const workOrderResponse = await request(db, "/work-orders", {
    method: "POST",
    token,
    body: JSON.stringify({
      scheduledDate: "2026-07-24",
      workType: "정기점검",
      customerId: customer.id,
      siteId: site.id,
      assigneeIds: [me.user.id],
      intent: "schedule",
    }),
  });
  expect(workOrderResponse.status).toBe(200);
  const { workOrder } = (await workOrderResponse.json()) as {
    workOrder: { id: string };
  };
  return workOrder.id;
}

async function uploadReadyApprovalPdfArtifact(
  db: D1Database,
  workOrderId: string,
  token: string,
) {
  const version = await db
    .prepare(
      `SELECT rv.version
       FROM report_versions rv
       WHERE rv.work_order_id = ?
       ORDER BY rv.version DESC LIMIT 1`,
    )
    .bind(workOrderId)
    .first<{ version: number }>();
  expect(version).not.toBeNull();
  const pdf = minimalParseablePdf(`approval-p0-v${version!.version}`);
  const digest = await crypto.subtle.digest("SHA-256", pdf);
  const checksum = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const response = await request(
    db,
    `/work-orders/${workOrderId}/report-versions/${version!.version}/artifacts/approval`,
    {
      method: "PUT",
      token,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "X-Content-SHA256": checksum,
      },
      body: new Blob([pdf.slice()], { type: "application/pdf" }),
    },
  );
  expect(response.status).toBe(200);
}

async function runToApprovalLink(db: D1Database, token: string) {
  const id = await createWorkOrder(db, token);
  expect(
    (
      await request(db, `/work-orders/${id}/start`, {
        method: "POST",
        token,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(db, `/work-orders/${id}/field-record`, {
        method: "PUT",
        token,
        body: JSON.stringify({ transcript: "점검 완료" }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(db, `/work-orders/${id}/photos`, {
        method: "POST",
        token,
        body: JSON.stringify({
          kind: "before",
          dataUrl: TEST_PNG_DATA_URL,
        }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(db, `/work-orders/${id}/submit`, {
        method: "POST",
        token,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(db, `/work-orders/${id}/report/finalize`, {
        method: "POST",
        token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      })
    ).status,
  ).toBe(200);
  await uploadReadyApprovalPdfArtifact(db, id, token);
  const linkResponse = await request(db, `/work-orders/${id}/approval-links`, {
    method: "POST",
    token,
  });
  expect(linkResponse.status).toBe(200);
  const link = (await linkResponse.json()) as { token: string };
  return { id, approvalToken: link.token };
}

async function approve(db: D1Database, approvalToken: string, name: string) {
  return request(db, `/public/approvals/${approvalToken}/approve`, {
    method: "POST",
    body: JSON.stringify({
      name,
      title: "팀장",
      signatureDataUrl: TEST_SIGNATURE_DATA_URL,
      agree: true,
    }),
  });
}

describe("approval evidence, reissue, and correction P0", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
    mediaBucket = new MemoryR2();
  });

  it("surfaces latest request status, viewedAt, and direct revision comment in internal detail", async () => {
    const admin = await signup(db, "approval-detail@test.local");
    const { id, approvalToken } = await runToApprovalLink(db, admin.token);

    const publicView = await request(
      db,
      `/public/approvals/${approvalToken}`,
    );
    expect(publicView.status).toBe(200);

    const pendingDetail = (await (
      await request(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as {
      approval: {
        status: string;
        requestStatus: string;
        viewedAt: string | null;
      };
    };
    expect(pendingDetail.approval).toMatchObject({
      status: "pending",
      requestStatus: "pending",
    });
    expect(pendingDetail.approval.viewedAt).not.toBeNull();

    const revision = await request(
      db,
      `/public/approvals/${approvalToken}/revision`,
      {
        method: "POST",
        body: JSON.stringify({ comment: "압력 수치를 다시 확인해주세요" }),
      },
    );
    expect(revision.status).toBe(200);

    const detail = (await (
      await request(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as {
      approval: {
        status: string;
        requestStatus: string;
        viewedAt: string | null;
        revisionComment: string | null;
      };
    };
    expect(detail.approval).toMatchObject({
      status: "revision_requested",
      requestStatus: "revision_requested",
      revisionComment: "압력 수치를 다시 확인해주세요",
    });
    expect(detail.approval.viewedAt).not.toBeNull();

    const stored = await db
      .prepare(
        "SELECT revision_comment, viewed_at FROM approval_requests WHERE work_order_id = ?",
      )
      .bind(id)
      .first<{ revision_comment: string | null; viewed_at: string | null }>();
    expect(stored).toMatchObject({
      revision_comment: "압력 수치를 다시 확인해주세요",
      viewed_at: detail.approval.viewedAt,
    });
  });

  it("allows explicit non-invalidating reissue, then supersedes the other link on first decision", async () => {
    const admin = await signup(db, "approval-reissue@test.local");
    const { id, approvalToken: firstToken } = await runToApprovalLink(
      db,
      admin.token,
    );

    const secondLink = await request(db, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ invalidatePrevious: false }),
    });
    expect(secondLink.status).toBe(200);
    const { token: secondToken } = (await secondLink.json()) as {
      token: string;
    };
    expect(secondToken).not.toBe(firstToken);
    expect(
      (await request(db, `/public/approvals/${firstToken}`)).status,
    ).toBe(200);
    expect(
      (await request(db, `/public/approvals/${secondToken}`)).status,
    ).toBe(200);

    const approved = await approve(db, firstToken, "첫 링크 승인자");
    expect(approved.status).toBe(200);
    expect(
      (await request(db, `/public/approvals/${secondToken}`)).status,
    ).toBe(410);

    const rows = await db
      .prepare(
        `SELECT status FROM approval_requests
         WHERE work_order_id = ? ORDER BY rowid ASC`,
      )
      .bind(id)
      .all<{ status: string }>();
    expect((rows.results ?? []).map((row) => row.status)).toEqual([
      "approved",
      "superseded",
    ]);
  });

  it("persists fixed-version consent evidence with the signature", async () => {
    const admin = await signup(db, "approval-consent@test.local");
    const { id, approvalToken } = await runToApprovalLink(db, admin.token);
    const approved = await approve(db, approvalToken, "동의 승인자");
    expect(approved.status).toBe(200);

    const stored = await db
      .prepare(
        `SELECT sig.agreed, sig.consented_at, sig.consent_version,
                sig.approved_at
         FROM signatures sig
         JOIN approval_requests ar ON ar.id = sig.approval_request_id
         WHERE ar.work_order_id = ?`,
      )
      .bind(id)
      .first<{
        agreed: number;
        consented_at: string | null;
        consent_version: string;
        approved_at: string;
      }>();
    expect(stored).toMatchObject({
      agreed: 1,
      consent_version: APPROVAL_CONSENT_VERSION,
    });
    expect(stored?.consented_at).toBe(stored?.approved_at);

    const report = (await (
      await request(db, `/work-orders/${id}/report-versions/1`, {
        token: admin.token,
      })
    ).json()) as {
      reportVersion: {
        signature: {
          agreed: boolean;
          consentedAt: string | null;
          consentVersion: string;
        } | null;
      };
    };
    expect(report.reportVersion.signature).toMatchObject({
      agreed: true,
      consentedAt: stored?.consented_at,
      consentVersion: APPROVAL_CONSENT_VERSION,
    });
  });

  it("preserves the signed v1 while office correction creates and reapproves v2 from a completed work order", async () => {
    const admin = await signup(db, "approval-correction@test.local");
    const { id, approvalToken } = await runToApprovalLink(db, admin.token);
    expect((await approve(db, approvalToken, "1차 승인자")).status).toBe(200);
    expect(
      (
        await request(db, `/work-orders/${id}/complete`, {
          method: "POST",
          token: admin.token,
        })
      ).status,
    ).toBe(200);

    const correction = await request(
      db,
      `/work-orders/${id}/report-correction`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ comment: "부품 수량 오기를 정정합니다" }),
      },
    );
    expect(correction.status).toBe(200);
    const correctedOldLink = (await (
      await request(db, `/public/approvals/${approvalToken}`)
    ).json()) as {
      approvalStatus: string;
      approvalRequestStatus: string;
    };
    expect(correctedOldLink).toMatchObject({
      approvalStatus: "revision_requested",
      approvalRequestStatus: "approved",
    });

    const beforeEdit = (await (
      await request(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as {
      workOrder: { workStatus: string; approvalStatus: string };
      approval: {
        requestStatus: string;
        revisionComment: string | null;
        correctionRequestedAt: string | null;
      };
      draft: Record<string, unknown>;
    };
    expect(beforeEdit.workOrder).toMatchObject({
      workStatus: "completed",
      approvalStatus: "revision_requested",
    });
    expect(beforeEdit.approval).toMatchObject({
      requestStatus: "approved",
      revisionComment: "부품 수량 오기를 정정합니다",
    });
    expect(beforeEdit.approval.correctionRequestedAt).not.toBeNull();

    const update = await request(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: {
          ...beforeEdit.draft,
          workSummary: "부품 수량을 정정한 최종 보고서",
        },
      }),
    });
    expect(update.status).toBe(200);
    const finalizeV2 = await request(
      db,
      `/work-orders/${id}/report/finalize`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    expect(finalizeV2.status).toBe(200);
    const finalizeJson = (await finalizeV2.json()) as {
      reportVersion: { version: number };
    };
    expect(finalizeJson.reportVersion.version).toBe(2);
    await uploadReadyApprovalPdfArtifact(db, id, admin.token);

    const secondLink = await request(db, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
    });
    expect(secondLink.status).toBe(200);
    const { token: secondToken } = (await secondLink.json()) as {
      token: string;
    };
    expect((await approve(db, secondToken, "2차 승인자")).status).toBe(200);

    const signatures = await db
      .prepare(
        `SELECT rv.version, sig.name, sig.agreed, sig.consent_version
         FROM signatures sig
         JOIN approval_requests ar ON ar.id = sig.approval_request_id
         JOIN report_versions rv ON rv.id = ar.report_version_id
         WHERE ar.work_order_id = ?
         ORDER BY rv.version ASC`,
      )
      .bind(id)
      .all<{
        version: number;
        name: string;
        agreed: number;
        consent_version: string;
      }>();
    expect(signatures.results ?? []).toEqual([
      {
        version: 1,
        name: "1차 승인자",
        agreed: 1,
        consent_version: APPROVAL_CONSENT_VERSION,
      },
      {
        version: 2,
        name: "2차 승인자",
        agreed: 1,
        consent_version: APPROVAL_CONSENT_VERSION,
      },
    ]);

    const finalDetail = (await (
      await request(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as {
      workOrder: { workStatus: string; approvalStatus: string };
      reportVersions: Array<{ version: number }>;
    };
    expect(finalDetail.workOrder).toMatchObject({
      workStatus: "completed",
      approvalStatus: "approved",
    });
    expect(finalDetail.reportVersions.map((version) => version.version)).toEqual([
      1, 2,
    ]);
  });

  it("uses CAS so concurrent office correction requests create one correction window", async () => {
    const admin = await signup(db, "approval-correction-race@test.local");
    const { id, approvalToken } = await runToApprovalLink(db, admin.token);
    expect((await approve(db, approvalToken, "승인자")).status).toBe(200);

    let signalPaused!: () => void;
    const paused = new Promise<void>((resolve) => {
      signalPaused = resolve;
    });
    let signalResume!: () => void;
    const resume = new Promise<void>((resolve) => {
      signalResume = resolve;
    });
    const racingDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      signalPaused,
      resume,
    );
    const stalePromise = request(
      racingDb,
      `/work-orders/${id}/report-correction`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ comment: "늦게 도착한 정정 요청" }),
      },
    );
    await paused;

    const winner = await request(db, `/work-orders/${id}/report-correction`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ comment: "먼저 반영된 정정 요청" }),
    });
    expect(winner.status).toBe(200);
    signalResume();

    const stale = await stalePromise;
    expect(stale.status).toBe(409);
    const stored = await db
      .prepare(
        `SELECT revision_comment, correction_requested_at
         FROM approval_requests
         WHERE work_order_id = ? AND status = 'approved'`,
      )
      .bind(id)
      .first<{
        revision_comment: string | null;
        correction_requested_at: string | null;
      }>();
    expect(stored?.revision_comment).toBe("먼저 반영된 정정 요청");
    expect(stored?.correction_requested_at).not.toBeNull();
  });
});
