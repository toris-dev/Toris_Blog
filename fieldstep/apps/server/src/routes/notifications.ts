import { Hono } from "hono";
import type { AppEnv } from "../db.js";
import { nowIso } from "../db.js";
import { requireAuth } from "../middleware.js";

export const notificationRoutes = new Hono<AppEnv>();


notificationRoutes.get("/notifications", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const unreadOnly = c.req.query("unread") === "1";

  const sql = unreadOnly
    ? "SELECT id, type, message, work_order_id, read_at, created_at FROM notifications WHERE org_id = ? AND (user_id = ? OR user_id IS NULL) AND read_at IS NULL ORDER BY created_at DESC"
    : "SELECT id, type, message, work_order_id, read_at, created_at FROM notifications WHERE org_id = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC";

  const rows = await c.env.DB.prepare(sql)
    .bind(orgId, userId)
    .all<{ id: string; type: string; message: string; work_order_id: string | null; read_at: string | null; created_at: string }>();

  return c.json({
    notifications: (rows.results ?? []).map((r) => ({
      id: r.id,
      kind: r.type,
      message: r.message,
      workOrderId: r.work_order_id,
      read: !!r.read_at,
      createdAt: r.created_at,
    })),
  });
});

notificationRoutes.post("/notifications/read", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => null);
  const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
  // D1 바인딩 파라미터 한계(100) 내로 제한하고 문자열만 허용한다.
  const ids = rawIds.filter((v): v is string => typeof v === "string").slice(0, 100);
  if (ids.length === 0) return c.json({ ok: true });

  const ts = nowIso();
  const placeholders = ids.map(() => "?").join(", ");
  await c.env.DB.prepare(
    `UPDATE notifications SET read_at = ? WHERE org_id = ? AND (user_id = ? OR user_id IS NULL) AND id IN (${placeholders})`,
  )
    .bind(ts, orgId, userId, ...ids)
    .run();

  return c.json({ ok: true });
});
