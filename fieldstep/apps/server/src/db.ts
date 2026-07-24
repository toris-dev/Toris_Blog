import type { Role } from "@fieldstep/shared";

export type Bindings = {
  DB: D1Database;
  /**
   * Private R2 media storage. Optional so unit tests and the legacy D1 photo
   * fallback can run before a remote bucket is provisioned.
   */
  MEDIA?: R2Bucket;
  APP_ORIGIN?: string;
  /**
   * 통합관리자(서비스 운영자) allowlist — 쉼표로 구분한 이메일 목록.
   * 이 목록에 있는 기존 사용자만 /ops 운영자 로그인·세션이 허용된다(PRD §14.3).
   * 미설정 시 운영자 콘솔은 완전히 비활성(로그인 자체가 거부).
   */
  PLATFORM_OPERATOR_EMAILS?: string;
};

export type Variables = {
  userId: string;
  userName: string;
  userEmail: string;
  orgId: string;
  orgName: string;
  role: Role;
  // /ops 운영자 라우트에서만 설정된다(조직 컨텍스트 없음).
  operatorUserId: string;
  operatorEmail: string;
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
