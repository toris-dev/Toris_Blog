import { Hono } from "hono";
import { signupSchema, loginSchema, acceptInviteSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { isKnownRole, requireAuth } from "../middleware.js";
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
  const {
    email,
    password,
    name,
    orgName,
    orgLogoUrl,
    orgBusinessNo,
    orgAddress,
    orgContactName,
    orgContactPhone,
    orgContactEmail,
  } = parsed.data;

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
      `INSERT INTO organization_profiles
         (org_id, logo_url, business_no, address, contact_name, contact_phone, contact_email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orgId,
      orgLogoUrl ?? null,
      orgBusinessNo ?? null,
      orgAddress ?? null,
      orgContactName ?? null,
      orgContactPhone ?? null,
      orgContactEmail ?? null,
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
    org: {
      id: orgId,
      name: orgName,
      logoUrl: orgLogoUrl ?? null,
      businessNo: orgBusinessNo ?? null,
      address: orgAddress ?? null,
      contactName: orgContactName ?? null,
      contactPhone: orgContactPhone ?? null,
      contactEmail: orgContactEmail ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
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
  if (!isKnownRole(membership.role)) {
    return c.json({ error: "조직 멤버십이 유효하지 않습니다" }, 401);
  }

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
    `SELECT i.id, i.org_id, i.email, i.role, i.expires_at, i.accepted_at, il.canceled_at
     FROM invites i
     LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
     WHERE i.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{
      id: string;
      org_id: string;
      email: string;
      role: string;
      expires_at: string;
      accepted_at: string | null;
      canceled_at: string | null;
    }>();

  if (!invite) return c.json({ error: "초대를 찾을 수 없습니다" }, 404);
  if (!isKnownRole(invite.role)) {
    return c.json({ error: "초대 역할이 유효하지 않습니다" }, 409);
  }
  if (invite.canceled_at) return c.json({ error: "취소된 초대입니다" }, 410);
  if (invite.accepted_at) return c.json({ error: "이미 사용된 초대입니다" }, 400);
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return c.json({ error: "초대가 만료되었습니다" }, 400);
  }

  const org = await c.env.DB.prepare("SELECT id, name FROM organizations WHERE id = ?")
    .bind(invite.org_id)
    .first<{ id: string; name: string }>();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  let user = await c.env.DB.prepare("SELECT id, email, name, pw_hash, pw_salt FROM users WHERE email = ?")
    .bind(invite.email)
    .first<{ id: string; email: string; name: string; pw_hash: string; pw_salt: string }>();

  // An invite link proves possession of the link, not ownership of an existing
  // account. Require the existing password before linking it to this org.
  if (user) {
    const verified = await verifyPassword(password, user.pw_hash, user.pw_salt);
    if (!verified) {
      return c.json({ error: "이미 가입된 이메일입니다. 먼저 로그인한 뒤 초대 링크를 수락해주세요" }, 409);
    }
  }

  const ts = nowIso();
  const originalTokenHash = tokenHash;
  // 수락 claim이 성공하는 즉시 공개 초대 토큰을 무작위 내부 해시로 회전한다.
  // accepted_at 시각만으로 claim을 식별하면 같은 밀리초의 경합 요청이 동일 claim을
  // 오인할 수 있으므로, 요청마다 다른 해시를 후속 INSERT의 guard로 사용한다.
  const claimTokenHash = await sha256Hex(generateToken());
  const sessionToken = generateToken();
  const sessionTokenHash = await sha256Hex(sessionToken);
  const sessionId = newId();
  const sessionExpiresAt = addDaysIso(SESSION_TTL_DAYS);
  const creatingUser = !user;
  if (!user) {
    const { hash, salt } = await hashPassword(password);
    user = {
      id: newId(),
      email: invite.email,
      name,
      pw_hash: hash,
      pw_salt: salt,
    };
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB
      .prepare(
        `UPDATE invites
         SET accepted_at = ?, token_hash = ?
         WHERE id = ? AND org_id = ? AND token_hash = ?
           AND accepted_at IS NULL AND expires_at > ?
           AND NOT EXISTS (
             SELECT 1 FROM invite_lifecycle
             WHERE invite_id = ? AND canceled_at IS NOT NULL
           )`,
      )
      .bind(
        ts,
        claimTokenHash,
        invite.id,
        invite.org_id,
        originalTokenHash,
        ts,
        invite.id,
      ),
  ];

  if (creatingUser) {
    statements.push(
      c.env.DB
        .prepare(
          `INSERT INTO users (id, email, name, pw_hash, pw_salt, created_at)
           SELECT ?, ?, ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM invites
             WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at = ?
           )`,
        )
        .bind(
          user.id,
          user.email,
          user.name,
          user.pw_hash,
          user.pw_salt,
          ts,
          invite.id,
          invite.org_id,
          claimTokenHash,
          ts,
        ),
    );
  }

  statements.push(
    c.env.DB
      .prepare(
        `INSERT INTO memberships (id, org_id, user_id, role, active, created_at)
         SELECT ?, ?, ?, ?, 1, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at = ?
         )
         ON CONFLICT(org_id, user_id) DO UPDATE SET
           role = CASE
             WHEN memberships.role IN ('admin', 'office', 'field')
               THEN memberships.role
             ELSE excluded.role
           END,
           active = 1`,
      )
      .bind(
        newId(),
        invite.org_id,
        user.id,
        invite.role,
        ts,
        invite.id,
        invite.org_id,
        claimTokenHash,
        ts,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO invite_lifecycle (invite_id, canceled_at, resend_count, updated_at)
         SELECT ?, NULL, 0, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at = ?
         )
         ON CONFLICT(invite_id) DO UPDATE SET updated_at = excluded.updated_at
         WHERE invite_lifecycle.canceled_at IS NULL`,
      )
      .bind(
        invite.id,
        ts,
        invite.id,
        invite.org_id,
        claimTokenHash,
        ts,
      ),
  );

  const sessionStatementIndex = statements.length;
  statements.push(
    c.env.DB
      .prepare(
        `INSERT INTO sessions (id, token_hash, user_id, org_id, expires_at, created_at)
         SELECT ?, ?, ?, ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at = ?
         )
           AND EXISTS (
             SELECT 1 FROM memberships
             WHERE org_id = ? AND user_id = ? AND active = 1
           )`,
      )
      .bind(
        sessionId,
        sessionTokenHash,
        user.id,
        invite.org_id,
        sessionExpiresAt,
        ts,
        invite.id,
        invite.org_id,
        claimTokenHash,
        ts,
        invite.org_id,
        user.id,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO audit_events
           (id, org_id, actor_user_id, event, target, detail_json, created_at)
         SELECT ?, ?, ?, 'accept_invite', ?, NULL, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at = ?
         )`,
      )
      .bind(
        newId(),
        invite.org_id,
        user.id,
        invite.id,
        ts,
        invite.id,
        invite.org_id,
        claimTokenHash,
        ts,
      ),
  );

  const results = await c.env.DB.batch(statements);
  if (
    results[0]?.meta.changes !== 1 ||
    results[sessionStatementIndex]?.meta.changes !== 1
  ) {
    return c.json(
      { error: "초대 상태가 변경되었습니다. 최신 초대 링크를 사용해주세요" },
      409,
    );
  }

  const acceptedMembership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE org_id = ? AND user_id = ? AND active = 1",
  )
    .bind(invite.org_id, user.id)
    .first<{ role: string }>();
  if (!acceptedMembership || !isKnownRole(acceptedMembership.role)) {
    throw new Error("초대 수락 후 활성 멤버십을 찾을 수 없습니다");
  }

  return c.json({
    token: sessionToken,
    user: { id: user.id, email: user.email, name: user.name },
    org: { id: org.id, name: org.name },
    role: acceptedMembership.role,
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
