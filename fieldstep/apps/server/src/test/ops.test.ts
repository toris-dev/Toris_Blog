/**
 * 통합관리자(서비스 운영자) 콘솔 — PRD §14.3 운영자 도구 서버 테스트.
 *
 * e2e.test.ts와 동일한 패턴(D1 shim + app.request)을 따르되, /ops 라우트는
 * env.PLATFORM_OPERATOR_EMAILS(운영자 allowlist)를 필요로 하므로 req 헬퍼가
 * 세 번째 인자(env)로 그 값을 전달한다.
 */
import { describe, it, expect, beforeEach } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

const OPERATOR_EMAIL = "op@example.com";
const PASSWORD = "password123";

/**
 * /ops 요청 헬퍼. operatorEmails가 undefined이면 PLATFORM_OPERATOR_EMAILS를
 * 전혀 설정하지 않는다(allowlist 미설정 시나리오 재현). 기본값은 운영자 이메일.
 */
function req(
  db: D1Database,
  path: string,
  init: RequestInit & { token?: string } = {},
  // null(또는 빈 문자열) = allowlist 미설정 시나리오. undefined는 기본 파라미터가
  // 삼켜 기본값(OPERATOR_EMAIL)이 되므로 반드시 null을 넘겨야 "미설정"을 재현한다.
  operatorEmails: string | null = OPERATOR_EMAIL,
) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const env: Record<string, unknown> = { DB: db };
  if (operatorEmails) env.PLATFORM_OPERATOR_EMAILS = operatorEmails;
  return app.request(path, { ...rest, headers }, env as never);
}

type SignupResult = { token: string; user: { id: string }; org: { id: string } };

async function signup(
  db: D1Database,
  orgName: string,
  email: string,
  extra: Record<string, unknown> = {},
): Promise<SignupResult> {
  const res = await req(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD, name: "관리자", orgName, ...extra }),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as SignupResult;
}

/** 운영자 사용자를 가입시키고 로그인해 운영자 세션 토큰을 반환한다. */
async function operatorLogin(db: D1Database): Promise<string> {
  await signup(db, "운영자조직", OPERATOR_EMAIL);
  const res = await req(db, "/ops/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: OPERATOR_EMAIL, password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

/** 최소 작업(고객·현장·작업지시) 생성 후 작업 id를 반환한다. */
async function createWorkOrder(db: D1Database, token: string): Promise<string> {
  const me = (await (await req(db, "/me", { token })).json()) as { user: { id: string } };
  const custRes = await req(db, "/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "고객" }),
  });
  const { customer } = (await custRes.json()) as { customer: { id: string } };
  const siteRes = await req(db, "/sites", {
    method: "POST",
    token,
    body: JSON.stringify({ customerId: customer.id, name: "현장" }),
  });
  const { site } = (await siteRes.json()) as { site: { id: string } };
  const woRes = await req(db, "/work-orders", {
    method: "POST",
    token,
    body: JSON.stringify({
      scheduledDate: "2026-07-24",
      workType: "점검",
      customerId: customer.id,
      siteId: site.id,
      assigneeIds: [me.user.id],
    }),
  });
  expect(woRes.status).toBe(200);
  return ((await woRes.json()) as { workOrder: { id: string } }).workOrder.id;
}

describe("fieldstep ops 콘솔(운영자)", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  // -------------------------------------------------------------------------
  // 1) 운영자 인증
  // -------------------------------------------------------------------------

  it("allowlist에 있는 사용자는 올바른 비밀번호로 로그인 200 + {token, operator}", async () => {
    await signup(db, "운영자조직", OPERATOR_EMAIL);
    const res = await req(db, "/ops/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: OPERATOR_EMAIL, password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      token: string;
      operator: { id: string; email: string; name: string };
    };
    expect(json.token.length).toBeGreaterThan(0);
    expect(json.operator.email).toBe(OPERATOR_EMAIL);
  });

  it("잘못된 비밀번호는 401", async () => {
    await signup(db, "운영자조직", OPERATOR_EMAIL);
    const res = await req(db, "/ops/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: OPERATOR_EMAIL, password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("allowlist에 없는 사용자는 올바른 비밀번호여도 401", async () => {
    await signup(db, "운영자조직", OPERATOR_EMAIL);
    await signup(db, "일반조직", "notop@example.com");
    // allowlist는 OPERATOR_EMAIL 뿐 — notop은 자격 없음.
    const res = await req(db, "/ops/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "notop@example.com", password: PASSWORD }),
    });
    expect(res.status).toBe(401);
  });

  it("allowlist 미설정(PLATFORM_OPERATOR_EMAILS undefined)이면 운영자 로그인 401", async () => {
    await signup(db, "운영자조직", OPERATOR_EMAIL);
    const res = await req(
      db,
      "/ops/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: OPERATOR_EMAIL, password: PASSWORD }),
      },
      null,
    );
    expect(res.status).toBe(401);
  });

  it("GET /ops/me — 운영자 토큰이면 200 {operator}, 토큰 없으면 401", async () => {
    const token = await operatorLogin(db);
    const ok = await req(db, "/ops/me", { token });
    expect(ok.status).toBe(200);
    const json = (await ok.json()) as { operator: { id: string; email: string; name: string } };
    expect(json.operator.email).toBe(OPERATOR_EMAIL);

    const noToken = await req(db, "/ops/me");
    expect(noToken.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // 2) requireOperator 가드
  // -------------------------------------------------------------------------

  it("GET /ops/orgs — 토큰 없으면 401", async () => {
    const res = await req(db, "/ops/orgs");
    expect(res.status).toBe(401);
  });

  it("GET /ops/orgs — 일반 조직 세션 토큰은 운영자로 취급되지 않는다(401)", async () => {
    const admin = await signup(db, "일반조직", "admin@example.com");
    const res = await req(db, "/ops/orgs", { token: admin.token });
    expect([401, 403]).toContain(res.status);
  });

  // -------------------------------------------------------------------------
  // 3) 교차 조직 가시성
  // -------------------------------------------------------------------------

  it("GET /ops/orgs — 여러 조직을 모두 반환한다", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");
    const b = await signup(db, "B조직", "admin-b@example.com");

    const res = await req(db, "/ops/orgs", { token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      orgs: { id: string; name: string; members: number; work_orders: number }[];
    };
    const ids = json.orgs.map((o) => o.id);
    expect(ids).toContain(a.org.id);
    expect(ids).toContain(b.org.id);
    // 각 신규 조직은 admin 1명.
    const orgA = json.orgs.find((o) => o.id === a.org.id)!;
    expect(orgA.members).toBe(1);
    expect(orgA.work_orders).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 4) 도구 해피패스
  // -------------------------------------------------------------------------

  it("GET /ops/orgs/:id — 200이며 contactEmail이 마스킹된다", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com", {
      orgContactEmail: "owner@example.com",
      orgContactPhone: "010-1234-5678",
    });

    const res = await req(db, `/ops/orgs/${a.org.id}`, { token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      org: { id: string; name: string };
      profile: { contactEmail: string | null; contactPhone: string | null } | null;
    };
    expect(json.org.id).toBe(a.org.id);
    expect(json.profile).not.toBeNull();
    // 원문이 아닌 마스킹 값(• 포함)이어야 한다.
    expect(json.profile!.contactEmail).toContain("•");
    expect(json.profile!.contactEmail).not.toBe("owner@example.com");
    expect(json.profile!.contactPhone).toContain("•");
  });

  it("GET /ops/orgs/:id — 없는 조직은 404", async () => {
    const token = await operatorLogin(db);
    const res = await req(db, "/ops/orgs/does-not-exist", { token });
    expect(res.status).toBe(404);
  });

  it("GET /ops/orgs/:id/usage — 200이며 수치 필드를 반환한다", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");
    await createWorkOrder(db, a.token);

    const res = await req(db, `/ops/orgs/${a.org.id}/usage`, { token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      orgId: string;
      workOrders: number;
      reports: number;
      storageBytes: number;
      photoCount: number;
      voiceMinutes: number;
    };
    expect(json.orgId).toBe(a.org.id);
    expect(json.workOrders).toBe(1);
    expect(typeof json.reports).toBe("number");
    expect(typeof json.storageBytes).toBe("number");
    expect(typeof json.photoCount).toBe("number");
    expect(typeof json.voiceMinutes).toBe("number");
  });

  it("템플릿 업로드 → 활성화 → 목록에서 active:true (활성 유일성 보장)", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");

    const createV1 = await req(db, `/ops/orgs/${a.org.id}/templates`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: "v1", config: { a: 1 } }),
    });
    expect(createV1.status).toBe(200);
    const v1 = (await createV1.json()) as { id: string; version: number; active: boolean };
    expect(v1.version).toBe(1);
    expect(v1.active).toBe(false);

    const activateV1 = await req(
      db,
      `/ops/orgs/${a.org.id}/templates/${v1.id}/activate`,
      { method: "POST", token },
    );
    expect(activateV1.status).toBe(200);
    expect(((await activateV1.json()) as { ok: boolean }).ok).toBe(true);

    const listAfterV1 = await req(db, `/ops/orgs/${a.org.id}/templates`, { token });
    const afterV1 = (await listAfterV1.json()) as {
      templates: { id: string; version: number; active: boolean }[];
    };
    expect(afterV1.templates.find((t) => t.id === v1.id)!.active).toBe(true);

    // 두 번째 템플릿을 활성화하면 첫 번째는 비활성(활성 유일성 부분 인덱스 검증).
    const createV2 = await req(db, `/ops/orgs/${a.org.id}/templates`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: "v2", config: { b: 2 } }),
    });
    const v2 = (await createV2.json()) as { id: string; version: number };
    expect(v2.version).toBe(2);

    const activateV2 = await req(
      db,
      `/ops/orgs/${a.org.id}/templates/${v2.id}/activate`,
      { method: "POST", token },
    );
    expect(activateV2.status).toBe(200);

    const listAfterV2 = await req(db, `/ops/orgs/${a.org.id}/templates`, { token });
    const afterV2 = (await listAfterV2.json()) as {
      templates: { id: string; active: boolean }[];
    };
    expect(afterV2.templates.find((t) => t.id === v2.id)!.active).toBe(true);
    expect(afterV2.templates.find((t) => t.id === v1.id)!.active).toBe(false);
    expect(afterV2.templates.filter((t) => t.active).length).toBe(1);
  });

  it("템플릿 업로드 검증 — 이름/설정 누락 400, 없는 조직 404", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");

    const noName = await req(db, `/ops/orgs/${a.org.id}/templates`, {
      method: "POST",
      token,
      body: JSON.stringify({ config: { a: 1 } }),
    });
    expect(noName.status).toBe(400);

    const noConfig = await req(db, `/ops/orgs/${a.org.id}/templates`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: "v1" }),
    });
    expect(noConfig.status).toBe(400);

    const missingOrg = await req(db, "/ops/orgs/nope/templates", {
      method: "POST",
      token,
      body: JSON.stringify({ name: "v1", config: {} }),
    });
    expect(missingOrg.status).toBe(404);
  });

  it("GET /ops/orgs/:id/export?format=json — 200이며 배열 섹션을 반환한다", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");
    await createWorkOrder(db, a.token);

    const res = await req(db, `/ops/orgs/${a.org.id}/export?format=json`, { token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      org: { id: string; name: string };
      customers: unknown[];
      sites: unknown[];
      assets: unknown[];
      workOrders: unknown[];
      billingRecords: unknown[];
    };
    expect(json.org.id).toBe(a.org.id);
    expect(Array.isArray(json.customers)).toBe(true);
    expect(json.customers.length).toBe(1);
    expect(Array.isArray(json.sites)).toBe(true);
    expect(json.workOrders.length).toBe(1);
    expect(Array.isArray(json.billingRecords)).toBe(true);
  });

  it("GET /ops/orgs/:id/export — csv는 text/csv, 잘못된 format은 400", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");
    await createWorkOrder(db, a.token);

    const csv = await req(db, `/ops/orgs/${a.org.id}/export?format=csv`, { token });
    expect(csv.status).toBe(200);
    expect(csv.headers.get("Content-Type")).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain("## customers");

    const bad = await req(db, `/ops/orgs/${a.org.id}/export?format=xml`, { token });
    expect(bad.status).toBe(400);
  });

  it("GET /ops/audit — 200이며 최소한 가입 감사 이벤트를 포함한다", async () => {
    const token = await operatorLogin(db);
    await signup(db, "A조직", "admin-a@example.com");

    const res = await req(db, "/ops/audit", { token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      events: { id: string; event: string; orgId: string }[];
    };
    expect(json.events.length).toBeGreaterThan(0);
    expect(json.events.some((e) => e.event === "signup")).toBe(true);
  });

  it("작업 재처리 — 없는 작업 404, 잘못된 target 400, 실패 상태 리셋은 {ok:true}", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");

    const missing = await req(db, "/ops/work-orders/nope/reprocess", {
      method: "POST",
      token,
      body: JSON.stringify({ target: "ai" }),
    });
    expect(missing.status).toBe(404);

    const workOrderId = await createWorkOrder(db, a.token);

    const badTarget = await req(db, `/ops/work-orders/${workOrderId}/reprocess`, {
      method: "POST",
      token,
      body: JSON.stringify({ target: "bogus" }),
    });
    expect(badTarget.status).toBe(400);

    // AI 초안이 실패한 상태를 만들고 재처리로 pending 복구(멱등 리셋) 확인.
    await db
      .prepare("UPDATE work_orders SET ai_status = 'failed' WHERE id = ?")
      .bind(workOrderId)
      .run();
    const reprocess = await req(db, `/ops/work-orders/${workOrderId}/reprocess`, {
      method: "POST",
      token,
      body: JSON.stringify({ target: "ai" }),
    });
    expect(reprocess.status).toBe(200);
    const json = (await reprocess.json()) as {
      ok: boolean;
      target: string;
      resetCount: number;
    };
    expect(json.ok).toBe(true);
    expect(json.target).toBe("ai");
    expect(json.resetCount).toBe(1);

    const row = await db
      .prepare("SELECT ai_status FROM work_orders WHERE id = ?")
      .bind(workOrderId)
      .first<{ ai_status: string }>();
    expect(row?.ai_status).toBe("pending");
  });

  it("운영자 행위는 대상 조직 감사 로그에 남는다(export → ops.export)", async () => {
    const token = await operatorLogin(db);
    const a = await signup(db, "A조직", "admin-a@example.com");

    const res = await req(db, `/ops/orgs/${a.org.id}/export?format=json`, { token });
    expect(res.status).toBe(200);

    const audit = await db
      .prepare(
        "SELECT event, org_id FROM audit_events WHERE org_id = ? AND event = 'ops.export'",
      )
      .bind(a.org.id)
      .first<{ event: string; org_id: string }>();
    expect(audit?.event).toBe("ops.export");
  });

  // -------------------------------------------------------------------------
  // 5) 조직 격리 보존 — 운영자 코드가 조직 라우트를 약화시키지 않았는지 확인
  // -------------------------------------------------------------------------

  it("일반 admin은 여전히 타 조직 작업에 접근할 수 없다(404)", async () => {
    const a = await signup(db, "A조직", "admin-a@example.com");
    const b = await signup(db, "B조직", "admin-b@example.com");
    const bWorkOrderId = await createWorkOrder(db, b.token);

    const cross = await req(db, `/work-orders/${bWorkOrderId}`, { token: a.token });
    expect(cross.status).toBe(404);
  });
});
