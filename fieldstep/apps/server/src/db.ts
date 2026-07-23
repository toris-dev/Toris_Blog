import type { Role } from "@fieldstep/shared";

export type Bindings = { DB: D1Database; APP_ORIGIN?: string };

export type Variables = {
  userId: string;
  userName: string;
  userEmail: string;
  orgId: string;
  orgName: string;
  role: Role;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function recordAudit(
  db: D1Database,
  args: { orgId: string; actorUserId: string | null; event: string; target: string; detail?: unknown },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO audit_events (id, org_id, actor_user_id, event, target, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      newId(),
      args.orgId,
      args.actorUserId,
      args.event,
      args.target,
      args.detail !== undefined ? JSON.stringify(args.detail) : null,
      nowIso(),
    )
    .run();
}

export async function notify(
  db: D1Database,
  args: { orgId: string; userId?: string | null; type: string; workOrderId?: string | null; message: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO notifications (id, org_id, user_id, type, work_order_id, message, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)",
    )
    .bind(newId(), args.orgId, args.userId ?? null, args.type, args.workOrderId ?? null, args.message, nowIso())
    .run();
}
