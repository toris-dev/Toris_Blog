import { Hono } from "hono";
import { inviteCreateSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth, requireAdmin, requireOfficeOrAdmin } from "../middleware.js";
import { generateToken, sha256Hex, addDaysIso } from "../auth.js";

const INVITE_TTL_DAYS = 7;

export const orgRoutes = new Hono<AppEnv>();

orgRoutes.get("/users", requireAuth, requireOfficeOrAdmin, async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, m.role, m.active
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = ? ORDER BY u.name ASC`,
  )
    .bind(c.get("orgId"))
    .all<{ id: string; email: string; name: string; role: string; active: number }>();

  const members = (rows.results ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    active: !!r.active,
  }));
  return c.json({ members });
});

orgRoutes.post("/invites", requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { email, role } = parsed.data;

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const id = newId();
  const expiresAt = addDaysIso(INVITE_TTL_DAYS);
  const ts = nowIso();

  await c.env.DB.prepare(
    "INSERT INTO invites (id, org_id, email, role, token_hash, expires_at, accepted_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)",
  )
    .bind(id, c.get("orgId"), email, role, tokenHash, expiresAt, ts)
    .run();

  await recordAudit(c.env.DB, {
    orgId: c.get("orgId"),
    actorUserId: c.get("userId"),
    event: "invite_created",
    target: id,
  });

  return c.json({ invite: { id, email, role, token, expiresAt } });
});

orgRoutes.get("/invites", requireAuth, requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, role, expires_at, accepted_at FROM invites WHERE org_id = ? ORDER BY created_at DESC",
  )
    .bind(c.get("orgId"))
    .all<{ id: string; email: string; role: string; expires_at: string; accepted_at: string | null }>();

  const invites = (rows.results ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    expiresAt: r.expires_at,
    accepted: !!r.accepted_at,
  }));
  return c.json({ invites });
});
