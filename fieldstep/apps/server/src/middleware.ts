import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./db.js";
import { sha256Hex } from "./auth.js";

export function isKnownRole(
  role: string,
): role is AppEnv["Variables"]["role"] {
  return role === "admin" || role === "office" || role === "field";
}

/**
 * 공통 인증 미들웨어 — Authorization: Bearer <token> → sessions → memberships → orgId 주입.
 * 만료/무효 세션은 401. 이후 핸들러는 c.get("orgId")로 조직 격리를 강제한다.
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("authorization") ?? c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return c.json({ error: "인증이 필요합니다" }, 401);

  const tokenHash = await sha256Hex(token);
  const session = await c.env.DB.prepare(
    "SELECT id, user_id, org_id, expires_at FROM sessions WHERE token_hash = ?",
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; org_id: string; expires_at: string }>();

  if (!session) return c.json({ error: "세션이 유효하지 않습니다" }, 401);
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return c.json({ error: "세션이 만료되었습니다" }, 401);
  }

  const membership = await c.env.DB.prepare(
    "SELECT role, active FROM memberships WHERE org_id = ? AND user_id = ?",
  )
    .bind(session.org_id, session.user_id)
    .first<{ role: string; active: number }>();

  if (!membership || !membership.active || !isKnownRole(membership.role)) {
    return c.json({ error: "조직 멤버십이 유효하지 않습니다" }, 401);
  }

  const user = await c.env.DB.prepare("SELECT name, email FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<{ name: string; email: string }>();
  const org = await c.env.DB.prepare("SELECT name FROM organizations WHERE id = ?")
    .bind(session.org_id)
    .first<{ name: string }>();

  if (!user || !org) return c.json({ error: "세션이 유효하지 않습니다" }, 401);

  c.set("userId", session.user_id);
  c.set("orgId", session.org_id);
  c.set("orgName", org.name);
  c.set("role", membership.role);
  c.set("userName", user.name);
  c.set("userEmail", user.email);

  await next();
};

/** office/admin 전용 라우트 가드 */
export const requireOfficeOrAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const role = c.get("role");
  if (role !== "office" && role !== "admin") {
    return c.json({ error: "권한이 없습니다" }, 403);
  }
  await next();
};

/** admin 전용 라우트 가드 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get("role") !== "admin") {
    return c.json({ error: "관리자 권한이 필요합니다" }, 403);
  }
  await next();
};

/**
 * PLATFORM_OPERATOR_EMAILS(쉼표 구분)를 정규화한 소문자 이메일 Set으로 파싱한다.
 * 미설정이면 빈 Set → 운영자 콘솔 전면 비활성.
 */
export function operatorAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}

export function isOperatorEmail(raw: string | undefined, email: string): boolean {
  return operatorAllowlist(raw).has(email.trim().toLowerCase());
}

/**
 * 통합관리자(서비스 운영자) 전용 가드 — 조직 격리와 분리된 전사 접근.
 * operator_sessions 토큰을 검증하고, 그 사용자의 이메일이 여전히
 * PLATFORM_OPERATOR_EMAILS allowlist에 있는지 매 요청 재확인한다(시크릿에서 제거하면 즉시 무효).
 * org 컨텍스트(orgId/role)는 설정하지 않는다 — /ops 핸들러는 org를 넘나든다.
 */
export const requireOperator: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("authorization") ?? c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "운영자 인증이 필요합니다" }, 401);
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return c.json({ error: "운영자 인증이 필요합니다" }, 401);

  const tokenHash = await sha256Hex(token);
  const session = await c.env.DB.prepare(
    "SELECT user_id, expires_at FROM operator_sessions WHERE token_hash = ?",
  )
    .bind(tokenHash)
    .first<{ user_id: string; expires_at: string }>();

  if (!session) return c.json({ error: "운영자 세션이 유효하지 않습니다" }, 401);
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return c.json({ error: "운영자 세션이 만료되었습니다" }, 401);
  }

  const user = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<{ email: string }>();
  if (!user || !isOperatorEmail(c.env.PLATFORM_OPERATOR_EMAILS, user.email)) {
    return c.json({ error: "운영자 권한이 없습니다" }, 403);
  }

  c.set("operatorUserId", session.user_id);
  c.set("operatorEmail", user.email);
  await next();
};
