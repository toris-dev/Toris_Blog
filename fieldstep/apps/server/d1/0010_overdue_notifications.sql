-- FR-057 연체 알림은 작업/사용자별로 평생 한 번만 생성한다.
-- 납기일을 미래로 옮겼다가 다시 과거로 바꾸는 경우를 별도 episode로
-- 추적하지 않으므로, 이미 읽은 알림을 조용히 되살리지 않는 보수적 정책이다.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_billing_overdue_once_uq
  ON notifications (org_id, user_id, work_order_id, type)
  WHERE type = 'billing_overdue'
    AND user_id IS NOT NULL
    AND work_order_id IS NOT NULL;
