import { describe, it, expect, beforeEach } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";
import { minimalParseablePdf } from "./pdf-fixture.js";
import { MemoryR2 } from "./r2-shim.js";

const TEST_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgo=";
let mediaBucket: MemoryR2;

function req(db: D1Database, path: string, init: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
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
        if (!sql.includes(sqlFragment)) {
          return statement;
        }

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

async function signup(db: D1Database, orgName: string, email = "admin@a.com") {
  const res = await req(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123", name: "관리자", orgName }),
  });
  const json = await res.json();
  return json as { token: string; user: { id: string }; org: { id: string } };
}

describe("fieldstep-api e2e", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
    mediaBucket = new MemoryR2();
  });

  // -------------------------------------------------------------------------
  // 인증
  // -------------------------------------------------------------------------

  it("회원가입 → 로그인 → /me", async () => {
    const { token, org } = await signup(db, "A조직");
    const me = await req(db, "/me", { token });
    expect(me.status).toBe(200);
    const meJson = (await me.json()) as any;
    expect(meJson.org.id).toBe(org.id);
    expect(meJson.role).toBe("admin");

    const login = await req(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@a.com", password: "password123" }),
    });
    expect(login.status).toBe(200);
  });

  it("잘못된 비밀번호는 401", async () => {
    await signup(db, "A조직");
    const res = await req(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@a.com", password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("로그인 무차별 대입: 반복 실패 시 429로 스로틀된다", async () => {
    await signup(db, "A조직");
    // 허용 실패 횟수(8) 소진 — 모두 401
    for (let i = 0; i < 8; i++) {
      const res = await req(db, "/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "admin@a.com", password: "wrongpassword" }),
      });
      expect(res.status).toBe(401);
    }
    // 다음 시도는 올바른 비밀번호여도 429(차단)
    const blocked = await req(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@a.com", password: "password123" }),
    });
    expect(blocked.status).toBe(429);
    // 다른 계정 키는 영향받지 않는다
    const other = await req(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "other@a.com", password: "password123" }),
    });
    expect(other.status).toBe(401);
  });

  it("로그아웃 후 세션은 무효", async () => {
    const { token } = await signup(db, "A조직");
    const out = await req(db, "/auth/logout", { method: "POST", token });
    expect(out.status).toBe(200);
    const me = await req(db, "/me", { token });
    expect(me.status).toBe(401);
  });

  it("초대 수락 플로우", async () => {
    const { token } = await signup(db, "A조직");
    const inviteRes = await req(db, "/invites", {
      method: "POST",
      token,
      body: JSON.stringify({ email: "field1@a.com", role: "field" }),
    });
    expect(inviteRes.status).toBe(200);
    const { invite } = (await inviteRes.json()) as { invite: { token: string } };

    const acceptRes = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token: invite.token, name: "현장A", password: "password123" }),
    });
    expect(acceptRes.status).toBe(200);
    const acceptJson = (await acceptRes.json()) as any;
    expect(acceptJson.role).toBe("field");
  });

  it("만료된 초대 토큰은 400", async () => {
    const { token, org } = await signup(db, "A조직");
    const inviteRes = await req(db, "/invites", { method: "POST", token, body: JSON.stringify({ email: "x@a.com", role: "office" }) });
    const { invite } = (await inviteRes.json()) as { invite: { id: string; token: string } };
    // 강제로 만료시킨다
    await db.prepare("UPDATE invites SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").bind(invite.id).run();
    const acceptRes = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token: invite.token, name: "x", password: "password123" }),
    });
    expect(acceptRes.status).toBe(400);
    void org;
  });

  it("초대는 admin만 생성 가능(office는 403)", async () => {
    const { token } = await signup(db, "A조직");
    const inviteRes = await req(db, "/invites", { method: "POST", token, body: JSON.stringify({ email: "office1@a.com", role: "office" }) });
    const { invite } = (await inviteRes.json()) as { invite: { token: string } };
    const acceptRes = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token: invite.token, name: "사무직원", password: "password123" }),
    });
    const officeJson = (await acceptRes.json()) as { token: string };

    const forbidden = await req(db, "/invites", {
      method: "POST",
      token: officeJson.token,
      body: JSON.stringify({ email: "another@a.com", role: "field" }),
    });
    expect(forbidden.status).toBe(403);
  });

  // -------------------------------------------------------------------------
  // 조직 격리
  // -------------------------------------------------------------------------

  it("조직 격리: A 토큰으로 B의 고객 접근 불가(404)", async () => {
    const a = await signup(db, "A조직", "admin-a@x.com");
    const b = await signup(db, "B조직", "admin-b@x.com");

    const customerRes = await req(db, "/customers", {
      method: "POST",
      token: b.token,
      body: JSON.stringify({ name: "B고객" }),
    });
    const { customer } = (await customerRes.json()) as { customer: { id: string } };

    const cross = await req(db, `/customers/${customer.id}`, { token: a.token });
    expect(cross.status).toBe(404);
  });

  it("조직 격리: A 토큰으로 B의 작업 접근 불가(404)", async () => {
    const a = await signup(db, "A조직", "admin-a2@x.com");
    const b = await signup(db, "B조직", "admin-b2@x.com");
    const { id: bWorkOrderId } = await createFullWorkOrder(db, b.token, b.org.id);

    const cross = await req(db, `/work-orders/${bWorkOrderId}`, { token: a.token });
    expect(cross.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // 역할
  // -------------------------------------------------------------------------

  it("field 역할은 작업 생성 403", async () => {
    const admin = await signup(db, "C조직", "admin-c@x.com");
    const fieldToken = await inviteAndAccept(db, admin.token, "field-c@x.com", "field");
    const customer = await createCustomer(db, admin.token, "고객1");
    const site = await createSite(db, admin.token, customer.id, "현장1");

    const res = await req(db, "/work-orders", {
      method: "POST",
      token: fieldToken,
      body: JSON.stringify({ scheduledDate: "2026-07-24", workType: "정기점검", customerId: customer.id, siteId: site.id, assigneeIds: [] }),
    });
    expect(res.status).toBe(403);
  });

  it("field 역할은 미배정 작업 조회 불가(404)", async () => {
    const admin = await signup(db, "D조직", "admin-d@x.com");
    const fieldToken = await inviteAndAccept(db, admin.token, "field-d@x.com", "field");
    const customer = await createCustomer(db, admin.token, "고객1");
    const site = await createSite(db, admin.token, customer.id, "현장1");
    const woRes = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ scheduledDate: "2026-07-24", workType: "정기점검", customerId: customer.id, siteId: site.id, assigneeIds: [] }),
    });
    const { workOrder } = (await woRes.json()) as { workOrder: { id: string } };

    const detail = await req(db, `/work-orders/${workOrder.id}`, { token: fieldToken });
    expect(detail.status).toBe(404);

    const list = await req(db, "/work-orders", { token: fieldToken });
    const listJson = (await list.json()) as { workOrders: unknown[] };
    expect(listJson.workOrders.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 수직 플로우 e2e
  // -------------------------------------------------------------------------

  it("수직 플로우: 고객→현장→장비→작업생성→시작→기록→제출→리포트→확정→승인링크→열람→승인→청구→대시보드→알림", async () => {
    const admin = await signup(db, "E조직", "admin-e@x.com");
    const fieldToken = await inviteAndAccept(db, admin.token, "field-e@x.com", "field");
    const fieldMe = (await (await req(db, "/me", { token: fieldToken })).json()) as any;
    // 서버 대시보드는 서울(Asia/Seoul) 기준 오늘로 카운트하므로 테스트도 동일 기준을 써야 한다.
    // UTC 날짜(toISOString)를 쓰면 UTC/서울 자정 사이 구간(예: 00~09시 KST)에서 하루가 어긋나 flaky.
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

    const customer = await createCustomer(db, admin.token, "이엔지고객");
    const site = await createSite(db, admin.token, customer.id, "본사현장");
    const assetRes = await req(db, "/assets", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ siteId: site.id, name: "냉동기1호" }),
    });
    const { asset } = (await assetRes.json()) as { asset: { id: string } };

    // 작업 생성 (scheduled)
    const createRes = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: today,
        workType: "정기점검",
        customerId: customer.id,
        siteId: site.id,
        assetId: asset.id,
        assigneeIds: [fieldMe.user.id],
      }),
    });
    expect(createRes.status).toBe(200);
    const { workOrder } = (await createRes.json()) as { workOrder: { id: string; workStatus: string } };
    expect(workOrder.workStatus).toBe("scheduled");

    // 배정 알림 생성 확인
    const notifBefore = await req(db, "/notifications?unread=1", { token: fieldToken });
    const notifBeforeJson = (await notifBefore.json()) as { notifications: unknown[] };
    expect(notifBeforeJson.notifications.length).toBeGreaterThan(0);

    // start (필드가 배정된 상태)
    const startRes = await req(db, `/work-orders/${workOrder.id}/start`, { method: "POST", token: fieldToken });
    expect(startRes.status).toBe(200);

    // field-record 임시저장
    const frRes = await req(db, `/work-orders/${workOrder.id}/field-record`, {
      method: "PUT",
      token: fieldToken,
      body: JSON.stringify({ transcript: "냉매 5개 교체 함. 압축기 소음 발견.", workSummary: "정기점검 수행" }),
    });
    expect(frRes.status).toBe(200);

    // photo 업로드
    const photoRes = await req(db, `/work-orders/${workOrder.id}/photos`, {
      method: "POST",
      token: fieldToken,
      body: JSON.stringify({ kind: "before", dataUrl: TEST_PNG_DATA_URL }),
    });
    expect(photoRes.status).toBe(200);

    // submit
    const submitRes = await req(db, `/work-orders/${workOrder.id}/submit`, { method: "POST", token: fieldToken });
    expect(submitRes.status).toBe(200);
    const submitJson = (await submitRes.json()) as { aiStatus: string };
    expect(["drafted", "failed"]).toContain(submitJson.aiStatus);

    const detailAfterSubmit = (await (await req(db, `/work-orders/${workOrder.id}`, { token: admin.token })).json()) as any;
    expect(detailAfterSubmit.draft).not.toBeNull();

    // report PUT (검토 수정)
    const reportPutRes = await req(db, `/work-orders/${workOrder.id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: {
          workSummary: "정기점검 수행 완료",
          actions: ["점검"],
          usedParts: [{ name: "냉매", quantity: 5, unit: "개" }],
          issues: ["압축기 소음"],
          recommendations: [],
          nextInspectionDate: null,
          uncertainFields: [],
        },
      }),
    });
    expect(reportPutRes.status).toBe(200);

    // finalize (version 1)
    const finalizeRes = await req(db, `/work-orders/${workOrder.id}/report/finalize`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ confirmedUncertainFields: [] }),
    });
    expect(finalizeRes.status).toBe(200);
    const { reportVersion } = (await finalizeRes.json()) as { reportVersion: { version: number; reportNumber: string } };
    expect(reportVersion.version).toBe(1);
    expect(reportVersion.reportNumber).toBe(`FS-${today.replaceAll("-", "")}-001`);
    await markReportPdfReady(db, workOrder.id, 1, admin.token);

    // approval-link 생성
    const linkRes = await req(db, `/work-orders/${workOrder.id}/approval-links`, { method: "POST", token: admin.token });
    expect(linkRes.status).toBe(200);
    const { token: approvalToken } = (await linkRes.json()) as { token: string };

    // public GET (viewedAt 기록)
    const publicGet1 = await req(db, `/public/approvals/${approvalToken}`);
    expect(publicGet1.status).toBe(200);
    const publicJson1 = (await publicGet1.json()) as { viewedAt: string | null };
    expect(publicJson1.viewedAt).not.toBeNull();

    // approve (서명)
    const approveRes = await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({ name: "고객담당자", title: "팀장", signatureDataUrl: TEST_PNG_DATA_URL, agree: true }),
    });
    expect(approveRes.status).toBe(200);

    // billing = billable 확인
    const afterApprove = (await (await req(db, `/work-orders/${workOrder.id}`, { token: admin.token })).json()) as any;
    expect(afterApprove.workOrder.billingStatus).toBe("billable");
    expect(afterApprove.approval.status).toBe("approved");

    // billing PUT
    const billingPutRes = await req(db, `/work-orders/${workOrder.id}/billing`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ amount: 150000, billedAt: "2026-07-25", dueAt: "2026-08-25" }),
    });
    expect(billingPutRes.status).toBe(200);
    const billingJson = (await billingPutRes.json()) as { billing: { status: string } };
    expect(billingJson.billing.status).toBe("billed");

    // 대시보드 카운트
    const dashRes = await req(db, "/dashboard", { token: admin.token });
    const dashJson = (await dashRes.json()) as { counts: Record<string, number> };
    expect(dashJson.counts.today).toBeGreaterThanOrEqual(1);

    // 알림 존재(사무실 승인 알림)
    const notifs = await req(db, "/notifications", { token: admin.token });
    const notifsJson = (await notifs.json()) as { notifications: { kind: string }[] };
    expect(notifsJson.notifications.some((n) => n.kind === "approved")).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 전이 가드
  // -------------------------------------------------------------------------

  it("scheduled 상태에서 submit 호출 시 409", async () => {
    const admin = await signup(db, "F조직", "admin-f@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    const res = await req(db, `/work-orders/${id}/submit`, { method: "POST", token: admin.token });
    expect(res.status).toBe(409);
  });

  it("서명(승인) 이후에는 report PUT이 409(새 버전 필요)", async () => {
    const admin = await signup(db, "G조직", "admin-g@x.com");
    const { id, approvalToken } = await runToFinalized(db, admin.token, admin.org.id);

    await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({ name: "고객", signatureDataUrl: TEST_PNG_DATA_URL, agree: true }),
    });

    const putRes = await req(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: { workSummary: "수정", actions: [], usedParts: [], issues: [], recommendations: [], nextInspectionDate: null, uncertainFields: [] },
      }),
    });
    expect(putRes.status).toBe(409);
  });

  it("만료된 승인 토큰은 410", async () => {
    const admin = await signup(db, "H조직", "admin-h@x.com");
    const { id } = await runToFinalized(db, admin.token, admin.org.id);
    const linkRes = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    const { token: approvalToken } = (await linkRes.json()) as { token: string };

    await db.prepare("UPDATE approval_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE work_order_id = ?").bind(id).run();

    const res = await req(db, `/public/approvals/${approvalToken}`);
    expect(res.status).toBe(410);
    const json = (await res.json()) as any;
    expect(json.approval).toBe("expired");
  });

  it("승인 링크 재발급 시 구 토큰은 무효(404)", async () => {
    const admin = await signup(db, "I조직", "admin-i@x.com");
    const { id } = await runToFinalized(db, admin.token, admin.org.id);

    const link1 = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    const { token: token1 } = (await link1.json()) as { token: string };

    const link2 = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    const { token: token2 } = (await link2.json()) as { token: string };
    expect(token2).not.toBe(token1);

    const oldGet = await req(db, `/public/approvals/${token1}`);
    expect(oldGet.status).toBe(410);

    const oldApprove = await req(db, `/public/approvals/${token1}/approve`, {
      method: "POST",
      body: JSON.stringify({ name: "고객", signatureDataUrl: TEST_PNG_DATA_URL, agree: true }),
    });
    expect(oldApprove.status).toBe(410);

    const newGet = await req(db, `/public/approvals/${token2}`);
    expect(newGet.status).toBe(200);
  });

  it("존재하지 않는 승인 토큰은 404", async () => {
    const res = await req(db, "/public/approvals/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("finalize 없이 approval-link 요청은 400", async () => {
    const admin = await signup(db, "J조직", "admin-j@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    const res = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    expect(res.status).toBe(400);
  });

  it("in_progress가 아닌 상태에서 field-record 저장은 409", async () => {
    const admin = await signup(db, "K조직", "admin-k@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    const res = await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "test" }),
    });
    expect(res.status).toBe(409);
  });

  it("승인완료 전 billing PUT은 409", async () => {
    const admin = await signup(db, "L조직", "admin-l@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    const res = await req(db, `/work-orders/${id}/billing`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ amount: 1000 }),
    });
    expect(res.status).toBe(409);
  });

  it("입력값 검증 실패는 400", async () => {
    const admin = await signup(db, "M조직", "admin-m@x.com");
    const res = await req(db, "/customers", { method: "POST", token: admin.token, body: JSON.stringify({}) });
    expect(res.status).toBe(400);
  });

  it("인증 없이 보호된 라우트 접근은 401", async () => {
    const res = await req(db, "/customers");
    expect(res.status).toBe(401);
  });

  it("헬스체크", async () => {
    const res = await req(db, "/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, service: "fieldstep-api" });
  });

  it("알림 읽음 처리", async () => {
    const admin = await signup(db, "N조직", "admin-n@x.com");
    const fieldToken = await inviteAndAccept(db, admin.token, "field-n@x.com", "field");
    const fieldMe = (await (await req(db, "/me", { token: fieldToken })).json()) as any;
    const customer = await createCustomer(db, admin.token, "고객N");
    const site = await createSite(db, admin.token, customer.id, "현장N");
    const woRes = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ scheduledDate: "2026-07-24", workType: "점검", customerId: customer.id, siteId: site.id, assigneeIds: [fieldMe.user.id] }),
    });
    const { workOrder } = (await woRes.json()) as { workOrder: { id: string } };

    const before = (await (await req(db, "/notifications?unread=1", { token: fieldToken })).json()) as { notifications: { id: string }[] };
    expect(before.notifications.length).toBe(1);

    const readRes = await req(db, "/notifications/read", {
      method: "POST",
      token: fieldToken,
      body: JSON.stringify({ ids: [before.notifications[0]!.id] }),
    });
    expect(readRes.status).toBe(200);

    const after = (await (await req(db, "/notifications?unread=1", { token: fieldToken })).json()) as { notifications: unknown[] };
    expect(after.notifications.length).toBe(0);
    void workOrder;
  });

  it("고객 검색(q) 필터", async () => {
    const admin = await signup(db, "O조직", "admin-o@x.com");
    await createCustomer(db, admin.token, "가나다전자");
    await createCustomer(db, admin.token, "마바사기계");
    const res = await req(db, "/customers?q=가나다", { token: admin.token });
    const json = (await res.json()) as { customers: { name: string }[] };
    expect(json.customers.length).toBe(1);
    expect(json.customers[0]!.name).toBe("가나다전자");
  });

  it("자산 이력 조회", async () => {
    const admin = await signup(db, "P조직", "admin-p@x.com");
    const { asset } = await createFullWorkOrder(db, admin.token, admin.org.id, true);
    const res = await req(db, `/assets/${asset!.id}/history`, { token: admin.token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { workOrders: unknown[] };
    expect(json.workOrders.length).toBe(1);
  });

  it("공개 승인 GET은 작업·고객·현장 컨텍스트를 포함한다", async () => {
    const admin = await signup(db, "Q조직", "admin-q@x.com");
    const { approvalToken } = await runToFinalized(db, admin.token, admin.org.id);
    const res = await req(db, `/public/approvals/${approvalToken}`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      reportVersion: {
        workOrder: { scheduledDate: string; workType: string };
        customer: { name: string };
        site: { name: string };
      };
    };
    expect(json.reportVersion.workOrder.scheduledDate).toBe("2026-07-24");
    expect(json.reportVersion.workOrder.workType).toBe("정기점검");
    expect(json.reportVersion.customer.name).toBe("기본고객");
    expect(json.reportVersion.site.name).toBe("기본현장");
  });

  it("보고서 버전 스냅샷 조회 — 승인 후 서명·잠금 포함", async () => {
    const admin = await signup(db, "R조직", "admin-r@x.com");
    const { id, approvalToken } = await runToFinalized(db, admin.token, admin.org.id);

    const beforeApprove = await req(db, `/work-orders/${id}/report-versions/1`, { token: admin.token });
    expect(beforeApprove.status).toBe(200);
    const beforeJson = (await beforeApprove.json()) as {
      reportVersion: { structured: { workSummary: string }; lockedAt: string | null; signature: unknown };
    };
    expect(beforeJson.reportVersion.structured.workSummary).toBe("점검 완료");
    expect(beforeJson.reportVersion.lockedAt).toBeNull();
    expect(beforeJson.reportVersion.signature).toBeNull();

    const approveRes = await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({ name: "김승인", title: "팀장", signatureDataUrl: TEST_PNG_DATA_URL, agree: true }),
    });
    expect(approveRes.status).toBe(200);

    const afterApprove = await req(db, `/work-orders/${id}/report-versions/1`, { token: admin.token });
    const afterJson = (await afterApprove.json()) as {
      reportVersion: { lockedAt: string | null; signature: { name: string; signatureDataUrl: string } | null };
    };
    expect(afterJson.reportVersion.lockedAt).not.toBeNull();
    expect(afterJson.reportVersion.signature?.name).toBe("김승인");
    expect(afterJson.reportVersion.signature?.signatureDataUrl).toBe(TEST_PNG_DATA_URL);
  });

  it("보고서 버전 스냅샷 — 타 조직 404, 없는 버전 404", async () => {
    const admin = await signup(db, "S조직", "admin-s@x.com");
    const { id } = await runToFinalized(db, admin.token, admin.org.id);
    const outsider = await signup(db, "S2조직", "admin-s2@x.com");

    const crossOrg = await req(db, `/work-orders/${id}/report-versions/1`, { token: outsider.token });
    expect(crossOrg.status).toBe(404);

    const missing = await req(db, `/work-orders/${id}/report-versions/99`, { token: admin.token });
    expect(missing.status).toBe(404);

    const invalid = await req(db, `/work-orders/${id}/report-versions/abc`, { token: admin.token });
    expect(invalid.status).toBe(400);
  });

  it("현장 제출 응답에 생성된 초안이 포함된다", async () => {
    const admin = await signup(db, "T조직", "admin-t@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    await req(db, `/work-orders/${id}/start`, { method: "POST", token: admin.token });
    await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "6204 베어링 2개 교체 완료. 3개월 후 진동 재점검 권장." }),
    });
    await addTestPhoto(db, id, admin.token);
    const res = await req(db, `/work-orders/${id}/submit`, { method: "POST", token: admin.token });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { aiStatus: string; draft: { workSummary: string; usedParts: unknown[] } | null };
    expect(json.aiStatus).toBe("drafted");
    expect(json.draft).not.toBeNull();
    expect(json.draft!.workSummary.length).toBeGreaterThan(0);
    expect(json.draft!.usedParts.length).toBe(1);
  });


  // -------------------------------------------------------------------------
  // 신규: 완료/취소, revision, 부분저장, 사진 가드, 교차조직 방어
  // -------------------------------------------------------------------------

  it("승인 revision 경로: 요청 → v2 확정 → 최신 버전 링크 재발송", async () => {
    const admin = await signup(db, "U조직", "admin-u@x.com");
    const { id, approvalToken } = await runToFinalized(db, admin.token, admin.org.id);

    const revisionRes = await req(db, `/public/approvals/${approvalToken}/revision`, {
      method: "POST",
      body: JSON.stringify({ comment: "사진을 다시 찍어주세요" }),
    });
    expect(revisionRes.status).toBe(200);

    const detail = (await (await req(db, `/work-orders/${id}`, { token: admin.token })).json()) as any;
    expect(detail.workOrder.approvalStatus).toBe("revision_requested");
    expect(detail.approval.revisionComment).toBe("사진을 다시 찍어주세요");

    const notifs = (await (await req(db, "/notifications", { token: admin.token })).json()) as {
      notifications: { kind: string }[];
    };
    expect(notifs.notifications.some((n) => n.kind === "revision_requested")).toBe(true);

    const prematureResend = await req(db, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
    });
    expect(prematureResend.status).toBe(409);

    const beforeEdit = (await (
      await req(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as any;
    const updateRes = await req(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: {
          ...beforeEdit.draft,
          workSummary: "고객 요청을 반영한 수정본",
        },
      }),
    });
    expect(updateRes.status).toBe(200);

    const finalizeV2 = await req(db, `/work-orders/${id}/report/finalize`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ confirmedUncertainFields: [] }),
    });
    expect(finalizeV2.status).toBe(200);
    const finalizeV2Json = (await finalizeV2.json()) as {
      reportVersion: { version: number };
    };
    expect(finalizeV2Json.reportVersion.version).toBe(2);
    await markReportPdfReady(db, id, 2, admin.token);

    const resendRes = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    expect(resendRes.status).toBe(200);
    const { token: v2Token } = (await resendRes.json()) as { token: string };

    const detailAfterResend = (await (await req(db, `/work-orders/${id}`, { token: admin.token })).json()) as any;
    expect(detailAfterResend.workOrder.approvalStatus).toBe("pending");
    expect(detailAfterResend.reportVersions.map((v: { version: number }) => v.version)).toEqual([1, 2]);

    const v1 = (await (
      await req(db, `/work-orders/${id}/report-versions/1`, { token: admin.token })
    ).json()) as any;
    const v2 = (await (
      await req(db, `/work-orders/${id}/report-versions/2`, { token: admin.token })
    ).json()) as any;
    expect(v1.reportVersion.structured.workSummary).toBe("점검 완료");
    expect(v2.reportVersion.structured.workSummary).toBe("고객 요청을 반영한 수정본");
    expect(v2.reportVersion.reportNumber).toBe(
      v1.reportVersion.reportNumber,
    );

    const publicV2 = (await (
      await req(db, `/public/approvals/${v2Token}`)
    ).json()) as any;
    expect(publicV2.reportVersion.version).toBe(2);
  });

  it("PATCH 작업: 타 조직 customerId 주입은 400", async () => {
    const a = await signup(db, "V조직", "admin-v@x.com");
    const b = await signup(db, "W조직", "admin-w@x.com");
    const { id } = await createFullWorkOrder(db, a.token, a.org.id);
    const bCustomer = await createCustomer(db, b.token, "타조직고객");

    const res = await req(db, `/work-orders/${id}`, {
      method: "PATCH",
      token: a.token,
      body: JSON.stringify({ customerId: bCustomer.id }),
    });
    expect(res.status).toBe(400);
  });

  it("완료 처리: reviewed에서 성공, 완료 후 재요청은 409", async () => {
    const admin = await signup(db, "X조직", "admin-x@x.com");
    const { id } = await runToFinalized(db, admin.token, admin.org.id);

    const completeRes = await req(db, `/work-orders/${id}/complete`, { method: "POST", token: admin.token });
    expect(completeRes.status).toBe(200);
    const completeJson = (await completeRes.json()) as { workStatus: string };
    expect(completeJson.workStatus).toBe("completed");

    const completeAgain = await req(db, `/work-orders/${id}/complete`, { method: "POST", token: admin.token });
    expect(completeAgain.status).toBe(409);
  });

  it("작업 취소: 사유 없으면 400, scheduled에서 성공, 확정 후에는 409", async () => {
    const admin = await signup(db, "Y조직", "admin-y@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);

    const missingReason = await req(db, `/work-orders/${id}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({}),
    });
    expect(missingReason.status).toBe(400);

    const cancelRes = await req(db, `/work-orders/${id}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ reason: "고객 요청 취소" }),
    });
    expect(cancelRes.status).toBe(200);

    const { id: id2 } = await runToFinalized(db, admin.token, admin.org.id);
    const cancelBlocked = await req(db, `/work-orders/${id2}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ reason: "취소 시도" }),
    });
    expect(cancelBlocked.status).toBe(409);
  });

  it("확정(reviewed) 이후 사진 추가는 409", async () => {
    const admin = await signup(db, "Z조직", "admin-z@x.com");
    const { id } = await runToFinalized(db, admin.token, admin.org.id);
    const res = await req(db, `/work-orders/${id}/photos`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ kind: "after", dataUrl: TEST_PNG_DATA_URL }),
    });
    expect(res.status).toBe(409);
  });

  it("현장 제출은 사진과 비어 있지 않은 전사·요약을 모두 서버에서 요구하고 제출 후 사진을 잠근다", async () => {
    const admin = await signup(db, "Z2조직", "admin-z2@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    await req(db, `/work-orders/${id}/start`, {
      method: "POST",
      token: admin.token,
    });
    await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ workSummary: "점검 완료" }),
    });

    const missingPhoto = await req(db, `/work-orders/${id}/submit`, {
      method: "POST",
      token: admin.token,
    });
    expect(missingPhoto.status).toBe(400);

    const photo = await addTestPhoto(db, id, admin.token);
    await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ workSummary: "   ", transcript: "\n\t" }),
    });
    const missingText = await req(db, `/work-orders/${id}/submit`, {
      method: "POST",
      token: admin.token,
    });
    expect(missingText.status).toBe(400);

    await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "정상 작동 확인" }),
    });
    const submitted = await req(db, `/work-orders/${id}/submit`, {
      method: "POST",
      token: admin.token,
    });
    expect(submitted.status).toBe(200);

    const addAfterSubmit = await req(db, `/work-orders/${id}/photos`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        kind: "after",
        dataUrl: TEST_PNG_DATA_URL,
      }),
    });
    expect(addAfterSubmit.status).toBe(409);
    const deleteAfterSubmit = await req(
      db,
      `/work-orders/${id}/photos/${photo.id}`,
      { method: "DELETE", token: admin.token },
    );
    expect(deleteAfterSubmit.status).toBe(409);
  });

  it("불확실 항목은 PUT으로 지울 수 없고 finalize 본문 확인 목록 없이는 확정할 수 없다", async () => {
    const admin = await signup(db, "Z3조직", "admin-z3@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    await req(db, `/work-orders/${id}/start`, {
      method: "POST",
      token: admin.token,
    });
    await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "필터 교체함" }),
    });
    await addTestPhoto(db, id, admin.token);
    const submitRes = await req(db, `/work-orders/${id}/submit`, {
      method: "POST",
      token: admin.token,
    });
    expect(submitRes.status).toBe(200);

    const detail = (await (
      await req(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as any;
    expect(detail.draft.uncertainFields).toContain("usedParts[0].quantity");
    const bypassPut = await req(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: { ...detail.draft, uncertainFields: [] },
      }),
    });
    expect(bypassPut.status).toBe(200);
    const bypassPutJson = (await bypassPut.json()) as any;
    expect(bypassPutJson.draft.uncertainFields).toContain(
      "usedParts[0].quantity",
    );

    const missingBody = await req(db, `/work-orders/${id}/report/finalize`, {
      method: "POST",
      token: admin.token,
    });
    expect(missingBody.status).toBe(400);

    const missingConfirmation = await req(
      db,
      `/work-orders/${id}/report/finalize`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    expect(missingConfirmation.status).toBe(409);

    const confirmed = await req(db, `/work-orders/${id}/report/finalize`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        confirmedUncertainFields: ["usedParts[0].quantity"],
      }),
    });
    expect(confirmed.status).toBe(200);

    const audit = await db
      .prepare(
        "SELECT detail_json FROM audit_events WHERE target = ? AND event = 'report_finalized' ORDER BY created_at DESC LIMIT 1",
      )
      .bind(id)
      .first<{ detail_json: string }>();
    expect(JSON.parse(audit!.detail_json).confirmedUncertainFields).toEqual([
      "usedParts[0].quantity",
    ]);
  });

  it("field-record 부분저장 시 next_inspection_date를 3-상태로 처리한다", async () => {
    const admin = await signup(db, "AA조직", "admin-aa@x.com");
    const { id } = await createFullWorkOrder(db, admin.token, admin.org.id);
    await req(db, `/work-orders/${id}/start`, { method: "POST", token: admin.token });

    const first = await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "1차 점검", nextInspectionDate: "2026-12-01" }),
    });
    expect(first.status).toBe(200);
    const firstJson = (await first.json()) as { fieldRecord: { nextInspectionDate: string | null } };
    expect(firstJson.fieldRecord.nextInspectionDate).toBe("2026-12-01");

    // 키 미포함 → 기존값 유지
    const second = await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ workSummary: "요약 갱신" }),
    });
    expect(second.status).toBe(200);
    const secondJson = (await second.json()) as {
      fieldRecord: { nextInspectionDate: string | null; workSummary: string | null };
    };
    expect(secondJson.fieldRecord.nextInspectionDate).toBe("2026-12-01");
    expect(secondJson.fieldRecord.workSummary).toBe("요약 갱신");

    // 명시적 null → 삭제
    const third = await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ nextInspectionDate: null }),
    });
    expect(third.status).toBe(200);
    const thirdJson = (await third.json()) as { fieldRecord: { nextInspectionDate: string | null } };
    expect(thirdJson.fieldRecord.nextInspectionDate).toBeNull();
  });

  it("존재하지 않는(비활성) 담당자 배정은 400", async () => {
    const admin = await signup(db, "AB조직", "admin-ab@x.com");
    const customer = await createCustomer(db, admin.token, "고객1");
    const site = await createSite(db, admin.token, customer.id, "현장1");
    const res = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "점검",
        customerId: customer.id,
        siteId: site.id,
        assigneeIds: ["nonexistent-user-id"],
      }),
    });
    expect(res.status).toBe(400);
  });

  it("승인 완료 링크가 만료되어도 승인 상태와 서명 증빙은 보존된다", async () => {
    const admin = await signup(db, "AC조직", "admin-ac@x.com");
    const { id, approvalToken } = await runToFinalized(db, admin.token, admin.org.id);

    const approveRes = await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({
        name: "김승인",
        signatureDataUrl: TEST_PNG_DATA_URL,
        agree: true,
      }),
    });
    expect(approveRes.status).toBe(200);

    await db
      .prepare("UPDATE approval_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE work_order_id = ?")
      .bind(id)
      .run();

    const expiredGet = await req(db, `/public/approvals/${approvalToken}`);
    expect(expiredGet.status).toBe(410);

    const requestRow = await db
      .prepare("SELECT status FROM approval_requests WHERE work_order_id = ?")
      .bind(id)
      .first<{ status: string }>();
    expect(requestRow?.status).toBe("approved");

    const versionRes = await req(db, `/work-orders/${id}/report-versions/1`, {
      token: admin.token,
    });
    const versionJson = (await versionRes.json()) as {
      reportVersion: { signature: { name: string } | null };
    };
    expect(versionJson.reportVersion.signature?.name).toBe("김승인");
  });

  it("수정 요청한 구 승인 토큰은 재발급 후 승인에 사용할 수 없다", async () => {
    const admin = await signup(db, "AD조직", "admin-ad@x.com");
    const { id, approvalToken: oldToken } = await runToFinalized(
      db,
      admin.token,
      admin.org.id,
    );

    const revisionRes = await req(db, `/public/approvals/${oldToken}/revision`, {
      method: "POST",
      body: JSON.stringify({ comment: "사진을 교체해주세요" }),
    });
    expect(revisionRes.status).toBe(200);

    const detail = (await (
      await req(db, `/work-orders/${id}`, { token: admin.token })
    ).json()) as any;
    const updateRes = await req(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: {
          ...detail.draft,
          workSummary: "사진 확인 후 수정본",
        },
      }),
    });
    expect(updateRes.status).toBe(200);
    const finalizeV2 = await req(db, `/work-orders/${id}/report/finalize`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ confirmedUncertainFields: [] }),
    });
    expect(finalizeV2.status).toBe(200);
    await markReportPdfReady(db, id, 2, admin.token);

    const resendRes = await req(db, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
    });
    expect(resendRes.status).toBe(200);
    const { token: newToken } = (await resendRes.json()) as { token: string };

    const staleApprove = await req(db, `/public/approvals/${oldToken}/approve`, {
      method: "POST",
      body: JSON.stringify({
        name: "구 링크 승인자",
        signatureDataUrl: TEST_PNG_DATA_URL,
        agree: true,
      }),
    });
    expect(staleApprove.status).toBe(410);

    const currentGet = await req(db, `/public/approvals/${newToken}`);
    expect(currentGet.status).toBe(200);

    const workOrderRow = await db
      .prepare("SELECT approval_status, billing_status FROM work_orders WHERE id = ?")
      .bind(id)
      .first<{ approval_status: string; billing_status: string }>();
    expect(workOrderRow).toMatchObject({
      approval_status: "pending",
      billing_status: "none",
    });
  });

  it("구 토큰 승인 조회와 재발급이 경합해도 무효 토큰은 승인 상태를 되살릴 수 없다", async () => {
    const admin = await signup(db, "AD2조직", "admin-ad2@x.com");
    const { id, approvalToken: oldToken } = await runToFinalized(
      db,
      admin.token,
      admin.org.id,
    );

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
      "FROM approval_requests WHERE token_hash = ?",
      signalPaused,
      resume,
    );

    const staleApprovePromise = req(
      racingDb,
      `/public/approvals/${oldToken}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "경합한 구 링크 승인자",
          signatureDataUrl: TEST_PNG_DATA_URL,
          agree: true,
        }),
      },
    );

    await paused;
    const resendRes = await req(db, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
    });
    expect(resendRes.status).toBe(200);
    const { token: newToken } = (await resendRes.json()) as { token: string };
    signalResume();

    const staleApprove = await staleApprovePromise;
    expect(staleApprove.status).toBe(410);

    const currentGet = await req(db, `/public/approvals/${newToken}`);
    expect(currentGet.status).toBe(200);
    const requestRows = await db
      .prepare(
        "SELECT status FROM approval_requests WHERE work_order_id = ? ORDER BY sent_at ASC",
      )
      .bind(id)
      .all<{ status: string }>();
    expect((requestRows.results ?? []).map((row) => row.status).sort()).toEqual([
      "pending",
      "superseded",
    ]);

    const signatures = await db
      .prepare(
        `SELECT sig.id
         FROM signatures sig
         JOIN approval_requests ar ON ar.id = sig.approval_request_id
         WHERE ar.work_order_id = ?`,
      )
      .bind(id)
      .all<{ id: string }>();
    expect(signatures.results ?? []).toHaveLength(0);
  });

  it("재발급 조회와 승인이 경합해도 완료된 승인을 pending으로 되돌릴 수 없다", async () => {
    const admin = await signup(db, "AD3조직", "admin-ad3@x.com");
    const { id, approvalToken } = await runToFinalized(
      db,
      admin.token,
      admin.org.id,
    );

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

    const resendPromise = req(racingDb, `/work-orders/${id}/approval-links`, {
      method: "POST",
      token: admin.token,
    });
    await paused;

    const approveRes = await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({
        name: "정상 승인자",
        signatureDataUrl: TEST_PNG_DATA_URL,
        agree: true,
      }),
    });
    expect(approveRes.status).toBe(200);
    signalResume();

    const resendRes = await resendPromise;
    expect(resendRes.status).toBe(409);

    const workOrderRow = await db
      .prepare("SELECT approval_status, billing_status FROM work_orders WHERE id = ?")
      .bind(id)
      .first<{ approval_status: string; billing_status: string }>();
    expect(workOrderRow).toMatchObject({
      approval_status: "approved",
      billing_status: "billable",
    });

    const requestRows = await db
      .prepare("SELECT status FROM approval_requests WHERE work_order_id = ?")
      .bind(id)
      .all<{ status: string }>();
    expect((requestRows.results ?? []).map((row) => row.status)).toEqual([
      "approved",
    ]);
  });

  it("서명 후 마스터와 작업을 수정해도 공개 보고서는 확정 당시 메타데이터를 유지한다", async () => {
    const admin = await signup(db, "AE조직", "admin-ae@x.com");
    const { id, approvalToken } = await runToFinalized(db, admin.token, admin.org.id);

    const before = (await (
      await req(db, `/public/approvals/${approvalToken}`)
    ).json()) as {
      reportVersion: {
        customer: { id: string; name: string };
        workOrder: { scheduledDate: string; workType: string };
      };
    };

    const approveRes = await req(db, `/public/approvals/${approvalToken}/approve`, {
      method: "POST",
      body: JSON.stringify({
        name: "고객",
        signatureDataUrl: TEST_PNG_DATA_URL,
        agree: true,
      }),
    });
    expect(approveRes.status).toBe(200);

    const customerPatch = await req(
      db,
      `/customers/${before.reportVersion.customer.id}`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ name: "서명 후 변경 고객" }),
      },
    );
    expect(customerPatch.status).toBe(200);

    const workOrderPatch = await req(db, `/work-orders/${id}`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: "2030-01-01",
        workType: "서명 후 변경 작업",
      }),
    });
    expect(workOrderPatch.status).toBe(200);

    const after = (await (
      await req(db, `/public/approvals/${approvalToken}`)
    ).json()) as typeof before;
    expect(after.reportVersion.customer.name).toBe(
      before.reportVersion.customer.name,
    );
    expect(after.reportVersion.workOrder.scheduledDate).toBe(
      before.reportVersion.workOrder.scheduledDate,
    );
    expect(after.reportVersion.workOrder.workType).toBe(
      before.reportVersion.workOrder.workType,
    );
  });

  it("작업 생성·수정에서 타 조직 또는 다른 현장의 장비를 연결할 수 없다", async () => {
    const orgA = await signup(db, "AF조직", "admin-af@x.com");
    const customerA = await createCustomer(db, orgA.token, "A고객");
    const siteA = await createSite(db, orgA.token, customerA.id, "A현장");
    const assetARes = await req(db, "/assets", {
      method: "POST",
      token: orgA.token,
      body: JSON.stringify({
        siteId: siteA.id,
        name: "A조직 장비",
        serialNo: "SECRET-A",
      }),
    });
    const { asset: assetA } = (await assetARes.json()) as {
      asset: { id: string };
    };

    const orgB = await signup(db, "AG조직", "admin-ag@x.com");
    const customerB = await createCustomer(db, orgB.token, "B고객");
    const siteB1 = await createSite(db, orgB.token, customerB.id, "B현장1");
    const siteB2 = await createSite(db, orgB.token, customerB.id, "B현장2");
    const assetBRes = await req(db, "/assets", {
      method: "POST",
      token: orgB.token,
      body: JSON.stringify({ siteId: siteB1.id, name: "B현장1 장비" }),
    });
    const { asset: assetB } = (await assetBRes.json()) as {
      asset: { id: string };
    };

    const crossOrgCreate = await req(db, "/work-orders", {
      method: "POST",
      token: orgB.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "점검",
        customerId: customerB.id,
        siteId: siteB2.id,
        assetId: assetA.id,
        assigneeIds: [],
      }),
    });
    expect(crossOrgCreate.status).toBe(400);

    const crossSiteCreate = await req(db, "/work-orders", {
      method: "POST",
      token: orgB.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "점검",
        customerId: customerB.id,
        siteId: siteB2.id,
        assetId: assetB.id,
        assigneeIds: [],
      }),
    });
    expect(crossSiteCreate.status).toBe(400);

    const validCreate = await req(db, "/work-orders", {
      method: "POST",
      token: orgB.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "점검",
        customerId: customerB.id,
        siteId: siteB2.id,
        assigneeIds: [],
      }),
    });
    expect(validCreate.status).toBe(200);
    const { workOrder } = (await validCreate.json()) as {
      workOrder: { id: string };
    };

    const crossOrgPatch = await req(db, `/work-orders/${workOrder.id}`, {
      method: "PATCH",
      token: orgB.token,
      body: JSON.stringify({ assetId: assetA.id }),
    });
    expect(crossOrgPatch.status).toBe(400);

    const crossSitePatch = await req(db, `/work-orders/${workOrder.id}`, {
      method: "PATCH",
      token: orgB.token,
      body: JSON.stringify({ assetId: assetB.id }),
    });
    expect(crossSitePatch.status).toBe(400);
  });

  it("초안은 배정 시 예정으로 전환되고 배정 변경 이력·알림을 보존한다", async () => {
    const admin = await signup(db, "작업수명주기", "admin-lifecycle@x.com");
    const fieldToken = await inviteAndAccept(
      db,
      admin.token,
      "field-lifecycle@x.com",
      "field",
    );
    const fieldMe = (await (
      await req(db, "/me", { token: fieldToken })
    ).json()) as { user: { id: string } };

    const customerRes = await req(db, "/customers", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        name: "보안 고객",
        bizNo: "123-45-67890",
        address: "서울시 고객로 1",
        contactName: "김현장",
        contactPhone: "010-1234-5678",
        memo: "현장 사용자에게 숨길 내부 메모",
      }),
    });
    const customer = ((await customerRes.json()) as { customer: { id: string } })
      .customer;
    const siteRes = await req(db, "/sites", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        customerId: customer.id,
        name: "제1공장",
        address: "서울시 산업로 99",
        accessInfo: "정문 경비실에서 방문증 수령",
      }),
    });
    const site = ((await siteRes.json()) as { site: { id: string } }).site;

    const draftRes = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        scheduledTime: "09:30",
        workType: "설비 정기점검",
        customerId: customer.id,
        siteId: site.id,
        request: "가동 전 진동값 확인",
        assigneeIds: [],
        intent: "draft",
      }),
    });
    expect(draftRes.status).toBe(200);
    const draft = (await draftRes.json()) as {
      workOrder: { id: string; workStatus: string };
    };
    expect(draft.workOrder.workStatus).toBe("draft");

    const prematureStart = await req(
      db,
      `/work-orders/${draft.workOrder.id}/start`,
      { method: "POST", token: admin.token },
    );
    expect(prematureStart.status).toBe(409);

    const duplicate = await req(
      db,
      `/work-orders/${draft.workOrder.id}/assign`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({
          userIds: [fieldMe.user.id, fieldMe.user.id],
        }),
      },
    );
    expect(duplicate.status).toBe(400);

    const assigned = await req(
      db,
      `/work-orders/${draft.workOrder.id}/assign`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ userIds: [fieldMe.user.id] }),
      },
    );
    expect(assigned.status).toBe(200);
    const assignedJson = (await assigned.json()) as {
      workOrder: { workStatus: string };
    };
    expect(assignedJson.workOrder.workStatus).toBe("scheduled");

    const fieldList = await req(
      db,
      "/work-orders?date=2026-07-24&mine=1",
      { token: fieldToken },
    );
    expect(fieldList.status).toBe(200);
    const fieldWork = (
      (await fieldList.json()) as { workOrders: Record<string, unknown>[] }
    ).workOrders[0]!;
    expect(fieldWork).toMatchObject({
      request: "가동 전 진동값 확인",
      siteAddress: "서울시 산업로 99",
      accessInfo: "정문 경비실에서 방문증 수령",
      contactName: "김현장",
      contactPhone: "010-1234-5678",
    });
    expect(fieldWork).not.toHaveProperty("approvalStatus");
    expect(fieldWork).not.toHaveProperty("billingStatus");

    const fieldDetail = await req(
      db,
      `/work-orders/${draft.workOrder.id}`,
      { token: fieldToken },
    );
    expect(fieldDetail.status).toBe(200);
    const fieldDetailJson = (await fieldDetail.json()) as any;
    expect(fieldDetailJson.customer.memo).toBeUndefined();
    expect(fieldDetailJson.customer.bizNo).toBeUndefined();
    expect(fieldDetailJson.assignees[0].email).toBeUndefined();
    expect(fieldDetailJson.workOrder.approvalStatus).toBeUndefined();
    expect(fieldDetailJson.workOrder.billingStatus).toBeUndefined();
    expect(fieldDetailJson.approval).toBeNull();
    expect(fieldDetailJson.billing).toBeNull();
    expect(fieldDetailJson.assignmentHistory).toEqual([]);
    const hiddenReport = await req(
      db,
      `/work-orders/${draft.workOrder.id}/report-versions/1`,
      { token: fieldToken },
    );
    expect(hiddenReport.status).toBe(403);

    const reassigned = await req(
      db,
      `/work-orders/${draft.workOrder.id}/assign`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ userIds: [admin.user.id] }),
      },
    );
    expect(reassigned.status).toBe(200);

    const officeDetail = (await (
      await req(db, `/work-orders/${draft.workOrder.id}`, {
        token: admin.token,
      })
    ).json()) as any;
    expect(
      officeDetail.assignmentHistory.map(
        (event: { userId: string; action: string }) => [
          event.userId,
          event.action,
        ],
      ),
    ).toEqual(
      expect.arrayContaining([
        [fieldMe.user.id, "assigned"],
        [fieldMe.user.id, "unassigned"],
        [admin.user.id, "assigned"],
      ]),
    );
    expect(
      officeDetail.assignmentHistory.every(
        (event: { actorUserId: string }) =>
          event.actorUserId === admin.user.id,
      ),
    ).toBe(true);

    const fieldNotifications = (await (
      await req(db, "/notifications", { token: fieldToken })
    ).json()) as { notifications: { kind: string }[] };
    expect(fieldNotifications.notifications.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["assigned", "assignment_removed"]),
    );
  });

  it("시작과 취소가 경합해도 CAS로 단 하나의 전이만 성공한다", async () => {
    const admin = await signup(db, "CAS-시작취소", "admin-cas-start@x.com");
    const { id } = await createFullWorkOrder(
      db,
      admin.token,
      admin.org.id,
    );

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );

    const startPromise = req(delayedDb, `/work-orders/${id}/start`, {
      method: "POST",
      token: admin.token,
    });
    await waiting;
    const cancel = await req(db, `/work-orders/${id}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ reason: "동시 취소" }),
    });
    release();
    const start = await startPromise;

    expect(cancel.status).toBe(200);
    expect(start.status).toBe(409);
    const row = await db
      .prepare(
        "SELECT work_status, started_at, canceled_at FROM work_orders WHERE id = ?",
      )
      .bind(id)
      .first<{
        work_status: string;
        started_at: string | null;
        canceled_at: string | null;
      }>();
    expect(row).toMatchObject({
      work_status: "canceled",
      started_at: null,
    });
    expect(row?.canceled_at).not.toBeNull();
  });

  it("동시 완료 요청은 CAS로 한 건만 성공한다", async () => {
    const admin = await signup(db, "CAS-완료", "admin-cas-complete@x.com");
    const { id } = await createFullWorkOrder(
      db,
      admin.token,
      admin.org.id,
    );
    await db
      .prepare(
        "UPDATE work_orders SET work_status = 'reviewed', reviewed_at = ? WHERE id = ?",
      )
      .bind(new Date().toISOString(), id)
      .run();

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );

    const firstPromise = req(delayedDb, `/work-orders/${id}/complete`, {
      method: "POST",
      token: admin.token,
    });
    await waiting;
    const second = await req(db, `/work-orders/${id}/complete`, {
      method: "POST",
      token: admin.token,
    });
    release();
    const first = await firstPromise;

    expect(second.status).toBe(200);
    expect(first.status).toBe(409);
    const audits = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_events WHERE target = ? AND event = 'work_completed'",
      )
      .bind(id)
      .first<{ n: number }>();
    expect(audits?.n).toBe(1);
  });

  it("초안 배정 CAS 패배 시 후속 배정·이력 쓰기를 모두 막는다", async () => {
    const admin = await signup(db, "CAS-배정", "admin-cas-assign@x.com");
    const fieldToken = await inviteAndAccept(
      db,
      admin.token,
      "field-cas-assign@x.com",
      "field",
    );
    const fieldMe = (await (
      await req(db, "/me", { token: fieldToken })
    ).json()) as { user: { id: string } };
    const customer = await createCustomer(db, admin.token, "배정 고객");
    const site = await createSite(db, admin.token, customer.id, "배정 현장");
    const draftResponse = await req(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "배정 경합 점검",
        customerId: customer.id,
        siteId: site.id,
        assigneeIds: [],
        intent: "draft",
      }),
    });
    const draft = (await draftResponse.json()) as {
      workOrder: { id: string };
    };

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );
    const stalePromise = req(
      delayedDb,
      `/work-orders/${draft.workOrder.id}/assign`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ userIds: [fieldMe.user.id] }),
      },
    );
    await waiting;

    const winner = await req(
      db,
      `/work-orders/${draft.workOrder.id}/assign`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ userIds: [admin.user.id] }),
      },
    );
    expect(winner.status).toBe(200);
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);

    const assignments = await db
      .prepare(
        "SELECT user_id FROM assignments WHERE work_order_id = ? ORDER BY user_id",
      )
      .bind(draft.workOrder.id)
      .all<{ user_id: string }>();
    expect(assignments.results.map((row) => row.user_id)).toEqual([
      admin.user.id,
    ]);
    const history = await db
      .prepare(
        `SELECT user_id, action
         FROM assignment_events
         WHERE work_order_id = ?
         ORDER BY created_at, id`,
      )
      .bind(draft.workOrder.id)
      .all<{ user_id: string; action: string }>();
    expect(history.results).toEqual([
      { user_id: admin.user.id, action: "assigned" },
    ]);
    const workOrder = await db
      .prepare(
        "SELECT work_status, revision, write_token FROM work_orders WHERE id = ?",
      )
      .bind(draft.workOrder.id)
      .first<{
        work_status: string;
        revision: number;
        write_token: string | null;
      }>();
    expect(workOrder).toMatchObject({
      work_status: "scheduled",
      revision: 1,
    });
    expect(workOrder?.write_token).toBeTruthy();
  });

  it("동시 일반 PATCH는 패배 요청의 필드·배정을 남기지 않는다", async () => {
    const admin = await signup(db, "CAS-PATCH", "admin-cas-patch@x.com");
    const fieldToken = await inviteAndAccept(
      db,
      admin.token,
      "field-cas-patch@x.com",
      "field",
    );
    const fieldMe = (await (
      await req(db, "/me", { token: fieldToken })
    ).json()) as { user: { id: string } };
    const { id } = await createFullWorkOrder(
      db,
      admin.token,
      admin.org.id,
    );

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );
    const stalePromise = req(delayedDb, `/work-orders/${id}`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({
        request: "패배 요청의 메모",
        assigneeIds: [fieldMe.user.id],
      }),
    });
    await waiting;

    const winner = await req(db, `/work-orders/${id}`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({ request: "승리 요청의 메모" }),
    });
    expect(winner.status).toBe(200);
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);

    const workOrder = await db
      .prepare(
        "SELECT request, revision, write_token FROM work_orders WHERE id = ?",
      )
      .bind(id)
      .first<{
        request: string | null;
        revision: number;
        write_token: string | null;
      }>();
    expect(workOrder).toMatchObject({
      request: "승리 요청의 메모",
      revision: 1,
    });
    expect(workOrder?.write_token).toBeTruthy();
    const assignments = await db
      .prepare("SELECT user_id FROM assignments WHERE work_order_id = ?")
      .bind(id)
      .all<{ user_id: string }>();
    expect(assignments.results.map((row) => row.user_id)).toEqual([
      admin.user.id,
    ]);
    const staleEvents = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM assignment_events WHERE work_order_id = ? AND user_id = ?",
      )
      .bind(id, fieldMe.user.id)
      .first<{ n: number }>();
    expect(staleEvents?.n).toBe(0);
  });

  it("현장기록 INSERT 실행 전에 작업이 취소되면 기록을 남기지 않는다", async () => {
    const admin = await signup(
      db,
      "CAS-현장기록-생성",
      "admin-cas-field-insert@x.com",
    );
    const { id } = await createFullWorkOrder(
      db,
      admin.token,
      admin.org.id,
    );
    await req(db, `/work-orders/${id}/start`, {
      method: "POST",
      token: admin.token,
    });

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );
    const stalePromise = req(delayedDb, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "취소 뒤 남으면 안 되는 기록" }),
    });
    await waiting;

    const canceled = await req(db, `/work-orders/${id}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ reason: "현장 중단" }),
    });
    expect(canceled.status).toBe(200);
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);
    const stored = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM field_records WHERE work_order_id = ?",
      )
      .bind(id)
      .first<{ n: number }>();
    expect(stored?.n).toBe(0);
  });

  it("현장기록 UPDATE 실행 전에 작업이 취소되면 기존 기록을 보존한다", async () => {
    const admin = await signup(
      db,
      "CAS-현장기록-수정",
      "admin-cas-field-update@x.com",
    );
    const { id } = await createFullWorkOrder(
      db,
      admin.token,
      admin.org.id,
    );
    await req(db, `/work-orders/${id}/start`, {
      method: "POST",
      token: admin.token,
    });
    const initial = await req(db, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "보존할 기존 기록" }),
    });
    expect(initial.status).toBe(200);

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "SELECT * FROM work_orders WHERE org_id = ? AND id = ?",
      paused,
      resume,
    );
    const stalePromise = req(delayedDb, `/work-orders/${id}/field-record`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({ transcript: "취소 뒤 덮으면 안 되는 기록" }),
    });
    await waiting;

    const canceled = await req(db, `/work-orders/${id}/cancel`, {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ reason: "현장 중단" }),
    });
    expect(canceled.status).toBe(200);
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);
    const stored = await db
      .prepare(
        "SELECT transcript FROM field_records WHERE work_order_id = ?",
      )
      .bind(id)
      .first<{ transcript: string | null }>();
    expect(stored?.transcript).toBe("보존할 기존 기록");
  });

  it("서로 다른 작업을 동시에 최초 확정해도 보고서 번호가 중복되지 않는다", async () => {
    const admin = await signup(
      db,
      "CAS-보고서-번호",
      "admin-cas-report-number@x.com",
    );
    const first = await runToSubmitted(db, admin.token, admin.org.id);
    const second = await runToSubmitted(db, admin.token, admin.org.id);

    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    let pausedFirst!: () => void;
    let pausedSecond!: () => void;
    const resumeFirst = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const resumeSecond = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    const waitingFirst = new Promise<void>((resolve) => {
      pausedFirst = resolve;
    });
    const waitingSecond = new Promise<void>((resolve) => {
      pausedSecond = resolve;
    });
    const firstDb = pauseFirstQueryContaining(
      db,
      "SELECT COUNT(*) AS n FROM report_versions WHERE work_order_id = ?",
      pausedFirst,
      resumeFirst,
    );
    const secondDb = pauseFirstQueryContaining(
      db,
      "SELECT COUNT(*) AS n FROM report_versions WHERE work_order_id = ?",
      pausedSecond,
      resumeSecond,
    );

    const firstFinalize = req(
      firstDb,
      `/work-orders/${first.id}/report/finalize`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    await waitingFirst;
    const secondFinalize = req(
      secondDb,
      `/work-orders/${second.id}/report/finalize`,
      {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ confirmedUncertainFields: [] }),
      },
    );
    await waitingSecond;
    releaseFirst();
    releaseSecond();

    const [firstResponse, secondResponse] = await Promise.all([
      firstFinalize,
      secondFinalize,
    ]);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    const firstJson = (await firstResponse.json()) as {
      reportVersion: { reportNumber: string };
    };
    const secondJson = (await secondResponse.json()) as {
      reportVersion: { reportNumber: string };
    };
    expect(
      [firstJson.reportVersion.reportNumber, secondJson.reportVersion.reportNumber].sort(),
    ).toEqual(["FS-20260724-001", "FS-20260724-002"]);
  });

  it("동시 보고서 PUT은 최신 초안 revision만 갱신한다", async () => {
    const admin = await signup(
      db,
      "CAS-보고서-revision",
      "admin-cas-report-revision@x.com",
    );
    const { id, draft } = await runToSubmitted(
      db,
      admin.token,
      admin.org.id,
    );

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "FROM report_drafts WHERE work_order_id = ?",
      paused,
      resume,
    );
    const stalePromise = req(delayedDb, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: { ...draft, workSummary: "패배한 초안" },
      }),
    });
    await waiting;

    const winner = await req(db, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: { ...draft, workSummary: "승리한 초안" },
      }),
    });
    expect(winner.status).toBe(200);
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);

    const stored = await db
      .prepare(
        "SELECT structured_json, revision FROM report_drafts WHERE work_order_id = ?",
      )
      .bind(id)
      .first<{ structured_json: string; revision: number }>();
    expect(JSON.parse(stored!.structured_json).workSummary).toBe(
      "승리한 초안",
    );
    expect(stored?.revision).toBe(1);
  });

  it("보고서 PUT 실행 전에 허용 상태를 벗어나면 초안을 갱신하지 않는다", async () => {
    const admin = await signup(
      db,
      "CAS-보고서-상태",
      "admin-cas-report-state@x.com",
    );
    const { id, draft } = await runToSubmitted(
      db,
      admin.token,
      admin.org.id,
    );

    let release!: () => void;
    let paused!: () => void;
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      paused = resolve;
    });
    const delayedDb = pauseFirstQueryContaining(
      db,
      "FROM report_drafts WHERE work_order_id = ?",
      paused,
      resume,
    );
    const stalePromise = req(delayedDb, `/work-orders/${id}/report`, {
      method: "PUT",
      token: admin.token,
      body: JSON.stringify({
        structured: { ...draft, workSummary: "상태 전이 뒤 초안" },
      }),
    });
    await waiting;

    await db
      .prepare(
        "UPDATE work_orders SET work_status = 'reviewed', reviewed_at = ?, updated_at = ? WHERE id = ?",
      )
      .bind(new Date().toISOString(), new Date().toISOString(), id)
      .run();
    release();
    const stale = await stalePromise;
    expect(stale.status).toBe(409);

    const stored = await db
      .prepare(
        "SELECT structured_json, revision FROM report_drafts WHERE work_order_id = ?",
      )
      .bind(id)
      .first<{ structured_json: string; revision: number }>();
    expect(JSON.parse(stored!.structured_json).workSummary).toBe(
      draft.workSummary,
    );
    expect(stored?.revision).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

async function createCustomer(db: D1Database, token: string, name: string) {
  const res = await app.request(
    "/customers",
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name }) },
    { DB: db },
  );
  const json = (await res.json()) as { customer: { id: string; name: string } };
  return json.customer;
}

async function createSite(db: D1Database, token: string, customerId: string, name: string) {
  const res = await app.request(
    "/sites",
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ customerId, name }) },
    { DB: db },
  );
  const json = (await res.json()) as { site: { id: string; name: string } };
  return json.site;
}

async function inviteAndAccept(db: D1Database, adminToken: string, email: string, role: string): Promise<string> {
  const inviteRes = await app.request(
    "/invites",
    { method: "POST", headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) },
    { DB: db },
  );
  const { invite } = (await inviteRes.json()) as { invite: { token: string } };
  const acceptRes = await app.request(
    "/auth/accept-invite",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: invite.token, name: email, password: "password123" }) },
    { DB: db },
  );
  const json = (await acceptRes.json()) as { token: string };
  return json.token;
}

async function createFullWorkOrder(db: D1Database, token: string, _orgId: string, withAsset = false) {
  const meRes = await app.request(
    "/me",
    { headers: { Authorization: `Bearer ${token}` } },
    { DB: db },
  );
  const me = (await meRes.json()) as { user: { id: string } };
  const customer = await createCustomer(db, token, "기본고객");
  const site = await createSite(db, token, customer.id, "기본현장");
  let asset: { id: string } | undefined;
  if (withAsset) {
    const assetRes = await app.request(
      "/assets",
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ siteId: site.id, name: "기본장비" }) },
      { DB: db },
    );
    asset = ((await assetRes.json()) as { asset: { id: string } }).asset;
  }
  const woRes = await app.request(
    "/work-orders",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledDate: "2026-07-24",
        workType: "정기점검",
        customerId: customer.id,
        siteId: site.id,
        assetId: asset?.id,
        assigneeIds: [me.user.id],
        intent: "schedule",
      }),
    },
    { DB: db },
  );
  const { workOrder } = (await woRes.json()) as { workOrder: { id: string } };
  return { id: workOrder.id, customer, site, asset };
}

async function runToSubmitted(db: D1Database, token: string, orgId: string) {
  const { id } = await createFullWorkOrder(db, token, orgId);
  await req(db, `/work-orders/${id}/start`, {
    method: "POST",
    token,
  });
  await req(db, `/work-orders/${id}/field-record`, {
    method: "PUT",
    token,
    body: JSON.stringify({ transcript: "점검 완료" }),
  });
  await addTestPhoto(db, id, token);
  const submitted = await req(db, `/work-orders/${id}/submit`, {
    method: "POST",
    token,
  });
  expect(submitted.status).toBe(200);
  const detail = (await (
    await req(db, `/work-orders/${id}`, { token })
  ).json()) as { draft: Record<string, unknown> };
  return { id, draft: detail.draft };
}

/** scheduled → in_progress → submitted → report finalize(version 1) → approval-link 발급까지 진행. */
async function runToFinalized(db: D1Database, token: string, orgId: string) {
  const { id } = await createFullWorkOrder(db, token, orgId);
  await app.request(`/work-orders/${id}/start`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }, { DB: db });
  await app.request(
    `/work-orders/${id}/field-record`,
    { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ transcript: "점검 완료" }) },
    { DB: db },
  );
  await addTestPhoto(db, id, token);
  await app.request(`/work-orders/${id}/submit`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }, { DB: db });
  await app.request(
    `/work-orders/${id}/report/finalize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ confirmedUncertainFields: [] }),
    },
    { DB: db },
  );
  await markReportPdfReady(db, id, 1, token);
  const linkRes = await req(db, `/work-orders/${id}/approval-links`, {
    method: "POST",
    token,
  });
  const { token: approvalToken } = (await linkRes.json()) as { token: string };
  return { id, approvalToken };
}

async function markReportPdfReady(
  db: D1Database,
  workOrderId: string,
  version: number,
  token: string,
): Promise<void> {
  const pdf = minimalParseablePdf(`e2e-${workOrderId}-v${version}`);
  const digest = await crypto.subtle.digest("SHA-256", pdf);
  const checksum = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const response = await req(
    db,
    `/work-orders/${workOrderId}/report-versions/${version}/artifacts/approval`,
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

async function addTestPhoto(
  db: D1Database,
  workOrderId: string,
  token: string,
): Promise<{ id: string }> {
  const response = await req(db, `/work-orders/${workOrderId}/photos`, {
    method: "POST",
    token,
    body: JSON.stringify({
      kind: "before",
      dataUrl: TEST_PNG_DATA_URL,
    }),
  });
  expect(response.status).toBe(200);
  const json = (await response.json()) as { photo: { id: string } };
  return json.photo;
}
