import { describe, it, expect, beforeEach } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

function req(db: D1Database, path: string, init: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return app.request(path, { ...rest, headers }, { DB: db });
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
    const today = new Date().toISOString().slice(0, 10);

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
      body: JSON.stringify({ kind: "before", dataUrl: "data:image/png;base64,AAA=" }),
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
    const finalizeRes = await req(db, `/work-orders/${workOrder.id}/report/finalize`, { method: "POST", token: admin.token });
    expect(finalizeRes.status).toBe(200);
    const { reportVersion } = (await finalizeRes.json()) as { reportVersion: { version: number; reportNumber: string } };
    expect(reportVersion.version).toBe(1);
    expect(reportVersion.reportNumber).toBe(`FS-${today.replaceAll("-", "")}-001`);

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
      body: JSON.stringify({ name: "고객담당자", title: "팀장", signatureDataUrl: "data:image/png;base64,BBB=", agree: true }),
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
      body: JSON.stringify({ name: "고객", signatureDataUrl: "data:image/png;base64,CCC=", agree: true }),
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
      body: JSON.stringify({ name: "고객", signatureDataUrl: "data:image/png;base64,DDD=", agree: true }),
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
      body: JSON.stringify({ name: "김승인", title: "팀장", signatureDataUrl: "data:image/png;base64,QUJD", agree: true }),
    });
    expect(approveRes.status).toBe(200);

    const afterApprove = await req(db, `/work-orders/${id}/report-versions/1`, { token: admin.token });
    const afterJson = (await afterApprove.json()) as {
      reportVersion: { lockedAt: string | null; signature: { name: string; signatureDataUrl: string } | null };
    };
    expect(afterJson.reportVersion.lockedAt).not.toBeNull();
    expect(afterJson.reportVersion.signature?.name).toBe("김승인");
    expect(afterJson.reportVersion.signature?.signatureDataUrl).toBe("data:image/png;base64,QUJD");
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

  it("승인 revision 경로: 요청 → 상태/알림/코멘트 복원 → 재발송", async () => {
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

    const resendRes = await req(db, `/work-orders/${id}/approval-links`, { method: "POST", token: admin.token });
    expect(resendRes.status).toBe(200);

    const detailAfterResend = (await (await req(db, `/work-orders/${id}`, { token: admin.token })).json()) as any;
    expect(detailAfterResend.workOrder.approvalStatus).toBe("pending");
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
      body: JSON.stringify({ kind: "after", dataUrl: "data:image/png;base64,EEE=" }),
    });
    expect(res.status).toBe(409);
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
        assigneeIds: [],
      }),
    },
    { DB: db },
  );
  const { workOrder } = (await woRes.json()) as { workOrder: { id: string } };
  return { id: workOrder.id, customer, site, asset };
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
  await app.request(`/work-orders/${id}/submit`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }, { DB: db });
  await app.request(`/work-orders/${id}/report/finalize`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }, { DB: db });
  const linkRes = await app.request(`/work-orders/${id}/approval-links`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }, { DB: db });
  const { token: approvalToken } = (await linkRes.json()) as { token: string };
  return { id, approvalToken };
}
