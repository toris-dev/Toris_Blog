export const BILLING_OVERDUE_NOTIFICATION_TYPE = "billing_overdue";

/**
 * 외부 cron 없이 알림 목록 동기화 시점에 현재 조직의 연체 알림을 채운다.
 *
 * - 사용자 대상 행만 생성한다. broadcast(user_id IS NULL)는 만들지 않는다.
 * - 결정적 id와 부분 UNIQUE 인덱스를 함께 사용해 동시 새로고침도 멱등하다.
 * - 한 작업/사용자당 한 번만 생성하므로 읽은 알림은 다시 생성하지 않는다.
 */
export async function materializeOverdueNotifications(
  db: D1Database,
  args: { orgId: string; seoulToday: string },
): Promise<number> {
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO notifications
         (id, org_id, user_id, type, work_order_id, message, created_at, read_at)
       SELECT
         'billing-overdue:' || wo.id || ':' || m.user_id,
         wo.org_id,
         m.user_id,
         ?,
         wo.id,
         c.name || ' · ' || s.name || ' 청구가 납기일(' || br.due_at ||
           ')을 지나 미입금 상태입니다.',
         strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         NULL
       FROM work_orders AS wo
       JOIN billing_records AS br ON br.work_order_id = wo.id
       JOIN customers AS c ON c.id = wo.customer_id AND c.org_id = wo.org_id
       JOIN sites AS s ON s.id = wo.site_id AND s.org_id = wo.org_id
       JOIN memberships AS m
         ON m.org_id = wo.org_id
        AND m.active = 1
        AND m.role IN ('admin', 'office')
       WHERE wo.org_id = ?
         AND wo.billing_status IN ('billed', 'overdue')
         AND br.billed_at IS NOT NULL
         AND br.due_at IS NOT NULL
         AND br.due_at < ?
         AND br.paid_at IS NULL`,
    )
    .bind(
      BILLING_OVERDUE_NOTIFICATION_TYPE,
      args.orgId,
      args.seoulToday,
    )
    .run();

  return inserted.meta.changes;
}
