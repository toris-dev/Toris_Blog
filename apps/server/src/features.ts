import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq } from "drizzle-orm";
import {
  appUsers,
  expertSessions,
  goals,
  metrics,
  posts,
  subscribers,
  receivables,
  paymentFailures,
  deadlines,
  signals,
  financialSnapshots,
  featureRequests,
  lossPrevented,
} from "./db/schema.sqlite.js";
import { verifyFirebaseToken, type FirebaseTokenPayload } from "./auth.js";
import {
  canCreateGoal,
  FREE_GOAL_LIMIT,
  isPro,
  type EntitlementStatus,
  todayCommandCenter,
  buildCommandCards,
  computeRunway,
  triageFeatureRequests,
  sumLossPrevented,
  buildWeeklyBriefing,
  receivableSchema,
  paymentFailureSchema,
  deadlineSchema,
  signalSchema,
  financialSnapshotSchema,
  featureRequestSchema,
  lossPreventedSchema,
  type CommandCenterInput,
} from "@builderstep/shared";

type Bindings = { DB: D1Database };
type Vars = { user: FirebaseTokenPayload; status: EntitlementStatus };

/** /app/* — 전 라우트 구글 로그인 필수, PRO 게이팅은 라우트별 */
export const features = new Hono<{ Bindings: Bindings; Variables: Vars }>();

features.use("*", async (c, next) => {
  const authz = c.req.header("authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer "))
    return c.json({ error: "login required" }, 401);
  const claims = await verifyFirebaseToken(authz.slice(7).trim());
  if (!claims) return c.json({ error: "invalid token" }, 401);
  c.set("user", claims);

  const db = drizzle(c.env.DB);
  const sub = await db
    .select({ status: subscribers.status })
    .from(subscribers)
    .where(eq(subscribers.email, claims.email))
    .limit(1);
  c.set("status", (sub[0]?.status as EntitlementStatus) ?? "none");
  await next();
});

const requirePro = (c: { get: (k: "status") => EntitlementStatus }) =>
  isPro(c.get("status"));

/**
 * CEO Command Center 게이팅:
 * - /command-center 는 무료(미리보기) — 아래 목록에서 제외
 * - 재무/미수금/결제실패/마감/시그널/기능요청/방어금액/주간보고 상세·입력은 PRO
 * 개별 핸들러에 가드를 반복하지 않고 경로 프리픽스로 일괄 차단한다.
 */
export const PRO_PATHS = [
  "/finance",
  "/receivables",
  "/payment-failures",
  "/deadlines",
  "/signals",
  "/feature-requests",
  "/loss-prevented",
  "/weekly-briefing",
] as const;

/** 경로가 PRO 전용 프리픽스를 포함하는지 (순수 함수 — 테스트 대상) */
export const isProPath = (path: string): boolean =>
  PRO_PATHS.some((p) => path.includes(p));

/** 게이팅 결정: PRO 경로인데 pro가 아니면 차단 (순수 함수 — 테스트 대상) */
export const proGateDecision = (
  status: EntitlementStatus,
  path: string,
): "allow" | "block" =>
  isProPath(path) && !isPro(status) ? "block" : "allow";

features.use("*", async (c, next) => {
  if (proGateDecision(c.get("status"), c.req.path) === "block") {
    return c.json({ error: "pro required", upgrade: true }, 403);
  }
  await next();
});

/* ---------------- 단계 진단 (무료) ---------------- */

features.get("/me", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  return c.json({
    email,
    pro: isPro(c.get("status")),
    status: c.get("status"),
    stage: rows[0]?.stage ?? 0,
    diagnosedAt: rows[0]?.diagnosedAt ?? null,
  });
});

features.put("/me", async (c) => {
  const { email, uid, name } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { stage?: number };
  const stage = Number(body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 8)
    return c.json({ error: "stage must be 1..8" }, 400);

  const db = drizzle(c.env.DB);
  const now = new Date().toISOString();
  const existing = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (existing.length === 0) {
    await db.insert(appUsers).values({
      email, uid, name: name ?? null, stage,
      diagnosedAt: now, createdAt: now, updatedAt: now,
    });
  } else {
    await db.update(appUsers)
      .set({ stage, diagnosedAt: now, updatedAt: now, uid, ...(name ? { name } : {}) })
      .where(eq(appUsers.email, email));
  }
  return c.json({ ok: true, stage });
});

/* ---------------- 목표 트래킹 (무료 3개 / PRO 무제한+회고) ---------------- */

features.get("/goals", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(goals)
    .where(eq(goals.email, email)).orderBy(desc(goals.createdAt));
  return c.json({
    goals: rows,
    limit: isPro(c.get("status")) ? null : FREE_GOAL_LIMIT,
  });
});

features.post("/goals", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { title?: string; stage?: number };
  const title = String(body.title ?? "").trim();
  if (!title) return c.json({ error: "title required" }, 400);
  if (title.length > 120) return c.json({ error: "title too long" }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select({ id: goals.id }).from(goals).where(eq(goals.email, email));
  if (!canCreateGoal(c.get("status"), existing.length))
    return c.json({ error: "goal limit", upgrade: true, limit: FREE_GOAL_LIMIT }, 403);

  const now = new Date().toISOString();
  const stage = Number.isInteger(body.stage) && body.stage! >= 1 && body.stage! <= 8 ? body.stage! : null;
  await db.insert(goals).values({ email, title, stage, createdAt: now, updatedAt: now });
  return c.json({ ok: true }, 201);
});

features.patch("/goals/:id", async (c) => {
  const { email } = c.get("user");
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => ({}))) as { status?: string; retro?: string };

  const patch: Partial<typeof goals.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (body.status !== undefined) {
    if (!["todo", "doing", "done"].includes(body.status))
      return c.json({ error: "bad status" }, 400);
    patch.status = body.status as "todo" | "doing" | "done";
  }
  if (body.retro !== undefined) {
    // 회고 아카이브는 PRO 기능
    if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
    patch.retro = String(body.retro).slice(0, 2000);
  }
  const db = drizzle(c.env.DB);
  await db.update(goals).set(patch).where(and(eq(goals.id, id), eq(goals.email, email)));
  return c.json({ ok: true });
});

features.delete("/goals/:id", async (c) => {
  const { email } = c.get("user");
  const id = Number(c.req.param("id"));
  const db = drizzle(c.env.DB);
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.email, email)));
  return c.json({ ok: true });
});

/* ---------------- 커뮤니티 (열람 무료 / 작성 PRO) ---------------- */

features.get("/posts", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db.select({
    id: posts.id, author: posts.author, type: posts.type,
    title: posts.title, body: posts.body, createdAt: posts.createdAt,
  }).from(posts).orderBy(desc(posts.createdAt)).limit(50);
  return c.json({ posts: rows, canWrite: isPro(c.get("status")) });
});

features.post("/posts", async (c) => {
  if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
  const { email, name } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    type?: string; title?: string; body?: string;
  };
  const type = ["story", "feedback", "match"].includes(body.type ?? "") ? body.type! : "story";
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim();
  if (!title || !content) return c.json({ error: "title and body required" }, 400);
  if (title.length > 120 || content.length > 4000) return c.json({ error: "too long" }, 400);

  const db = drizzle(c.env.DB);
  await db.insert(posts).values({
    email, author: name ?? email.split("@")[0]!,
    type: type as "story" | "feedback" | "match",
    title, body: content, createdAt: new Date().toISOString(),
  });
  return c.json({ ok: true }, 201);
});

/* ---------------- 전문가 상담 예약 (PRO) ---------------- */

features.get("/sessions", async (c) => {
  if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(expertSessions)
    .where(eq(expertSessions.email, email)).orderBy(desc(expertSessions.createdAt));
  return c.json({ sessions: rows });
});

features.post("/sessions", async (c) => {
  if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    topic?: string; preferredAt?: string; note?: string;
  };
  if (!["marketing", "pricing", "tax", "legal"].includes(body.topic ?? ""))
    return c.json({ error: "bad topic" }, 400);
  const preferredAt = String(body.preferredAt ?? "").trim();
  if (!preferredAt) return c.json({ error: "preferredAt required" }, 400);

  const db = drizzle(c.env.DB);
  await db.insert(expertSessions).values({
    email,
    topic: body.topic as "marketing" | "pricing" | "tax" | "legal",
    preferredAt,
    note: body.note ? String(body.note).slice(0, 1000) : null,
    createdAt: new Date().toISOString(),
  });
  return c.json({ ok: true }, 201);
});

/* ---------------- 지표 대시보드 (PRO) ---------------- */

features.get("/metrics", async (c) => {
  if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(metrics)
    .where(eq(metrics.email, email)).orderBy(desc(metrics.date)).limit(30);
  return c.json({ metrics: rows.reverse() });
});

features.put("/metrics/:date", async (c) => {
  if (!requirePro(c)) return c.json({ error: "pro required", upgrade: true }, 403);
  const { email } = c.get("user");
  const date = c.req.param("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: "date must be YYYY-MM-DD" }, 400);
  const body = (await c.req.json().catch(() => ({}))) as { revenue?: number; users?: number };
  const revenue = Math.max(0, Math.floor(Number(body.revenue ?? 0)) || 0);
  const users = Math.max(0, Math.floor(Number(body.users ?? 0)) || 0);

  const db = drizzle(c.env.DB);
  const existing = await db.select().from(metrics)
    .where(and(eq(metrics.email, email), eq(metrics.date, date))).limit(1);
  if (existing.length === 0) {
    await db.insert(metrics).values({ email, date, revenue, users });
  } else {
    await db.update(metrics).set({ revenue, users })
      .where(and(eq(metrics.email, email), eq(metrics.date, date)));
  }
  return c.json({ ok: true });
});

/* ==================== CEO Command Center (Feature 1~6) ==================== */
// builderId 는 로그인 email. 날짜는 ISO 문자열로 저장하고 도메인 계층에서 Date 로 파싱.

const nowIso = () => new Date().toISOString();
const posInt = (v: unknown, dflt = 0) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : dflt;
};
const isIso = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

async function loadCommandInput(
  db: ReturnType<typeof drizzle>,
  builderId: string,
  now: Date,
): Promise<CommandCenterInput> {
  const [recv, pf, dl, sg, snaps] = await Promise.all([
    db.select().from(receivables).where(eq(receivables.builderId, builderId)),
    db.select().from(paymentFailures).where(eq(paymentFailures.builderId, builderId)),
    db.select().from(deadlines).where(eq(deadlines.builderId, builderId)),
    db.select().from(signals).where(eq(signals.builderId, builderId)),
    db.select().from(financialSnapshots)
      .where(eq(financialSnapshots.builderId, builderId))
      .orderBy(desc(financialSnapshots.recordedAt)).limit(2),
  ]);
  return {
    builderId,
    now,
    receivables: recv.map((r) => receivableSchema.parse(r)),
    paymentFailures: pf.map((r) => paymentFailureSchema.parse(r)),
    deadlines: dl.map((r) => deadlineSchema.parse(r)),
    signals: sg.map((r) => signalSchema.parse(r)),
    snapshot: snaps[0] ? financialSnapshotSchema.parse(snaps[0]) : undefined,
    previousSnapshot: snaps[1] ? financialSnapshotSchema.parse(snaps[1]) : undefined,
  };
}

/* --- Feature 1: 대표자 홈 · Today Command Center --- */
features.get("/command-center", async (c) => {
  const { email } = c.get("user");
  const pro = requirePro(c);
  const db = drizzle(c.env.DB);
  const now = new Date();
  const input = await loadCommandInput(db, email, now);
  const allCards = todayCommandCenter(input, 3);
  // 무료: 가장 중요한 카드 1개만 미리보기, 런웨이는 PRO 전용
  const cards = pro ? allCards : allCards.slice(0, 1);
  const runway = pro && input.snapshot ? computeRunway(input.snapshot) : null;
  return c.json({
    cards,
    runway,
    generatedAt: now.toISOString(),
    pro,
    locked: !pro && allCards.length > cards.length,
  });
});

/* --- Feature 2: 돈 · Runway Lite (재무 스냅샷 수동 입력) --- */
features.get("/finance", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(financialSnapshots)
    .where(eq(financialSnapshots.builderId, email))
    .orderBy(desc(financialSnapshots.recordedAt)).limit(24);
  const latest = rows[0] ? financialSnapshotSchema.parse(rows[0]) : null;
  return c.json({
    snapshots: rows,
    runway: latest ? computeRunway(latest) : null,
  });
});

features.post("/finance", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const cashKrw = posInt(body.cashKrw);
  const monthlyRevenueKrw = posInt(body.monthlyRevenueKrw);
  const monthlyFixedCostKrw = posInt(body.monthlyFixedCostKrw);
  const monthlyVariableCostKrw = posInt(body.monthlyVariableCostKrw);
  const recordedAt = isIso(body.recordedAt) ? new Date(body.recordedAt).toISOString() : nowIso();
  const db = drizzle(c.env.DB);
  await db.insert(financialSnapshots).values({
    builderId: email, cashKrw, monthlyRevenueKrw,
    monthlyFixedCostKrw, monthlyVariableCostKrw, recordedAt,
  });
  const snap = financialSnapshotSchema.parse({
    builderId: email, cashKrw, monthlyRevenueKrw,
    monthlyFixedCostKrw, monthlyVariableCostKrw, recordedAt,
  });
  return c.json({ ok: true, runway: computeRunway(snap) }, 201);
});

/* --- Feature 3: 미수금 (Receivables) --- */
features.get("/receivables", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(receivables)
    .where(eq(receivables.builderId, email)).orderBy(desc(receivables.dueDate));
  return c.json({ receivables: rows });
});

features.post("/receivables", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const customer = String(body.customer ?? "").trim();
  const amountKrw = posInt(body.amountKrw);
  if (!customer) return c.json({ error: "customer required" }, 400);
  if (!isIso(body.dueDate)) return c.json({ error: "dueDate must be ISO date" }, 400);
  if (amountKrw <= 0) return c.json({ error: "amountKrw must be > 0" }, 400);
  const db = drizzle(c.env.DB);
  await db.insert(receivables).values({
    id: crypto.randomUUID(), builderId: email, customer, amountKrw,
    dueDate: new Date(body.dueDate).toISOString(), paidAt: null, createdAt: nowIso(),
  });
  return c.json({ ok: true }, 201);
});

features.patch("/receivables/:id", async (c) => {
  const { email } = c.get("user");
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { paid?: boolean };
  const paidAt = body.paid === false ? null : nowIso();
  const db = drizzle(c.env.DB);
  await db.update(receivables).set({ paidAt })
    .where(and(eq(receivables.id, id), eq(receivables.builderId, email)));
  return c.json({ ok: true });
});

/* --- Feature 4: 결제 실패 (Payment Failures) --- */
features.get("/payment-failures", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(paymentFailures)
    .where(eq(paymentFailures.builderId, email)).orderBy(desc(paymentFailures.failedAt));
  return c.json({ paymentFailures: rows });
});

features.post("/payment-failures", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const subscriptionId = String(body.subscriptionId ?? "").trim();
  if (!subscriptionId) return c.json({ error: "subscriptionId required" }, 400);
  const db = drizzle(c.env.DB);
  await db.insert(paymentFailures).values({
    id: crypto.randomUUID(), builderId: email, subscriptionId,
    mrrKrw: posInt(body.mrrKrw), retryCount: posInt(body.retryCount),
    failedAt: isIso(body.failedAt) ? new Date(body.failedAt).toISOString() : nowIso(),
    resolvedAt: null,
  });
  return c.json({ ok: true }, 201);
});

features.patch("/payment-failures/:id", async (c) => {
  const { email } = c.get("user");
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { resolved?: boolean; retryCount?: number };
  const patch: Partial<typeof paymentFailures.$inferInsert> = {};
  if (body.resolved !== undefined) patch.resolvedAt = body.resolved === false ? null : nowIso();
  if (body.retryCount !== undefined) patch.retryCount = posInt(body.retryCount);
  const db = drizzle(c.env.DB);
  await db.update(paymentFailures).set(patch)
    .where(and(eq(paymentFailures.id, id), eq(paymentFailures.builderId, email)));
  return c.json({ ok: true });
});

/* --- Feature 5: 마감/리스크 (Deadlines) --- */
features.get("/deadlines", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(deadlines)
    .where(eq(deadlines.builderId, email)).orderBy(desc(deadlines.dueDate));
  return c.json({ deadlines: rows });
});

features.post("/deadlines", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return c.json({ error: "title required" }, 400);
  if (!isIso(body.dueDate)) return c.json({ error: "dueDate must be ISO date" }, 400);
  const db = drizzle(c.env.DB);
  await db.insert(deadlines).values({
    id: crypto.randomUUID(), builderId: email, title,
    dueDate: new Date(body.dueDate).toISOString(),
    estimatedImpactKrw: posInt(body.estimatedImpactKrw), doneAt: null,
  });
  return c.json({ ok: true }, 201);
});

features.patch("/deadlines/:id", async (c) => {
  const { email } = c.get("user");
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { done?: boolean };
  const doneAt = body.done === false ? null : nowIso();
  const db = drizzle(c.env.DB);
  await db.update(deadlines).set({ doneAt })
    .where(and(eq(deadlines.id, id), eq(deadlines.builderId, email)));
  return c.json({ ok: true });
});

/* --- 고객 신호 (Signals) — Command Center 입력원 --- */
features.get("/signals", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(signals)
    .where(eq(signals.builderId, email)).orderBy(desc(signals.receivedAt)).limit(100);
  return c.json({ signals: rows });
});

features.post("/signals", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const channel = signalSchema.shape.channel.safeParse(body.channel);
  const kind = signalSchema.shape.kind.safeParse(body.kind);
  if (!channel.success) return c.json({ error: "bad channel" }, 400);
  if (!kind.success) return c.json({ error: "bad kind" }, 400);
  const db = drizzle(c.env.DB);
  await db.insert(signals).values({
    id: crypto.randomUUID(), builderId: email,
    channel: channel.data, kind: kind.data,
    text: String(body.text ?? "").slice(0, 2000),
    count: Math.max(1, posInt(body.count, 1)),
    estimatedImpactKrw: posInt(body.estimatedImpactKrw),
    receivedAt: isIso(body.receivedAt) ? new Date(body.receivedAt).toISOString() : nowIso(),
  });
  return c.json({ ok: true }, 201);
});

/* --- Feature 6: 우선순위 엔진 · 기능 요청 Not Now/This Week --- */
features.get("/feature-requests", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(featureRequests)
    .where(eq(featureRequests.builderId, email)).orderBy(desc(featureRequests.createdAt));
  const parsed = rows.map((r) => featureRequestSchema.parse(r));
  return c.json({ requests: rows, triage: triageFeatureRequests(parsed) });
});

features.post("/feature-requests", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return c.json({ error: "title required" }, 400);
  const origin = body.origin === "founder" ? "founder" : "customer";
  const clamp01 = (v: unknown, dflt: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : dflt;
  };
  const db = drizzle(c.env.DB);
  await db.insert(featureRequests).values({
    id: crypto.randomUUID(), builderId: email, title,
    requestCount: posInt(body.requestCount),
    customerValueKrw: posInt(body.customerValueKrw),
    revenueChurnImpactKrw: posInt(body.revenueChurnImpactKrw),
    strategyFit: clamp01(body.strategyFit, 0.5),
    urgency: clamp01(body.urgency, 0),
    estimatedEffortDays: Math.max(0.5, Number(body.estimatedEffortDays) || 1),
    origin, status: "not_now", createdAt: nowIso(),
  });
  return c.json({ ok: true }, 201);
});

features.patch("/feature-requests/:id", async (c) => {
  const { email } = c.get("user");
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Partial<typeof featureRequests.$inferInsert> = {};
  const st = featureRequestSchema.shape.status.safeParse(body.status);
  if (body.status !== undefined) {
    if (!st.success) return c.json({ error: "bad status" }, 400);
    patch.status = st.data;
  }
  if (body.requestCount !== undefined) patch.requestCount = posInt(body.requestCount);
  if (body.revenueChurnImpactKrw !== undefined)
    patch.revenueChurnImpactKrw = posInt(body.revenueChurnImpactKrw);
  const db = drizzle(c.env.DB);
  await db.update(featureRequests).set(patch)
    .where(and(eq(featureRequests.id, id), eq(featureRequests.builderId, email)));
  return c.json({ ok: true });
});

/* --- 핵심 차별점: 방지한 손실 집계 (Loss Prevented) --- */
features.get("/loss-prevented", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(lossPrevented)
    .where(eq(lossPrevented.builderId, email)).orderBy(desc(lossPrevented.occurredAt)).limit(200);
  const parsed = rows.map((r) => lossPreventedSchema.parse(r));
  return c.json({ items: rows, summary: sumLossPrevented(parsed) });
});

features.post("/loss-prevented", async (c) => {
  const { email } = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = lossPreventedSchema.shape.kind.safeParse(body.kind);
  if (!kind.success) return c.json({ error: "bad kind" }, 400);
  const db = drizzle(c.env.DB);
  await db.insert(lossPrevented).values({
    id: crypto.randomUUID(), builderId: email, kind: kind.data,
    amountKrw: posInt(body.amountKrw), note: String(body.note ?? "").slice(0, 500),
    occurredAt: isIso(body.occurredAt) ? new Date(body.occurredAt).toISOString() : nowIso(),
  });
  return c.json({ ok: true }, 201);
});

/* --- Feature 6: 주간 CEO 브리핑 --- */
features.get("/weekly-briefing", async (c) => {
  const { email } = c.get("user");
  const db = drizzle(c.env.DB);
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const input = await loadCommandInput(db, email, now);
  const [lp, frRows] = await Promise.all([
    db.select().from(lossPrevented)
      .where(eq(lossPrevented.builderId, email)).orderBy(desc(lossPrevented.occurredAt)).limit(200),
    db.select().from(featureRequests)
      .where(eq(featureRequests.builderId, email)).orderBy(desc(featureRequests.createdAt)),
  ]);

  const openCards = buildCommandCards(input);
  // 고객 수는 빌더가 추적 중인 미수금의 고유 고객으로 근사 (별도 고객 테이블 없음)
  const customerCount = new Set(
    (input.receivables ?? []).map((r) => r.customer),
  ).size;
  const inquiryCount = (input.signals ?? []).filter(
    (s) => s.kind === "inquiry" && s.receivedAt >= weekStart,
  ).length;

  const briefing = buildWeeklyBriefing({
    builderId: email,
    weekStart,
    weekEnd: now,
    current: input.snapshot ?? {
      builderId: email, cashKrw: 0, monthlyRevenueKrw: 0,
      monthlyFixedCostKrw: 0, monthlyVariableCostKrw: 0, recordedAt: now,
    },
    previous: input.previousSnapshot,
    customerCount,
    inquiryCount,
    openCards,
    lossPrevented: lp.map((r) => lossPreventedSchema.parse(r)),
    featureRequests: frRows.map((r) => featureRequestSchema.parse(r)),
  });
  return c.json({ briefing });
});
