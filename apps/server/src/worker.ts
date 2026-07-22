import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { subscribers, webhookEvents } from "./db/schema.sqlite.js";
import { verifyFirebaseToken } from "./auth.js";
import { features } from "./features.js";
import {
  featuresFor,
  isPro,
  type EntitlementStatus,
} from "@builderstep/shared";

type Bindings = {
  DB: D1Database;
  RAPID_WEBHOOK_SECRET?: string;
  /** 서명 헤더명이 래피드 문서와 다르면 vars로 교체 */
  RAPID_SIGNATURE_HEADER?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: ["https://builder.toris.kr", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.route("/app", features);

app.get("/health", (c) => c.json({ ok: true, service: "builderstep-api" }));

/** hex HMAC-SHA256 — 래피드 웹훅 서명 검증(타이밍 세이프) */
async function verifySignature(
  secret: string,
  rawBody: string,
  signature: string | undefined,
): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const given = signature.replace(/^sha256=/, "").toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/** 래피드 이벤트 타입 → 구독 상태 매핑(제공사 스펙 확정 시 여기만 조정) */
export function mapEventToStatus(eventType: string): Exclude<EntitlementStatus, "none"> | null {
  const t = eventType.toLowerCase();
  if (/(subscription|payment)[._-]?(activated|succeeded|success|paid|renewed|created)/.test(t))
    return "active";
  if (/grace|past[._-]?due|retry/.test(t)) return "grace";
  if (/cancel/.test(t)) return "canceled";
  if (/refund/.test(t)) return "refunded";
  if (/expire/.test(t)) return "expired";
  return null;
}

app.post("/webhooks/rapid", async (c) => {
  const secret = c.env.RAPID_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "webhook secret not configured" }, 503);

  const raw = await c.req.text();
  const header = c.env.RAPID_SIGNATURE_HEADER ?? "x-rapid-signature";
  const ok = await verifySignature(secret, raw, c.req.header(header));
  if (!ok) return c.json({ error: "invalid signature" }, 401);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }

  const eventId = String(body.id ?? body.event_id ?? crypto.randomUUID());
  const eventType = String(body.type ?? body.event ?? "unknown");
  const data = (body.data ?? body) as Record<string, unknown>;
  const email = String(
    data.email ?? (data.customer as Record<string, unknown>)?.email ?? "",
  ).toLowerCase();
  const rapidUserId = data.user_id != null ? String(data.user_id) : null;
  const plan =
    data.plan === "yearly" || data.plan === "monthly"
      ? (data.plan as "monthly" | "yearly")
      : null;
  const periodEnd = data.current_period_end != null ? String(data.current_period_end) : null;

  const db = drizzle(c.env.DB);
  const now = new Date().toISOString();

  // 중복 이벤트 무시(재전송 대비)
  try {
    await db.insert(webhookEvents).values({
      provider: "rapid",
      externalId: eventId,
      eventType,
      payload: raw,
      receivedAt: now,
    });
  } catch {
    return c.json({ ok: true, deduped: true });
  }

  const status = mapEventToStatus(eventType);
  if (!status || !email) return c.json({ ok: true, ignored: true });

  const existing = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(subscribers).values({
      email,
      rapidUserId,
      plan,
      status,
      currentPeriodEnd: periodEnd,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(subscribers)
      .set({
        status,
        updatedAt: now,
        ...(plan ? { plan } : {}),
        ...(rapidUserId ? { rapidUserId } : {}),
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      })
      .where(eq(subscribers.email, email));
  }

  return c.json({ ok: true, status });
});

app.get("/entitlements", async (c) => {
  // 구글 로그인 경로: Bearer ID 토큰이 오면 검증된 본인 이메일만 조회한다
  const authz = c.req.header("authorization");
  let email = "";
  let verified = false;
  if (authz?.toLowerCase().startsWith("bearer ")) {
    const claims = await verifyFirebaseToken(authz.slice(7).trim());
    if (!claims) return c.json({ error: "invalid token" }, 401);
    email = claims.email;
    verified = true;
  } else {
    email = (c.req.query("email") ?? "").toLowerCase().trim();
  }
  if (!email) return c.json({ error: "email required" }, 400);

  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  const status: EntitlementStatus =
    (rows[0]?.status as EntitlementStatus) ?? "none";
  return c.json({
    email,
    verified,
    status,
    plan: rows[0]?.plan ?? null,
    pro: isPro(status),
    currentPeriodEnd: rows[0]?.currentPeriodEnd ?? null,
    features: featuresFor(status),
  });
});

export default app;
