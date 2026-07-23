import { Hono } from "hono";
import { signupSchema, loginSchema, acceptInviteSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth } from "../middleware.js";
import { generateToken, hashPassword, nowIso as authNowIso, addDaysIso, sha256Hex, verifyPassword, SESSION_TTL_DAYS } from "../auth.js";
import { checkLoginThrottle, recordLoginFailure, clearLoginThrottle } from "../ratelimit.js";

export const authRoutes = new Hono<AppEnv>();

async function createSession(db: D1Database, userId: string, orgId: string) {
  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  await db
    .prepare(
      "INSERT INTO sessions (id, token_hash, user_id, org_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(newId(), tokenHash, userId, orgId, addDaysIso(SESSION_TTL_DAYS), authNowIso())
    .run();
  return token;
}

authRoutes.post("/auth/signup", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { email, password, name, orgName } = parsed.data;

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return c.json({ error: "이미 가입된 이메일입니다" }, 400);

  const { hash, salt } = await hashPassword(password);
  const userId = newId();
  const orgId = newId();
  const membershipId = newId();
  const ts = nowIso();

  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)").bind(
      orgId,
      orgName,
      ts,
    ),
    c.env.DB.prepare(
      "INSERT INTO users (id, email, name, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(userId, email, name, hash, salt, ts),
    c.env.DB.prepare(
      "INSERT INTO memberships (id, org_id, user_id, role, active, created_at) VALUES (?, ?, ?, 'admin', 1, ?)",
    ).bind(membershipId, orgId, userId, ts),
  ]);

  const token = await createSession(c.env.DB, userId, orgId);
  await recordAudit(c.env.DB, { orgId, actorUserId: userId, event: "signup", target: orgId });

  return c.json({
    token,
    user: { id: userId, email, name },
    org: { id: orgId, name: orgName },
    role: "admin",
  });
});

authRoutes.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { email, password } = parsed.data;

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const retryAfter = await checkLoginThrottle(c.env.DB, ip, email);
  if (retryAfter !== null) {
    return c.json({ error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요" }, 429, {
      "Retry-After": String(retryAfter),
    });
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, name, pw_hash, pw_salt FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{ id: string; email: string; name: string; pw_hash: string; pw_salt: string }>();
  if (!user) {
    await recordLoginFailure(c.env.DB, ip, email);
    return c.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, 401);
  }

  const ok = await verifyPassword(password, user.pw_hash, user.pw_salt);
  if (!ok) {
    await recordLoginFailure(c.env.DB, ip, email);
    return c.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, 401);
  }
  await clearLoginThrottle(c.env.DB, ip, email);

  const membership = await c.env.DB.prepare(
    "SELECT org_id, role FROM memberships WHERE user_id = ? AND active = 1 ORDER BY created_at ASC LIMIT 1",
  )
    .bind(user.id)
    .first<{ org_id: string; role: string }>();
  if (!membership) return c.json({ error: "소속된 조직이 없습니다" }, 401);

  const org = await c.env.DB.prepare("SELECT id, name FROM organizations WHERE id = ?")
    .bind(membership.org_id)
    .first<{ id: string; name: string }>();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 401);

  const token = await createSession(c.env.DB, user.id, org.id);

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
    org: { id: org.id, name: org.name },
    role: membership.role,
  });
});

authRoutes.post("/auth/accept-invite", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { token, name, password } = parsed.data;

  const tokenHash = await sha256Hex(token);
  const invite = await c.env.DB.prepare(
    "SELECT id, org_id, email, role, expires_at, accepted_at FROM invites WHERE token_hash = ?",
  )
    .bind(tokenHash)
    .first<{ id: string; org_id: string; email: string; role: string; expires_at: string; accepted_at: string | null }>();

  if (!invite) return c.json({ error: "초대를 찾을 수 없습니다" }, 404);
  if (invite.accepted_at) return c.json({ error: "이미 사용된 초대입니다" }, 400);
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return c.json({ error: "초대가 만료되었습니다" }, 400);
  }

  const org = await c.env.DB.prepare("SELECT id, name FROM organizations WHERE id = ?")
    .bind(invite.org_id)
    .first<{ id: string; name: string }>();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  let user = await c.env.DB.prepare("SELECT id, email, name FROM users WHERE email = ?")
    .bind(invite.email)
    .first<{ id: string; email: string; name: string }>();

  const ts = nowIso();
  if (!user) {
    const { hash, salt } = await hashPassword(password);
    const userId = newId();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, name, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(userId, invite.email, name, hash, salt, ts)
      .run();
    user = { id: userId, email: invite.email, name };
  }

  const existingMembership = await c.env.DB.prepare(
    "SELECT id FROM memberships WHERE org_id = ? AND user_id = ?",
  )
    .bind(invite.org_id, user.id)
    .first();
  if (!existingMembership) {
    await c.env.DB.prepare(
      "INSERT INTO memberships (id, org_id, user_id, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
    )
      .bind(newId(), invite.org_id, user.id, invite.role, ts)
      .run();
  }

  await c.env.DB.prepare("UPDATE invites SET accepted_at = ? WHERE id = ?").bind(ts, invite.id).run();

  const sessionToken = await createSession(c.env.DB, user.id, invite.org_id);
  await recordAudit(c.env.DB, {
    orgId: invite.org_id,
    actorUserId: user.id,
    event: "accept_invite",
    target: invite.id,
  });

  return c.json({
    token: sessionToken,
    user: { id: user.id, email: user.email, name: user.name },
    org: { id: org.id, name: org.name },
    role: invite.role,
  });
});

authRoutes.post("/auth/logout", requireAuth, async (c) => {
  const header = c.req.header("authorization") ?? c.req.header("Authorization") ?? "";
  const token = header.slice("Bearer ".length).trim();
  const tokenHash = await sha256Hex(token);
  await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({
    user: { id: c.get("userId"), email: c.get("userEmail"), name: c.get("userName") },
    org: { id: c.get("orgId"), name: c.get("orgName") },
    role: c.get("role"),
  });
});
