import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./db.js";
import { sha256Hex } from "./auth.js";

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

  if (!membership || !membership.active) {
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
  c.set("role", membership.role as AppEnv["Variables"]["role"]);
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
